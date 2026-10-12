# Round 09 - Program pages from the data, and site fixes

DiChiaro Baseball & Softball Academy. Written 5 October 2026.
One run, one stop. Follow CLAUDE.md rule 5 and the Speed section.

Scope: a mobile hero hotfix first, then every "See dates and details" link opens its own program, built from
`data/programs.json`, plus a short list of fixes. No layout redesign. No
backend changes.

## Step 0

Run the CLAUDE.md Step 0 commands. If prompt files are committed but not
pushed, push them first, then run Step 0 again. Expect 0 0 and a clean tree.

## Boundaries

1. Work on review only. Never push or merge to main. No force-push.
2. Do not change `api/`, the register flow logic, payment code, Airtable
   code, or any slug, price, date or option in `data/programs.json`. The
   money path reads that file.
3. Facts come from `data/programs.json` only. Written copy comes from the
   approved page copy only. Never invent copy. A section with no approved
   copy and no data is left out of that program's page, not filled in.
4. Never hand-edit the generated HTML. Edit the source and run
   `node build.mjs`.
5. Review notes stay on the page.
6. Stay unindexed. Do not set `SITE_ORIGIN`.
7. Delete nothing beyond what an item names. Never use an em dash.

## 0. Hero hotfix, first

Daniel's top priority for this round. Do it before item 1 and commit it on
its own. Reference: `docs/reference/round08/hero-dark-mobile.png`.

1. At phone widths, lighten the overlay over the top half of the shared
   image hero so the photo reads clearly. The sub text must still pass 4.5:1
   at its brightest pixel. Report the number.
2. At phone widths, hero buttons sit at their natural width, stacked and
   left aligned, as in the reference. Keep the current button colors.
3. Homepage hero image: use `dbsa-07-little-league.jpg`, as in the
   reference. Choose an object-position that keeps the players in frame
   at 390.

Check home, instructors, camps, lessons and program at 390 and 1440.

## 1. One page per program, generated at build time

Today `program.html` is a fixed Infield Camp page and ignores `?p=`. Every
details link opens it, and the link slugs (`infield-camp`,
`monday-hit-night`) do not match the data slugs (`infield-camp-2026-27`,
`hit-night-fall-2026`).

1. Extend `build.mjs` so it writes one static page per program in
   `data/programs.json` where `status` is `live` and `gated` is `false`.
   Today that is six: three Little League, the Infield Camp and two Hit
   Nights. The three gated team programs get no public page.
   - Static pages rather than client-side rendering, so each program can be
     indexed at launch with its own title, description and Event JSON-LD.
   - Path: `programs/<slug>.html`, for example
     `programs/infield-camp-2026-27.html`.
2. The template is the current program page design. Facts render from the
   data: name, season, ages, sport, day, times, groups, every date, the
   venue split, every option and its price, the payment schedule, and the
   skills list.
3. Written copy (hero sub, group bodies, skill descriptions, FAQ, venue
   cards) moves into a new `data/program-copy.json`, keyed by slug. Move the
   Infield Camp's approved copy there word for word. The other five
   programs get only what their data supports until Daniel supplies copy.
   List every section left out per program.
4. The skills heading counts from the data. The data lists ten Infield
   skills, so the heading becomes "Ten skills, drilled until they're
   automatic." A skill with no written description shows its name only.
5. Dates render in American order from the data: "Nov 14, 2026", "Jan 1,
   2027". That fixes the day-first dates the round 07 report flagged.
6. "Add all dates to your calendar" downloads a `.ics` file generated at
   build time from that program's dates, times and venue. Today it opens
   the contact form.
7. "Download the flyer (PDF)": none of the PDFs named in the data are in
   the repo. Leave the button off every generated page and list the flyer
   files Daniel needs to add to `assets/flyers/`. When a file exists at
   that path, the build shows the button. Today the button opens the
   contact form.
8. The High school chip "Full, waitlist open" becomes "Full". Waitlists
   were dropped.
9. "Have a town or league code?" links to a code field that no longer
   exists. Remove the link from the template and log it in the briefing.
   It comes back if codes come back.
10. "Six places left" has no source in the data. Keep it exactly as it is
   on the Infield page only, and list it as a question for Michael. Do not
   generate places-left text for any other program.
11. Keep the Superdome split lines exactly as they are on the Infield page,
   still held for the Feb 6 answer.
12. Old links must not break. `program.html?p=<anything>` redirects to the
   matching program page, using a small map from the old link slugs to the
   data slugs, and falls back to `camps-and-clinics.html`.

## 2. Point every details link at its own page

On the homepage and the camps page:

- Little League card: `programs/little-league-fall-2026.html`
- Infield Camp card: `programs/infield-camp-2026-27.html`
- Hit Night card: `programs/hit-night-fall-2026.html`
- Spring Little League card: `programs/little-league-march-2027.html`.
  Report the conflict: the card says "Dates coming" and "Spring 2027", but
  the data has dates starting Mar 7, 2027. Do not change the card copy.

Report that Winter Little League and Winter Hit Night now have pages but no
card. Adding cards is Daniel's decision.

## 3. Fixes from earlier reports

1. Infield Camp card on the homepage and the camps page: the sport reads
   "Baseball". The data says baseball and softball. Use "Baseball and
   softball", matching the other cards.
2. Hit Night card on the homepage and the camps page: "packages from $75"
   is September's package, which has passed. The remaining packages start
   at $100. Change it to "$30 a session, packages from $100" in both places.
3. The register progress connector at 360: the line between steps 2 and 3
   runs through the 03 marker. Fix it.

## 4. Verify, then report once

1. `npm run verify` passes. Add the six program pages to the pages it walks.
2. On the preview, open every details link on the homepage and the camps
   page, and each `program.html?p=` link from the old set. Each one lands on
   the right program. Check one generated page at 390 and 1440.
3. Download one `.ics` file and confirm it holds the right number of
   events, at the right times.

Report, short:

1. Preview link first.
2. Commits, one line each.
3. The six pages generated, and the sections left out of each.
4. Flyer files Daniel needs to add.
5. Conflicts and questions for Michael.
6. Verify output.

Then update section 8 of `docs/build-thread-briefing.md` and stop.

## Out of scope

- New camp cards, new copy for the five programs without it.
- The money path, `/api/config-check`, the confirmation email and the third
  state on the success page. Round 10.
- Domain, `SITE_ORIGIN`, cutover. Round 11.

End of prompt.
