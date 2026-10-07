/* ==========================================================================
   POST /api/webhooks/clover

   The one place a registration becomes confirmed after an online payment.
   The signature is checked against the raw body before anything is parsed,
   and an unverified request gets 401. It moves no registration: the only
   thing written is a signature_failed row, at most one a minute, with the
   time and the request's length and nothing from the request itself, so a
   changed signing secret shows up in Airtable instead of only in a log.

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
import { leaves, idCandidates, outcome, amount, orderId, merchantMismatch } from "../_lib/match.js";
import { createHash } from "node:crypto";

/* A note for the webhook_note field: the reason, then what was found. */
const note = (reason, detail) => `${reason}\n\n${JSON.stringify(detail, null, 2)}`.slice(0, 90000);

export async function POST(request) {
  const rawBody = await request.text();
  let event;
  try {
    event = provider().verifyWebhook({ rawBody, headers: request.headers });
  } catch (e) {
    /* The error type only: a JSON parse error quotes the body. */
    console.error("webhook verify failed", e.name);
    event = { valid: false };
  }
  if (!event.valid) {
    /* Logged so a changed signing secret shows up as a run of these
       instead of payments quietly staying pending. Nothing from the
       request is logged. */
    console.log("webhook", JSON.stringify({ result: "invalid signature" }));
    const alert = await recordSignatureFailure(Buffer.byteLength(rawBody, "utf8"));
    const body = { error: "Invalid signature" };
    /* On a preview only, say whether the alert row is in the table, read
       back from it. The row's ID, its status and the note's length. */
    if (process.env.VERCEL_ENV === "preview") body.diagnostic = alert;
    return json(body, 401);
  }

  /* Signed by the provider from here on. Everything below reads the
     payload by value; see api/_lib/match.js. */
  const ls = leaves(event.payload);
  /* One line per webhook: how it was handled, the registration, the reason
     and the key paths where things were found. Key names only, never the
     payload's values. */
  const report = (result, extra = {}) => {
    console.log("webhook", JSON.stringify({ result, ...extra }));
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

/* --- Signature failure alert -----------------------------------------------

   One row per minute at most, named for the minute, so a flood of bad
   requests cannot fill the table: the ID is checked before writing, and
   this instance remembers the last minute it recorded so a flood costs one
   lookup a minute, not one per request. Never the body, the headers or the
   secret: the time and the byte length only. A failure to record is logged
   by type and never changes the 401. */
let lastAlertMinute = null;

async function recordSignatureFailure(bytes) {
  const now = new Date();
  const minute = now.toISOString().slice(0, 16);
  const id = "SIGFAIL-" + minute.replace(/[-:]/g, "").replace("T", "-");
  if (lastAlertMinute === minute) return { recorded: id, written: false, reason: "already recorded this minute" };
  lastAlertMinute = minute;
  try {
    const db = store();
    if (await db.get(id)) return { recorded: id, written: false, reason: "already recorded this minute", readBack: await readBack(db, id) };
    /* The time and the length go in program and option as well as the note:
       webhook_note is optional, and a table without it would otherwise keep
       only the status. */
    await db.create({
      registration_id: id,
      status: "signature_failed",
      program: "Webhook signature failure",
      option: `${bytes} bytes at ${now.toISOString()}`,
      webhook_note: `Webhook signature failed verification at ${now.toISOString()}. The request was ${bytes} bytes. ` +
        "At most one of these rows is written a minute, so a run of failures shows as one row per minute. " +
        "A run of them usually means the signing secret in Clover and in Vercel no longer match, and payments are being taken without being confirmed."
    });
    console.log("webhook", JSON.stringify({ result: "signature failure recorded", recorded: id }));
    return { recorded: id, written: true, readBack: await readBack(db, id) };
  } catch (e) {
    lastAlertMinute = null;
    console.error("webhook signature alert not recorded", e.name);
    return { recorded: null, written: false, reason: e.name };
  }
}

/* What the table now holds for the alert, without its contents. */
async function readBack(db, id) {
  const row = await db.get(id);
  return row ? { status: row.status, program: row.program || null, option: row.option || null, noteLength: (row.webhook_note || "").length } : null;
}

/* A registration a person must look at. A confirmed one stays confirmed. */
async function flag(db, reg, reason, detail) {
  await db.update(reg.registration_id, {
    ...(reg.status === "confirmed" ? {} : { status: "needs_review" }),
    webhook_note: note(reason, detail)
  });
}
