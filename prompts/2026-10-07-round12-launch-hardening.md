# Round 12 - Launch hardening and small fixes

DiChiaro Baseball & Softball Academy. Written 7 October 2026. Go-live
target: Tuesday 13 October. One run, one report. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`. Daniel owns it.
3. **This round touches the money path, so it carries full evidence.**
   For every change under `api/`:
   - Show a test or curl that fails before the change and passes after.
   - Never print a secret, a header value or a full payload.
   - `api/_lib/match.js` keeps matching by value.
   - A webhook that cannot be matched or confirmed still leaves an
     Airtable row.
4. Do not change environment variables on Vercel or Clover. Do not set
   `SITE_ORIGIN`. The preview stays on the mock provider and
   `Registrations Review`.
5. Facts come from `data/programs.json`. Never use an em dash.

## Round 11 verdict

Accepted:

- The program pages.
- The instructor-selection removals.
- Your 1024 header and red-band contrast fixes. They fix visible problems
  in the shared rules, which is the right call.

On the premium gate, do not adopt the kit's fixed spacing, hover and
touch-target system before launch. It is a site-wide redesign of rhythm
and states, and the risk is wrong for this week.

- Tap targets: the site already meets the WCAG 2.2 AA minimum of 24px.
  Log 44px as a post-launch item.
- Edges: fix the one real defect, item 1 below.

## 1. Small fixes

1. **Header gutter at 1440.** The header sits at 59.8 to 1380.2 while the
   content container sits at 80 to 1360. Align the header to the
   container's gutter at every width, in the shared header rule.
2. **Infield Superdome text.** The page now contradicts itself: the copy
   says 11 and 4, and the date chips, built from the data, show 3
   Superdome dates. The data wins. Michael's PDFs become the baseline in
   round 13 and will confirm it. Change these to match the data:
   - "four Superdome sessions" becomes "three".
   - "11 of 15 / 4 of 15" becomes "12 of 15 / 3 of 15".
   - The schedule line becomes "Twelve at Pollitt Drive, then three
     combined mornings at the Superdome in February."
   Generate these from the data if the template allows it, so they cannot
   drift again. Report the exact lines changed.
3. **Lou photo alt text.** `dbsa-09` shows Lou posing with a player. Use
   the accurate alt text you wrote for About, on Home and on the Infield
   page too.
4. **Past options are not sellable.** Hit Night Fall still offers the
   September package. Hide any option whose sessions have all passed, both
   on the program page and in the register flow's option list.
   - Pricing is unchanged.
   - Server side, `/api/checkout/session` refuses an option with no future
     sessions, with the same generic error it already uses.
   - Prove it: a crafted request for the September package is refused.

## 2. Launch hardening (launch plan, blockers 2 to 5, 13 and 14)

1. **Remove `/api/config-check`.** Delete the endpoint and any reference
   to it. Proof: it returns 404 on the preview.
2. **Signature failure alert.** Every webhook request that fails signature
   verification writes an Airtable row in the active table:
   - `status` set to `signature_failed`
   - the timestamp
   - the request's byte length
   - no body, headers or secret
   Keep it to at most one row per minute, so a flood cannot fill the
   table. Proof: post a wrongly signed request to the preview, read the
   row back, then post a correctly signed mock webhook and show it still
   confirms.
3. **Third state on the success page.** If polling has not confirmed the
   payment after 60 seconds, keep polling but swap the screen to:
   - H2: "Still confirming your payment."
   - Body: "This can take a few minutes. If your card was charged, your
     place is held. Keep your reference number and we'll confirm by phone
     or email."
   - The reference number shown.
   - Button: "Call (201) 773-6858".
   If it confirms later, it moves to the confirmed screen. Proof: with the
   mock webhook held back, the third state appears, then confirms once the
   webhook is sent.
4. **Confirmation copy.** No email is sent yet. Remove every line in the
   register flow and on the success screens that promises an email,
   receipt or reminder, for example "the receipt is on its way" and "A
   receipt is in your inbox". Replace each one with "Keep this page. Your
   reference number is your proof of registration." Write it once per
   screen, not twice. List every line changed.
5. **301 redirects.** Add the old Framer to new map from
   `docs/launch-plan.md` section 2 to `vercel.json` as permanent
   redirects. Program targets use the round 11 slugs. Proof: curl every
   old path on the preview and show a 301 and its target.
6. **Analytics.** Add Vercel Web Analytics:
   - The official script tag in the shared head partial.
   - No cookies, no consent banner needed.
   - Daniel enables it in the Vercel dashboard.
   Leave a clearly marked, commented slot for a Google Analytics tag,
   added when Michael gives access. Do not add GA now.

## Verify, then report once

`npm run verify` passes, plus `npm run check:payments` against the
preview.

Report:

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. The proof for every item in section 2, and for item 1.4, pass or fail.
4. The lines changed for 1.2 and 2.4.
5. What Daniel has to do in the Vercel dashboard.

Then update sections 8 and 9 of `docs/build-thread-briefing.md` and stop.

## Out of scope

Round 13, after Michael's 9 PDFs:

- Re-baseline the data.
- The Teams filter and the three extra camps.
- Flyers.
- The Spring Little League card.
- Winter cards, if Daniel wants them.
- Removing the review notes.
- The final copy sweep.

Post-launch:

- 44px tap targets and the kit's spacing and hover system.
- Clean URLs.

End of prompt.
