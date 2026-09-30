/* ==========================================================================
   /api/mock-checkout. The stand-in for Clover's payment page.

   Exists only when PAYMENT_PROVIDER=mock, and 404s otherwise. Approve and
   Decline each post a signed webhook to the real /api/webhooks/clover, over
   HTTP, exactly as Clover would, then send the payer back. Nothing here
   touches storage: the webhook handler is the only thing that confirms.
   ========================================================================== */

import { MockProvider } from "./_lib/providers/mock.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(title, inner, status = 200) {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; background: #f4f1ea; color: #1a1a1a; margin: 0; padding: 16px; }
  main { max-width: 480px; margin: 48px auto; background: #fff; padding: 24px; border-radius: 8px; }
  .warn { background: #fff3cd; padding: 8px 12px; border-radius: 4px; font-size: 14px; }
  .amount { font-size: 32px; font-weight: 700; margin: 8px 0 16px; }
  form { display: inline-block; margin-right: 8px; }
  button { font: inherit; padding: 12px 20px; border-radius: 4px; border: 1px solid #1a1a1a; cursor: pointer; }
  button[value=approve] { background: #1a1a1a; color: #fff; }
</style></head>
<body><main>${inner}</main></body></html>`, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

const enabled = () => process.env.PAYMENT_PROVIDER === "mock";
const notFound = () => new Response("Not found", { status: 404 });

/* Only ever send the payer back to this site. */
function safeReturn(value, origin) {
  try {
    const u = new URL(value, origin);
    return u.origin === origin ? u.href : null;
  } catch { return null; }
}

export async function GET(request) {
  if (!enabled()) return notFound();
  const url = new URL(request.url);
  const q = url.searchParams;
  const session = q.get("session") || "";
  const amount = Number(q.get("amount"));
  const back = safeReturn(q.get("return"), url.origin);
  if (!/^mock_[0-9a-f]{24}$/.test(session) || !Number.isInteger(amount) || !back) {
    return page("Mock checkout", "<p>This checkout link is not valid.</p>", 400);
  }

  const hidden = ["session", "amount", "return"]
    .map((k) => `<input type="hidden" name="${k}" value="${esc(q.get(k))}">`).join("");
  return page("Mock checkout", `
    <p class="warn">Mock checkout. Not a real payment. No card is taken.</p>
    <p>${esc(q.get("label") || "")}</p>
    <p>Reference ${esc(q.get("ref") || "")}</p>
    <p class="amount">$${(amount / 100).toFixed(2)}</p>
    <form method="post">${hidden}<button name="decision" value="approve">Approve</button></form>
    <form method="post">${hidden}<button name="decision" value="decline">Decline</button></form>`);
}

export async function POST(request) {
  if (!enabled()) return notFound();
  const url = new URL(request.url);
  const form = new URLSearchParams(await request.text());
  const session = form.get("session") || "";
  const amount = Number(form.get("amount"));
  const back = safeReturn(form.get("return"), url.origin);
  const decision = form.get("decision");
  if (!/^mock_[0-9a-f]{24}$/.test(session) || !Number.isInteger(amount) || !back || !["approve", "decline"].includes(decision)) {
    return page("Mock checkout", "<p>This checkout request is not valid.</p>", 400);
  }

  const { body, headers } = MockProvider.signedWebhook({
    sessionId: session,
    approved: decision === "approve",
    amountCents: amount
  });
  try {
    const res = await fetch(`${url.origin}/api/webhooks/clover`, { method: "POST", headers, body });
    if (!res.ok) console.error("mock webhook delivery", res.status, await res.text());
  } catch (e) {
    /* A webhook that never arrives is a real case. The payer still goes
       back, and the confirmation screen stays on "confirming". */
    console.error("mock webhook delivery", e);
  }
  return new Response(null, { status: 303, headers: { Location: back } });
}
