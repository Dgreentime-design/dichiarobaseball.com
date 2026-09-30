# Round 01 - Verify the Vercel deployment

Deployed URL: https://dichiarobaseballcom-rgr6.vercel.app

Scope: the site is deployed to a permanent Vercel URL built from the GitHub repo. Routes, headers and
indexing have already been checked externally and passed. This round covers what an external check
cannot see. No feature work.

Rounds 1 to 4 of this build predate this prompt record, so round numbering starts here. Do not
renumber earlier work.

## Boundaries

Restated in full, every round.

- This is a client review deployment, not a launch. It must stay unindexed.
- Do not remove or weaken the `noindex, nofollow` meta tag on any page.
- Do not change `robots.txt`. It currently disallows everything, which is correct.
- Do not set `SITE_ORIGIN` in the Vercel environment. Leaving it unset is what keeps the review
  copy unindexed.
- Do not merge to another branch, do not force-push, do not rewrite history.
- Delete nothing. If something looks obsolete, report it and leave it.
- Work only inside this repository, `~/projects/dichiarobaseball.com`. If you believe you need a file
  outside it, stop and report instead.
- Anything outside this round's scope goes in the report as a finding, not a fix.
- Stop at the checkpoint at the end and report. Do not continue into the next piece of work.

## Step 0: project identity check

Before reading or writing anything else, run and report all four:

```
pwd
git remote get-url origin
git status --porcelain
git rev-list --left-right --count origin/main...HEAD
```

Expected:
- `pwd` is `/Users/danielgreenwood/projects/dichiarobaseball.com`
- remote is `https://github.com/Dgreentime-design/dichiarobaseball.com.git`
- `git status --porcelain` prints nothing, the tree is clean
- the count is `0	0`, HEAD is level with `origin/main`

No commit SHA is named here on purpose. A SHA written into this file is wrong the moment the file is
committed, which is exactly what happened on the first attempt at this round.

If any of the four does not match, STOP. Write nothing, report the mismatch, and wait. A previous
session drifted between projects and this check exists to catch that before it happens again.

## Already verified, do not repeat

- All 13 `.html` routes return 200, as does `/` and `/robots.txt`.
- `noindex, nofollow` is present on `/`, and `/robots.txt` serves the disallow-all body.
- `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options` are all present on a deployed
  response, so `vercel.json` headers are being applied.

## Tasks

1. Confirm which commit Vercel deployed and that it matches the current `origin/main`. A deployment
   built from an older commit passes every other check while showing the client stale content.

2. Run `npm run build` and confirm the generated HTML is byte-identical to what is committed. If the
   build produces a diff, the committed output is stale and the client is reviewing something the
   source no longer produces. Report the diff, do not commit it.

3. `sitemap.xml` deploys as an empty `<urlset>`. Find where the sitemap is generated in `build.mjs`
   and report why it produces no entries. Report the cause, do not fix it. The generator is almost
   certainly keyed off `SITE_ORIGIN`, which is deliberately unset, and if so that is correct
   behaviour for a review deploy and the finding is "working as intended".

4. Run `verify.mjs` against the deployed URL rather than localhost. If it only accepts a localhost
   origin, say so and run it against a local server instead, reporting which you used.

## What to verify

- 1440 and 390 widths on `/`, `/program.html`, `/instructors.html`, `/register.html`.
- No horizontal scroll at 390. One overflowing element is enough to fail.
- Content parity between 1440 and 390. Layout changes between breakpoints, content does not.
- Every internal link resolves on the deployed origin. Links are `.html` suffixed because clean URLs
  are deliberately off, so a link written without the suffix is a bug.

## Report

Numbered, in this order:

1. Step 0 output, verbatim.
2. Deployed commit SHA and whether it matches the current `origin/main`.
3. Build reproducibility: identical, or the list of files that differed.
4. Cause of the empty sitemap, and whether it is intended behaviour for a review deploy.
5. `verify.mjs` result, and which origin it ran against.
6. Breakpoint results: overflow, parity, link resolution.
7. Anything else you found, as findings only.

## Explicitly out of scope

- Clean URLs. Deferred until the canonicals in `pages/` are updated in the same change.
- Any copy, pricing, or program-content edits. Those come from the flyers and are decided separately.
- Registration and payments wiring.
- Repository visibility and any GitHub or Vercel account settings.

End of prompt.
