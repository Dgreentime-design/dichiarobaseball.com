/* ==========================================================================
   Images. One registry, sized files, one <picture> per slot.

   data/images.json has one entry per image slot, numbered as in
   docs/review/image-map.md. A page asks for a slot, never a file:

     {{img 7}}         a lazy <picture> for slot 7
     {{img 1 hero}}    the page's first hero: eager, fetchpriority high,
                       and a preload in <head>
     {{img_url 10}}    the slot's 1280px JPG as an absolute URL, for og:image

   A slot can name a second original in file_mobile. The slot then renders
   that photo up to 767px wide and file above it (art direction, not just a
   crop), with focal_mobile as its focal point, and the hero preload asks
   for the right one per breakpoint.

   Originals live in assets/img/src/. Each one used by a slot is written to
   assets/img/gen/ as <name>-<width>-<hash>, at 480, 800, 1280, 1920 and
   2880 wide, as far as the
   original allows, in WebP plus a JPG fallback. The generated files are
   committed like the generated HTML.

   assets/img/gen/manifest.json records a hash of each original and of the
   settings below. An unchanged original is not rebuilt. On Vercel nothing
   is generated: the committed files are used, and a missing or stale one
   fails the build, so a swap that was never built locally cannot ship.
   ========================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, parse } from "node:path";

export const SRC = "assets/img/src";
export const GEN = "assets/img/gen";
const MANIFEST = join(GEN, "manifest.json");
const WIDTHS = [480, 800, 1280, 1920, 2880];
/* Tuned so a 1280 hero lands well under 200 KB. Change these and every
   image rebuilds, because they are part of the hash. */
const SETTINGS = { webp: { quality: 70, effort: 6 }, jpg: { quality: 72, mozjpeg: true } };
const SETTINGS_KEY = JSON.stringify({ WIDTHS, SETTINGS });

export const registry = JSON.parse(readFileSync(join("data", "images.json"), "utf8"));
const slots = registry.slots;
const layouts = registry._layouts;

const stem = (file) => parse(file).name;
const hashOf = (file) => createHash("sha1").update(readFileSync(join(SRC, file))).update(SETTINGS_KEY).digest("hex").slice(0, 8);
/* The hash is in the name: /assets/ is cached for a week, so a photo
   replaced under the same file name still reaches every browser at once. */
const out = (file, w, ext, hash = manifest[file].hash) => `${GEN}/${stem(file)}-${w}-${hash}.${ext}`;

let manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

export function slot(n) {
  const s = slots[String(n)];
  if (!s) throw new Error(`images: slot ${n} is not in data/images.json`);
  if (!layouts[s.layout]) throw new Error(`images: slot ${n} has layout "${s.layout}", which is not in _layouts`);
  return s;
}

/* Build every sized file the registry needs. Returns what it did. */
export async function generate() {
  const files = [...new Set(Object.values(slots).flatMap((s) => [s.file, s.file_mobile]).filter(Boolean))].sort();
  const missing = files.filter((f) => !existsSync(join(SRC, f)));
  if (missing.length) throw new Error(`images: missing in ${SRC}: ${missing.join(", ")}`);
  mkdirSync(GEN, { recursive: true });
  const stale = files.filter((f) => {
    const m = manifest[f];
    return !m || m.hash !== hashOf(f) || m.widths.some((w) => !existsSync(out(f, w, "webp")) || !existsSync(out(f, w, "jpg")));
  });
  if (stale.length && process.env.VERCEL) {
    throw new Error(`images: ${stale.join(", ")} not built. Run npm run build locally and commit assets/img/gen/.`);
  }
  let sharp;
  if (stale.length) sharp = (await import("sharp")).default;
  for (const f of stale) {
    const { width, height } = await sharp(join(SRC, f)).metadata();
    const hash = hashOf(f);
    const widths = WIDTHS.filter((w) => w <= width);
    if (!widths.length) widths.push(width);
    for (const w of widths) {
      const r = sharp(join(SRC, f)).resize({ width: w }).toColourspace("srgb");
      await r.clone().webp(SETTINGS.webp).toFile(out(f, w, "webp", hash));
      await r.clone().flatten({ background: "#ffffff" }).jpeg(SETTINGS.jpg).toFile(out(f, w, "jpg", hash));
    }
    manifest[f] = { hash, width, height, widths };
    console.log(`  image ${f}: ${widths.join(", ")}`);
  }
  /* Forget originals no slot uses any more, and their files. */
  const keep = new Set(["manifest.json"]);
  for (const f of files) for (const w of manifest[f].widths) for (const ext of ["webp", "jpg"]) keep.add(parse(out(f, w, ext)).base);
  manifest = Object.fromEntries(Object.entries(manifest).filter(([f]) => files.includes(f)));
  if (!process.env.VERCEL) {
    for (const g of readdirSync(GEN)) if (!keep.has(g)) unlinkSync(join(GEN, g));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  }
  return { built: stale.length, total: files.length };
}

const srcset = (f, ext, prefix) => manifest[f].widths.map((w) => `${prefix}${out(f, w, ext)} ${w}w`).join(", ");
const fallback = (f) => manifest[f].widths.filter((w) => w <= 1280).pop() || manifest[f].widths[0];
const attr = (s) => String(s).replace(/&(?!(?:amp|lt|gt|quot|rsquo|#\d+);)/g, "&amp;").replace(/"/g, "&quot;");

/* The media query file_mobile answers. Matches the focal_mobile CSS. */
const PHONE = "(max-width: 767px)";

/* The sizes for the phone photo: zoom_mobile draws it wider than the box,
   so it asks for that much more. Only a single-value sizes can be scaled. */
function phoneSizes(s) {
  const sizes = layouts[s.layout];
  if (!s.zoom_mobile) return sizes;
  if (sizes.includes(",") || sizes.includes("(")) throw new Error(`images: slot zoom_mobile needs a single-value sizes, layout "${s.layout}" has "${sizes}"`);
  return `calc(${sizes} * ${s.zoom_mobile})`;
}

/* The <picture> for a slot. prefix is "../" for pages one folder down. */
export function picture(n, { hero = false, prefix = "" } = {}) {
  const s = slot(n);
  const f = s.file;
  const m = manifest[f];
  const sizes = layouts[s.layout];
  /* Phone sources first: the browser takes the first <source> that matches.
     width and height on them keep the box reserved for the phone photo. */
  const fm = s.file_mobile;
  const phone = fm
    ? ["webp", "jpg"].map((ext) => `<source media="${PHONE}"${ext === "webp" ? ` type="image/webp"` : ""} srcset="${srcset(fm, ext, prefix)}" sizes="${phoneSizes(s)}" width="${manifest[fm].width}" height="${manifest[fm].height}">`).join("")
    : "";
  const style = [
    s.focal && s.focal !== "50% 50%" ? `--focal: ${s.focal};` : "",
    s.focal_mobile ? `--focal-m: ${s.focal_mobile};` : "",
    s.zoom_mobile ? `--zoom-m: ${s.zoom_mobile};` : "",
  ].filter(Boolean).join(" ");
  const load = hero ? ` fetchpriority="high"` : ` loading="lazy" decoding="async"`;
  return `<picture>` + phone +
    `<source type="image/webp" srcset="${srcset(f, "webp", prefix)}" sizes="${sizes}">` +
    `<img src="${prefix}${out(f, fallback(f), "jpg")}" srcset="${srcset(f, "jpg", prefix)}" sizes="${sizes}" alt="${attr(s.alt)}" width="${m.width}" height="${m.height}"${load} data-slot="${n}"${style ? ` style="${style}"` : ""}>` +
    `</picture>`;
}

/* The preload for a page's first hero, so the browser starts it before the
   CSS is parsed. type= keeps a browser without WebP from fetching it. */
export function preload(n, { prefix = "" } = {}) {
  const s = slot(n);
  const link = (f, media) => `<link rel="preload" as="image" type="image/webp" imagesrcset="${srcset(f, "webp", prefix)}" imagesizes="${f === s.file_mobile ? phoneSizes(s) : layouts[s.layout]}"${media ? ` media="${media}"` : ""} fetchpriority="high">`;
  /* With a phone photo, one preload per breakpoint, so a phone never
     downloads the desktop photo and a desktop never downloads the phone one. */
  if (s.file_mobile) return link(s.file_mobile, PHONE) + "\n" + link(s.file, "(min-width: 768px)");
  return link(s.file);
}

/* The 1280 JPG as an absolute URL against the production domain. build.mjs
   rewrites the origin like every other absolute URL. */
export function imageUrl(n, origin) {
  const f = slot(n).file;
  return `${origin}/${out(f, fallback(f), "jpg")}`;
}

/* Resolves the three tokens in a page and puts the hero preload in <head>. */
export function resolveImages(html, { origin, prefix = "" } = {}) {
  let heroSlot = null;
  html = html
    .replace(/\{\{img_url (\d+)\}\}/g, (_, n) => imageUrl(n, origin))
    .replace(/\{\{img (\d+)( hero)?\}\}/g, (_, n, hero) => {
      if (hero && heroSlot === null) heroSlot = n;
      return picture(n, { hero: !!hero, prefix });
    });
  if (heroSlot !== null) html = html.replace("</head>", () => `${preload(heroSlot, { prefix })}\n</head>`);
  return html;
}
