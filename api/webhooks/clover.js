/* ==========================================================================
   POST /api/webhooks/clover

   The one place a registration becomes confirmed after an online payment.
   The signature is checked against the raw body before anything is parsed,
   and an unverified request gets 401 with nothing written.

   The payload is read by value: the registration is the one whose stored
   checkout session ID appears anywhere in it, and it is confirmed only on
   a recognisable approved value, with any amount present equal to the
   server-priced amount. Idempotent: a retry or a duplicate delivery finds
   the row already confirmed and changes nothing. The handler never creates a row, so a webhook cannot add
   a second registration, only move an existing one.

   It answers as soon as the one row is written. If storage fails it returns
   500 so the provider retries, rather than 200 and a lost confirmation.
   ========================================================================== */

import "../_lib/guard.js";
import { store } from "../_lib/store.js";
import { provider } from "../_lib/providers/index.js";
import { json } from "../_lib/http.js";
import { explain } from "../_lib/providers/signature.js";
import { leaves, idCandidates, outcome, amount, orderId, merchantMismatch } from "../_lib/match.js";

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
      report("unmatched", { reason: "no value equals a stored checkout session", candidatePaths: candidates.map((c) => c.path) });
      return json({ ok: true, ignored: "unmatched" });
    }
    const sessionPaths = ls.filter((l) => l.value === reg.checkout_session_id).map((l) => l.path);
    const base = { registration: reg.registration_id, sessionPaths };

    const wrongMerchant = merchantMismatch(ls, process.env.CLOVER_MERCHANT_ID);
    if (wrongMerchant.length) {
      report("unmatched", { ...base, reason: "merchant ID differs", paths: wrongMerchant });
      return json({ ok: true, ignored: "unmatched" });
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
        report("unmatched", { ...seen, reason: "amount differs from the server-priced amount" });
        return json({ ok: true, ignored: "unmatched" });
      }
      if (reg.status === "confirmed") {
        if (order && reg.provider_order_id && reg.provider_order_id !== order.value) {
          /* A second, different payment for a registration already paid.
             Nothing to change here, but a person needs to refund it. */
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

    report("unmatched", { ...seen, reason: `no recognisable outcome (${out.result})` });
    return json({ ok: true, ignored: "unmatched" });
  } catch (e) {
    console.error("webhook store", e);
    return json({ error: "Temporarily unavailable" }, 500);
  }
}
