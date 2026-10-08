/* ==========================================================================
   The enquiry forms, end to end, against the local dev server and the local
   file store. Reads .data/enquiries.json to see what was written, so it only
   runs against a server with no AIRTABLE_TOKEN.

     node scripts/check-enquiry.mjs [http://localhost:8080]

   The server must be running with ENQUIRIES_TABLE_NAME set, for example:
     ENQUIRIES_TABLE_NAME="Enquiries Review" node scripts/dev-server.mjs 8080

   For check 7 the script starts a second server on port 8091 with
   ENQUIRIES_TABLE_NAME removed, and stops it at the end.

   1. Contact            a valid message writes one row, status new
   2. Team camps         a valid message writes one row, details as lines
   3. Honeypot           a filled hidden field looks like success, writes nothing
   4. Too fast           under 3 seconds after load looks like success, writes nothing
   5. Bad input          a bad email, a 2,001 character message: 400, nothing written
   6. Rate limit         the sixth request in a minute from one address is refused
   7. Missing env var    the generic failure, nothing written anywhere, and the
                         page keeps what was typed and gives the phone and email
   8. Contact at 390     ?about=hittrax preselects the topic, the button reads
                         Sending..., success takes focus, about is stored
   9. Team camps at 390  success with a reference, the row has the details
   ========================================================================== */

import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/+$/, "");
const BARE = "http://localhost:8091";

const ENQUIRIES = new URL("../.data/enquiries.json", import.meta.url);
const REGISTRATIONS = new URL("../.data/registrations.json", import.meta.url);
const raw = (url) => { try { return readFileSync(url, "utf8"); } catch { return "[]"; } };
const rows = () => JSON.parse(raw(ENQUIRIES));
const row = (ref) => rows().find((r) => r.reference === ref);

const REFERENCE = /^EQ-\d{8}-[2-9A-HJKMNP-Z]{4}$/;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`  ok    ${name}`); }
  catch (e) { failures++; console.log(`  FAIL  ${name}\n          ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

/* Each API check comes from its own address, so the rate limit only bites
   where it is meant to. */
let ip = 0;
const post = (body, { base = BASE, from = `198.51.100.${++ip}` } = {}) =>
  fetch(`${base}/api/enquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": from },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });

const contact = (over = {}) => ({
  form: "contact",
  elapsedMs: 8000,
  website: "",
  pageUrl: "/contact.html",
  fields: {
    "first-name": "TEST", "last-name": "Enquiry", email: "test@example.com", phone: "",
    topic: "Private lessons", message: "TEST message from check-enquiry."
  },
  ...over
});

console.log(`\nChecking enquiries against ${BASE}\n`);

await check("1. Contact: a valid message writes one row, status new", async () => {
  const before = rows().length;
  const res = await post(contact({ about: "semi-private" }));
  const data = await res.json();
  assert(res.status === 200, `status ${res.status}`);
  assert(REFERENCE.test(data.reference), `reference ${data.reference}`);
  const r = row(data.reference);
  assert(r, "no row");
  assert(rows().length === before + 1, "more than one row");
  assert(r.form === "contact" && r.status === "new" && r.name === "TEST Enquiry", "form, status or name wrong");
  assert(r.topic === "Private lessons" && r.about === "semi-private", `topic ${r.topic}, about ${r.about}`);
  assert(r.created_at && r.page_url === "/contact.html", "created_at or page_url missing");
});

await check("2. Team camps: a valid message writes one row, details as lines", async () => {
  const res = await post({
    form: "team-camps", elapsedMs: 9000, website: "", pageUrl: "/team-camps.html",
    fields: { name: "TEST Coach", role: "Head coach, 12U", email: "coach@example.com", phone: "(201) 555 0148",
      team: "TEST 12U", sport: "Softball", players: "14", weeks: "Eight weeks", start: "First week of December", notes: "" }
  });
  const data = await res.json();
  assert(res.status === 200, `status ${res.status}`);
  const r = row(data.reference);
  assert(r && r.form === "team-camps" && r.topic === "Team booking", "row, form or topic wrong");
  assert(r.details === "Role: Head coach, 12U\nTeam: TEST 12U\nSport: Softball\nPlayers: 14\nWeeks: Eight weeks\nStart: First week of December",
    `details: ${JSON.stringify(r.details)}`);
});

await check("3. Honeypot: a filled hidden field looks like success and writes nothing", async () => {
  const before = raw(ENQUIRIES);
  const res = await post(contact({ website: "http://spam.example" }));
  const data = await res.json();
  assert(res.status === 200 && REFERENCE.test(data.reference), `status ${res.status}`);
  assert(raw(ENQUIRIES) === before, "a row was written");
});

await check("4. Too fast: under 3 seconds looks like success and writes nothing", async () => {
  const before = raw(ENQUIRIES);
  for (const elapsedMs of [500, 2999, undefined]) {
    const res = await post(contact({ elapsedMs }));
    assert(res.status === 200, `elapsed ${elapsedMs}: status ${res.status}`);
  }
  assert(raw(ENQUIRIES) === before, "a row was written");
});

await check("5. Bad input: a bad email or a 2,001 character message is a 400, nothing written", async () => {
  const before = raw(ENQUIRIES);
  const bad = [
    contact({ fields: { ...contact().fields, email: "not-an-email" } }),
    contact({ fields: { ...contact().fields, message: "x".repeat(2001) } }),
    contact({ fields: { ...contact().fields, topic: "Free bats" } }),
    contact({ form: "other" }),
    "{not json"
  ];
  for (const body of bad) {
    const res = await post(body);
    assert(res.status === 400, `status ${res.status}`);
    const text = await res.text();
    assert(!/test@example|not-an-email/.test(text), "the response echoes what was typed");
  }
  assert(raw(ENQUIRIES) === before, "a row was written");
  const res = await post(contact({ fields: { ...contact().fields, message: "x".repeat(2000) } }));
  assert(res.status === 200, `2,000 characters refused: ${res.status}`);
});

await check("6. Rate limit: the sixth request in a minute from one address is refused", async () => {
  const from = "203.0.113.77";
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await post("{not json", { from })).status);
  assert(statuses.slice(0, 5).every((s) => s === 400) && statuses[5] === 429, `statuses ${statuses.join(",")}`);
  assert((await post("{not json", { from: "203.0.113.78" })).status === 400, "another address was limited too");
});

/* A second server with no table name. */
const env = { ...process.env };
delete env.ENQUIRIES_TABLE_NAME;
delete env.AIRTABLE_TOKEN;
const bare = spawn(process.execPath, [new URL("./dev-server.mjs", import.meta.url).pathname, "8091"], { env, stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch(BARE); break; } catch { await wait(100); } }

const browser = await chromium.launch();
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

await check("7. Missing env var: the generic failure, nothing written, the page keeps what was typed", async () => {
  const before = raw(ENQUIRIES), regs = raw(REGISTRATIONS);
  const res = await post(contact(), { base: BARE });
  assert(res.status === 503, `status ${res.status}`);
  const body = await res.json();
  assert(body.error === "That didn't send." && Object.keys(body).length === 1, `body ${JSON.stringify(body)}`);
  assert(raw(ENQUIRIES) === before, "an enquiry row was written");
  assert(raw(REGISTRATIONS) === regs, "the registrations store changed");

  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`${BARE}/contact.html`);
  await page.fill("#first-name", "TEST");
  await page.fill("#last-name", "Kept");
  await page.fill("#email", "kept@example.com");
  await page.selectOption("#topic", "Something else");
  await page.fill("#message", "This text must survive a failure.");
  await wait(3200);
  await page.click("form [type=submit]");
  await page.waitForSelector("[data-enquiry-error]:not([hidden])", { timeout: 10000 });
  const error = await page.textContent("[data-enquiry-error]");
  assert(/That didn.t send\. Call \(201\) 773-6858 or email info@dichiarobaseball\.com\./.test(error.replace(/\s+/g, " ")), `error: ${error}`);
  assert(await page.inputValue("#message") === "This text must survive a failure.", "the message was lost");
  assert(await page.inputValue("#email") === "kept@example.com", "the email was lost");
  assert(await page.isEnabled("form [type=submit]") && (await page.textContent("form [type=submit]")).trim() === "Send message", "the button did not come back");
  await ctx.close();
});

bare.kill();

await check("8. Contact at 390: ?about=hittrax preselects the topic, Sending..., success takes focus", async () => {
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.route("**/api/enquiry", async (route) => { await wait(1500); await route.continue(); });
  await page.goto(`${BASE}/contact.html?about=hittrax`);
  assert(await page.inputValue("#topic") === "Cage or facility rental", `topic ${await page.inputValue("#topic")}`);
  await page.fill("#first-name", "TEST");
  await page.fill("#last-name", "Hittrax");
  await page.fill("#email", "hittrax@example.com");
  await page.fill("#message", "TEST HitTrax enquiry from check-enquiry.");
  await wait(3200);
  await page.click("form [type=submit]");
  await wait(300);
  const sending = page.locator("form [type=submit]");
  assert((await sending.textContent()).trim() === "Sending..." && await sending.isDisabled(), "button is not Sending... and disabled");
  await page.waitForSelector(".form-done", { timeout: 10000 });
  assert(await page.locator("form[data-enquiry-form]").count() === 0, "the form is still there");
  const heading = await page.evaluate(() => document.activeElement.textContent);
  assert(heading === "Thanks, we’ve got your message.", `focus is on: ${heading}`);
  const text = (await page.textContent(".form-done p")).trim();
  const ref = (text.match(/EQ-\d{8}-[2-9A-Z]{4}/) || [])[0];
  assert(ref && text === `We reply within one business day. Your reference is ${ref}.`, `text: ${text}`);
  const r = row(ref);
  assert(r && r.about === "hittrax" && r.topic === "Cage or facility rental", `row about ${r?.about}, topic ${r?.topic}`);
  assert(r.page_url === "/contact.html?about=hittrax", `page_url ${r.page_url}`);
  await ctx.close();
});

await check("9. Team camps at 390: success with a reference, the row has the details", async () => {
  const ctx = await browser.newContext(phone);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/team-camps.html`);
  for (const [sel, v] of [["#tc-name", "TEST Coach"], ["#tc-role", "Head coach"], ["#tc-email", "team@example.com"],
    ["#tc-phone", "(201) 555 0148"], ["#tc-team", "TEST Ridgewood 12U"], ["#tc-players", "12"], ["#tc-start", "December"]]) await page.fill(sel, v);
  await page.selectOption("#tc-sport", "Baseball");
  await page.selectOption("#tc-weeks", "Six weeks");
  await wait(3200);
  await page.click("form [type=submit]");
  await page.waitForSelector(".form-done", { timeout: 10000 });
  const ref = ((await page.textContent(".form-done p")).match(/EQ-\d{8}-[2-9A-Z]{4}/) || [])[0];
  const r = row(ref);
  assert(r && r.form === "team-camps" && /Team: TEST Ridgewood 12U/.test(r.details) && /Players: 12/.test(r.details), "row or details wrong");
  await ctx.close();
});

await browser.close();
console.log(`\n${failures === 0 ? "All enquiry checks passed." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
