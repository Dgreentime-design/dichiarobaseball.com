/* ==========================================================================
   POST /api/webhooks/clover

   The one place a registration becomes confirmed after an online payment.
   The signature is checked against the raw body before anything is parsed,
   and an unverified request gets 401 with nothing written.

   The payload is read by value: the registration is the one whose stored
   checkout session ID appears anywhere in it, and it is confirmed only on
   a recognisable approved value, with any amount present equal to the
   server-priced amount. Idempotent: a retry or a duplicate delivery finds
   the row already confirmed and changes nothing. A webhook never creates
   a registration, only moves an existing one.

   Nothing signed is dropped silently. A webhook that matches no
   registration becomes an UNMATCHED-<hash> row with status unmatched. An
   approved one that cannot be confirmed (wrong amount, other merchant)
   sets its registration to needs_review. A second payment on a paid
   registration, or a webhook with no outcome, leaves a webhook_note. All
   answer 200, except a failure to record anything, which answers 500 so
   the provider retries rather than leaving no trace.
   ========================================================================== */

import "../_lib/guard.js";
import { store } from "../_lib/store.js";
import { provider } from "../_lib/providers/index.js";
import { json } from "../_lib/http.js";
import { explain } from "../_lib/providers/signature.js";
import { leaves, idCandidates, outcome, amount, orderId, merchantMismatch } from "../_lib/match.js";
import { createHash } from "node:crypto";

/* A note for the webhook_note field: the reason, then what was found. */
const note = (reason, detail) => `${reason}\n\n${JSON.stringify(detail, null, 2)}`.slice(0, 90000);

/* TEMPORARY, round 05: capture the real payload shape. The last few
   requests are kept in this instance's memory and readable with GET on a
   preview deployment only. Header names, never values, so the signature is
   never kept. Remove in task 7. */
const CAPTURE = [];
const INSTANCE = Math.random().toString(36).slice(2, 8);

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  return json({ instance: INSTANCE, captured: CAPTURE });
}

export async function POST(request) {
  const rawBody = await request.text();
  let parsed;
  try { parsed = JSON.parse(rawBody); } catch { parsed = "(not JSON)"; }
  const entry = {
    at: new Date().toISOString(),
    method: request.method,
    headerNames: [...request.headers.keys()],
    bodyBytes: Buffer.byteLength(rawBody),
    body: parsed,
    signature: explain(rawBody, request.headers.get("clover-signature"), process.env.CLOVER_WEBHOOK_SECRET),
    status: null,
    response: null
  };
  CAPTURE.unshift(entry);
  CAPTURE.length = Math.min(CAPTURE.length, 10);

  const response = await handle(request, rawBody, entry);
  entry.status = response.status;
  entry.response = await response.clone().json().catch(() => null);
  console.log("webhook diagnostic", JSON.stringify(entry));
  return response;
}

async function handle(request, rawBody, entry) {
  let event;
  try {
    event = provider().verifyWebhook({ rawBody, headers: request.headers });
  } catch (e) {
    console.error("webhook verify", e);
    event = { valid: false };
  }
  if (!event.valid) return json({ error: "Invalid signature" }, 401);

  /* Signed by the provider from here on. Everything below reads the
     payload by value; see api/_lib/match.js. */
  const ls = leaves(event.payload);
  const report = (result, extra = {}) => {
    const m = { result, ...extra };
    if (entry) entry.match = m;
    console.log("webhook", JSON.stringify(m));
    return m;
  };

  try {
    const db = store();
    const candidates = idCandidates(ls);
    const reg = await db.findBySessionAmong(candidates.map((c) => c.value));
    if (!reg) {
      /* A signed webhook that matches no registration: a payment may have
         been taken with nobody knowing. Leave a row a person will see. The
         ID is a hash of the body, so a redelivery does not add a second. */
      const id = "UNMATCHED-" + createHash("sha256").update(rawBody).digest("hex").slice(0, 12).toUpperCase();
      const order = orderId(ls, null);
      const out = outcome(ls);
      const detail = { reason: "no value equals a stored checkout session", candidatePaths: candidates.map((c) => c.path), outcome: out.result };
      if (!(await db.get(id))) {
        await db.create({
          registration_id: id,
          status: "unmatched",
          payment_method: "online",
          provider_order_id: order ? order.value : null,
          webhook_note: note("Signed payment webhook that matched no registration. Check the Clover dashboard for this payment.", { ...detail, payload: event.payload })
        });
      }
      report("unmatched", { ...detail, recorded: id });
      return json({ ok: true, ignored: "unmatched", recorded: id });
    }
    const sessionPaths = ls.filter((l) => l.value === reg.checkout_session_id).map((l) => l.path);
    const base = { registration: reg.registration_id, sessionPaths };

    const wrongMerchant = merchantMismatch(ls, process.env.CLOVER_MERCHANT_ID);
    if (wrongMerchant.length) {
      const reason = "merchant ID in the webhook differs from ours";
      await flag(db, reg, reason, { paths: wrongMerchant, payload: event.payload });
      report("needs review", { ...base, reason, paths: wrongMerchant });
      return json({ ok: true, ignored: "needs review" });
    }

    const out = outcome(ls);
    const expected = Math.round(reg.amount * 100);
    const amt = amount(ls, expected);
    const order = orderId(ls, reg.checkout_session_id);
    const seen = {
      ...base,
      outcomePaths: out.paths,
      amount: { result: amt.result, unit: amt.unit || null, paths: amt.found.map((f) => f.path) },
      orderPath: order ? order.path : null
    };

    if (out.result === "approved") {
      if (amt.result === "mismatch") {
        const reason = "approved, but the amount differs from the server-priced amount";
        await flag(db, reg, reason, { expectedCents: expected, found: amt.found, orderId: order ? order.value : null, payload: event.payload });
        report("needs review", { ...seen, reason });
        return json({ ok: true, ignored: "needs review" });
      }
      if (reg.status === "confirmed") {
        if (order && reg.provider_order_id && reg.provider_order_id !== order.value) {
          /* A second, different payment for a registration already paid.
             Nothing to change here, but a person needs to refund it. */
          /* The registration stays confirmed: it is paid. The second
             payment is what needs a refund, so it goes in the note. */
          await db.update(reg.registration_id, {
            webhook_note: note("SECOND PAYMENT on an already confirmed registration. Refund the second order in Clover.", { firstOrder: reg.provider_order_id, secondOrder: order.value })
          });
          report("second payment", seen);
        } else {
          report("duplicate", seen);
        }
        return json({ ok: true, duplicate: true });
      }
      /* With no amount anywhere in the payload, the charge is the cart this
         server priced and sent when it created the session. That is what is
         relied on, and the log says so. */
      await db.update(reg.registration_id, { status: "confirmed", provider_order_id: order ? order.value : null });
      report("confirmed", seen);
      return json({ ok: true, status: "confirmed" });
    }

    /* A decline never undoes a confirmation, and a failed registration can
       still be confirmed by a later successful payment on the same session. */
    if (out.result === "declined") {
      if (reg.status === "pending") await db.update(reg.registration_id, { status: "failed" });
      report("declined", seen);
      return json({ ok: true, status: "failed" });
    }

    /* Signed and for this registration, but neither approved nor declined.
       Nothing is confirmed; the row keeps its status and gains a note. */
    const reason = `no recognisable outcome (${out.result})`;
    await db.update(reg.registration_id, { webhook_note: note(`Webhook received with ${reason}. Not confirmed.`, { outcomePaths: out.paths, payload: event.payload }) });
    report("unmatched", { ...seen, reason });
    return json({ ok: true, ignored: "unmatched" });
  } catch (e) {
    /* Including a failure to record an unmatched or flagged webhook: 500 so
       the provider retries, rather than 200 and no trace. */
    console.error("webhook store", e);
    return json({ error: "Temporarily unavailable" }, 500);
  }
}

/* A registration a person must look at. A confirmed one stays confirmed. */
async function flag(db, reg, reason, detail) {
  await db.update(reg.registration_id, {
    ...(reg.status === "confirmed" ? {} : { status: "needs_review" }),
    webhook_note: note(reason, detail)
  });
}
