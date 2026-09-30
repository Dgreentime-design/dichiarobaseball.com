# Round 01 - Verify the Vercel deployment

Scope: the site is now deployed to a permanent Vercel URL built from the GitHub repo. Verify that
deployment end to end and report. No feature work this round.

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
- Work only inside this repository. If you believe you need a file outside
  `website-build/`, stop and report instead.
- Anything you find that is outside this round's scope goes in the report as a finding, not a fix.
- Stop at the checkpoint at the end and report. Do not continue into the next piece of work.

## Verdict on the last report

Accepted. Two calls you made were right and should carry forward:

- Ruling out `vercel.json` deployment protection in favour of `noindex`. Protection would have put
  a login wall in front of the client review, which defeats the point.
- Flagging clean URLs as a content edit rather than a config flip, because the canonicals in
  `pages/` have to move with them. That is the correct read and it stays deferred.

The working tree is clean and all four commits are now on `origin/main`.

## Tasks

1. Confirm which commit Vercel actually deployed, and that it matches `origin/main` locally. A
   deployment built from an older commit will pass every other check in this list while showing the
   client stale content.

2. Fetch the deployed URL for every route in `sitemap.xml` plus `/`, and record the HTTP status of
   each. Anything other than 200 is a failure to report, not to fix. The root and `/program`
   matter most, since those are the two the client will open first.

3. Confirm `X-Robots-Tag` or the page-level `noindex, nofollow` meta is present on every deployed
   route, and that `/robots.txt` on the deployed URL returns the disallow-all body. If any route is
   indexable, stop immediately and report it as P0 before doing anything else, because an indexed
   review copy competes with the live site in search.

4. Confirm the three security headers in `vercel.json` are actually present on a deployed response:
   `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`. Config being committed is not
   proof it was applied.

5. Run `npm run build` and confirm the generated HTML is byte-identical to what is committed. If the
   build produces a diff, the committed output is stale and the client is reviewing something the
   source no longer produces. Report the diff, do not commit it.

6. Run the existing `verify.mjs` checks against the deployed URL rather than localhost. If it only
   accepts a localhost origin, report that limitation rather than editing the script.

## What to verify

- 1440 and 390 widths on `/`, `/program`, `/instructors`, `/register`.
- No horizontal scroll at 390. A single overflowing element is enough to fail the check.
- Every internal link resolves on the deployed origin, not just locally. Relative links that work
  from the filesystem can break once clean URLs or trailing slashes differ on the host.
- Content parity between 1440 and 390. Layout changes between breakpoints, content does not.

## Report

Numbered, in this order:

1. The deployed commit SHA and whether it matches `origin/main`.
2. A table of every route with its HTTP status.
3. Indexing status: noindex present or absent per route, and the deployed `robots.txt` body.
4. The three security headers, present or absent.
5. Build reproducibility: identical, or the list of files that differed.
6. `verify.mjs` result, or the reason it could not run against a remote origin.
7. Anything you found that is outside this round's scope, as findings only.

## Explicitly out of scope

- Clean URLs. Deferred until the canonicals in `pages/` are updated in the same change.
- Any copy, pricing, or program-content edits. Those come from the flyers and are decided separately.
- Registration and payments wiring.
- Renaming the parent folder. It has a trailing space in its name and that will be fixed later, by
  hand, after the client review link is out.

End of prompt.
