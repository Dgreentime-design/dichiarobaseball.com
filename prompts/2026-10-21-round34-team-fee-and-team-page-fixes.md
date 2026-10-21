# Round 34: $10 online fee for team camps, two Team camps page fixes

Date: 21 Oct 2026. Branch: `review`. Follows round 33b. Goal: live today.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. No DNS, MX, Vercel settings or Clover dashboard
  changes. Do not edit `pages/instructors.html`. Delete nothing.
- Public (non-team) programs must not change in price, copy or checkout.
- No em dashes. Stop at the checkpoint and report.

## 1. Team camps page: the "Faster / Just call." card looks broken

`pages/team-camps.html`, the `aside.wide-card` beside the "Tell us about
your team." form. The eyebrow "Faster" and the heading "Just call." sit
flush against the card's top-left border with no padding, while the body
below is inset by `--s-8`. Cause: `.wide-card__head` has no padding in this
use (pages.css), only `.wide-card__body` does.

Fix so the head has the same inset as the body (desktop `--s-8`, the
existing smaller value at the mobile breakpoint), and the gap between
heading and body matches other wide cards on the site. Fix it for this
card without breaking other `.wide-card` uses: check every page that uses
`.wide-card` before and after, and report each.

## 2. Team camps page: show the whole team photo

The hero image under "Bring your team indoors this winter." (`.media
media--3x1`, `{{img 39 hero}}`) crops the team photo (heads and the front
row are cut). Make it show the full photo at its natural aspect ratio at
every breakpoint: no crop, no letterboxing, no distortion. Use the image's
real ratio (read it from the source file) rather than 3:1. Keep width,
radius and the media label as they are. Check 1440, 1024, 768, 390.

## 3. $10 online processing fee, team and town camps only

Rule: when a team or town camp (the round 31 code flow) is paid online,
the family pays the camp price plus a flat $10 processing fee, once per
registration (not per player). At the facility and by check: no fee.
Public programs: never a fee.

Server (the only place money is decided):
- Add one constant, e.g. `TEAM_ONLINE_FEE_CENTS = 1000`, in the server
  team-camp module. Not configurable from the browser.
- Team checkout with payment method online: total = server price x
  players + 1000. Facility or check: total = server price x players.
- The Clover Hosted Checkout request carries the fee as its own line item
  ("Online processing fee", $10.00) next to the camp line, so the Clover
  receipt shows it separately. Clover total = camp + fee.
- The registration row: `amount` = the total actually charged (so the
  existing webhook amount check still matches), plus the new field
  `processing_fee` = 10 (Airtable currency field, exists on Registrations
  and Registrations Review; add it to the store's OPTIONAL_FIELDS). For
  facility and check rows, `processing_fee` = 0 or empty and `amount` =
  camp price, as today.
- Re-validate on the server: a request that sends its own fee or total is
  ignored, as with price.

UI (register flow, team camps only):
- "How would you like to pay?" options for a team camp:
  - Online now: title stays "Online now", add a small "+$10" tag in the
    existing chip style next to the title. Description: "Card or digital
    wallet on Clover's secure page. A $10 processing fee applies to online
    payments. Your place is confirmed the moment payment clears."
  - At the facility and By check: unchanged, and add to each description
    "No processing fee."
- Summary card and "Total due today" update live when the method changes:
  with online selected show a line "Online processing fee  $10" above the
  total and total = price + 10; with facility or check, no fee line and
  total = price.
- Confirmation screen and anything else that shows the paid amount shows
  the same split.
- The fee must be visible before the family leaves for Clover (disclosed
  before they are charged).
- Public programs: the payment step looks exactly as it does today.

## Verify (preview, test codes only)

1. Faster card: padded like other cards at 1440 and 390; every other
   `.wide-card` on the site unchanged (before/after screenshots).
2. Team photo: whole photo visible, no crop, at 1440, 1024, 768, 390.
3. TESTA-7KQ4, 10U camp ($210): online shows +$10 tag, fee line, total
   $220; switch to facility: $210, no fee line; check: $210.
4. With PAYMENT_PROVIDER unset on preview, inspect the checkout request
   the server would send (unit test or local mock provider): camp line
   $210 + fee line $10 = $220. Run the mock provider end to end locally:
   row has amount 220, processing_fee 10, and the mock webhook confirms it.
5. Facility registration on preview: amount 210, no fee. Then remove that
   test row from Registrations Review by exact record ID.
6. Tamper: posting a lower total or fee 0 with online is ignored (row
   still 220).
7. A public program (e.g. Little League Fall): payment step and totals
   unchanged, no fee anywhere.
8. `verify.mjs` and `check:payments` pass. Screenshots in `_proof/r34/`.

## Report

Files changed; how the fee reaches Clover (line items or a single total);
verify results; commits on `review` not yet on `main`; preview URL
https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/

End of prompt.
