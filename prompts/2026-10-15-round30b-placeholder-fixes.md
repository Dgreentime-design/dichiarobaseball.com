# Round 30b: Two placeholder fixes before merge

Date: 15 Oct 2026. Branch: `review`. Follows round 30 (2ff2fe4). Copy only.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records, and do not change Vercel settings.
- Do not edit `pages/instructors.html`.
- Delete nothing.
- `placeholder` values only. Do not run the register end-to-end test again;
  no new test registrations.
- Stop at the checkpoint and report.

## The changes

1. `pages/team-camps.html`, `tc-team`: it is cut off at 390.
   - Current: `Team name and age group, e.g. 12U softball`
   - New: `Team name and age group`
2. `pages/contact.html`, `message` textarea (line 83): change the plain
   apostrophe in `player's` to `&rsquo;` to match the rest of the site. No
   other wording changes.

Rebuild so the built HTML matches. As in round 30, if the rebuild only
changes the build date in `programs/*.ics`, restore those files and leave
them out of the commit.

## Verify

1. The `tc-team` placeholder fits at 390 with no cut-off (report text width
   and field width).
2. `verify.mjs` passes.
3. Screenshots of the Team camps form at 390 and the Contact form at 1440.

## Report

1. Files and lines changed.
2. Verify results and screenshots.
3. Commits pushed to `review`, the preview URL
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/
   and the full list of commits on `review` not yet on `main` (should be
   round 30 and 30b), ready for Daniel to merge.

End of prompt.
