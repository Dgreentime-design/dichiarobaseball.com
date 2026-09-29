/* ==========================================================================
   Reads the JSON-LD out of the built pages, or out of a deployment, and
   checks it is actually usable rather than merely present.

     node scripts/check-jsonld.mjs                 the files in this folder
     node scripts/check-jsonld.mjs https://host    the served responses

   What it checks:
     - the block parses
     - every node has an @type, and the types are the ones intended
     - the facility carries an address, a phone and a url
     - every Event has a start before its end, a location and an offer
     - no Event date is invented: each one appears in programs.json
     - no gated program appears anywhere in the output
   ========================================================================== */

import { readFileSync, existsSync } from "node:fs";

const base = process.argv[2] ? process.argv[2].replace(/\/+$/, "") : null;

const PAGES = [
  "index.html", "contact.html", "program.html", "about.html",
  "camps-and-clinics.html", "lessons.html", "facility-and-rentals.html",
  "instructors.html", "lous-journey.html", "team-camps.html", "register.html",
  "waiver-and-policies.html", "privacy-policy.html", "terms-and-conditions.html",
];

const data = JSON.parse(readFileSync("data/programs.json", "utf8"));
const allDates = new Set();
for (const p of data.programs) for (const d of (p.schedule && p.schedule.dates) || []) allDates.add(d);
const gatedNames = data.programs.filter((p) => p.gated).map((p) => p.name);

let failures = 0;
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const ok = (m) => console.log("  ok    " + m);

async function load(page) {
  if (!base) return existsSync(page) ? readFileSync(page, "utf8") : null;
  const res = await fetch(`${base}/${page}`);
  if (!res.ok) { fail(`${page} -> HTTP ${res.status}`); return null; }
  return res.text();
}

console.log(base ? `\nJSON-LD on ${base}\n` : "\nJSON-LD in the built files\n");

let totalEvents = 0;
let pagesWithLd = 0;

for (const page of PAGES) {
  const html = await load(page);
  if (html === null) continue;

  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  if (!blocks.length) continue;
  pagesWithLd++;
  console.log(page);

  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "").replace(/<\\\//g, "</");
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      fail(`does not parse: ${e.message}`);
      continue;
    }
    if (parsed["@context"] !== "https://schema.org") fail("@context is not schema.org");

    const nodes = parsed["@graph"] || [parsed];
    const untyped = nodes.filter((n) => !n["@type"]);
    if (untyped.length) fail(`${untyped.length} node(s) with no @type`);

    for (const n of nodes.filter((n) => n["@type"] === "SportsActivityLocation")) {
      const missing = ["name", "url", "telephone", "address"].filter((k) => !n[k]);
      if (missing.length) fail(`facility is missing ${missing.join(", ")}`);
      else if (!n.address.streetAddress || !n.address.postalCode) fail("facility address is not a full PostalAddress");
      else ok(`facility: ${n.name}, ${n.address.streetAddress}, ${n.address.addressLocality}`);
    }

    const events = nodes.filter((n) => n["@type"] === "Event");
    if (events.length) {
      let bad = 0;
      for (const e of events) {
        if (!e.startDate || !e.endDate) { bad++; continue; }
        if (new Date(e.startDate) >= new Date(e.endDate)) { bad++; continue; }
        if (!e.location || !e.location.name) { bad++; continue; }
        if (!e.offers || !e.offers.length) { bad++; continue; }
        if (!allDates.has(e.startDate.slice(0, 10))) { bad++; continue; }
      }
      if (bad) fail(`${bad} of ${events.length} events are malformed or carry a date that is not in programs.json`);
      else ok(`${events.length} events, all with a valid range, a location, an offer and a date from programs.json`);
      const first = events[0], last = events[events.length - 1];
      console.log(`        first ${first.startDate} ${first.name}`);
      console.log(`        last  ${last.startDate} ${last.name}`);
      totalEvents += events.length;
    }

    for (const name of gatedNames) {
      if (body.includes(name)) fail(`gated program "${name}" appears in structured data`);
    }
  }
  console.log("");
}

if (!pagesWithLd) fail("no page carried any JSON-LD");
if (!totalEvents) fail("no Event was found on any page");

console.log(`${pagesWithLd} page(s) with structured data, ${totalEvents} events.`);
console.log(failures === 0 ? "All structured data checks passed." : `${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
