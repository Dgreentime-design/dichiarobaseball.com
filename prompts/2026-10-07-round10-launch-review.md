# Round 10 - Launch review, client meeting prep, then round 09

DiChiaro Baseball & Softball Academy. Written 7 October 2026.
Client review with Michael today at 2pm. Target go-live: within 7 days,
by 14 October 2026. One run, one report. Follow CLAUDE.md.

## Step 0, and a folder check

Daniel reorganised his folders this week, and `~/projects/dichiarobaseball.com`
may no longer be where the repo lives. Before anything else:

1. Run the CLAUDE.md Step 0 commands from the folder you started in. The
   remote must be `Dgreentime-design/dichiarobaseball.com` and the branch
   `review`. If the folder is not that repo, stop and tell Daniel where
   you are.
2. Check whether `prompts/2026-10-05-round09-program-pages.md` exists
   locally and whether it has a section "0. Hero hotfix, first". It was
   committed on 5 October but may never have been pushed. Report found or
   missing. If it is missing, skip Part 3 and say so.
3. Save this prompt as `prompts/2026-10-07-round10-launch-review.md`,
   commit it, and push it, along with any committed but unpushed prompt
   files.

## Boundaries

Review branch only. Never push or merge to main. No force-push. Do not
change environment variables on Vercel or Clover. Do not touch the money
path code in Parts 1 and 2: they are read and write-up only. Never use an
em dash.

## Part 1 - Where we are and what is left (read only, about 15 minutes)

Read `CLAUDE.md`, `docs/build-thread-briefing.md`, the playbook's "Before
go-live" section, every prompt in `prompts/`, and `git log` for review.
Then write `docs/launch-plan.md`, kept short and scannable:

1. **Status in one screen.** What is built and proven, what is on the
   preview now, and what is not.
2. **Launch blockers.** Everything that must be true to take real
   registrations and payments on dichiarobaseball.com. For each: the owner
   (Claude Code, Daniel, or Michael), the effort, and whether it blocks the
   launch or can follow it. Include at least:
   - Program pages (round 09).
   - `/api/config-check` locked or removed.
   - Webhook 401 alert.
   - Third state on the success page.
   - Confirmation email or copy change.
   - Live-mode switch: `PAYMENT_PROVIDER`, the Airtable table, the Clover
     secret check.
   - Review notes removed.
   - Final copy sweep.
   - `SITE_ORIGIN` and indexing.
   - The domain and the old Vercel project.
   - Analytics.
   - **Redirects from the old Framer URLs.** List the old site's URLs from
     its sitemap, if you can fetch it, and propose a 301 map.
   - The Home Game registration links being retired.
3. **Day-by-day plan, 7 to 14 October.** The rounds Claude Code runs and
   the steps Daniel and Michael own, in order, with the go-live day named.
   Keep it to the minimum that launches safely. Anything that can follow
   launch goes in a "week after launch" list.
4. **Decisions needed from Michael today.** Every open question in the
   briefing, the punchlist and the reports, as one numbered list Daniel can
   read out. Include:
   - The Superdome split.
   - "Six places left".
   - Spring Little League dates.
   - "More than thirty teams".
   - Town and league codes.
   - The two-payment collection.
   - Hit Night winter pricing.
   - Lesson package pricing.
   - The instructor roster.
   - Opening hours.
   - The check payee.
   - The refund window.
   - The waiver text.
   - The flyer PDFs.
   - The Google Analytics access.
   - Which programs are on sale at launch.

## Part 2 - The 2pm review guide (read only)

Write `docs/client-review-2026-10-07.md`, a walkthrough Daniel follows in
the meeting:

1. **Page by page, in visit order.** For each page: the preview link, what
   Michael should check, and the facts shown on it.
2. **Every price, date, time and age on the site**, in one table: what the
   page shows next to what `data/programs.json` says, with a column for
   Michael to mark correct or wrong. Include rentals and lessons, which are
   not in the data file. Name the source for each.
3. **Every image**, with the page it is on, and a column for keep or
   replace.
4. **The payment walkthrough.** The steps to register on the preview with
   the mock provider, at 390 and 1440. Then, as a separate optional step,
   what it would take to show Michael the real Clover hosted page: which
   variable to change, the redeploy, the fact that a completed payment is
   a real charge to void, and how to switch back. Daniel decides. Do not
   do it.
5. **Constant Contact.** What the site needs to send contacts there:
   - Which fields, and at which moment: a confirmed registration only,
     never a pending one.
   - Consent for marketing, kept separate from the waiver.
   - Whether the confirmation email itself can come from Constant Contact.
     Check what its API supports for single, immediate, per-registration
     emails, as opposed to campaigns and list-join automations. Report
     what you found and your recommendation. Do not build anything.

Push both docs.

## Part 3 - Run round 09, hotfix first

Then follow `prompts/2026-10-05-round09-program-pages.md` in full.

1. Push item 0 (the mobile hero hotfix) as its own commit, first, so it is
   on the preview before the meeting.
2. If the program pages are not finished and verified on the preview by
   1:15pm Eastern, stop at a clean commit and say so. A half-working
   program page must never be on the preview during the meeting.

## Report, once

1. The preview link, and which commit it serves.
2. Step 0, and whether the round 09 prompt was found.
3. Links to `docs/launch-plan.md` and `docs/client-review-2026-10-07.md`.
4. The go-live date you propose, and the three things most likely to move
   it.
5. What shipped from round 09, and what did not.

End of prompt.
