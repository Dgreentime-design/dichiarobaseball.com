# Round 19 - Launch readiness: freeze the build, rehearse the cutover, write the runbook

DiChiaro Baseball & Softball Academy. Written 9 October 2026.
**Go-live: Monday 12 October, 1:00pm Eastern.** Images are parked until
Daniel's weekend pass. Everything else gets locked now. One run, one report.
Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if not pushed. Expect 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`.
3. No changes to prices, dates, options, or the money path logic.
4. Do not change any Vercel or Clover setting. Read only. Never print a
   secret or a variable's value; names and environments only.
5. Never use an em dash.

## 1. Park the image work safely

- Round 18b is cancelled. Do not run it.
- Slot 1 (Home hero) goes back to `dbsa-07-little-league.jpg` with its
  round 17 focal ("76% 50%"), so phones show a working hero at launch.
  Keep slots 8 and 37 on the new facility photo; they work at every width.
- Leave `dbsa-19` in `src/` for Daniel's weekend pass. Rebuild, verify.

## 2. How production actually builds

The HTML is generated and committed. Answer exactly, from the code and the
Vercel build log of the latest review deployment:

1. Does Vercel run `build.mjs` on deploy, or serve the committed files?
2. So where does `SITE_ORIGIN` have to be set for the live site to be
   indexable, with the right canonical, `og:url`, sitemap and robots: in
   Vercel Production variables, in the local build before the merge, or
   both? If it must be a local build step, add `npm run build:prod` that
   builds with `SITE_ORIGIN=https://dichiarobaseball.com`, and say exactly
   when Daniel or you run it.
3. Rehearse it: build once as production into a temp folder (not
   committed), and prove robots allows indexing, the sitemap lists every
   public page on `https://dichiarobaseball.com`, canonicals and `og:url`
   are absolute on that domain, and no `noindex` remains. Then confirm the
   review build is still `noindex`.

## 3. Production variables checklist (names only)

List every environment variable the code reads, and for each: required on
Production?, set on Production today? (from the Vercel dashboard or CLI,
names only), and the value it must have at go-live where it is not a
secret (`PAYMENT_PROVIDER=clover`, `AIRTABLE_TABLE_NAME=Registrations`,
`ENQUIRIES_TABLE_NAME=Enquiries`, `SITE_ORIGIN=https://dichiarobaseball.com`).
Flag anything missing.

## 4. Merge readiness

1. `git diff main...review --stat`: summarize what the merge brings.
2. Confirm `main` has nothing that `review` lacks.
3. Run the full checks: `verify`, `check:payments`, `check:enquiry`.
4. Confirm the 35 old Framer paths in `vercel.json` all redirect on the
   preview (re-run the round 12 check).
5. 404 page, favicon, and `/register.html` with no program all behave.

## 5. Write the go-live runbook

`docs/go-live-runbook.md`, one page, in order, with an owner and a "how to
check it worked" for each step. Monday 12 October:

- **Before 12:00:** final preview check; Daniel approves.
- **12:00-12:30, Daniel:** merge `review` into `main` (any production build
  step from item 2 first); set or confirm Production variables from item 3;
  redeploy Production.
- **12:30, Daniel:** in Clover, point the Hosted Checkout webhook at
  `https://dichiarobaseball.com/api/webhooks/clover`, copy the signing
  secret into `CLOVER_WEBHOOK_SECRET` in the same sitting, redeploy.
- **12:45, Daniel:** DNS: add the domain to the Vercel project, point the
  apex and `www` records as Vercel shows. Change only website records.
  Do not touch MX or the mail host's records.
- **13:00, live checks (Claude Code):** home loads on the domain with
  HTTPS, 5 random old Framer URLs redirect, robots and sitemap are the
  production versions, one Contact message lands in `Enquiries` and the
  alert reaches info@, one real card payment for the cheapest option
  confirms in `Registrations`, then Daniel voids it in Clover.
- **After:** submit the sitemap in Google Search Console; Michael retires
  the Home Game links and updates Google Business Profile and social bios.
- **Rollback:** how to point the domain back at Framer if something
  blocks payments, and how long DNS takes.

Include the exact Vercel and Clover screens to click, written for Daniel.

## Report, then stop

1. Preview link and commit.
2. Commits, one line each.
3. Item 2 answers, and the rehearsal result.
4. The variables table, with anything missing flagged.
5. Merge summary and check results.
6. The runbook path.
7. Anything you think could still stop Monday, and your fix for it.

Update section 8 of the briefing: "Launch candidate, frozen for go-live
Monday 12 October 1pm". Stop.

End of prompt.
