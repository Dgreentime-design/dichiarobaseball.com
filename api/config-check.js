/* ==========================================================================
   GET /api/config-check. Preview only.

   Answers "did the configuration reach the running deployment" without
   ever echoing a value: which provider resolved, and for each variable the
   payment path reads, whether it is set. 404 everywhere except a Vercel
   preview deployment, so it cannot run in production or locally.
   ========================================================================== */

import "./_lib/guard.js";
import { provider } from "./_lib/providers/index.js";
import { json } from "./_lib/http.js";

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

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });

  let resolved = null;
  try { resolved = provider().name; } catch { resolved = null; }

  return json({
    provider: resolved,
    cloverEnvIsProduction: process.env.CLOVER_ENV === "production",
    present: Object.fromEntries(NAMES.map((n) => [n, Boolean(process.env[n])]))
  });
}
