/* ==========================================================================
   POST /api/webhooks/clover

   The one place a registration becomes confirmed after an online payment.
   The signature is checked against the raw body before anything is parsed,
   and an unverified request gets 401 with nothing written.

   Idempotent on the provider's payment ID: a retry or a duplicate delivery
   of the same payment finds the row already confirmed with that ID and
   changes nothing. The handler never creates a row, so a webhook cannot add
   a second registration, only move an existing one.

   It answers as soon as the one row is written. If storage fails it returns
   500 so the provider retries, rather than 200 and a lost confirmation.
   ========================================================================== */

import "../_lib/guard.js";
import { store } from "../_lib/store.js";
import { provider } from "../_lib/providers/index.js";
import { json } from "../_lib/http.js";

export async function POST(request) {
  const rawBody = await request.text();

  /* TEMPORARY, round 05: capture the real payload shape. Header names only,
     never values, so the signature never reaches the logs. Remove in task 7. */
  let parsed;
  try { parsed = JSON.parse(rawBody); } catch { parsed = "(not JSON)"; }
  console.log("webhook diagnostic", JSON.stringify({
    method: request.method,
    headerNames: [...request.headers.keys()],
    bodyBytes: Buffer.byteLength(rawBody),
    body: parsed
  }));

  let event;
  try {
    event = provider().verifyWebhook({ rawBody, headers: request.headers });
  } catch (e) {
    console.error("webhook verify", e);
    event = { valid: false };
  }
  if (!event.valid) return json({ error: "Invalid signature" }, 401);

  try {
    const db = store();
    const reg = event.sessionId ? await db.findBySession(event.sessionId) : null;
    if (!reg) {
      console.warn("webhook for unknown session", event.sessionId);
      return json({ ok: true, ignored: "unknown session" });
    }

    if (event.status === "succeeded") {
      if (reg.status === "confirmed") {
        if (reg.provider_order_id !== event.orderId) {
          /* A second, different payment for a registration already paid.
             Nothing to change here, but a person needs to refund it. */
          console.error("second payment for confirmed registration", reg.registration_id, event.orderId);
        }
        return json({ ok: true, duplicate: true });
      }
      const expected = Math.round(reg.amount * 100);
      if (event.amountCents !== null && event.amountCents !== expected) {
        console.error("amount mismatch", reg.registration_id, event.amountCents, expected);
        return json({ ok: true, ignored: "amount mismatch" });
      }
      await db.update(reg.registration_id, { status: "confirmed", provider_order_id: event.orderId });
      return json({ ok: true, status: "confirmed" });
    }

    /* A decline never undoes a confirmation, and a failed registration can
       still be confirmed by a later successful payment on the same session. */
    if (event.status === "failed" && reg.status === "pending") {
      await db.update(reg.registration_id, { status: "failed" });
      return json({ ok: true, status: "failed" });
    }

    return json({ ok: true, ignored: event.status });
  } catch (e) {
    console.error("webhook store", e);
    return json({ error: "Temporarily unavailable" }, 500);
  }
}
