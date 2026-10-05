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
     4. Every internal link resolves. No dead ends in the prototype.
     5. Eyebrow color. Every visible .eyebrow is one of the two approved
        colors, and the same color at 390 as at 1440. The color is set by
        the background, never by the breakpoint.
     6. Stat strips. No figure is clipped or wrapped, and no strip leaves an
        empty slot, at 390, 768 and 1440.
   ========================================================================== */

import { chromium } from "playwright";

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
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    small: Array.from(document.querySelectorAll("a, button")).filter(el => {
      const r = el.getBoundingClientRect();
      const inline = el.closest("p, li, blockquote") && getComputedStyle(el).display === "inline";
      return r.width > 0 && r.height < 24 && !inline;
    }).map(el => (el.textContent || "").trim().slice(0, 30)),
    links: Array.from(document.querySelectorAll("a[href]"))
      .map(a => a.getAttribute("href"))
      .filter(h => h && !/^(https?:|mailto:|tel:|#)/.test(h))
      .map(h => h.split(/[?#]/)[0])
  }));
  await page.close();
  return data;
}

const seen = new Set();
const queue = ["index.html"];
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

  const small = Array.from(new Set([...d.small, ...m.small]));
  if (small.length) fail("tap targets under 24px: " + small.join(", ")); else pass("tap targets");

  d.links.forEach(l => { allLinks.add(l); if (!seen.has(l)) queue.push(l); });
  console.log("");
}

/* --- 4: every internal link resolves ------------------------------------ */

console.log("Links");
const checker = await browser.newPage();
let broken = 0;
for (const link of Array.from(allLinks).sort()) {
  const res = await checker.goto(`${BASE}/${link}`, { waitUntil: "domcontentloaded" }).catch(() => null);
  if (!res || res.status() >= 400) { fail(`${link} -> ${res ? res.status() : "no response"}`); broken++; }
}
await checker.close();
if (broken === 0) pass(`${allLinks.size} internal links, all resolve`);

await browser.close();
console.log(`\n${failures === 0 ? "All checks passed." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
