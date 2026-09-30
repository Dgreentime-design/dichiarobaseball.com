/* ==========================================================================
   The money path, end to end, against the local dev server and the mock
   provider. Reads the local file store to see what was written, so it only
   runs against a server using that store (no AIRTABLE_TOKEN).

     MOCK_WEBHOOK_SECRET=... node scripts/check-payments.mjs [http://localhost:8080]

   The server must be running with PAYMENT_PROVIDER=mock and the same
   MOCK_WEBHOOK_SECRET.

   1. Happy path          approve at mock checkout, pending -> confirmed
   2. Decline             never shows success, row pending or failed
   3. Redirect, no pay    the return URL alone shows nothing confirmed
   4. Duplicate webhook   same signed webhook twice, one confirmation
   5. Bad signature       401 and nothing written
   6. Tampered amount     a lower amount in the request is ignored
   ========================================================================== */

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { sign } from "../api/_lib/providers/signature.js";

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/+$/, "");
const SECRET = process.env.MOCK_WEBHOOK_SECRET;
if (!SECRET) { console.error("MOCK_WEBHOOK_SECRET must be set"); process.exit(2); }

const STORE = new URL("../.data/registrations.json", import.meta.url);
const rawStore = () => { try { return readFileSync(STORE, "utf8"); } catch { return "[]"; } };
const rows = () => JSON.parse(rawStore());
const row = (id) => rows().find((r) => r.registration_id === id);

let failures = 0;
const results = [];
function check(name, fn) {
  return fn().then(
    () => { results.push(["PASS", name]); console.log(`  ok    ${name}`); },
    (e) => { failures++; results.push(["FAIL", name, e.message]); console.log(`  FAIL  ${name}\n          ${e.message}`); }
  );
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PLAYER = { firstName: "Test", lastName: "Player", dateOfBirth: "01 / 02 / 2016", grade: "Grade 4" };
const PARENT = { firstName: "Test", lastName: "Parent", email: "parent@example.com", phone: "(201) 555 0100" };

async function startSession(extra = {}) {
  const res = await fetch(`${BASE}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      programSlug: "little-league-fall-2026", optionId: "full", paymentMethod: "online",
      players: [PLAYER], parent: PARENT, waiverAccepted: true, photoConsent: false, ...extra
    })
  });
  const data = await res.json();
  assert(res.ok, `checkout/session ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function webhook(sessionId, { status = "APPROVED", secret = SECRET, header = "mock-signature", tamper } = {}) {
  const body = JSON.stringify({
    type: "PAYMENT", status, id: "mockpay_" + sessionId.replace(/^mock_/, ""),
    data: sessionId, amount: 32000, createdTime: Date.now()
  });
  const headers = { "Content-Type": "application/json" };
  if (secret) headers[header] = sign(body, secret);
  return fetch(`${BASE}/api/webhooks/clover`, { method: "POST", headers, body: tamper ? tamper(body) : body });
}

/* Walks the real form to the payment page in a browser. */
async function walkToCheckout(page) {
  await page.goto(`${BASE}/register.html?program=little-league-fall-2026`);
  await page.fill("#p1-first", "Mia");
  await page.fill("#p1-last", "Rodriguez");
  await page.fill("#p1-dob", "03 / 14 / 2016");
  await page.selectOption("#p1-grade", "Grade 4");
  await page.fill("#g-first", "Elena");
  await page.fill("#g-last", "Rodriguez");
  await page.fill("#g-email", "elena@example.com");
  await page.fill("#g-mobile", "(201) 555 0148");
  await page.click('[data-step-form="1"] button[type=submit]');
  await page.check("#waiver-agree");
  await page.fill("#sign-name", "Elena Rodriguez");
  await page.click('[data-step-form="2"] button[type=submit]');
  await page.click('[data-step-form="3"] button[type=submit]');
  await page.waitForURL(/\/api\/mock-checkout\?/);
  const id = new URL(page.url()).searchParams.get("ref");
  return id;
}

const title = (page) => page.textContent("[data-confirm-title]");

console.log(`\nChecking payments against ${BASE}\n`);
const browser = await chromium.launch();

await check("1. Happy path: approve moves the row pending -> confirmed with the right amount", async () => {
  const page = await browser.newPage();
  const id = await walkToCheckout(page);
  assert(row(id)?.status === "pending", `before approve: ${row(id)?.status}`);
  assert((await page.textContent(".amount")).includes("$320.00"), "mock checkout does not show $320.00");
  await page.click("button[value=approve]");
  await page.waitForURL(new RegExp(`register\\.html\\?registration=${id}`));
  await page.waitForFunction(() => /is registered/.test(document.querySelector("[data-confirm-title]").textContent), null, { timeout: 15000 });
  assert((await page.textContent("[data-due-status]")) === "Paid", "status is not Paid");
  assert((await page.textContent("[data-due-amount]")) === "$320.00", "confirmation amount is not $320.00");
  const r = row(id);
  assert(r.status === "confirmed", `row is ${r.status}`);
  assert(r.amount === 320, `row amount is ${r.amount}`);
  assert(r.provider_order_id, "no provider_order_id");
  await page.close();
});

await check("2. Decline: row moves to failed and the page never claims success", async () => {
  const page = await browser.newPage();
  const id = await walkToCheckout(page);
  await page.click("button[value=decline]");
  await page.waitForURL(new RegExp(`registration=${id}`));
  const seen = [];
  for (let i = 0; i < 12; i++) { seen.push(await title(page)); await wait(500); }
  assert(!seen.some((t) => /is registered/.test(t)), `a success title appeared: ${seen.join(" | ")}`);
  assert(seen.at(-1) === "The payment did not go through.", `final title: ${seen.at(-1)}`);
  assert(["pending", "failed"].includes(row(id).status), `row is ${row(id).status}`);
  assert(!row(id).provider_order_id, "a declined payment recorded an order ID");
  await page.close();
});

await check("3. Redirect without payment: the return URL shows nothing confirmed", async () => {
  const { registrationId: id } = await startSession();
  const page = await browser.newPage();
  await page.goto(`${BASE}/register.html?registration=${id}`);
  const seen = [];
  for (let i = 0; i < 10; i++) { seen.push(await title(page)); await wait(500); }
  assert(seen.every((t) => t === "Confirming your payment."), `titles seen: ${[...new Set(seen)].join(" | ")}`);
  assert((await page.textContent("[data-due-status]")) !== "Paid", "status shows Paid");
  assert(row(id).status === "pending", `row is ${row(id).status}`);

  /* And the old way in: #step-4 on its own must not open the confirmation. */
  await page.goto(`${BASE}/register.html#step-4`);
  await page.reload();
  assert(await page.isHidden('[data-step="4"]'), "#step-4 alone opens the confirmation panel");
  await page.close();
});

await check("4. Duplicate webhook: one confirmed registration, one order, no second row", async () => {
  const { registrationId: id } = await startSession();
  const session = row(id).checkout_session_id;
  const before = rows().length;
  const a = await webhook(session);
  const b = await webhook(session);
  assert(a.status === 200 && b.status === 200, `responses ${a.status}, ${b.status}`);
  assert((await b.json()).duplicate === true, "second delivery was not treated as a duplicate");
  const matching = rows().filter((r) => r.registration_id === id);
  assert(matching.length === 1, `${matching.length} rows for ${id}`);
  assert(rows().length === before, `row count went ${before} -> ${rows().length}`);
  assert(matching[0].status === "confirmed", `row is ${matching[0].status}`);
  assert(matching[0].provider_order_id === "mockpay_" + session.replace(/^mock_/, ""), "wrong order ID");
});

await check("5. Bad signature: 401 and nothing written", async () => {
  const { registrationId: id } = await startSession();
  const session = row(id).checkout_session_id;
  const snapshot = rawStore();
  const attempts = {
    unsigned: await webhook(session, { secret: null }),
    "wrong secret": await webhook(session, { secret: "not-the-secret" }),
    "body changed after signing": await webhook(session, { tamper: (b) => b.replace("APPROVED", "APPROVED ") }),
    "signature in the Clover header": await webhook(session, { header: "clover-signature" })
  };
  for (const [name, res] of Object.entries(attempts)) assert(res.status === 401, `${name}: ${res.status}`);
  assert(rawStore() === snapshot, "the store changed");
  assert(row(id).status === "pending", `row is ${row(id).status}`);
});

await check("6. Tampered amount: the server recomputes and ignores the submitted value", async () => {
  const data = await startSession({ amountCents: 100, amount: 1, total: 1, price: 1 });
  assert(data.amountCents === 32000, `response amount ${data.amountCents}`);
  assert(new URL(data.redirectUrl, BASE).searchParams.get("amount") === "32000", "provider asked for the wrong amount");
  assert(row(data.registrationId).amount === 320, `row amount ${row(data.registrationId).amount}`);
});

await browser.close();
console.log(`\n${failures === 0 ? "All payment checks passed." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
