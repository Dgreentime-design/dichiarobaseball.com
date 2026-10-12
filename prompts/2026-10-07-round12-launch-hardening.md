# Round 12 - Flyer re-baseline, camps page, launch hardening and small fixes

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

## Order of work

Do the parts in this order and commit each on its own:

1. Section 0: the data re-baseline from the flyers. Every later fact
   depends on it.
2. Section 0b: the camps page.
3. Section 1: the small fixes.
4. Section 2: launch hardening.

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

## 0. Re-baseline the program data from Michael's 9 flyers

Michael's 9 PDFs are now the source of truth for every camp, date, time,
age and price. Daniel has added them to the repo, renamed to the program
slugs:

    assets/flyers/little-league-fall-2026.pdf
    assets/flyers/little-league-winter-2027.pdf
    assets/flyers/little-league-march-2027.pdf
    assets/flyers/infield-camp-2026-27.pdf
    assets/flyers/hit-night-fall-2026.pdf
    assets/flyers/hit-night-winter-2027.pdf
    assets/flyers/iha-softball-winter-2027.pdf
    assets/flyers/fair-lawn-hs-softball-2027.pdf
    assets/flyers/old-tappan-hs-2026-27.pdf

Commit them first, on their own, unchanged.

1. Read every PDF in full. Compare each one with its entry in
   `data/programs.json`, field by field:
   - name, season, ages, sport, day
   - every date, every group and its time, the venue split
   - every option and its price, the payment schedule
   - what is taught
2. Where a flyer and the data disagree, **the flyer wins**, with one
   exception. Where a flyer contradicts itself (the known case is the Hit
   Night Fall registration box printing November $25 and December $125
   against its own schedule), keep the value the schedule supports and flag
   it for Michael. Never guess. If a flyer is unreadable or ambiguous,
   leave the data value, flag it, and keep going.
3. **Prices are money.** `/api/checkout/session` charges from this file.
   For every price change, list the slug, the option, the old price and
   the new price in the report.
4. Update each program's `flyer` field to its new file name above. The
   flyer button from round 09 then appears on every program page that has
   a file.
5. Clear each `needs_confirming` note that a flyer now answers, and
   record the answer. The open one that matters most is the Infield
   Superdome split, Feb 6 at the academy or the Superdome.
6. Rebuild. Every program page, card and price on the site must now match
   the data. Check the homepage and camps cards too: they are hand-built,
   so update their dates, prices and session counts to match. The Spring
   Little League card (`little-league-march-2027`) included.
7. Run `npm run check:payments` after the change, and show that a mock
   checkout for one program charges the new price.

## 0b. Camps page: Teams filter and the three team programs

From the 7 October review: add "Teams" to the camps filter, and show the
three team programs on the camps page:

- IHA Softball Winter 2027
- Fair Lawn HS Softball 2027
- Old Tappan HS 2026-27

1. Each gets a card in the existing card pattern, tagged so the "Teams"
   filter shows only these three. Each card links to its generated program
   page. Generate pages for these three now, even though they are gated.
2. They are `gated` in the data. Do not change `gated`. On a gated card
   and page, replace the register button with "Ask about joining", linking
   to `contact.html?about=<slug>`. Register stays available only where
   `gated` is false. Report this so Daniel can confirm with Michael
   whether these teams register online.
3. The empty-state and filter count keep working with the new filter.
4. Do not add cards for Winter Little League or Winter Hit Night. Daniel
   decides that separately.

## 1. Small fixes

1. **Header gutter at 1440.** The header sits at 59.8 to 1380.2 while the
   content container sits at 80 to 1360. Align the header to the
   container's gutter at every width, in the shared header rule.
2. **Infield Superdome text.** The page contradicts itself: the copy
   says 11 and 4, and the date chips, built from the data, show 3
   Superdome dates. After section 0, generate the venue counts and the
   schedule sentence from the re-baselined data, so they always match the
   flyer and cannot drift again. Report the exact lines changed.
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
3. Section 0: a table of every change, as slug, field, old value, new
   value and flyer page. Every flagged contradiction, for Michael.
4. Section 0b: the three team cards, and how registration works on each.
5. The proof for every item in section 2, and for item 1.4, pass or fail.
6. The lines changed for 1.2 and 2.4.
7. What Daniel has to do in the Vercel dashboard.

Then update sections 8 and 9 of `docs/build-thread-briefing.md` and stop.

## Out of scope

Round 13:

- Winter cards, if Daniel wants them.
- Removing the review notes.
- The final copy sweep.

Post-launch:

- 44px tap targets and the kit's spacing and hover system.
- Clean URLs.

End of prompt.
