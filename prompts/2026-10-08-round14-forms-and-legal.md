# Round 14 - Enquiry forms that work, and factual legal fixes

DiChiaro Baseball & Softball Academy. Written 8 October 2026. Go-live
target: Tuesday 13 October. One run, one report. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`. Daniel owns it.
3. **New endpoint, so full evidence.** Do not change the registration or
   payment code: `api/checkout/`, `api/webhooks/`, `api/registration/`,
   `api/_lib/match.js`, prices, dates or options. `check:payments` must
   still pass 11 of 11.
4. Never print a secret, a header value or a full payload. No personal data
   in logs: log a reference and a status only.
5. Do not change Vercel environment variables yourself. Tell Daniel exactly
   what to add.
6. Stay unindexed. Do not set `SITE_ORIGIN`. Never use an em dash.

## Round 13 verdict

Accepted. Removing the Lou's Journey note sections, the "Add another
player" button and the sibling promises was the right call. The legal
inconsistencies you listed are fixed in item 2 below.

## Decision (7-8 October, do not re-ask)

The Contact and Team camps forms save every message to Airtable, and an
Airtable automation emails Michael. Daniel builds the automation. The site
sends no email itself.

## 1. The enquiry forms

Today `pages/contact.html` and `pages/team-camps.html` show "Not sent. This
form is not taking messages yet." on submit.

1. **One endpoint:** `POST /api/enquiry`. It writes one row to the table
   named by a new env var, `ENQUIRIES_TABLE_NAME`, in the same base and with
   the same token as registrations. Reuse the Airtable client in
   `api/_lib/store.js`; do not duplicate it. If the env var is missing, the
   endpoint returns the generic failure below, it never falls back to the
   Registrations table.
2. **Fields** (Daniel creates these in Airtable, use these exact names):
   `reference` (EQ-YYYYMMDD-XXXX), `created_at`, `form` (contact or
   team-camps), `about` (the `?about=` slug if the page was opened with one,
   for example `hittrax` or a team program slug), `name`, `email`, `phone`,
   `topic`, `message`, `details` (the team camps fields that have no column:
   role, team, sport, players, weeks, start, as readable lines), `page_url`,
   `status` (always `new`).
3. **Validation server side:** required fields as the form marks them, an
   email that looks like an email, length caps on every field (message
   2,000 characters), trimmed. Return a generic 400 on bad input.
4. **Spam:** a hidden honeypot field, and refuse a submit that arrives
   under 3 seconds after page load. Both return a fake success and write
   nothing. Add a per-IP limit of 5 a minute; holding it in memory is
   fine. No captcha.
5. **`?about=`:** when Contact is opened with `?about=<slug>`, preselect the
   matching topic (HitTrax and rentals to "Cage or facility rental", a team
   program slug to "Team booking", a camp slug to "Camps and clinics") and
   store the slug in `about`. Unknown slugs are ignored.
6. **On the page:**
   - Sending: the button disables and reads "Sending...".
   - Success: replace the form with "Thanks, we've got your message." and
     "We reply within one business day. Your reference is EQ-...". Move
     focus to that heading.
   - Failure (network or 5xx): keep what they typed, and show "That didn't
     send. Call (201) 773-6858 or email <the address already on the page>."
   - Remove the "Not sent" notices.
7. **Reply promise:** Contact says "same day during opening hours" in the
   lede and the og:description, Team camps says "within one business day".
   Use "We reply within one business day." in both places on both pages.
8. **Add the enquiry checks to `npm run check:payments`** or a new
   `npm run check:enquiry`: valid submit writes a row, honeypot writes
   nothing, a too-fast submit writes nothing, bad email is a 400, missing
   env var is the generic failure.

**Proof on the preview**, after Daniel adds the env var (if it is not set
yet when you get here, finish everything else, prove it locally against
the mock store, and say so in the report):
- One Contact message and one Team camps message, at 390, each read back
  from `Enquiries Review` by reference.
- One Contact message opened from `contact.html?about=hittrax`, with the
  topic preselected and `about` stored.

## 2. Legal pages: factual fixes only

In `legal.json`, change only what is now untrue. Leave the waiver, release,
refund terms and privacy terms otherwise word for word.

- "Last updated" becomes the date of this commit.
- Cookies: name Vercel Web Analytics as the analytics in use, and say it
  sets no cookies. Remove "will be named here".
- Remove the waitlist promise.
- Refund terms: "on the receipt" becomes "on the confirmation screen".
- Remove "Every booking after this skips this step" and the matching
  waiver line, and the same line on Register. The skip is not built.
- Privacy: add one sentence that messages sent through the Contact and Team
  camps forms are stored to reply to them and are not added to marketing
  lists.
- British spellings to American: behavior, acknowledgment, authorize.
- Leave "Anything else is opt-in" as it is, and list it for the lawyer.

List every changed line, old and new.

## 3. Two small fixes

1. `register.js` still shows "2:30 to 4:00pm". Use the site format,
   "2:30pm-4:00pm", wherever it renders times.
2. Ages: one style, "6-12", everywhere outside `instructors.html`.

## Verify, then report once

`npm run verify`, `npm run check:payments` (11 of 11) and the enquiry
checks pass.

Report:

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. Exactly what Daniel adds in Vercel and Airtable, as a checklist.
4. Item 1: each proof, pass or fail.
5. Item 2: every `legal.json` line, old and new.
6. Item 3: the lines changed.
7. Verify output.

Then update section 8 of the briefing and stop.

End of prompt.
