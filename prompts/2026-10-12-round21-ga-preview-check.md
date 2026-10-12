# Round 21 - Close round 20's loose ends and check GA4 on the preview

DiChiaro Baseball & Softball Academy. Monday 12 October 2026.
**Go-live 2:00pm Eastern.** Short round, technical only. No copy or image
changes; those come at 1:00pm in round 22 with Michael. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if not pushed. Expect 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`.
3. No changes to prices, dates, options, or the money path logic.
4. Do not change any Vercel, Clover, Airtable or GA4 setting. Read only.
   Never print a secret or a variable's value; names and environments only.
5. No personal data in analytics.
6. Never use an em dash.
7. Stop at the checkpoint and report. Out of scope: report, don't fix.

## Verdict on round 20

Accepted. Clean work: the funnel fires in order, purchase is deduped, no
personal data leaves, checkout survives GA being blocked, and the tag costs
nothing in speed. Your out-of-scope list was the right call; four of those
items are done here. The TEST row DBSA-BMGF5VAN3M has been deleted.

## Tasks

1. **Runbook.** Add `GA4_MEASUREMENT_ID` to the variables table in
   `docs/go-live-runbook.md`: Production and Preview, not secret, must be set
   before the merge or the live site launches without GA.
2. **Spam must not count as a lead.** `generate_lead` fires only on a real
   save (the API returned a real reference). The honeypot's fake success must
   not fire it. Prove both with one honeypot submit and one real submit on
   preview.
3. **Privacy policy section 04, "Who we share it with".** Add one item, in
   the voice of the section, saying Google receives anonymous site-usage
   data through Google Analytics (no names, emails or player details), and
   point to section 08. Touch nothing else in `legal.json`.
4. **Preview recheck with the real tag.** Daniel has set
   `GA4_MEASUREMENT_ID` for Preview. Confirm by name that it exists for
   Preview and Production. After your push redeploys the preview:
   a. View source on Home: the gtag snippet is present with `debug_mode`.
   b. One mock online checkout and one Contact message on the preview.
      Capture the collect requests: events 1 to 6 for the checkout, 9 for
      the contact, in order.
   c. Re-run the speed check on the preview, Home and one program page at
      390 and 1440. Compare with round 18b (1.7 to 2.3s on phones).
   If the variable is not set for Preview, stop after tasks 1 to 3 and say so.
5. Delete nothing in Airtable. List any TEST rows you created by reference.

## Verify

`npm run verify`, `check:payments`, `check:enquiry`, `check-jsonld` pass.

## Report

1. Step 0.
2. Tasks 1 to 3, each with the diff or proof.
3. Task 4 a, b, c with evidence, or why it stopped.
4. TEST rows created.
5. Commits and the preview URL.
6. Anything out of scope.

## Out of scope (report, don't fix)

Copy, images, legal page description lengths, consent banner, Event schema,
server-side purchase event.

End of prompt.
