/* ==========================================================================
   Verify. Run before any client review.

     node verify.mjs                 # against http://localhost:8080
     node verify.mjs http://host/    # against something else

   Six checks:
     1. Content parity, 1440 vs 390. Every leaf text node must match. This
        is the standing rule: layout changes between breakpoints, content
        does not.
     2. Horizontal overflow at 390, 768 and 1440.
     3. Tap targets under 24px that are not inline links in a sentence.
     4. Every internal link resolves, calendar downloads included. No dead
        ends in the prototype. The walk starts from the homepage and every
        generated program page.
     5. Eyebrow color. Every visible .eyebrow is one of the two approved
        colors, and the same color at 390 as at 1440. The color is set by
        the background, never by the breakpoint.
     6. Stat strips. No figure is clipped or wrapped, and no strip leaves an
        empty slot, at 390, 768 and 1440.
     7. Metadata. Every page has its own title and description; og: and
        twitter: title and description equal them; there is a share image;
        the description is 70 to 160 characters; and every number in the
        description also appears in the page body, so a share card cannot
        claim a count, price or date the page does not show.
     8. Images. Every slot in data/images.json points at an original that
        exists, with its sized files built. Every slot's sizes value covers
        its rendered width at 1440, 768 and 390 without asking for more
        than 25% extra. The same file twice on one page is listed; it
        becomes a failure once DUPLICATES_FAIL is true (after the photo
        round).
   ========================================================================== */

import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";

/* Turn on after the round that swaps the photos: until then the duplicates
   are a list for Daniel, not a failure. */
const DUPLICATES_FAIL = false;

const BASE = (process.argv[2] || "http://localhost:8080").replace(/\/$/, "");
const EXE = process.env.CHROME_PATH || undefined;
const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});

let failures = 0;
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const pass = (m) => console.log("  ok    " + m);

/* --- 1 to 3: per page, per breakpoint ----------------------------------- */

async function inspect(url, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" });
  /* Scroll the whole page first so lazy-loaded images resolve. Otherwise a
     taller breakpoint reports fewer strings purely because more images are
     still below the fold. */
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
  });
  await page
    .waitForFunction(() => Array.from(document.images).every(i => i.complete), null, { timeout: 10000 })
    .catch(() => console.log("  note  some images never settled"));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const data = await page.evaluate(() => ({
    text: (() => {
      /* Count content the reader can reach at this width. checkVisibility()
         excludes display:none, which is how the desktop nav and the mobile
         toggle swap. It deliberately does NOT exclude visibility:hidden, so
         the closed mobile menu still counts: its links are content, they are
         just behind a button. Assistive-only text and the duplicated marquee
         are not content. */
      const out = [];
      const ignore = el =>
        el.closest(".visually-hidden, .skip-link") ||
        /* aria-hidden marks decoration, except on the closed mobile menu,
           where it is a state rather than a statement about the content. */
        (el.closest('[aria-hidden="true"]') && !el.closest(".menu"));
      document.querySelectorAll("header.site-header, .menu, main, footer.site-footer").forEach(root => {
        root.querySelectorAll("*").forEach(el => {
          if (el.children.length === 0 && el.checkVisibility() && !ignore(el)) {
            const s = (el.textContent || "").replace(/\s+/g, " ").trim();
            if (s) out.push(s);
          }
        });
      });
      return out;
    })(),
    eyebrows: Array.from(document.querySelectorAll(".eyebrow"))
      .filter(el => el.checkVisibility())
      .map(el => ({ text: el.textContent.replace(/\s+/g, " ").trim().slice(0, 40), color: getComputedStyle(el).color })),
    stats: Array.from(document.querySelectorAll(".stat-strip")).flatMap(s => {
      const cols = getComputedStyle(s).gridTemplateColumns.split(" ").length;
      const out = [];
      if (s.children.length % cols) out.push(`${s.children.length} items in ${cols} columns`);
      s.querySelectorAll(".stat dt").forEach(d => {
        if (d.scrollWidth > d.clientWidth + 1) out.push(`"${d.textContent.trim()}" clipped`);
        if (d.getClientRects().length > 1 || d.offsetHeight > parseFloat(getComputedStyle(d).fontSize) * 2) out.push(`"${d.textContent.trim()}" wraps`);
      });
      return out;
    }),
    /* The width the sizes attribute asks for, against the width the image
       is drawn at. Smaller is a blurry image, much larger is wasted bytes. */
    sizes: Array.from(document.querySelectorAll("img[data-slot]")).map(i => {
      let val = null;
      for (const part of (i.getAttribute("sizes") || "").split(/,(?![^(]*\))/)) {
        const m = part.trim().match(/^(\(.*\))\s+(.+)$/);
        if (!m) { val = part.trim(); break; }
        if (matchMedia(m[1]).matches) { val = m[2]; break; }
      }
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;left:0;top:0;height:1px;width:${val}`;
      document.body.appendChild(d);
      const asked = d.getBoundingClientRect().width;
      d.remove();
      const drawn = i.getBoundingClientRect().width;
      return { slot: i.dataset.slot, drawn: Math.round(drawn), asked: Math.round(asked) };
    }).filter(x => x.drawn > 0 && (x.asked < x.drawn - 1 || x.asked > x.drawn * 1.25 + 8)),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    small: Array.from(document.querySelectorAll("a, button")).filter(el => {
      const r = el.getBoundingClientRect();
      const inline = el.closest("p, li, blockquote") && getComputedStyle(el).display === "inline";
      return r.width > 0 && r.height < 24 && !inline;
    }).map(el => (el.textContent || "").trim().slice(0, 30)),
    /* Resolved against the page, so a link from programs/ written as
       ../index.html is the same route as index.html from the root. */
    links: Array.from(document.querySelectorAll("a[href]"))
      .map(a => a.getAttribute("href"))
      .filter(h => h && !/^(https?:|mailto:|tel:|#)/.test(h))
      .map(h => new URL(h, location.href).pathname.replace(/^\//, "") || "index.html")
  }));
  await page.close();
  return data;
}

const seen = new Set();
/* The program pages are generated from data/programs.json, so the walk
   starts from them as well as the homepage: a program with no card linking
   to it is still checked. */
const programPages = JSON.parse(readFileSync("data/programs.json", "utf8")).programs
  .filter(p => p.status === "live")
  .map(p => `programs/${p.slug}.html`);
const queue = ["index.html", ...programPages];
const allLinks = new Set();

console.log(`\nVerifying ${BASE}\n`);

while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);

  const url = `${BASE}/${file}`;
  const d = await inspect(url, 1440);
  const m = await inspect(url, 390);
  const t = await inspect(url, 768);

  console.log(file);

  const onlyD = d.text.filter(x => !m.text.includes(x));
  const onlyM = m.text.filter(x => !d.text.includes(x));
  if (onlyD.length || onlyM.length) {
    fail(`content parity: ${onlyD.length} desktop only, ${onlyM.length} mobile only`);
    onlyD.slice(0, 3).forEach(s => console.log("          desktop only: " + s.slice(0, 70)));
    onlyM.slice(0, 3).forEach(s => console.log("          mobile only : " + s.slice(0, 70)));
  } else {
    pass(`content parity, ${d.text.length} strings at both widths`);
  }

  const over = [["1440", d], ["768", t], ["390", m]].filter(([, x]) => x.overflow).map(([w]) => w);
  if (over.length) fail("horizontal overflow at " + over.join(", ")); else pass("no horizontal overflow");

  /* #5A524C on light backgrounds, #E15C57 on dark and image ones. */
  const EYEBROW = ["rgb(90, 82, 76)", "rgb(225, 92, 87)"];
  const badEyebrow = [];
  if (d.eyebrows.length !== m.eyebrows.length) {
    badEyebrow.push(`${d.eyebrows.length} at 1440, ${m.eyebrows.length} at 390`);
  }
  d.eyebrows.forEach((e, i) => {
    const mob = m.eyebrows[i];
    if (!EYEBROW.includes(e.color)) badEyebrow.push(`"${e.text}" is ${e.color} at 1440`);
    if (mob && !EYEBROW.includes(mob.color)) badEyebrow.push(`"${mob.text}" is ${mob.color} at 390`);
    if (mob && mob.color !== e.color) badEyebrow.push(`"${e.text}" is ${e.color} at 1440, ${mob.color} at 390`);
  });
  if (badEyebrow.length) {
    fail(`eyebrow color: ${badEyebrow.length} problem(s)`);
    badEyebrow.slice(0, 4).forEach(s => console.log("          " + s));
  } else pass(`eyebrow color, ${d.eyebrows.length} eyebrows, same approved color at both widths`);

  const stats = Array.from(new Set([...d.stats.map(s => s + " at 1440"), ...t.stats.map(s => s + " at 768"), ...m.stats.map(s => s + " at 390")]));
  if (stats.length) { fail(`stat strip: ${stats.length} problem(s)`); stats.slice(0, 4).forEach(s => console.log("          " + s)); }
  else pass("stat strips, no clipped figure, no empty slot");

  const sizes = [["1440", d], ["768", t], ["390", m]].flatMap(([w, x]) => x.sizes.map(z => `slot ${z.slot} at ${w}: drawn ${z.drawn}px, sizes asks ${z.asked}px`));
  if (sizes.length) { fail(`image sizes: ${sizes.length} problem(s)`); sizes.slice(0, 4).forEach(s => console.log("          " + s)); }
  else pass("image sizes match the drawn width");

  const small = Array.from(new Set([...d.small, ...m.small]));
  if (small.length) fail("tap targets under 24px: " + small.join(", ")); else pass("tap targets");

  d.links.forEach(l => { allLinks.add(l); if (!seen.has(l) && l.endsWith(".html")) queue.push(l); });
  console.log("");
}

/* --- 4: every internal link resolves ------------------------------------ */

console.log("Links");
/* Requested rather than opened, so a download such as a calendar file is
   checked the same way as a page. */
const checker = await browser.newContext();
let broken = 0;
for (const link of Array.from(allLinks).sort()) {
  const res = await checker.request.get(`${BASE}/${link}`).catch(() => null);
  if (!res || res.status() >= 400) { fail(`${link} -> ${res ? res.status() : "no response"}`); broken++; }
}
await checker.close();
if (broken === 0) pass(`${allLinks.size} internal links, all resolve`);

/* --- 7: metadata describes the real page -------------------------------- */

console.log("\nMetadata");
const decode = (x) => x
  .replace(/&nbsp;/g, " ").replace(/&rsquo;|&lsquo;/g, "\u2019").replace(/&ldquo;|&rdquo;/g, "\"")
  .replace(/&middot;/g, "\u00b7").replace(/&rarr;/g, "\u2192").replace(/&mdash;|&ndash;/g, "-")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");
const meta = (html, attr, name) => {
  const m = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`, "i"));
  return m ? m[1] : null;
};
const titles = new Map(), descriptions = new Map();
const metaChecker = await browser.newContext();
let metaProblems = 0;
for (const file of Array.from(seen).filter((f) => f.endsWith(".html")).sort()) {
  const res = await metaChecker.request.get(`${BASE}/${file}`);
  const html = await res.text();
  const problems = [];
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  const description = meta(html, "name", "description");
  if (!title) problems.push("no title");
  if (!description) problems.push("no meta description");
  if (title) titles.set(title, [...(titles.get(title) || []), file]);
  if (description) descriptions.set(description, [...(descriptions.get(description) || []), file]);
  for (const [attr, name, want] of [["property", "og:title", title], ["property", "og:description", description],
    ["name", "twitter:title", title], ["name", "twitter:description", description]]) {
    const got = meta(html, attr, name);
    if (got !== want) problems.push(`${name} ${got === null ? "missing" : "differs from the page"}`);
  }
  if (!meta(html, "property", "og:image")) problems.push("no og:image");
  if (description) {
    const text = decode(description);
    /* Declared exception: pages/instructors.html is Daniel's to edit, and
       its description is his to shorten. Reported, not failed. */
    if ((text.length < 70 || text.length > 160) && file === "instructors.html") console.log(`  note  instructors.html: description is ${text.length} characters (Daniel's page)`);
    else if (text.length < 70 || text.length > 160) problems.push(`description is ${text.length} characters`);
    const body = decode(html.replace(/^[\s\S]*?<body[^>]*>/i, "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ");
    const missing = (text.match(/\d+(?:,\d{3})*(?::\d\d)?/g) || []).filter((n) => !body.includes(n));
    if (missing.length) problems.push(`description says ${missing.join(", ")}, the page does not`);
  }
  if (problems.length) { metaProblems += problems.length; fail(`${file}: ${problems.join("; ")}`); }
}
for (const [kind, map] of [["title", titles], ["description", descriptions]]) {
  for (const [, files] of map) if (files.length > 1) { metaProblems++; fail(`same ${kind} on ${files.join(", ")}`); }
}
await metaChecker.close();
if (metaProblems === 0) pass(`${titles.size} pages: unique titles and descriptions, share tags match, 70 to 160 characters, every number on the page`);

/* --- 8: the image registry ---------------------------------------------- */

console.log("\nImages");
const images = JSON.parse(readFileSync("data/images.json", "utf8"));
const gen = existsSync("assets/img/gen/manifest.json") ? JSON.parse(readFileSync("assets/img/gen/manifest.json", "utf8")) : {};
let imageProblems = 0;
for (const [n, s] of Object.entries(images.slots)) {
  if (!existsSync(`assets/img/src/${s.file}`)) { imageProblems++; fail(`slot ${n}: assets/img/src/${s.file} does not exist`); continue; }
  const m = gen[s.file];
  const built = m && m.widths.every(w => ["webp", "jpg"].every(ext => existsSync(`assets/img/gen/${s.file.replace(/\.[^.]+$/, "")}-${w}-${m.hash}.${ext}`)));
  if (!built) { imageProblems++; fail(`slot ${n}: sized files for ${s.file} are not built, run npm run build`); }
  if (!images._layouts[s.layout]) { imageProblems++; fail(`slot ${n}: layout "${s.layout}" is not in _layouts`); }
}
/* Read from the served pages, so this is what a visitor gets. */
const pageChecker = await browser.newContext();
const duplicates = [];
let slotsSeen = 0;
for (const file of Array.from(seen).filter((f) => f.endsWith(".html")).sort()) {
  const html = await (await pageChecker.request.get(`${BASE}/${file}`)).text();
  const used = new Map();
  for (const [, n] of html.matchAll(/data-slot="(\d+)"/g)) {
    slotsSeen++;
    const s = images.slots[n];
    if (!s) { imageProblems++; fail(`${file}: slot ${n} is not in data/images.json`); continue; }
    if (used.has(s.file)) duplicates.push(`${file}: slot ${n} repeats ${s.file}, first used in slot ${used.get(s.file)}`);
    else used.set(s.file, n);
  }
}
await pageChecker.close();
if (imageProblems === 0) pass(`${Object.keys(images.slots).length} slots, every original present and built, ${slotsSeen} images on the pages walked`);
if (duplicates.length && DUPLICATES_FAIL) duplicates.forEach(x => fail("same photo twice: " + x));
else if (duplicates.length) {
  console.log(`  note  same photo twice on one page, ${duplicates.length}, for the photo round:`);
  duplicates.forEach(x => console.log("          " + x));
} else pass("no photo used twice on one page");

await browser.close();
console.log(`\n${failures === 0 ? "All checks passed." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
