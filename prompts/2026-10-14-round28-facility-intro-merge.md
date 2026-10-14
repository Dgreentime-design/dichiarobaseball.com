# Round 28: Facility and rentals, one intro module with the room photo and stats

Date: 14 Oct 2026. Branch: `review`. Run after round 27 is reported and
accepted. One page, one change.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records.
- Do not edit `pages/instructors.html`.
- Delete nothing beyond the empty wrapper this move leaves behind. Report
  anything you remove.
- `pages/facility-and-rentals.html` only, plus a page-scoped CSS rule if the
  spacing needs one. The `.hero-light` styles are shared with About: do not
  change the shared rules. Scope anything new to this page.
- Do not touch rounds 25 to 27 (Home hero, filter bar, card buttons).
- Stop at the checkpoint and report. Anything outside scope: report, don't
  fix.

## The change

Today the page opens with a text-only intro (eyebrow `Facility and rentals`,
headline `The room is yours by the hour.`, lede `Cages, turf and HitTrax on
Pollitt Drive. January works the same as June.`). Then `What you can rent`
follows, and only after that come the room photo and the four stats
(6,500 / $35 / $60 / 365). The intro is cut off from the picture and numbers
it introduces.

Daniel wants the intro moved down so it leads the photo and stats as one
connected module, placed after `What you can rent`.

New order:
1. `What you can rent` band (unchanged, now first under the header).
2. One module: eyebrow, headline, lede, then the 3x1 room photo, then the
   stat strip.
3. HitTrax, then everything else, unchanged.

## Tasks

1. Move the copy block (`.hero-light__copy`: eyebrow, headline, lede) out of
   the first `section.hero-light` and into the second one (currently
   `aria-label="The facility in numbers"`), as the first child of its
   `.hero-light__inner`, above the photo. Remove the now-empty first
   section.
2. The merged section is labelled by its headline: replace
   `aria-label="The facility in numbers"` with
   `aria-labelledby="room-title"` and give the headline `id="room-title"`.
3. Spacing inside the module uses the existing `.hero-light__inner` rhythm
   (copy, photo and stats `--s-9` apart). Band padding stays `--band-y`.
   The module must read as one unit: no extra rule, background change or
   padding between the copy and the photo.
4. Headings. The page's first visible heading is now `Three ways to use the
   space.`
   - Make that heading the page's `h1` (it keeps its `display-l` class, so
     nothing changes visually).
   - Make `The room is yours by the hour.` an `h2` with the same
     `display-l` class.
   - Exactly one `h1` on the page. The `<title>` and meta description stay
     as they are.
5. Anchors and links: confirm nothing links to the removed section. Grep
   the partials, pages and sitemap for `facility-and-rentals.html#` and
   report what you find (the footer's `#hittrax` link must still work).
6. Spacing at the top of the page. With the light intro gone, the surface
   band now sits directly under the header. Check it starts with its normal
   `--band-y` padding and reads as a deliberate opening at 1440 and 390. If
   it looks cramped, report it with a screenshot instead of inventing a new
   spacing value.

## Verify

1. Full-page screenshots of Facility and rentals at 1440, 1024, 768 and 390,
   before and after.
2. Close-up of the merged module at 1440 and 390: copy, photo and stats
   reading as one unit.
3. The heading outline before and after (h1, h2, h3 list).
4. Regression: pixel diff About (which shares `.hero-light`) and Home at
   1440 and 390. Both must be unchanged.
5. `verify.mjs` passes. No horizontal scroll at 390.

## Report

1. Step 0 notes.
2. Each task: done, file and lines.
3. Screenshots, heading outline and the anchor grep.
4. Anything about the new page opening that needs Daniel's eye.
5. Commits and the preview URL:
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/
6. The list of commits on `review` that are not yet on `main`, ready for
   Daniel's final review and merge.

## Out of scope (report, don't fix)

- Any other page, About's hero included.
- Copy changes on this page.
- The photo crop or a new image.
- Page speed and design tokens.

End of prompt.
