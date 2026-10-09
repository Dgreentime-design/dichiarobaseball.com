# Round 17 - Image pipeline, one-line image swaps, and the speed wins

DiChiaro Baseball & Softball Academy. Written 9 October 2026. Go-live
target: Tuesday 13 October. One run, one report. Follow CLAUDE.md.

Purpose: Daniel is choosing new photos now, against the slot numbers in
`docs/review/image-map.md`. Build the plumbing so that when he hands them
over, each swap is one line, every image is served at the right size, and
the page speed issues from round 16 are gone. No new photos this round.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html` or slots 48-54. Daniel owns them.
3. No changes to `api/`, prices, dates, options or the register flow logic.
4. No visual change: the site must look the same at 390, 768, 1024 and 1440
   after this round. Prove it with before and after screenshots of Home,
   Camps, one program page and Register, compared side by side.
5. Never use an em dash.

## Round 16 verdict

Accepted, including the US date fix on the confirmation screen and keeping
the 3-second spam floor.

## 1. One image registry, keyed by slot number

1. Create `data/images.json`: one entry per slot from the image map (1-47),
   with `file`, `alt`, and `focal` (CSS object-position, default "50% 50%").
   Where a slot has a different crop on phones, allow `focal_mobile`.
2. Every page and generated program page reads its images from the
   registry by slot number. Hero images that are decorative keep empty alt.
3. Swapping a photo, or moving its focal point, is then one line in
   `data/images.json` plus a rebuild. Document that in
   `docs/review/image-map.md` under "How to swap a photo".
4. `npm run verify` fails if a slot points at a missing file, or if two
   slots on the same page use the same file. Report current duplicates
   (the map shows some, for example slots 11 and 14 on Camps) as a list for
   Daniel instead of failing on them today; turn that into a hard check
   after the photo round.

## 2. Responsive images at build time

1. Originals live in `assets/img/src/` (move today's files there).
2. `build.mjs` generates sized versions per original: widths 480, 800,
   1280, 1920 and 2880 where the original is large enough, in AVIF or WebP
   plus a JPG fallback, quality tuned so a 1280 hero lands under about
   200 KB. Use `sharp`. Cache outputs so an unchanged image is not
   rebuilt. Generated files are committed like the generated HTML.
3. Each image renders as `<picture>` with `srcset` and a `sizes` value
   that matches its slot's rendered width at each breakpoint, plus
   `width` and `height` so nothing shifts.
4. The first hero on each page loads eagerly with `fetchpriority="high"`
   and a preload; everything else `loading="lazy"` and `decoding="async"`.
5. The Vercel build must still pass. If `sharp` can't run there, commit the
   generated files and skip generation on Vercel. Say which you chose.

## 3. The three speed wins from round 16

1. **Render-blocking CSS.** One combined, minified CSS file at build time.
   Self-host the fonts (WOFF2, only the weights in use), `font-display:
   swap`, preload the one or two above the fold. Remove the Google Fonts
   request.
2. **Register's layout shift (0.844).** Reserve the form's space so the
   footer doesn't jump. Target CLS under 0.05.
3. **Images**, done by item 2.

Targets on the preview, Lighthouse mobile: Home performance 90 or above,
LCP under 2.5s on Home and Camps, CLS under 0.1 everywhere.

## Verify, then report once

`npm run verify`, `npm run check:payments` and `npm run check:enquiry` pass.

Report:

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. Before and after Lighthouse for Home, Camps, Infield and Register.
4. The before and after screenshot check: identical, or every difference
   listed.
5. Total image weight on Home, before and after.
6. The duplicate-photo list for Daniel.
7. "How to swap a photo", in three lines.
8. Decisions you made for us.

Update section 8 of the briefing and stop. Round 18 swaps the photos and
copy from Daniel's list.

End of prompt.
