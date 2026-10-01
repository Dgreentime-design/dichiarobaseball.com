/* ==========================================================================
   GET /api/config-check. Preview only.

   Answers "did the configuration reach the running deployment" without
   ever echoing a value: which provider resolved, and for each variable the
   payment path reads, whether it is set. 404 everywhere except a Vercel
   preview deployment, so it cannot run in production or locally.

   ?registration=<id>, or ?session=<checkout session ID>, also reads that registration's rows from storage and
   returns what a payment test needs as evidence: how many rows carry the
   ID, and each row's status, amount and provider order ID. Never a name,
   email or phone number.
   ========================================================================== */

import "./_lib/guard.js";
import { provider } from "./_lib/providers/index.js";
import { json, REGISTRATION_ID } from "./_lib/http.js";
import { store } from "./_lib/store.js";

const NAMES = [
  "PAYMENT_PROVIDER",
  "CLOVER_ENV",
  "CLOVER_MERCHANT_ID",
  "CLOVER_PRIVATE_TOKEN",
  "CLOVER_WEBHOOK_SECRET",
  "AIRTABLE_TOKEN",
  "AIRTABLE_BASE_ID",
  "AIRTABLE_TABLE_NAME",
  "VERCEL_AUTOMATION_BYPASS_SECRET"
];

export async function GET(request) {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });

  const params = new URL(request.url).searchParams;
  let id = params.get("registration");
  const session = params.get("session");
  if (!id && session) {
    if (!/^[\w-]{6,128}$/.test(session)) return json({ error: "Not a session ID" }, 400);
    const reg = await store().findBySession(session);
    if (!reg) return json({ session, rows: 0, records: [] });
    id = reg.registration_id;
  }
  if (id) {
    if (!REGISTRATION_ID.test(id) && !/^UNMATCHED-[0-9A-F]{12}$/.test(id)) return json({ error: "Not a registration ID" }, 400);
    let rows;
    try {
      rows = await store().all(id);
    } catch (e) {
      /* Only the HTTP status and Airtable's error type, which name the
         problem without carrying any configured value. */
      const m = String(e.message).match(/^Airtable (\d+): .*?"type"\s*:\s*"([A-Z_]+)"/);
      return json({ storageError: m ? { status: Number(m[1]), type: m[2] } : { kind: e.name } }, 502);
    }
    return json({
      registration: id,
      rows: rows.length,
      records: rows.map((r) => ({
        status: r.status,
        amount: r.amount,
        payment_method: r.payment_method,
        provider_order_id: r.provider_order_id || null,
        checkout_session_id_set: Boolean(r.checkout_session_id)
      }))
    });
  }

  let resolved = null;
  try { resolved = provider().name; } catch { resolved = null; }

  return json({
    provider: resolved,
    cloverEnvIsProduction: process.env.CLOVER_ENV === "production",
    present: Object.fromEntries(NAMES.map((n) => [n, Boolean(process.env[n])]))
  });
}
