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

function write(file, html) {
  writeFileSync(file, setCurrent(html, file));
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

console.log(`\n${pages} page${pages === 1 ? "" : "s"}, ${legal} legal, ${stubs} stub${stubs === 1 ? "" : "s"}.`);
