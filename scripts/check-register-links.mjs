/* ==========================================================================
   Every register link on the site lands on the program it names.

     node scripts/check-register-links.mjs [http://localhost:8080]

   Crawls every page reachable from the home page, collects every
   register.html?program= link with the heading of the card or block it sits
   in, follows each one, and checks the registration page renders the
   program with that slug in data/programs.json. Then checks that a slug
   that does not exist, and no slug at all, show "we could not find that
   program" and render no program.
   ========================================================================== */

import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/+$/, "");
const DATA = JSON.parse(readFileSync(new URL("../data/programs.json", import.meta.url), "utf8"));
const bySlug = Object.fromEntries(DATA.programs.map((p) => [p.slug, p]));

let failures = 0;
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const ok = (m) => console.log("  ok    " + m);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

/* --- Collect ------------------------------------------------------------- */

const seen = new Set();
const queue = ["index.html"];
const links = [];
while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  await page.goto(`${BASE}/${file}`, { waitUntil: "domcontentloaded" });
  const found = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => {
    const block = a.closest("article, section");
    const h = block && block.querySelector("h1, h2, h3");
    return { href: a.getAttribute("href"), text: a.textContent.replace(/\s+/g, " ").trim(), heading: h ? h.textContent.replace(/\s+/g, " ").trim() : "" };
  }));
  for (const l of found) {
    if (/^register\.html\?program=/.test(l.href)) links.push({ ...l, from: file });
    const path = l.href.split(/[?#]/)[0];
    if (/^[\w-]+\.html$/.test(path) && !seen.has(path)) queue.push(path);
  }
}

console.log(`\nRegister links on ${BASE}: ${links.length} across ${seen.size} pages\n`);

/* --- Follow -------------------------------------------------------------- */

for (const l of links) {
  const url = new URL(l.href.replace(/&amp;/g, "&"), BASE + "/");
  const slug = url.searchParams.get("program");
  const expected = bySlug[slug];
  const where = `${l.from} "${l.heading}" -> ${slug}${url.search.replace(/^\?program=[^&]*/, "")}${url.hash}`;
  if (!expected) { fail(`${where}: no program with that slug`); continue; }

  await page.goto(url.href, { waitUntil: "networkidle" });
  const shown = await page.evaluate(() => ({
    name: (document.querySelector("[data-program-name]") || {}).textContent || "",
    line: (document.querySelector("[data-line-name]") || {}).textContent || "",
    missing: !document.querySelector("[data-program-missing]").hidden,
    step1: !document.querySelector('[data-step="1"]').hidden,
    option: (document.querySelector('input[name="option"]:checked') || {}).value || null
  }));
  const want = `${expected.name}, ${expected.season}`;
  if (shown.missing || !shown.step1) fail(`${where}: showed not-found`);
  else if (shown.line !== want) fail(`${where}: rendered "${shown.line}", expected "${want}"`);
  else ok(`${where}: "${shown.line}"${shown.option ? `, option ${shown.option} preselected` : ""}`);
}

/* --- Not found ----------------------------------------------------------- */

console.log("\nNot found");
for (const q of ["?program=does-not-exist", "", "?program=infield-camp", "?program=iha-softball-winter-2027"]) {
  await page.goto(`${BASE}/register.html${q}`, { waitUntil: "networkidle" });
  const r = await page.evaluate(() => ({
    missing: !document.querySelector("[data-program-missing]").hidden,
    heading: document.querySelector("[data-program-missing] h1").textContent,
    visibleSteps: Array.from(document.querySelectorAll("[data-step]")).filter((p) => !p.hidden).length,
    name: Array.from(document.querySelectorAll("[data-program-name]")).map((e) => e.textContent).join(""),
    link: (document.querySelector("[data-program-missing] a") || {}).getAttribute?.("href")
  }));
  const label = `register.html${q || " (no program)"}`;
  if (!r.missing) fail(`${label}: not-found state not shown`);
  else if (r.visibleSteps || r.name) fail(`${label}: a program rendered alongside not-found`);
  else ok(`${label}: "${r.heading}", link to ${r.link}, no program rendered`);
}

await browser.close();
console.log(`\n${failures === 0 ? "All register link checks passed." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
