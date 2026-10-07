# Round 13 - Launch polish: review notes off, legal copy, final sweep

DiChiaro Baseball & Softball Academy. Written 7 October 2026. Go-live
target: Tuesday 13 October. One run, one report. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`. Daniel owns it.
3. No changes to `api/`, prices, dates or options. Only
   `assets/js/register.js` display code changes, for item 1.
4. `legal.json` is opened for item 2 only, and only for the lines named
   there.
5. Stay unindexed. Do not set `SITE_ORIGIN`. Never use an em dash, and
   use a plain hyphen, not an en dash, in time and date ranges.

## Round 12 verdict

Accepted:

- The flyer re-baseline changed no prices.
- The Superdome split is resolved from the flyer: Feb 6 at the academy,
  Feb 13, 20, 27 and Mar 6 at the Superdome.
- Every proof in section 2 passed.

## 1. The placeholder name on the confirmation screen

A parent who returns from payment in a different browser sees "Mia is
registered.", the prototype's placeholder.

- Never show a hardcoded name.
- If the player names are not available to that browser, read them from
  the status endpoint, but only if it already returns them. Do not add
  personal data to a public endpoint.
- Otherwise fall back to "You're registered."

Prove it in a fresh private browser.

## 2. Legal copy that promises email

`legal.json` still promises confirmation, reminder and receipt emails, and
the terms say a booking is confirmed once "you have received a
confirmation email". No email is sent at launch. Change only these lines:

- **Booking confirmed:** "Your booking is confirmed when the confirmation
  screen shows your reference number."
- **Remove** every promise of confirmation, reminder or receipt emails.
  Where a sentence needs a replacement, use: "Keep your reference number.
  It is your proof of registration."
- **Leave everything else in `legal.json` word for word:** the waiver, the
  release, the refund terms and the privacy terms. Michael's lawyer
  reviews those separately.

List every changed line, old and new.

## 3. Review notes and placeholders off

These were kept through the build on purpose and come off now. Remove:

- Every review note, prototype note, "Needs confirming", "Asset needed"
  and `build-note` block, on every page except `instructors.html`.
- The "To confirm with Michael" hours slots on About and Contact. Replace
  each with "Call (201) 773-6858 for today's hours." Do not invent hours.

Keep any note whose question is still open by copying it into
`docs/launch-plan.md` under "Open after launch", so nothing is lost. List
each one removed, by page.

## 4. Final copy sweep

Walk every page, except `instructors.html`, at 390 and 1440, and fix
only:

- Typos, and inconsistent punctuation.
- Time and date range formats: one style, "9:00am-12:00pm", "Nov 14,
  2026".
- Sentence case.
- Any leftover line that promises email, offers a choice of instructor,
  or sells HitTrax.

Do not rewrite approved copy. Anything bigger than a typo goes in the
report as a suggestion, not a change.

## Verify, then report once

`npm run verify` and `npm run check:payments` pass. On the preview, run
one mock registration end to end at 390, in a fresh private browser.

Report:

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. Item 1: the proof.
4. Item 2: every `legal.json` line, old and new.
5. Item 3: the notes removed, by page.
6. Item 4: the fixes, plus the suggestions not made.
7. Verify output.

Then update section 8 of the briefing: the preview is the launch
candidate, pending Daniel's instructors rework and Michael's sign-off.
Stop.

End of prompt.
