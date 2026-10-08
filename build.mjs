/* ==========================================================================
   Build.

   1. Resolves {{> partial }} tokens in pages/ and writes flat HTML to the
      project root, which is what gets served.
   2. Generates a stub page for every route that is designed but not built
      yet, from pages/_stub.html and stubs.json, so no link in the
      prototype dead-ends in a 404.
   3. Generates one page and one calendar file per public program, from
      pages/_program.html, data/programs.json and data/program-copy.json.

   Three things are shared by every page: the header, the mobile menu and
   the footer. They live once, in partials/, so a change to the navigation
   is one edit rather than fourteen.

   Run: node build.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
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
/* program.html only forwards old links to a program's own page. */
const ALWAYS_NOINDEX = new Set(["register.html", "program.html"]);

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
/* The time a single-slot program runs on a date. A program can change its
   time part way through (Old Tappan moves from 4:00pm to 7:00pm on 3
   January), recorded in the data as schedule.time_change. */
function timeOn(s, date) {
  return s.time_change && date >= s.time_change.from ? s.time_change.time : s.time;
}

/* Where a family goes to sign up. A gated program is not sold on the site:
   it is a team's own block, so the page asks the family to get in touch. */
const signUpUrl = (program) => program.gated
  ? `contact.html?about=${encodeURIComponent(program.slug)}`
  : `register.html?program=${encodeURIComponent(program.slug)}`;

function eventsFor(program, file) {
  const s = program.schedule || {};
  const combined = s.combined || null;
  const combinedDates = new Set((combined && combined.dates) || []);
  const facility = VENUES.facility || {};
  const other = VENUES[s.venue === "split" ? "superdome" : s.venue] || VENUES.superdome || {};
  const offers = openOptions(program).map((o) => ({
    "@type": "Offer",
    name: plain(o.label),
    price: String(o.price),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: `${ORIGIN}/${signUpUrl(program)}`,
  }));

  const times = (date) => (s.groups && s.groups.length)
    ? s.groups.map((g) => ({ label: g.label, time: g.time }))
    : [{ label: null, time: timeOn(s, date) }];

  const out = [];
  for (const date of s.dates || []) {
    const isCombined = combinedDates.has(date);
    const slots = isCombined ? [{ label: combined.label, time: combined.time }] : times(date);
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
        url: `${ORIGIN}/${file}`,
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

/* Program pages, keyed by file. Filled in as the pages are generated. */
const PROGRAM_PAGE = {};

function structuredData(file) {
  const graph = [];
  if (file === "index.html" || file === "contact.html") graph.push(facilityNode());
  const slug = PROGRAM_PAGE[file];
  if (slug) {
    const program = programs.programs.find((p) => p.slug === slug);
    if (program) {
      graph.push(facilityNode());
      graph.push(...eventsFor(program, file));
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
        /* Review notes in legal.json are not published. They are kept in
           docs/launch-plan.md under "Open after launch". */
        if (b.t === "note") return "";
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

/* --- Program pages -------------------------------------------------------

   One static page per live program, gated team programs included, at
   programs/<slug>.html, plus a calendar file beside it. Facts come from
   data/programs.json and words from data/program-copy.json, and nothing
   else: change either file and every page rebuilds, with no edit here.

   A section with neither data nor approved copy is left out, never filled
   in. Static rather than rendered in the browser, so each program can be
   indexed at launch with its own title, description and events. */

console.log("Programs");
const COPY = existsSync(join("data", "program-copy.json"))
  ? JSON.parse(readFileSync(join("data", "program-copy.json"), "utf8"))
  : {};
/* Every live program gets a page, gated ones included: a team program is
   shown on the site, it just is not sold here. */
const PUBLIC = programs.programs.filter((p) => p.status === "live");
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const word = (n) => n <= 20 ? WORDS[n]
  : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? "-" + WORDS[n % 10].toLowerCase() : "")
  : String(n);
const ymd = (iso) => { const [y, m, d] = iso.split("-").map(Number); return { y, m: m - 1, d }; };
/* American order, from the data: "Nov 14, 2026". */
const usDate = (iso) => { const { y, m, d } = ymd(iso); return `${MON[m]} ${d}, ${y}`; };
const dow = (iso) => DOW[new Date(`${iso}T12:00:00Z`).getUTCDay()];
const money = (n) => "$" + Number(n).toLocaleString("en-US");
const typo = (s) => String(s).replace(/'/g, "&rsquo;");
const compact = (t) => String(t).replace(/\s*-\s*/, "-");
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
const today = new Date().toISOString().slice(0, 10);

/* "18-01 Pollitt Drive, Fair Lawn, NJ 07410" to "Pollitt Drive, Fair Lawn". */
const shortPlace = (address) => {
  const parts = String(address).split(",").map((s) => s.trim());
  return [parts[0].replace(/^[\d-]+\s+/, ""), parts[1]].filter(Boolean).join(", ");
};

/* The span a program day covers, earliest start to latest end. */
function daySpan(s) {
  if (!(s.groups && s.groups.length)) return s.time ? compact(s.time) : "";
  const first = s.groups[0].time.split(/\s*-\s*/)[0];
  const last = s.groups[s.groups.length - 1].time.split(/\s*-\s*/)[1];
  return `${first}-${last}`;
}

/* The options a family can still buy, by the same rule the checkout uses
   (api/_lib/programs.js): one with a session still to come. The page is
   built at deploy time, so the checkout's own check is the one that holds
   between deploys. */
const easternToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
const openOptions = (p) => p.options.filter((o) =>
  (o.dates || p.schedule.dates || []).some((d) => d >= easternToday));

/* Words the copy can use in place of facts, from the schedule: how many
   sessions, how many at each venue, which months the away sessions fall in,
   the day and the times. */
function factsFor(p) {
  const s = p.schedule;
  const away = (s.combined && s.combined.dates) || [];
  const months = [...new Set(away.map((iso) => MONTH[ymd(iso).m]))];
  const lower = (n) => word(n).toLowerCase();
  return {
    sessions: lower(s.dates.length),
    home: lower(s.dates.length - away.length),
    Home: word(s.dates.length - away.length),
    away: lower(away.length),
    away_months: months.length > 1 ? months.slice(0, -1).join(", ") + " and " + months.at(-1) : (months[0] || ""),
    day: s.day.toLowerCase(),
    Day: s.day,
    home_time: compact(daySpan(s)),
    away_time: s.combined ? compact(s.combined.time) : "",
    home_count: s.dates.length - away.length,
    away_count: away.length,
    total: s.dates.length,
  };
}

function heroBlock(p, c, f) {
  const s = p.schedule;
  const opts = openOptions(p).length ? openOptions(p) : p.options;
  const prices = [...new Set(opts.map((o) => o.price))];
  const min = Math.min(...opts.map((o) => o.price));
  const instalments = Math.max(0, ...opts.map((o) => (o.schedule || []).length));
  const from = money(min) + (instalments > 1 ? `, ${instalments}-payment plan` : "");
  const ages = /^\d/.test(p.ages) ? `Ages ${p.ages}` : p.ages;
  const sports = p.sport.map((x) => x[0].toUpperCase() + x.slice(1)).join(" &amp; ");
  const dates = s.dates || [];
  const img = c.image;
  const flyer = p.flyer && existsSync(join("assets", "flyers", p.flyer))
    ? `\n        <a class="btn btn--ghost" href="assets/flyers/${encodeURI(p.flyer)}" download>Download the flyer (PDF)</a>` : "";
  const starts = dates.length && dates[0] > today ? `\n        <p class="status">Starts ${MON[ymd(dates[0]).m]} ${ymd(dates[0]).d}</p>` : "";
  const cta = f.gated ? "Ask about joining"
    : `${c.register_label || "Register"} &nbsp;·&nbsp; ${prices.length > 1 ? "from " : ""}${money(min)}`;
  return `
<!-- ===================================================================== -->
<!-- Block 01 · Hero · required                                            -->
<!-- ===================================================================== -->
<section class="hero"${img.focus ? ` style="--hero-focus: ${img.focus};"` : ""}>
  <div class="hero__media media media--16x9 media--note">
    <img src="${img.src}" alt="" width="${img.width}" height="${img.height}" fetchpriority="high">
    <span class="media__label">${img.label}</span>
  </div>

  <div class="hero__inner">
    <div class="hero__copy">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="camps-and-clinics.html">Camps &amp; clinics</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${c.crumb || typo(p.name)}</span>
      </nav>

      <p class="eyebrow eyebrow--on-dark">${sports} &nbsp;·&nbsp; ${esc(p.season)}</p>
      <h1 class="display-xl">${c.title_html || typo(p.name)}</h1>
      <p class="hero__lede body-l">
        ${c.hero_sub || typo(p.summary)}
      </p>

      <dl class="prog-facts">
        <div class="stat stat--label"><dt>Who</dt><dd>${esc(ages)}</dd></div>
        <div class="stat stat--label"><dt>When</dt><dd>${dates.length} ${s.day}s, ${daySpan(s)}${s.time_change ? `, ${compact(s.time_change.time)} from ${MON[ymd(s.time_change.from).m]} ${ymd(s.time_change.from).d}` : ""}</dd></div>
        <div class="stat stat--label"><dt>Runs</dt><dd>${usDate(dates[0])} to ${usDate(dates[dates.length - 1])}</dd></div>
        <div class="stat stat--label"><dt>${opts.length > 1 ? "From" : "Price"}</dt><dd>${from}</dd></div>
      </dl>

      <div class="prog-actions">
        <a class="btn btn--primary" href="${f.register}">${cta}</a>${flyer}${starts}
      </div>
    </div>
  </div>
</section>

<!-- Block 02 · Marquee · optional -->
{{> marquee }}
`;
}

function groupsBlock(p, c, f) {
  const groups = p.schedule.groups || [];
  if (groups.length < 2) return "";
  const g = c.groups || {};
  const cards = groups.map((grp) => {
    const gc = (g.cards || {})[grp.id] || {};
    const chip = gc.chip ? `\n          <span class="chip${gc.chip_class ? " " + gc.chip_class : ""}">${gc.chip}</span>` : "";
    const body = gc.body ? `\n        <p>${gc.body}</p>` : "";
    const cta = gc.cta || { label: f.gated ? "Ask about joining" : `Register for ${esc(grp.label.toLowerCase())}`, href: f.register };
    return `
      <article class="group">
        <div class="group__head">
          <h3 class="heading-m">${esc(grp.label)}</h3>${chip}
        </div>
        <p class="group__when">${p.schedule.day}s &nbsp;·&nbsp; ${esc(compact(grp.time))}</p>${body}
        <a class="btn ${cta.class || "btn--primary"}" href="${cta.href}">${cta.label}</a>
      </article>`;
  }).join("\n");
  const lede = g.lede ? `\n      <p class="sec-head__lede body-l">\n        ${fill(g.lede, factsFor(p))}\n      </p>` : "";
  return `
<!-- ===================================================================== -->
<!-- Block 03 · Groups · optional, two or more groups only                 -->
<!-- ===================================================================== -->
<section class="band band--bone" aria-labelledby="groups-title">
  <div class="container">
    <div class="sec-head">
      <p class="eyebrow">${g.eyebrow || word(groups.length) + " groups"}</p>
      <h2 class="display-l" id="groups-title">${g.title || groups.map((x, i) => esc(i ? x.label.toLowerCase() : x.label)).join(" and ") + "."}</h2>${lede}
    </div>

    <div class="group-grid">${cards}
    </div>
  </div>
</section>
`;
}

function skillsBlock(p, c) {
  const list = p.teaches || [];
  if (!list.length) return "";
  const k = c.skills || {};
  const desc = k.descriptions || {};
  const items = list.map((name, i) =>
    `      <article class="skill"><p class="skill__n">${String(i + 1).padStart(2, "0")}</p><h3>${esc(name)}</h3>${desc[name] ? `<p>${desc[name]}</p>` : ""}</article>`
  ).join("\n");
  const eyebrow = k.eyebrow ? `\n      <p class="eyebrow">${k.eyebrow}</p>` : "";
  /* Three across unless another count fills every row: ten skills are two
     rows of five, eight are two rows of four, never a row with one. */
  const cols = list.length % 3 === 0 ? 3 : [5, 4].find((n) => list.length % n === 0) || 3;
  return `
<!-- ===================================================================== -->
<!-- Block 04 · What is taught · required                                  -->
<!-- ===================================================================== -->
<section class="band band--surface" aria-labelledby="taught-title">
  <div class="container">
    <div class="sec-head">${eyebrow}
      <h2 class="display-l" id="taught-title">${word(list.length)} skills, drilled until they&rsquo;re automatic.</h2>
    </div>

    <div class="skills${cols === 3 ? "" : ` skills--${cols}`}">
${items}
    </div>
  </div>
</section>
`;
}

function scheduleBlock(p, c, f) {
  const s = p.schedule;
  const away = new Set((s.combined && s.combined.dates) || []);
  const months = [];
  for (const iso of s.dates) {
    const { y, m, d } = ymd(iso);
    const key = `${MONTH[m]} ${y}`;
    let row = months.find((r) => r.key === key);
    if (!row) months.push(row = { key, days: [] });
    row.days.push(`<span class="day${away.has(iso) ? " day--away" : ""}">${dow(iso)} ${d}</span>`);
  }
  const facility = VENUES.facility || {};
  const other = VENUES.superdome || {};
  const key = (s.groups && s.groups.length)
    ? s.groups.map((g) => `      <li>${esc(g.label)} &nbsp;·&nbsp; ${compact(g.time)}</li>`)
    : [`      <li>${esc(shortPlace(facility.address))} &nbsp;·&nbsp; ${compact(s.time)}${s.time_change ? `, then ${compact(s.time_change.time)} from ${usDate(s.time_change.from)}` : ""}</li>`];
  if (s.combined) key.push(`      <li class="is-away">${esc(s.combined.label)} &nbsp;·&nbsp; ${compact(s.combined.time)}</li>`);
  const lede = (c.schedule && c.schedule.lede)
    ? `\n    <p class="sec-head__lede body-l schedule__lede">\n      ${fill(c.schedule.lede, factsFor(p))}\n    </p>` : "";
  return `
<!-- ===================================================================== -->
<!-- Block 05 · Schedule · required                                        -->
<!-- ===================================================================== -->
<section class="band band--ink" aria-labelledby="schedule-title">
  <div class="container">
    <p class="eyebrow eyebrow--dim">Every date, up front</p>
    <div class="schedule__head">
      <h2 class="display-l on-dark" id="schedule-title">${word(s.dates.length)} ${s.day}s.</h2>
      <a class="btn btn--ghost btn--compact" href="${f.ics}" download>Add all dates to your calendar</a>
    </div>${lede}

    <div class="months">
${months.map((r) => `      <div class="month">
        <p class="month__name">${r.key}</p>
        <div class="month__days">${r.days.join("")}</div>
      </div>`).join("\n")}
    </div>

    <ul class="schedule__key">
${key.join("\n")}
    </ul>
  </div>
</section>
`;
}

function pricingBlock(p, c, f) {
  const opts = openOptions(p);
  if (opts.length < 2) return "";
  const k = c.pricing || {};
  const plans = k.plans || {};
  const min = Math.min(...opts.map((o) => o.price));
  const vars = { price: money(min), per_session: money(Math.round(min / p.schedule.dates.length)) };
  const reg = (plan) => f.register + (plan && !f.gated ? `&amp;plan=${plan}` : "");
  let body;
  if (opts.length === 2) {
    body = `    <div class="plans">` + opts.map((o) => {
      const pc = plans[o.id] || {};
      const sched = o.schedule && o.schedule.length > 1 ? o.schedule : null;
      const amount = sched ? money(sched[0].amount) : money(o.price);
      const note = sched
        ? "now, " + sched.slice(1).map((x) => `then ${money(x.amount)} on ${usDate(x.when)}`).join(", ")
        : (pc.note || "");
      return `
      <article class="plan">
        <p class="plan__label">${pc.label || esc(o.label)}</p>
        <div class="plan__amount">
          <strong>${amount}</strong>${note ? `\n          <span>${note}</span>` : ""}
        </div>${pc.body ? `\n        <p>${pc.body}</p>` : ""}
        <a class="btn btn--primary" href="${reg(pc.plan)}">${f.gated ? "Ask about joining" : pc.cta || "Register"}</a>
      </article>`;
    }).join("\n") + `\n    </div>`;
  } else {
    /* More than two options reads as a price list, not a row of cards. */
    body = `    <div class="plans">
      <article class="plan plan--list">
        <div class="rate-group">
${opts.map((o) => `          <div class="rate-row">
            <div class="rate-row__label"><span class="body-m">${esc(o.label)}</span></div>
            <span class="rate-row__price">${money(o.price)}</span>
          </div>`).join("\n")}
        </div>
        <a class="btn btn--primary" href="${f.register}">${f.gated ? "Ask about joining" : "Register"}</a>
      </article>
    </div>`;
  }
  const lede = k.lede ? `\n      <p class="sec-head__lede body-l">\n        ${fill(k.lede, vars)}\n      </p>` : "";
  const included = (k.included || []).length
    ? `\n\n    <ul class="included">\n${k.included.map((x) => `      <li>${x}</li>`).join("\n")}\n    </ul>` : "";
  const note = k.note_html ? `\n\n    ${k.note_html}` : "";
  return `
<!-- ===================================================================== -->
<!-- Block 06 · Pricing · optional, plans or packages only                 -->
<!-- ===================================================================== -->
<section class="band band--bone" aria-labelledby="price-title">
  <div class="container">
    <div class="sec-head">
      <p class="eyebrow">${word(opts.length)} ways to pay</p>
      <h2 class="display-l" id="price-title">${k.title ? fill(k.title, vars) : `From ${money(min)}.`}</h2>${lede}
    </div>

${body}${included}${note}
  </div>
</section>
`;
}

function instructorBlock(c) {
  const k = c.instructor;
  if (!k) return "";
  return `
<!-- ===================================================================== -->
<!-- Block 07 · Instructor · copy only                                     -->
<!-- ===================================================================== -->
<section class="band band--surface" aria-labelledby="who-teaches-title">
  <div class="container instructor-split">
    <div class="media media--4x5">
      <img src="${k.image.src}" alt="${k.image.alt}" width="${k.image.width}" height="${k.image.height}" loading="lazy">
      <span class="media__label">${k.image.label}</span>
    </div>

    <div class="lou__copy">
      <p class="eyebrow">${k.eyebrow}</p>
      <h2 class="display-l" id="who-teaches-title">${k.name}</h2>
      <p class="body-l">
        ${k.body}
      </p>

      <dl class="lou__credits">
${k.credits.map(([y, t]) => `        <div class="lou__credit"><dt>${y}</dt><dd>${t}</dd></div>`).join("\n")}
      </dl>
${k.quote ? `
      <figure class="pull-quote">
        <blockquote>${k.quote.text}</blockquote>
        <cite>${k.quote.cite}</cite>
      </figure>
` : ""}
      <p class="chip-row__action">
        <a class="arrow-link" href="instructors.html"><span>Meet all the instructors</span><span aria-hidden="true">&rarr;</span></a>
      </p>
    </div>
  </div>
</section>
`;
}

function venuesBlock(p, c) {
  const s = p.schedule;
  const k = c.venues;
  if (s.venue !== "split" || !k) return "";
  const facts = factsFor(p);
  const card = (id) => {
    const v = VENUES[id] || {};
    const vc = (k.cards || {})[id] || {};
    const n = id === "facility" ? facts.home_count : facts.away_count;
    const parts = String(v.address).split(",").map((x) => x.trim());
    const q = encodeURIComponent(v.address).replace(/%20/g, "+").replace(/%2C/g, "");
    return `
      <article class="venue">
        <div class="media media--16x9">
          <img src="${vc.map.src}" alt="${vc.map.alt}" width="1200" height="800" loading="lazy">
          <span class="media__label">${vc.map.label}</span>
        </div>
        <div class="venue__body">
          <div class="venue__head">
            <h3 class="heading-m">${vc.title || esc(v.name)}</h3>
            <span class="venue__count">${n} of ${facts.total} sessions</span>
          </div>
          <address>${esc(parts[0])}<br>${esc(parts.slice(1).join(", ").replace(/, (\d{5})$/, " $1"))}</address>${vc.when ? `\n          <p class="venue__when">${fill(vc.when, facts)}</p>` : ""}
          <a class="btn btn--outline btn--compact" href="https://maps.google.com/?q=${q}" rel="noopener">Get directions</a>
        </div>
      </article>`;
  };
  return `
<!-- ===================================================================== -->
<!-- Block 08 · Location · optional, two or more venues only               -->
<!-- ===================================================================== -->
<section class="band band--bone" aria-labelledby="where-title">
  <div class="container">
    <div class="sec-head">
      <p class="eyebrow">${k.eyebrow}</p>
      <h2 class="heading-xl" id="where-title">${k.title}</h2>
    </div>

    <div class="venues">${card("facility")}
${card("superdome")}
    </div>
  </div>
</section>
`;
}

function faqBlock(c) {
  if (!(c.faq && c.faq.length)) return "";
  return `
<!-- ===================================================================== -->
<!-- Block 09 · FAQ · optional                                             -->
<!-- ===================================================================== -->
<section class="band band--surface" aria-labelledby="faq-title">
  <div class="container">
    <div class="sec-head">
      <p class="eyebrow">Before you ask</p>
      <h2 class="heading-xl" id="faq-title">Questions parents ask.</h2>
    </div>

    <div class="faq">
${c.faq.map(([q, a]) => `      <details>
        <summary>${q}</summary>
        <p>${a}</p>
      </details>`).join("\n")}
    </div>
  </div>
</section>
`;
}

function registerBlock(p, c, f) {
  const k = c.register_band || {};
  const opts = openOptions(p).length ? openOptions(p) : p.options;
  const prices = [...new Set(opts.map((o) => o.price))];
  const min = Math.min(...opts.map((o) => o.price));
  const cta = (!f.gated && k.cta) || { label: f.gated ? "Ask about joining" : `Register &nbsp;·&nbsp; ${prices.length > 1 ? "from " : ""}${money(min)}`, href: f.register };
  return `
<!-- ===================================================================== -->
<!-- Block 10 · Register band · required                                   -->
<!-- ===================================================================== -->
<section class="band band--red" aria-labelledby="prog-register-title">
  <div class="register__inner">
    <div class="register__copy">
      <h2 class="display-l" id="prog-register-title">${k.title_html || `${typo(p.name)},<br>${esc(p.season)}.`}</h2>${k.body ? `
      <p class="body-m">
        ${k.body}
      </p>` : ""}
    </div>
    <div class="register__actions">
      <a class="btn btn--secondary" href="${cta.href}">${cta.label}</a>
    </div>
  </div>
</section>
`;
}

/* The calendar file. One event per session date: a family is in one group,
   so a day with two groups is one event spanning both, with each group's
   time in the description. Combined dates take that time and that venue.
   Times are written in UTC from the Eastern offset of each date. */
function icsFor(p) {
  const s = p.schedule;
  const away = new Set((s.combined && s.combined.dates) || []);
  const facility = VENUES.facility || {};
  const other = VENUES.superdome || {};
  const text = (x) => String(x).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const utc = (local) => new Date(local).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  /* The build day, not the build second, so a rebuild on the same day
     writes the same file. */
  const stamp = today.replace(/-/g, "") + "T000000Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DiChiaro Baseball & Softball Academy//Program calendar//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${text(`${plain(p.name)}, ${p.season}`)}`];
  for (const date of s.dates) {
    const combined = away.has(date);
    const time = combined ? s.combined.time
      : (s.groups && s.groups.length ? daySpan(s).replace("-", " - ") : timeOn(s, date));
    const range = parseRange(date, time);
    if (!range) continue;
    const venue = combined ? other : facility;
    const detail = combined
      ? s.combined.label
      : (s.groups && s.groups.length ? s.groups.map((g) => `${g.label}: ${compact(g.time)}`).join(". ") : "");
    lines.push("BEGIN:VEVENT", `UID:${p.slug}-${date}@dichiarobaseball.com`, `DTSTAMP:${stamp}`,
      `DTSTART:${utc(range.start)}`, `DTEND:${utc(range.end)}`,
      `SUMMARY:${text(plain(p.name))}`,
      `LOCATION:${text(`${venue.name}, ${venue.address}`)}`);
    if (detail) lines.push(`DESCRIPTION:${text(detail)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  /* Lines longer than 75 octets are folded, as the format requires. */
  const fold = (line) => {
    const out = [];
    let rest = Buffer.from(line, "utf8");
    let limit = 75;
    while (rest.length > limit) {
      let cut = limit;
      while (cut > 0 && (rest[cut] & 0xc0) === 0x80) cut--;
      out.push(rest.subarray(0, cut).toString("utf8"));
      rest = rest.subarray(cut);
      limit = 74;
    }
    out.push(rest.toString("utf8"));
    return out.join("\r\n ");
  };
  return lines.map(fold).join("\r\n") + "\r\n";
}

const PROGRAM_DIR = "programs";

/* Pages in programs/ sit one folder down, and every link in the partials
   and the template is relative to the root. Rewritten once, here, so the
   partials stay as they are. */
const upOne = (html) => html.replace(
  /(\s(?:href|src)=")(?!https?:|\/\/|#|mailto:|tel:|data:|\/|\.\.\/)([^"]+)"/g,
  (_, a, url) => {
    if (url.startsWith(PROGRAM_DIR + "/")) return `${a}${url.slice(PROGRAM_DIR.length + 1)}"`;
    if (url === "./") return `${a}../"`;
    return `${a}../${url}"`;
  }
);

if (PUBLIC.length && existsSync(join(PAGES, "_program.html"))) {
  mkdirSync(PROGRAM_DIR, { recursive: true });
  const template = readFileSync(join(PAGES, "_program.html"), "utf8");
  for (const p of PUBLIC) {
    const c = COPY[p.slug] || {};
    const file = `${PROGRAM_DIR}/${p.slug}.html`;
    const f = { register: signUpUrl(p).replace(/&/g, "&amp;"), gated: !!p.gated, ics: `${PROGRAM_DIR}/${p.slug}.ics` };
    if (!c.image) throw new Error(`build: ${p.slug} has no hero image in data/program-copy.json`);
    const blocks = [heroBlock(p, c, f), groupsBlock(p, c, f), skillsBlock(p, c), scheduleBlock(p, c, f),
      pricingBlock(p, c, f), instructorBlock(c), venuesBlock(p, c), faqBlock(c), registerBlock(p, c, f)].join("");
    const name = typo(p.name);
    const html = resolvePartials(template
      .replace("{{blocks}}", () => blocks)
      .replaceAll("{{title}}", () => `${name}, ${esc(p.season)} · DiChiaro Baseball &amp; Softball Academy`)
      .replaceAll("{{og_title}}", () => `${name}, ${esc(p.season)}`)
      .replaceAll("{{description}}", () => c.description || esc(p.summary))
      .replaceAll("{{og_description}}", () => c.og_description || c.description || esc(p.summary))
      .replaceAll("{{og_image}}", () => c.image.src)
      .replaceAll("{{file}}", () => file));
    PROGRAM_PAGE[file] = p.slug;
    write(file, upOne(html));
    writeFileSync(f.ics, icsFor(p));
    console.log("  built", f.ics);
  }

  /* program.html was the one fixed program page and every old link points
     at it, as program.html?p=<old slug>. It now forwards to the program's
     own page, and anything it does not know goes to the camps page. */
  const LEGACY = {
    "little-league-training-camp": "little-league-fall-2026",
    "spring-little-league": "little-league-march-2027",
    "infield-camp": "infield-camp-2026-27",
    "monday-hit-night": "hit-night-fall-2026",
  };
  const map = Object.fromEntries([
    ...Object.entries(LEGACY).filter(([, to]) => PUBLIC.some((p) => p.slug === to)),
    ...PUBLIC.map((p) => [p.slug, p.slug]),
  ]);
  write("program.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Camps &amp; clinics · DiChiaro Baseball &amp; Softball Academy</title>
<link rel="canonical" href="https://dichiarobaseball.com/camps-and-clinics.html">
<script>
  (function () {
    var map = ${JSON.stringify(map)};
    var p = new URLSearchParams(window.location.search).get("p");
    window.location.replace(map[p] ? "${PROGRAM_DIR}/" + map[p] + ".html" : "camps-and-clinics.html");
  })();
</script>
<noscript><meta http-equiv="refresh" content="0; url=camps-and-clinics.html"></noscript>
</head>
<body>
<p><a href="camps-and-clinics.html">See camps and clinics</a></p>
</body>
</html>
`);
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
