# Round 11 - Client review changes and program pages

DiChiaro Baseball & Softball Academy. Written 7 October 2026, after the
client review with Michael. Go-live target: Tuesday 13 October.
One run, one report. Follow CLAUDE.md.

## Step 0

Repo: `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. **Do not touch `pages/instructors.html`.** Daniel is reworking the
   instructors section himself. Report anything there that conflicts with
   this round, but do not change it.
3. No changes to `api/`, the money path, environment variables, or any
   slug, price, date or option in `data/programs.json`.
4. Never hand-edit generated HTML. Edit the source, then run
   `node build.mjs`.
5. Review notes stay on the page. Stay unindexed. Never use an em dash.

## Decisions from the 7 October review (do not re-ask)

- Families can no longer choose or request an instructor anywhere on the
  site.
- HitTrax stays a promotion with a "Request a HitTrax session" option. It
  is not sold online yet. Michael is setting its pricing.
- Michael is sending 9 PDFs as the new baseline for every camp, lesson and
  purchasable item. They arrive in a later push. This round builds on the
  current data, and a later round re-baselines it from the PDFs.

## 1. Program pages: round 09, items 1 to 4

Run `prompts/2026-10-05-round09-program-pages.md`, items 1 to 4, exactly
as written. Item 0 already shipped.

The generator must read only from `data/programs.json` and
`data/program-copy.json`, so a later data change rebuilds every page with
no template edits.

## 2. Remove instructor selection

Remove every line that lets or invites a family to choose a coach.
Known places:

- `pages/lessons.html`:
  - The meta description ("You pick the instructor...").
  - The hero sub ("You pick the coach, the skill and the length").
  - The "Choose who teaches" band and its "Name a coach when you book"
    line.
- `pages/contact.html`: the FAQ "Can I book with a specific coach?".

Replacement copy, where a line needs one:

- Lessons hero sub: "Seven days a week, year round. You pick the skill and
  the length."
- Lessons meta description: "Private and semi-private lessons in Fair
  Lawn, New Jersey. You pick the skill and the length. From $75."
- The "Choose who teaches" band: remove the whole band. Do not move it. If
  removing it leaves the page without a link to the Instructors page, add
  "Meet the instructors" as a text link at the end of the Rates section.
- The contact FAQ: remove the question and its answer.

Leave these alone:

- The "Taught by" rows on the rate cards. They are information, not a
  choice.
- The "Anything the coach should know" field on the register page.

Search every other page and the register JS for wording like "choose",
"pick", "name a coach", "specific coach", "your instructor", "book with".
Fix each one outside `instructors.html` and list them.

## 3. Coaches promo gets an image

The "Meet the coaches." staff teaser on `pages/about.html` gets a photo,
using the existing media component and layout pattern on that page. No new
component.

- Use `dbsa-09-lou-coaching.jpg`, unless it already appears in a
  neighbouring section of About. In that case, use
  `dbsa-06-group-semi-private.jpg`.
- Give it real alt text.
- At 390 the photo keeps the responsive rule in
  `docs/responsive-decisions.md`.

## 4. Lou's founder promo links to Instagram

In the homepage Lou section, below "Read Lou's story", add a text link
"Follow on Instagram" to `https://www.instagram.com/dichiaroacademy`. Open
it in a new tab with `rel="noopener"`, and give it an aria-label that says
it opens Instagram. Use the same handle the header and footer use.

## 5. HitTrax stays a request

The homepage HitTrax band button "Book a HitTrax session" becomes
"Request a HitTrax session", linking to `contact.html?about=hittrax`, the
same target the Rentals page uses. Check that no page offers a HitTrax
price or online purchase.

## Verify, then report once

`npm run verify` passes. On the preview, at 390 and 1440, check:

- Every details link.
- Lessons, Contact and About.
- The homepage Lou and HitTrax bands.

Report:

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. Every instructor-selection line removed, with its page.
4. Anything on `instructors.html` that conflicts with the decisions, for
   Daniel.
5. The program pages generated, and the sections left out of each.
6. Verify output.

Then update section 8 of `docs/build-thread-briefing.md` with the
7 October decisions above and stop.

## Out of scope, later rounds

- Round 12, launch hardening:
  - Lock or remove `/api/config-check`.
  - The webhook 401 alert.
  - The third state on the success page.
  - Confirmation copy.
  - 301 redirects from the Framer URLs.
  - Analytics.
- Round 13, after the 9 PDFs arrive:
  - Re-baseline `data/programs.json` from them.
  - Add "Teams" to the camps filter, plus the three additional camps.
  - Flyer download buttons.
  - The final copy sweep.

End of prompt.
