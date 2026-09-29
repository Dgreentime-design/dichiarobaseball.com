/* ==========================================================================
   Build.

   1. Resolves {{> partial }} tokens in pages/ and writes flat HTML to the
      project root, which is what gets served.
   2. Generates a stub page for every route that is designed but not built
      yet, from pages/_stub.html and stubs.json, so no link in the
      prototype dead-ends in a 404.

   Three things are shared by every page: the header, the mobile menu and
   the footer. They live once, in partials/, so a change to the navigation
   is one edit rather than fourteen.

   Run: node build.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const PAGES = "pages";
const PARTIALS = "partials";
const TOKEN = /\{\{>\s*([a-z0-9-]+)\s*\}\}/gi;

/* --- Where this copy of the site lives -----------------------------------

   Every canonical and og:url in pages/ is written against the production
   domain, which is correct for the source and wrong for every other place
   the site is served from. A review copy on Vercel that claims to be
   https://dichiarobaseball.com is telling Google it is a duplicate of a
   site that does not exist yet.

   So the origin is one value, resolved here, in this order:

     SITE_ORIGIN                     set it explicitly, and at the domain
                                     cutover set it to the production domain
     the Vercel domain               any deployment describes itself, which
                                     is what makes every review copy noindex
                                     without anyone remembering to do it
     the production domain           the default, and what a local build and
                                     the page sources already assume

   Note that Vercel's own "production" deployment is still a review copy
   until the domain is pointed here: what decides indexing is the origin
   being the real domain, not which Vercel environment built it.

   A rewrite of the literal rather than a token in the pages, so a page
   added later cannot miss it: there is nothing to remember. */
const PROD_ORIGIN = "https://dichiarobaseball.com";
const VERCEL_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const ORIGIN = (
  process.env.SITE_ORIGIN ||
  (VERCEL_HOST ? `https://${VERCEL_HOST}` : PROD_ORIGIN)
).replace(/\/+$/, "");

/* Indexing is opt in, and the opt in is setting SITE_ORIGIN to the real
   domain. Not "the resolved origin happens to be the production domain":
   that made the default dangerous, because `vercel deploy` builds locally
   when it cannot reach the account, VERCEL_URL is then unset, the origin
   falls back to the production domain, and a review copy ships indexable
   and claiming to be the live site. Which is the exact failure this is
   here to stop, and it got as far as a real deployment before it showed.

   So the safe state is the default. A build with nothing set is a review
   copy. Set SITE_ORIGIN=https://dichiarobaseball.com at the cutover, in
   the Vercel project's environment variables, and indexing turns on. */
const IS_PROD = process.env.SITE_ORIGIN === PROD_ORIGIN;

/* Pages that stay out of the index whatever the origin. The registration
   flow is a transaction, not a page anyone should arrive at from a search. */
const ALWAYS_NOINDEX = new Set(["register.html"]);

/* Collected as pages are written, so robots.txt, sitemap.xml and llms.txt
   are generated from the routes that actually exist rather than a list
   somebody has to remember to update. */
const built = [];

/* Files generated from legal.json, so a stub never overwrites one. */
const LEGAL_FILES = new Set(
  existsSync("legal.json")
    ? JSON.parse(readFileSync("legal.json", "utf8")).map(d => d.file)
    : []
);

const cache = new Map();
function partial(name) {
  if (cache.has(name)) return cache.get(name);
  const path = join(PARTIALS, name + ".html");
  if (!existsSync(path)) throw new Error(`Missing partial: ${name}`);
  const body = readFileSync(path, "utf8").trimEnd();
  cache.set(name, body);
  return body;
}

function resolvePartials(html) {
  let passes = 0;
  while (TOKEN.test(html) && passes < 5) {
    TOKEN.lastIndex = 0;
    html = html.replace(TOKEN, (_, name) => partial(name));
    passes++;
  }
  return html;
}

/* Marks the current page in the nav so the state is right on every page
   without hand editing each one. */
function setCurrent(html, page) {
  return html.replace(
    new RegExp(`(<a class="nav__link" href="${page}")`, "g"),
    '$1 aria-current="page"'
  );
}

/* --- The machine layer ---------------------------------------------------

   Four things a reader never sees and a crawler reads first: the origin the
   page claims to live at, whether it may be indexed, the structured data,
   and the three files at the root that describe the site to machines. */

const esc = (s) => String(s)
  .replace(/&(?!(?:amp|lt|gt|quot|#\d+|#x[0-9a-f]+);)/gi, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Entities are fine in HTML and wrong inside a JSON-LD string, where the
   value is text rather than markup. */
const plain = (s) => String(s)
  .replace(/&rsquo;/g, "’").replace(/&amp;/g, "&")
  .replace(/&nbsp;/g, " ").replace(/&middot;/g, "·")
  .replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const pick = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

/* A page keeps the production domain in its source and gets the resolved
   origin here. */
function setOrigin(html) {
  return IS_PROD ? html : html.split(PROD_ORIGIN).join(ORIGIN);
}

/* One rule for indexing rather than a meta tag per page. Anything that is
   not the real domain is a review copy, and a review copy of a client site
   turning up in a search result is the failure this prevents. */
function setRobots(html, file) {
  const noindex = !IS_PROD || ALWAYS_NOINDEX.has(file);
  const stripped = html.replace(/\s*<meta\s+name="robots"[^>]*>/gi, "");
  if (!noindex) return stripped;
  const tag = '\n<meta name="robots" content="noindex, nofollow">';
  return stripped.replace(/<\/head>/i, tag + "\n</head>");
}

/* --- Structured data ----------------------------------------------------- */

const programs = existsSync(join("data", "programs.json"))
  ? JSON.parse(readFileSync(join("data", "programs.json"), "utf8"))
  : { _meta: {}, programs: [] };

const VENUES = (programs._meta && programs._meta.venues) || {};
const PHONE = "+1-201-773-6858";
const EMAIL = "info@dichiarobaseball.com";

function postalAddress(address) {
  /* "18-01 Pollitt Drive, Fair Lawn, NJ 07410" */
  const m = String(address).match(/^(.*),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})$/);
  if (!m) return { "@type": "PostalAddress", streetAddress: address, addressCountry: "US" };
  return {
    "@type": "PostalAddress",
    streetAddress: m[1].trim(),
    addressLocality: m[2].trim(),
    addressRegion: m[3],
    postalCode: m[4],
    addressCountry: "US",
  };
}

const FACILITY_ID = `${ORIGIN}/#facility`;

function facilityNode() {
  const f = VENUES.facility || {};
  return {
    "@type": "SportsActivityLocation",
    "@id": FACILITY_ID,
    name: f.name || "DiChiaro Baseball & Softball Academy",
    description: "Year-round indoor baseball and softball instruction in Fair Lawn, New Jersey. Hitting, fielding and pitching for ages six to eighteen.",
    url: `${ORIGIN}/`,
    telephone: PHONE,
    email: EMAIL,
    address: postalAddress(f.address || ""),
    image: `${ORIGIN}/assets/img/dbsa-01-facility-in-use.jpg`,
    sameAs: [
      "https://www.instagram.com/dichiaroacademy",
      "https://www.facebook.com/dichiaroacademy",
    ],
  };
}

/* One Event per session date, which is what an Event is: a thing that
   happens at a time and a place. A program that runs fifteen Saturdays is
   fifteen events, and the dates are the verified ones in programs.json
   rather than anything retyped here.

   Where a program splits into groups, the group carries the time, so each
   group is its own series. Where it has combined sessions at the other
   venue, those dates take that venue and that time. */
function eventsFor(program) {
  const s = program.schedule || {};
  const combined = s.combined || null;
  const combinedDates = new Set((combined && combined.dates) || []);
  const facility = VENUES.facility || {};
  const other = VENUES[s.venue === "split" ? "superdome" : s.venue] || VENUES.superdome || {};
  const offers = (program.options || []).map((o) => ({
    "@type": "Offer",
    name: plain(o.label),
    price: String(o.price),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: `${ORIGIN}/register.html?program=${encodeURIComponent(program.slug)}`,
  }));

  const times = (s.groups && s.groups.length)
    ? s.groups.map((g) => ({ label: g.label, time: g.time }))
    : [{ label: null, time: s.time }];

  const out = [];
  for (const date of s.dates || []) {
    const isCombined = combinedDates.has(date);
    const slots = isCombined ? [{ label: combined.label, time: combined.time }] : times;
    for (const slot of slots) {
      const range = parseRange(date, slot.time);
      if (!range) continue;
      const venue = isCombined ? other : facility;
      out.push({
        "@type": "Event",
        name: plain(program.name) + (slot.label ? `, ${plain(slot.label)}` : ""),
        description: plain(program.summary || ""),
        startDate: range.start,
        endDate: range.end,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: venue.name || facility.name,
          address: postalAddress(venue.address || facility.address || ""),
        },
        organizer: { "@id": FACILITY_ID },
        url: `${ORIGIN}/program.html`,
        offers,
      });
    }
  }
  return out;
}

/* "9:00am - 10:30am" against a date, to two local ISO timestamps. Eastern,
   with the offset worked out from the date so a February session is not
   given a July offset. */
function parseRange(date, time) {
  if (!time) return null;
  const m = String(time).match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return null;
  const to24 = (h, ap) => {
    h = Number(h);
    if (/pm/i.test(ap) && h !== 12) h += 12;
    if (/am/i.test(ap) && h === 12) h = 0;
    return h;
  };
  const pad = (n) => String(n).padStart(2, "0");
  const off = easternOffset(date);
  return {
    start: `${date}T${pad(to24(m[1], m[3]))}:${m[2]}:00${off}`,
    end: `${date}T${pad(to24(m[4], m[6]))}:${m[5]}:00${off}`,
  };
}

/* US eastern time. Daylight saving runs from the second Sunday in March to
   the first Sunday in November, so a date outside that is -05:00. */
function easternOffset(date) {
  const d = new Date(`${date}T12:00:00Z`);
  const year = d.getUTCFullYear();
  const secondSundayMarch = nthSunday(year, 2, 2);
  const firstSundayNovember = nthSunday(year, 10, 1);
  return (d >= secondSundayMarch && d < firstSundayNovember) ? "-04:00" : "-05:00";
}

function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const offset = (7 - first.getUTCDay()) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + (n - 1) * 7, 12));
}

/* The program page currently carries one program. Keyed by file so a second
   program page only needs its slug adding. */
const PROGRAM_PAGE = { "program.html": "infield-camp-2026-27" };

function structuredData(file) {
  const graph = [];
  if (file === "index.html" || file === "contact.html") graph.push(facilityNode());
  const slug = PROGRAM_PAGE[file];
  if (slug) {
    const program = programs.programs.find((p) => p.slug === slug);
    if (program) {
      graph.push(facilityNode());
      graph.push(...eventsFor(program));
    }
  }
  if (!graph.length) return null;
  return { "@context": "https://schema.org", "@graph": graph };
}

function injectJsonLd(html, file) {
  const data = structuredData(file);
  if (!data) return html;
  /* Serialised with JSON.stringify, so the output is valid by construction,
     and the closing tag sequence is escaped because a literal </script>
     inside a script element ends it early. */
  const json = JSON.stringify(data).replace(/<\//g, "<\\/");
  const tag = `\n<script type="application/ld+json">${json}</script>`;
  return html.replace(/<\/head>/i, tag + "\n</head>");
}

function write(file, html) {
  html = setOrigin(html);
  html = setRobots(html, file);
  html = injectJsonLd(html, file);
  html = setCurrent(html, file);
  writeFileSync(file, html);
  built.push({
    file,
    title: plain(pick(html, /<title>([\s\S]*?)<\/title>/i) || file),
    description: plain(pick(html, /<meta name="description" content="([^"]*)"/i) || ""),
    noindex: /<meta name="robots"[^>]*noindex/i.test(html),
  });
  console.log("  built", file);
}

/* --- Real pages ---------------------------------------------------------- */

console.log("Pages");
let pages = 0;
for (const file of readdirSync(PAGES).filter(f => f.endsWith(".html") && !f.startsWith("_"))) {
  write(file, resolvePartials(readFileSync(join(PAGES, file), "utf8")));
  pages++;
}

/* --- Stubs ---------------------------------------------------------------
   Designed, not built. Each one carries the real header, menu and footer,
   so the navigation works from any page in the prototype and the shape of
   the site is reviewable end to end. */

console.log("Stubs");
let stubs = 0;
if (existsSync("stubs.json") && existsSync(join(PAGES, "_stub.html"))) {
  const template = readFileSync(join(PAGES, "_stub.html"), "utf8");
  for (const s of JSON.parse(readFileSync("stubs.json", "utf8"))) {
    /* A stub is only a stand-in. Once the real page source exists it wins,
       and the stub entry can stay in stubs.json harmlessly. */
    if (existsSync(join(PAGES, s.file)) || LEGAL_FILES.has(s.file)) {
      console.log("  skip ", s.file, "(real page built)"); continue;
    }
    const list = s.list.map(item => `\n        <li>${item}</li>`).join("");
    const html = resolvePartials(template)
      .replaceAll("{{title}}", s.title)
      .replaceAll("{{status}}", s.status)
      .replaceAll("{{intro}}", s.intro)
      .replaceAll("{{list}}", list + "\n      ");
    write(s.file, html);
    stubs++;
  }
}

/* --- Legal documents -----------------------------------------------------
   Three pages, one template, words in legal.json. The structure is
   identical across all three, so it lives once. */

console.log("Legal");
let legal = 0;
if (existsSync("legal.json") && existsSync(join(PAGES, "_legal.html"))) {
  const template = readFileSync(join(PAGES, "_legal.html"), "utf8");

  const slug = t => t.toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  for (const doc of JSON.parse(readFileSync("legal.json", "utf8"))) {
    const toc = doc.sections.map(sec =>
      `\n        <li><a href="#${slug(sec.title)}"><span>${sec.num}</span><span>${sec.title}</span></a></li>`
    ).join("");

    const body = doc.sections.map(sec => {
      const blocks = sec.blocks.map(b => {
        if (b.t === "p") return `\n        <p>${b.text}</p>`;
        if (b.t === "ul") return `\n        <ul>${b.items.map(i => `\n          <li>${i}</li>`).join("")}\n        </ul>`;
        if (b.t === "note") return `\n        <aside class="draft-note">\n          <p class="meta">Needs legal review</p>\n          <p>${b.text}</p>\n        </aside>`;
        return "";
      }).join("");
      return `\n      <section id="${slug(sec.title)}">\n        <h2 class="heading-l"><span class="num">${sec.num}</span><span>${sec.title}</span></h2>${blocks}\n      </section>`;
    }).join("\n");

    const html = resolvePartials(template)
      .replaceAll("{{title}}", doc.title)
      .replaceAll("{{eyebrow}}", doc.eyebrow)
      .replaceAll("{{lede}}", doc.lede)
      .replaceAll("{{updated}}", doc.updated)
      .replaceAll("{{description}}", doc.description)
      .replaceAll("{{file}}", doc.file)
      .replaceAll("{{toc}}", toc + "\n      ")
      .replaceAll("{{body}}", body + "\n    ");

    write(doc.file, html);
    legal++;
  }
}

/* --- robots.txt, sitemap.xml, llms.txt -----------------------------------

   All three from `built`, which is the list of pages this run actually
   wrote, so a route cannot appear in one and not the others, and a page
   added to pages/ turns up in all three without anyone editing a list.

   URLs keep the .html, because that is what the site actually is: every
   internal link and every canonical in pages/ is written that way.
   cleanUrls was on in vercel.json and had to come out, it 404ed the site
   root, so /about.html is both what is served and what is declared. One
   form everywhere, and no canonical pointing at a redirect. */

const urlFor = (file) => (file === "index.html" ? "/" : "/" + file);
const indexable = built.filter((p) => !p.noindex).sort((a, b) => a.file.localeCompare(b.file));

/* Nothing but the real domain may be crawled. On a review copy this is a
   blanket disallow, which pairs with the noindex on every page: the meta
   tag stops a page that is already known from being listed, robots.txt
   stops it being fetched in the first place. */
writeFileSync("robots.txt", IS_PROD
  ? `User-agent: *\nAllow: /\nDisallow: /register.html\n\nSitemap: ${ORIGIN}/sitemap.xml\n`
  : `# Review deployment, not the live site. Nothing here should be indexed.\nUser-agent: *\nDisallow: /\n`);

writeFileSync("sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  indexable.map((p) => `  <url><loc>${ORIGIN}${urlFor(p.file)}</loc></url>`).join("\n") +
  `\n</urlset>\n`);

/* llms.txt, following the convention: what this is, then the pages worth
   reading, each with the line that describes it. */
writeFileSync("llms.txt", [
  "# DiChiaro Baseball & Softball Academy",
  "",
  "> Year-round indoor baseball and softball instruction in Fair Lawn, New",
  "> Jersey. Lou DiChiaro has taught Bergen County players for twenty-five",
  "> years. Hitting, fielding and pitching for ages six to eighteen, in a",
  "> 5,500 sq ft facility built for it.",
  "",
  `Address: ${(VENUES.facility && VENUES.facility.address) || ""}`,
  `Phone: ${PHONE}`,
  `Email: ${EMAIL}`,
  "",
  "## Pages",
  "",
  ...indexable.map((p) => `- [${p.title}](${ORIGIN}${urlFor(p.file)})${p.description ? ": " + p.description : ""}`),
  "",
  "## Programs",
  "",
  /* Open programs only. A gated program is not listed on any page of the
     site, so listing it here would publish, to the crawlers this file
     exists for, exactly what the gate is there to withhold. Read from the
     data rather than by name, because which programs are gated is still
     provisional. */
  ...programs.programs.filter((p) => !p.gated).map((p) => {
    const when = (p.schedule && p.schedule.dates && p.schedule.dates.length)
      ? `${p.schedule.dates[0]} to ${p.schedule.dates[p.schedule.dates.length - 1]}, ${p.schedule.day || ""}`.trim()
      : "dates to confirm";
    return `- ${p.name}, ${p.season}. Ages ${p.ages}. ${when}.`;
  }),
  "",
  "## Notes",
  "",
  "- Prices belong to a program's purchasable options, not to the program.",
  "- Town and league rates are never published. A code is exchanged for one",
  "  price, server side.",
  "",
].join("\n"));

console.log("Machine layer");
console.log("  origin  ", ORIGIN, IS_PROD ? "(production)" : "(review, noindex everywhere)");
console.log("  built    robots.txt, sitemap.xml, llms.txt");
console.log(`  sitemap  ${indexable.length} of ${built.length} pages, ${built.length - indexable.length} noindex`);

/* Structured data is only worth having if it parses. Checked here rather
   than trusted, because a JSON-LD block that looks right and does not parse
   is worse than none: nothing warns you. */
let ld = 0;
for (const p of built) {
  const html = readFileSync(p.file, "utf8");
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  for (const b of blocks) {
    const body = b.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "").replace(/<\\\//g, "</");
    try {
      const parsed = JSON.parse(body);
      const types = (parsed["@graph"] || [parsed]).map((n) => n["@type"]);
      const counted = types.reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {});
      console.log(`  json-ld  ${p.file}: ` +
        Object.entries(counted).map(([t, n]) => `${n} ${t}`).join(", "));
      ld++;
    } catch (e) {
      throw new Error(`build: the JSON-LD on ${p.file} does not parse. ${e.message}`);
    }
  }
}
if (!ld) throw new Error("build: no JSON-LD was written. The homepage and contact page should both carry it.");

console.log(`\n${pages} page${pages === 1 ? "" : "s"}, ${legal} legal, ${stubs} stub${stubs === 1 ? "" : "s"}.`);
