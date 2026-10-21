# Round 31: Team and town camps, private codes

Date: 21 Oct 2026. Branch: `review`. Goal: built, tested on preview and
ready for Daniel to merge today. Read `docs/` and the current register flow
before changing anything; reuse existing components and styles.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records. Do not change Vercel settings.
- Do not edit `pages/instructors.html`.
- Delete nothing. The three unlisted team programs (IHA, Fair Lawn HS,
  Old Tappan HS) and their pages stay exactly as they are this round
  (they move in round 32).
- Do not change public program pricing, Clover settings, the webhook's
  confirm logic, or the Airtable automations.
- No em dashes in any copy. Placeholders never use personal names.
- Stop at the checkpoint and report. Anything outside scope: report, don't
  fix.

## What we are building

Towns and teams buy private camps. Each town or team has one private code
(printed on its flyer). Entering the code shows only that group's live
camps, with prices. Then the normal flow: player, waiver, pay online
(Clover), at the facility, or by check. Prices, camp names and group names
are never visible without a valid code.

## Data: Airtable, read at runtime (no deploy to add camps)

Base: `AIRTABLE_BASE_ID` (same base, same `AIRTABLE_TOKEN`). Tables exist
and hold test data. Use table IDs as defaults, overridable by optional env
vars `TEAM_GROUPS_TABLE` and `TEAM_CAMPS_TABLE`.

Groups `tblSu6t5sbfuyb34X`
- name `fldn0l9fNU1WcLXGs`, type `fld3AzETxmg5iiKlG` (town/team),
  sport `fldvbcFW9C24RffzI`, code `fldhwo9Ns2iin9bMv`,
  active `fldgDuztayuwp9FXf`, is_test `flds9DroUE9vhgZiR`,
  contact `fldkRMQbPnjtBKvfY` (internal, never sent to the browser),
  notes `fldsWW5QwniZiKjtV` (internal).

Team camps `tbljL2xLu9CdvXTr9`
- camp_name `fldaiV3cJ8o9k2aFl`, group `fldfWZwTyU95BFLzD` (link to one
  group), camp_ref `fld9PH7m64TkifCuG` (autonumber, the stable camp ID),
  status `fldiSMQ0TAxqj5vWR` (draft/live/closed), sport
  `fldis9Xb4fgIR4qvh`, ages `fldmWs15ptbQ0572H`, weeks
  `fldTwWCTBY890bZF2`, session_hours `fldJoV2DCD9FMWB01`, day
  `fldqMTIh8BXUR2r2U`, time `fldSj86dIUSaWoLNo`, start_date
  `flds7aZWZfBHXospM`, dates `fldFE8HDpKYSRJtio` (one YYYY-MM-DD per line),
  venue `fldkRFjH5lqmppMqL`, price `fld1M30J2Jaju6xCE` (per player),
  payment_methods `fldEwXiuwtKSkogJl` (online/facility/check), capacity
  `fldMrKb4NZcclhxGr` (optional), summary `fldHy9f4DPOSEsbpR`, is_test
  `fldaTJO4GVAblJoXs`, notes `fldtJL4F3Q6h5x5Rd` (internal, never sent).

Registrations (live) and Registrations Review (preview) each have two new
fields: `team_group` (text) and `team_camp_ref` (number). Add both to the
store's OPTIONAL_FIELDS so a missing field never loses a row.

Rules
- A code matches a group when: codes compare case-insensitive, ignoring
  spaces; group is active. A camp is shown when status = live, it belongs to
  that group, and it has a session still to come.
- Groups or camps with is_test checked are accepted on preview only
  (`VERCEL_ENV !== "production"`). On production they behave as unknown.
- Read Airtable with a short in-memory cache (60 seconds max) so a code
  change in Airtable takes effect within a minute.

## Security (from programs.json _meta.codes, still binding)

- New endpoint, e.g. `POST /api/team-code` with `{ code }`. Code in, that
  group's live camps out. Never a list of groups or codes.
- One identical failure response for every cause (unknown code, inactive
  group, test data on production): same status code, same shape, same
  message, with a small fixed delay so timing does not leak. A valid code
  with no live camps is not a failure (see UI).
- Constant-time comparison. Rate limit 5 attempts per minute per IP
  (best effort per instance is acceptable; say what you used). Log each
  attempt with a hashed IP and success/fail, never the code typed.
- Nothing about groups, codes, team camps or prices in any built HTML,
  `data/programs.json`, the sitemap, `llms.txt` or any GET endpoint.
- Never send `contact`, `notes` or other groups' data to the browser.

## Checkout

- Extend the existing checkout session flow to accept a team camp: the
  request carries `code` + `campRef` + players + payment method. The server
  re-validates the code and camp, takes the price from Airtable (price x
  players), and refuses a payment method the camp does not allow. The
  browser never supplies a price.
- Write the registration exactly like a public one, with:
  program = camp_name, option = "Team camp", team_group = group name,
  team_camp_ref = camp_ref, amount = server price. Online goes pending then
  confirmed by the existing webhook; facility and check confirmed at once.
  The existing Airtable alert then emails info@ as today.
- Check by mail uses the existing check details (payable to / mail to).
- If capacity is set and confirmed registrations for that camp_ref have
  reached it, the camp shows as full and checkout refuses it.

## UI (reuse existing components: input, field, option cards, pills,
summary card, error style; no new colors or fonts)

1. Camps page filter row: remove Weekends and Weeknights. Add Team/Town.
   Final order: All programs, Baseball, Softball, Ages 6-12, Ages 10-18,
   Team/Town. Must stay one row (scrolls on phones), as in round 27.
2. Team/Town filter shows ONE card only, no camp or group names, no
   prices:
   - Eyebrow: Team & town camps
   - Heading: Registering with your town or team?
   - Line: Enter the code from your flyer to see your camps and register.
   - Code field + button "Find my camps"
   - Secondary link: Plan a team block (to team-camps.html#ask-title)
   This card must not appear under any other filter, including All.
3. Team camps page: the same code block near the top ("Have a code from
   your flyer?").
4. Code field: label "Team or town code", placeholder "e.g. ABCD-2345",
   monospace (JetBrains Mono), auto-uppercase,
   accepts spaces and lowercase, autocomplete off, spellcheck off,
   min 44px tap target.
5. States:
   - Checking: button reads "Checking..." and is disabled.
   - Not recognised (every failure): "We don't recognise that code. Check
     your flyer, or call us at (201) 773-6858." in an aria-live region.
   - Too many tries: "Too many tries. Please wait a minute and try again."
   - Success: go to the camp picker.
6. Camp picker (in register.html, reached via `register.html?code=XXXX`,
   which is also the flyer QR target; the code is read from the URL then
   removed from the address bar with history.replaceState):
   - Header: eyebrow "Team & town camps", heading "[Group name] camps",
     link "Not [group name]? Use a different code".
   - One option card per live camp: camp name, ages, day and time, dates
     (first to last, number of sessions), weeks, session length, price.
   - Full camp: card disabled, label "Full".
   - Valid code with no live camps: "Registration for [group name] camps
     isn't open yet. Check back soon, or call (201) 773-6858."
   - Choosing a camp continues into the existing steps (player, waiver,
     payment). The summary card shows eyebrow "[Group name] · Team camp".
     Payment options show only the camp's payment_methods.
7. Copy tone: plain, welcoming, sentence case.

## Verify on the preview (with the test data)

1. TESTA-7KQ4: shows exactly two camps ($210 10U, $375 12U). The 14U
   draft ($640) never appears anywhere.
2. TESTB-M3XZ: shows only TEST Team B Softball ($289). No Town A data in
   any response.
3. Lowercase and spaced input (`testa 7kq4`) works.
4. Wrong code, then 6 quick tries: generic message, then the rate limit
   message. Responses identical in shape for every failure.
5. 12U camp offers online and facility only (no check). Tampering: post a
   different price or a payment method the camp does not allow straight to
   the API; both refused.
6. One facility registration through to confirmation on preview: row lands
   in Registrations Review with team_group, team_camp_ref and the server
   price; the TEST alert fires. Do not pay online; stop at the Clover
   handoff (PAYMENT_PROVIDER may be unset on preview, report what happens).
7. View source, data/programs.json, sitemap, llms.txt and every GET
   endpoint: no group names, codes, team camp names or team prices.
8. Filter row: one row at 1440, 1024, 768, 390. Team/Town card only
   under Team/Town.
9. `verify.mjs` passes. Screenshots of: filter row, Team/Town card,
   each code state, picker for both test codes, summary card, payment step,
   confirmation; desktop and 390.

## Report

1. Files changed and the new endpoint(s).
2. How rate limiting and the cache work, and their limits.
3. Results of Verify 1-9, with screenshots in `_proof/r31/`.
4. Any field or permission problem with the Airtable token on the new
   tables (names only, no values).
5. Commits pushed to `review`, the preview URL
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/
   and the list of commits on `review` not yet on `main`.

## Out of scope (report, don't fix)

- Moving IHA, Fair Lawn HS, Old Tappan HS onto codes (round 32).
- Real town and team camp data (Daniel and Claude add it in Airtable).
- Constant Contact, the card fee, Clover settings.

End of prompt.
