# Round 29: Home hero lede copy

Date: 14 Oct 2026. Branch: `review`. Run after round 28. One line of copy.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records.
- Do not edit `pages/instructors.html`.
- Delete nothing.
- Home hero lede only. No layout, style, animation or video changes; the
  round 26 hero is approved as built.
- Stop at the checkpoint and report. Anything outside scope: report, don't
  fix.

## The change

In the Home hero (`pages/index.html`, `.hero--video .hero__lede`):

- Current: `Year-round lessons and camps for ages 6 and up, taught by coaches who played the game.`
- New: `Year-round lessons and camps for ages 6 and up, from coaches who played the game and love teaching it.`

Exact text, sentence case, ending with a full stop. Rebuild so the built
`index.html` matches.

## Check, don't change

1. The new line is longer. Confirm it still sits within the lede's max
   width without a single word alone on the last line at 1440, 1024, 768
   and 390. If it leaves one, report it with a screenshot; do not change
   type sizes or widths.
2. Re-measure the lede contrast over the brightest frame at 768 and 1440
   (round 26's lowest was 5.05:1 at 768). Report the new lowest; it must
   stay at or above 4.5:1. The text is longer, so it may reach a brighter
   part of the video.
3. Grep the site for the old line (meta descriptions, Open Graph tags,
   JSON-LD, `llms.txt`, other pages). List every hit. Do not change them;
   Daniel decides whether the descriptions follow.

## Verify

1. Screenshots of the Home hero at rest at 1440, 1024, 768 and 390.
2. `verify.mjs` passes.

## Report

1. File and line changed.
2. Screenshots, the wrap check and the contrast figure.
3. The grep list from Check 3.
4. Commits and the preview URL:
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/
5. The full list of commits on `review` not yet on `main` (rounds 25 to
   29), ready for Daniel's final review and merge.

## Out of scope (report, don't fix)

- Any other copy, page or component.
- Meta descriptions and structured data (report only).

End of prompt.
