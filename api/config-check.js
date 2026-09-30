/* ==========================================================================
   GET /api/config-check. Preview only.

   Answers "did the configuration reach the running deployment" without
   ever echoing a value: which provider resolved, and for each variable the
   payment path reads, whether it is set. 404 everywhere except a Vercel
   preview deployment, so it cannot run in production or locally.

   ?registration=<id> also reads that registration's rows from storage and
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

  const id = new URL(request.url).searchParams.get("registration");
  if (id) {
    if (!REGISTRATION_ID.test(id)) return json({ error: "Not a registration ID" }, 400);
    const rows = await store().all(id);
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
