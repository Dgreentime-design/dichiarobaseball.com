# Round 32: Retire the unlisted team pages, close the price leak

Date: 21 Oct 2026. Branch: `review`. Follows round 31. Goal: ship today
with round 31.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. No DNS, MX or Vercel settings changes.
- Do not edit `pages/instructors.html`.
- Delete nothing except what this prompt names. Keep the old prompts, docs
  and git history as they are.
- Do not change the round 31 code flow, Clover, the webhook or Airtable.
- Stop at the checkpoint and report.

## Why

IHA, Fair Lawn HS and Old Tappan HS now live in Airtable behind private
codes (live, verified on preview). Their round 22 unlisted programs still
publish team names and prices in `data/programs.json` and on
`programs/<slug>.html`. That leak must close.

## The changes

1. Remove these three programs from `data/programs.json` and from
   everything generated from it (program pages, `.ics` files, any JSON
   or JS bundle, sitemap, `llms.txt`):
   - `iha-softball-winter-2027`
   - `fair-lawn-hs-softball-2027`
   - `old-tappan-hs-2026-27`
   Remove the `unlisted` handling in `build.mjs` only if nothing else uses
   it; otherwise leave it.
2. Permanent redirects (308 or 301 in `vercel.json`, matching how the repo
   already does redirects) from each old URL, `.html` and `.ics`, to
   `/team-camps.html`. A family with an old link lands on the page with the
   code box. No price or team name on the way.
3. `register.html?program=<old slug>` must not show anything about those
   programs; it falls into the existing "we could not find that program"
   state or redirects to `/team-camps.html`, whichever is already the
   pattern.
4. Small fix from round 31: when Airtable cannot be reached (network error
   or 5xx), the code endpoint returns a different, honest message:
   "We couldn't check your code just now. Please try again in a minute, or
   call (201) 773-6858." It must reveal nothing about whether the code is
   valid. Unknown or invalid codes keep the existing generic message.
5. Delete these round 31 test rows from Registrations Review only if your
   tooling can do it safely; otherwise list them for Daniel:
   DBSA-NXX4MNEK7H, DBSA-GB5HR46XQ4, DBSA-REKGFP96A8.

## Verify on the preview

1. Grep the built site, `data/programs.json`, sitemap, `llms.txt`, all JS
   and all GET endpoints for: IHA, Fair Lawn HS, Old Tappan, $330, $295,
   $550, 330, 295, 550 in a price context. Report every hit.
2. Each old URL (6: three `.html`, three `.ics`) redirects to
   `/team-camps.html`.
3. `register.html?program=` each old slug shows nothing about the program.
4. Codes still work: read the five real codes from the Airtable Groups
   table at runtime (never write a real code into any file, commit, log or
   report). Each shows exactly one camp: IHA $330, Fair Lawn HS $295,
   Old Tappan HS $550, Ridgewood HS $290, River Dell HS $340. Do not
   register or pay with real codes.
5. Simulated Airtable outage (locally) shows the new message; a wrong code
   still shows the generic one.
6. `verify.mjs` passes.

## Report

1. Files changed, redirects added.
2. Verify results.
3. Commits on `review` and the full list not yet on `main` (round 31 and
   32), with the preview URL
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/

End of prompt.
