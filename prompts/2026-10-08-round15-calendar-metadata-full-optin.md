# Round 15 - Calendar options, true metadata, "Full" switch, marketing opt-in

DiChiaro Baseball & Softball Academy. Written 8 October 2026. Go-live
target: Tuesday 13 October. One run, one report. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`. Daniel owns it.
3. **Item 3 touches the money path, so it carries full evidence.** For the
   change to `api/checkout/session.js`: a test that fails before and passes
   after, `api/_lib/match.js` untouched, `check:payments` passes in full,
   prices, dates and options unchanged.
4. Never print a secret, a header value or a full payload.
5. Do not change Vercel environment variables. Stay unindexed. Do not set
   `SITE_ORIGIN`. Never use an em dash; use a plain hyphen in ranges.

## Round 14 verdict

Accepted, including going past the brief on the cookie line and the
waitlist sentence. Both were untrue, and removing them was right.

## Decisions from Daniel, 8 October (do not re-ask)

- A full camp is switched off by hand: Michael watches Registrations and
  tells Daniel, and one data change closes it. No live capacity counting
  at launch.
- Calendar: Apple Calendar and Google Calendar are required. Outlook is
  nice to have.
- Search and share descriptions must describe the real page, everywhere,
  and a build rule must keep them that way.
- Contacts go to Constant Contact for marketing later, so the site must
  collect marketing consent from launch day.

## 0. First: the spam trap is eating real messages

Daniel's real Contact test on the preview (8 October) showed the success
screen but wrote no row. A direct POST with `website` empty and
`elapsedMs` 8000 saved fine (EQ-20261008-4EK3, both Airtable automations
ran), so the endpoint, table and env var work. The likely cause: the
honeypot is named `website`, and browsers and password managers autofill
a field with that name, so a real parent is silently discarded with a
fake success.

1. Rename the honeypot on both forms and in `api/enquiry.js` to a name
   nothing autofills (not website, url, company, name, email, phone or
   address), with `autocomplete="off"` plus `data-1p-ignore`,
   `data-lpignore="true"` and `data-form-type="other"`. Keep it off screen,
   `aria-hidden`, `tabindex="-1"`.
2. When a submit is discarded as spam, log which check caught it
   (`honeypot` or `too_fast`), never the value.
3. Add a check: a submit with the honeypot empty and 4 seconds elapsed
   saves; one with it filled is discarded.
4. Prove it on the preview with a real browser fill at 390, in Chrome with
   autofill on, and read the row back from `Enquiries Review`. Delete
   EQ-20261008-4EK3 afterwards only if Daniel says so.

Commit this on its own, first.

## 1. Add to calendar, three ways

Each program already gets a build-time `.ics` beside its page. Replace the
single "Add all dates to your calendar" button with one "Add to calendar"
control offering:

1. **Apple Calendar:** downloads the program's `.ics` (all dates). This is
   also the right file for Outlook desktop.
2. **Google Calendar:** opens Google's subscribe screen for the program's
   hosted `.ics`, using
   `https://calendar.google.com/calendar/r?cid=<url-encoded webcal:// URL>`.
3. **Outlook.com (nice to have):** opens
   `https://outlook.live.com/calendar/0/addfromweb?url=<url-encoded URL>`.
   Leave it out if it doesn't work, and say why.

Requirements:
- Absolute URLs for the `.ics` must come from one config value, so they
  switch from the preview host to `https://dichiarobaseball.com` at cutover
  without hand edits. Note in the report that Google can only fetch a
  public URL, so on the preview it may fail behind protection; say what you
  saw.
- Each event: program name, the group's time, the venue address, and a
  link back to the program page. Superdome dates carry the Superdome
  address.
- The `.ics` is served with `Content-Type: text/calendar`. Validate one
  file with an iCalendar validator or parser, and import one into a real
  calendar if you can.
- Keyboard and screen-reader friendly: a disclosure button with a list of
  links, not a hover menu. Tap targets at least 24px.
- **The confirmation screen:** "Add to calendar" currently links to
  `contact.html?about=calendar`. Show the same three options for the
  program just registered. Remove the `calendar` topic if nothing else uses
  it.

## 2. Metadata that describes the real page

Today the Camps share description says "Four programs running right now"
while the page shows seven.

1. Audit every page's `<title>`, meta description, `og:title`,
   `og:description`, `og:image` and `twitter:*` against what the page
   actually shows. List every mismatch.
2. **Rule:** any count, price, date, age or program name in metadata is
   generated from the same data the page renders (`data/programs.json`, the
   cards, `program-copy.json`), never typed by hand. Where a fact can't be
   generated, write the description without that fact.
3. `og:title` and `og:description` always equal the page's own title and
   meta description, from one source per page, so they can't drift apart.
4. Program pages: description from that program's data (name, ages, day,
   dates, price from).
5. **Add checks to `npm run verify`:** every page has a unique title and
   description; og and meta match; descriptions are 70 to 160 characters;
   no number in a description that the page body doesn't also contain.
6. Add the rule to CLAUDE.md under a "Metadata" heading so later rounds
   keep it.

## 3. The "Full" switch

1. Add `"full": false` to every program in `data/programs.json`. This is
   the only new field; touch nothing else in the file.
2. When `full` is true:
   - The program page and its cards show a "Full" chip, and the register
     button becomes "Ask about openings", linking to
     `contact.html?about=<slug>`.
   - The program is not offered in the register flow.
   - `/api/checkout/session` refuses it with the generic error it already
     uses. Prove it with a crafted request.
3. Document in `docs/launch-plan.md`, in plain words for Daniel: how to
   close a camp (the one line to change, commit, and the preview and
   production check), and how to reopen it.

## 4. Marketing opt-in, collected from launch day

Constant Contact sync comes after launch, but the consent must be
collected now so day-one contacts can be used.

1. On the register flow (the parent details step), the Contact form and the
   Team camps form, add one unticked checkbox:
   "Send me news about camps and clinics. You can unsubscribe at any time."
   Never pre-ticked. Not required. Kept separate from the waiver.
2. Store it as `marketing_opt_in` (true or false) plus
   `marketing_opt_in_at` (timestamp, empty when false) on the Registrations
   row and the Enquiries row. Daniel adds the fields; if a field is
   missing, the write must still succeed without it, and the report says
   so.
3. The privacy page line added in round 14 stays true: enquiry messages
   are not added to marketing lists unless the box is ticked. Adjust that
   one sentence to say so, and list it old and new.
4. Build nothing that talks to Constant Contact this round.

## Verify, then report once

`npm run verify` (with the new metadata checks), `npm run check:payments`
and `npm run check:enquiry` pass.

Report:

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. Item 1: what each calendar option did when tested, and where.
4. Item 2: the mismatch list, old and new, per page.
5. Item 3: the proof, and the close-a-camp steps.
6. Item 4: the checkbox on each form, and exactly which Airtable fields
   Daniel adds.
7. Verify output.

Then update section 8 of the briefing and stop.

End of prompt.
