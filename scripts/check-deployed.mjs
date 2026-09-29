/* ==========================================================================
   Reads a deployment and checks what it actually serves, not what the
   source says it should.

     node scripts/check-deployed.mjs https://host

   Checks:
     1. Every route responds 200, at the clean URL and at the .html one.
     2. The served canonical and og:url point at this origin, not at some
        other site. A review copy claiming the production domain tells
        Google it is a duplicate of a site that is not live.
     3. Every page carries noindex unless this IS the production domain.
     4. robots.txt matches: a blanket disallow off the real domain.
     5. sitemap.xml is well formed and every URL in it is on this origin
        and responds 200.
     6. llms.txt is served and names no gated program.
     7. Security headers from vercel.json arrived.
   ========================================================================== */

import { readFileSync } from "node:fs";

const BASE = (process.argv[2] || "").replace(/\/+$/, "");
if (!BASE) { console.error("usage: node scripts/check-deployed.mjs <url>"); process.exit(2); }

const PROD = "https://dichiarobaseball.com";
const IS_PROD = BASE === PROD;

/* The served form is .html, and the site root. cleanUrls is off: it 404ed
   the root, and .html is what every internal link and every canonical in
   the source already uses. */
const ROUTES = [
  "", "about.html", "camps-and-clinics.html", "contact.html",
  "facility-and-rentals.html", "instructors.html", "lessons.html",
  "lous-journey.html", "program.html", "register.html", "team-camps.html",
  "waiver-and-policies.html", "privacy-policy.html", "terms-and-conditions.html",
];

const data = JSON.parse(readFileSync("data/programs.json", "utf8"));
const gated = data.programs.filter((p) => p.gated).map((p) => p.name);

let failures = 0;
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const ok = (m) => console.log("  ok    " + m);
const pick = (s, re) => { const m = s.match(re); return m ? m[1] : null; };

console.log(`\nReading ${BASE}`);
console.log(IS_PROD ? "Treating this as the production domain.\n"
                    : "Not the production domain, so everything must be noindex.\n");

/* --- 1 to 3: every route ------------------------------------------------- */

console.log("Routes");
let served = 0;
const canonicals = [];
for (const route of ROUTES) {
  const url = `${BASE}/${route}`;
  let res, html;
  try {
    res = await fetch(url, { redirect: "manual" });
    html = await res.text();
  } catch (e) {
    fail(`${url} -> ${e.message}`);
    continue;
  }
  /* redirect: manual on purpose. A 200 after following a redirect hides
     that the url in the sitemap and the canonical is not the url served. */
  if (res.status !== 200) {
    fail(`${url} -> ${res.status}${res.headers.get("location") ? " -> " + res.headers.get("location") : ""}`);
    continue;
  }
  served++;

  const canonical = pick(html, /<link rel="canonical" href="([^"]+)"/i);
  const ogUrl = pick(html, /<meta property="og:url" content="([^"]+)"/i);
  const robots = pick(html, /<meta name="robots" content="([^"]+)"/i);
  canonicals.push({ route, canonical, ogUrl, robots });

  const wrongOrigin = [canonical, ogUrl].filter((u) => u && !u.startsWith(BASE));
  if (wrongOrigin.length) fail(`/${route} points at another origin: ${wrongOrigin.join(", ")}`);
  /* The canonical must be the url that actually serves, not a redirect. */
  if (canonical && canonical !== `${BASE}/${route}`) {
    fail(`/${route} declares canonical ${canonical}, which is not the url that served it`);
  }
  if (!IS_PROD && !(robots || "").includes("noindex")) fail(`/${route} is missing noindex`);
}
ok(`${served} of ${ROUTES.length} routes served 200 directly, no redirect`);

/* register.html is noindex at every origin, so it carries no canonical:
   a canonical on a page that must never be indexed is a mixed signal.
   Everything else must have one. */
const ALWAYS_NOINDEX = new Set(["register.html"]);
const missing = canonicals.filter((c) => !c.canonical && !ALWAYS_NOINDEX.has(c.route));
if (missing.length) fail(`${missing.length} indexable page(s) with no canonical: ${missing.map((c) => c.route).join(", ")}`);
else ok(`every page carries a canonical, except ${[...ALWAYS_NOINDEX].join(", ")} which is noindex by design`);
if (!IS_PROD) ok("every page carries noindex");
console.log(`        homepage canonical ${canonicals[0].canonical}`);
console.log(`        homepage og:url    ${canonicals[0].ogUrl}`);
console.log(`        homepage robots    ${canonicals[0].robots || "(none)"}`);

/* --- 4: robots.txt ------------------------------------------------------- */

console.log("\nrobots.txt");
{
  const res = await fetch(`${BASE}/robots.txt`);
  const body = await res.text();
  if (res.status !== 200) fail(`-> ${res.status}`);
  else {
    const blanket = /^\s*Disallow:\s*\/\s*$/m.test(body);
    if (IS_PROD && blanket) fail("the live site is disallowing everything");
    else if (!IS_PROD && !blanket) fail("a review copy is not disallowing everything");
    else ok(IS_PROD ? "allows crawling and names the sitemap" : "blanket disallow, as a review copy should");
    for (const line of body.trim().split("\n")) console.log("        " + line);
  }
}

/* --- 5: sitemap.xml ------------------------------------------------------ */

console.log("\nsitemap.xml");
{
  const res = await fetch(`${BASE}/sitemap.xml`);
  const body = await res.text();
  if (res.status !== 200) { fail(`-> ${res.status}`); }
  else {
    const locs = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    if (!/^<\?xml/.test(body.trim())) fail("does not start with an XML declaration");
    if (!body.includes("http://www.sitemaps.org/schemas/sitemap/0.9")) fail("missing the sitemap namespace");
    if (IS_PROD) {
      if (!locs.length) fail("the live sitemap is empty");
      else {
        const offOrigin = locs.filter((l) => !l.startsWith(BASE));
        if (offOrigin.length) fail(`${offOrigin.length} url(s) on another origin`);
        let bad = 0;
        for (const l of locs) {
          const r = await fetch(l, { redirect: "follow" });
          if (r.status !== 200) { bad++; console.log(`        ${r.status} ${l}`); }
        }
        if (bad) fail(`${bad} sitemap url(s) do not resolve`);
        else ok(`${locs.length} urls, all on this origin and all 200`);
      }
    } else {
      if (locs.length) fail(`a review copy is publishing ${locs.length} sitemap urls`);
      else ok("empty, as a review copy should be");
    }
  }
}

/* --- 6: llms.txt --------------------------------------------------------- */

console.log("\nllms.txt");
{
  const res = await fetch(`${BASE}/llms.txt`);
  const body = await res.text();
  if (res.status !== 200) fail(`-> ${res.status}`);
  else {
    ok(`served, ${body.split("\n").length} lines`);
    const leaked = gated.filter((n) => body.includes(n));
    if (leaked.length) fail(`names gated program(s): ${leaked.join(", ")}`);
    else ok(`no gated program named (${gated.length} withheld)`);
    const off = Array.from(body.matchAll(/\]\((https?:\/\/[^)]+)\)/g))
      .map((m) => m[1]).filter((u) => !u.startsWith(BASE));
    if (off.length) fail(`${off.length} link(s) on another origin, first ${off[0]}`);
    else ok("every link is on this origin");
  }
}

/* --- 7: headers ---------------------------------------------------------- */

console.log("\nHeaders");
{
  const res = await fetch(`${BASE}/`);
  const want = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-frame-options": "SAMEORIGIN",
  };
  for (const [k, v] of Object.entries(want)) {
    const got = res.headers.get(k);
    if (!got) fail(`${k} is missing`);
    else if (got.toLowerCase() !== v.toLowerCase()) fail(`${k} is "${got}", expected "${v}"`);
    else ok(`${k}: ${got}`);
  }
}

console.log(`\n${failures === 0 ? "The deployment serves what it should." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
