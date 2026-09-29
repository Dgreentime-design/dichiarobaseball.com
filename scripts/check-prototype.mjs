/* ==========================================================================
   Two things the other checks do not cover, driven in a real browser.

     node scripts/check-prototype.mjs                 against localhost:8080
     node scripts/check-prototype.mjs https://host    against a deployment

   1. The Gianna Sarlo card. No photograph has been supplied, so the card
      should render the labelled placeholder and make no request at all.
      The error handler in site.js produced the same appearance, but only
      after a 404, which put a real error in the logs for a file that is
      missing on purpose.

   2. The demo rate code. DEMO25 applies the invented town rate and drops
      the total. Anything else returns one message, whatever the reason.
      Checked because renaming the code is the kind of change that works
      everywhere except the one place nobody re-ran.
   ========================================================================== */

import { chromium } from "playwright";

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/+$/, "");
const browser = await chromium.launch();

let failures = 0;
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const ok = (m) => console.log("  ok    " + m);

/* --- 1: the card with no photograph -------------------------------------- */

console.log(`\nChecking ${BASE}\n`);
console.log("Gianna Sarlo card");
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const requested = [];
  const failed = [];
  page.on("request", (r) => { if (/gianna/i.test(r.url())) requested.push(r.url()); });
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });

  await page.goto(`${BASE}/instructors.html`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(600);

  const card = await page.evaluate(() => {
    const el = document.querySelector("#gianna-sarlo");
    if (!el) return null;
    const media = el.querySelector(".media");
    const label = el.querySelector(".media__label");
    return {
      hasImg: !!el.querySelector("img"),
      empty: media ? media.classList.contains("media--empty") : false,
      labelVisible: label ? label.checkVisibility() : false,
      labelText: label ? label.textContent.trim() : "",
      mediaHeight: media ? Math.round(media.getBoundingClientRect().height) : 0,
      name: (el.querySelector("h3, .person__name") || {}).textContent || "",
    };
  });

  if (!card) fail("the card is not on the page");
  else {
    if (card.hasImg) fail("the card still carries an <img>, so it still requests a file that is not there");
    else ok("no <img>, so nothing is requested");
    if (requested.length) fail(`${requested.length} request(s) for the missing photograph`);
    else ok("zero requests for dbsa-19");
    if (failed.length) fail(`${failed.length} failed request(s): ${[...new Set(failed)].join(", ")}`);
    else ok("no 4xx anywhere on the page");
    if (!card.empty) fail("media--empty is not set, so the placeholder will not render");
    else if (!card.labelVisible) fail("the placeholder label is not visible");
    else ok(`placeholder renders, ${card.mediaHeight}px tall, labelled`);
  }
  await page.close();
}

/* --- 2: the demo rate code ----------------------------------------------- */

console.log("\nDemo rate code");
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/register.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const source = await page.content();
  for (const banned of ["PLL25", "Paterson Little League"]) {
    if (source.includes(banned)) fail(`the served page still contains "${banned}"`);
  }
  if (!source.includes("DEMO25")) fail("the served page does not mention DEMO25");
  else ok("the page offers DEMO25 and names no real league");

  /* Walk to step 3, where the code field lives. */
  const total = () => page.evaluate(() => {
    const el = document.querySelector("[data-total]");
    return el ? el.textContent.trim() : null;
  });

  const before = await total();

  /* Walk the real flow to step 3 rather than forcing state, so this also
     proves the steps still advance. Required fields are filled generically:
     what is being tested here is the code, not the validation. */
  const reached = await page.evaluate(async () => {
    const fill = (form) => {
      for (const el of form.querySelectorAll("[required]")) {
        if (el.type === "checkbox" || el.type === "radio") { el.checked = true; }
        else if (el.tagName === "SELECT") {
          const opt = Array.from(el.options).find(o => o.value);
          if (opt) el.value = opt.value;
        } else if (el.type === "email") el.value = "parent@example.com";
        else if (el.type === "tel") el.value = "2015550123";
        else if (el.type === "date") el.value = "2015-01-01";
        else if (/date of birth|dob/i.test(el.getAttribute("placeholder") || el.id || "")) el.value = "01/01/2015";
        else el.value = "Test";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    for (let i = 0; i < 4; i++) {
      const panel = document.querySelector('[data-step]:not([hidden])');
      const step = panel ? Number(panel.getAttribute("data-step")) : null;
      if (step === 3) return 3;
      const form = document.querySelector(`[data-step-form="${step}"]`);
      if (!form) return step;
      fill(form);
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise(r => setTimeout(r, 250));
    }
    const panel = document.querySelector('[data-step]:not([hidden])');
    return panel ? Number(panel.getAttribute("data-step")) : null;
  });

  if (reached !== 3) fail(`could not reach step 3, stopped on step ${reached}`);
  else ok("walked steps 1 and 2, reached step 3");

  await page.evaluate(() => {
    const t = document.querySelector("[data-code-toggle]");
    if (t) t.click();
  });
  await page.waitForTimeout(200);

  const field = await page.$("#rate-code");

  if (field) {
    await page.fill("#rate-code", "NOPE99");
    await page.evaluate(() => {
      const btn = document.querySelector("[data-apply-code]")
        || Array.from(document.querySelectorAll("button")).find(b => /apply/i.test(b.textContent || ""));
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    const afterBad = await total();
    const message = await page.evaluate(() => {
      const el = document.querySelector(".field__error");
      return el ? el.textContent.trim() : null;
    });
    if (afterBad !== before) fail("a bad code changed the total");
    else ok(`a bad code leaves the total at ${before}`);
    if (!message) fail("a bad code produced no message");
    else ok(`one message, no detail about why: "${message}"`);

    await page.fill("#rate-code", "DEMO25");
    await page.evaluate(() => {
      const btn = document.querySelector("[data-apply-code]")
        || Array.from(document.querySelectorAll("button")).find(b => /apply/i.test(b.textContent || ""));
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    const afterGood = await total();
    if (afterGood === before) fail(`DEMO25 did not change the total, still ${before}`);
    else ok(`DEMO25 applies: ${before} becomes ${afterGood}`);

    const shown = await page.evaluate(() => {
      const el = document.querySelector("[data-rate-label]");
      return el ? el.textContent.trim() : null;
    });
    if (shown) ok(`rate shown as "${shown}"`);
  } else {
    fail("could not reach the code field");
  }

  if (errors.length) fail(`page error: ${errors[0]}`);
  else ok("no page errors");
  await page.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "All prototype checks passed." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
