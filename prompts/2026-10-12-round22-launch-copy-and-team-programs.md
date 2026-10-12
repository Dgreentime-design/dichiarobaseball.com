# Round 22 - Launch copy from Michael, team programs unlisted

DiChiaro Baseball & Softball Academy. Monday 12 October 2026, run at 1:20pm.
**Go-live 2:00pm Eastern.** Copy and visibility only. Images are round 23.
Michael signed these off in person today; they are the source of truth and
override earlier copy. One run, one report. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if not pushed. Expect 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. **`pages/instructors.html` is open this round** for the three Instructors
   items below only. Touch nothing else on it.
3. Prices and dates do not change. The only option change is removing the
   Infield Camp "Two payments" option (task 3).
4. No Vercel, Clover, Airtable or GA4 setting changes. Never print a secret.
5. No images. If a task seems to need an image change, report it for round 23.
6. Never use an em dash. Match the existing voice: plain, confident, short.
7. Stop at the checkpoint and report. Out of scope: report, don't fix.

## Verdict on round 21

Accepted. GA4 works on the preview, the funnel fires in order, no personal
data leaves, speed unchanged. Test rows deleted.

## Site-wide

1. **Facility size is 6,500 sq ft.** Replace every 5,500 (Home, About,
   Facility, Team camps, metadata, JSON-LD, llms.txt). Same format each place
   it appears ("6,500 sq ft" or "6,500 square feet", matching what is there).
2. **Ages: "6 and up".** Wherever the academy as a whole says 6-18 or ages
   6 to 18 (Home, Camps intro, Contact, marquee, metadata), say "Ages 6 and
   up" / "ages 6 and up". Program-specific ages (Little League 6 to 12, Hit
   Night 10 to 18, Infield grades) stay as they are.

## Home

3. **Monday Hit Night card, under price:** "$30 per session" and on the next
   line "Monthly packages". $30 is the Single session option price; take it
   from data, don't hard-code a different number.
4. **Infield Camp:** remove the Two payments option from `data/programs.json`
   (the `two-payments` option on `infield-camp-2026-27`), so Pay in full at
   $950 is the only option everywhere: Home card, Camps card, program page,
   register. Remove any "two payments" wording.
5. **Infield Camp:** show "Last 4 sessions at the Superdome, 8am to 10am".
   The data already has this (`schedule.combined`, Feb 13 to Mar 6, both
   groups, 8:00am to 10:00am). Show it on the Home card, the Camps card and
   the program page schedule.
6. Facility size and ages per items 1 and 2.

## Camps and clinics

7. Intro ages per item 2. Infield per items 4 and 5.
8. **Little League Winter 2027 is missing.** Find why (the fall card is
   tagged `zip: camps`, winter and March are `live`; check what the Camps
   page lists by) and list Winter 2027 alongside Fall 2026 and March 2027,
   same card pattern, in date order.
9. **Team programs come off the public site.** IHA Softball, Fair Lawn HS
   Softball and Old Tappan HS:
   a. Remove their three cards from the Camps page and the "Teams" filter
      chip if nothing is left under it.
   b. Keep their pages at their current URLs, working, with registration,
      so Michael can email each team its own link.
   c. Mark those three program pages `noindex`, take them out of the sitemap
      and llms.txt, and make sure nothing on the public site links to them
      (Home, footer, Camps, Lessons, related programs, search, JSON-LD).
   d. No team names or team prices anywhere public. The "Bring the whole
      team in" block on Camps stays, with no names and no prices, linking to
      the team camps enquiry page. Check `team-camps.html` too: if it shows
      any team name or price, remove it.
   Report the three URLs so Daniel can send them to Michael.

## Lessons

10. **Hitting, fielding, catching packages are 45-minute lessons**
    (confirmed by Michael). Prices do not change. On that card:
    - Single lesson stays: 30 minutes $75, 45 minutes $90.
    - The Packages heading becomes "Packages, 45-minute lessons".
    - 5 lessons $86 a lesson, $430. 10 lessons $82 a lesson, $820. Unchanged.
    - The "Not sure which" line "30 or 45 minutes, from $75" stays.
    Pitching card: leave its packages exactly as they are unless this prompt
    says otherwise (Daniel is confirming with Michael).
11. **Remove the "Taught by" block** (label and names) from both the
    Hitting and Pitching cards.
12. **Before you book:** "One waiver a season" becomes "One waiver per
    child" (keep "Signed online when you book."). The "Packages are final"
    item's line "They last the season, and any instructor can teach them."
    becomes "They never expire, and any instructor can teach them."

## Facility and rentals

13. Add "Baseballs and softballs are included." to the rentals details,
    where the rental inclusions are listed.
14. Size per item 1.

## Instructors (`pages/instructors.html`, open for these three only)

15. Stat row: "3 MLB draft picks" becomes "2 MLB draftees on staff".
    "Since 2000, Teaching in Fair Lawn" becomes "Since 2010, Open in Fair
    Lawn". Lou's own "coaching since 2000" lines stay; they are about Lou.
16. **Delete Eric Pfisterer** entirely: his card, any anchor, filter or
    count that includes him. Recount anything that says how many instructors.
17. **Remove the "Pick the instructor." section** (the closing band). If its
    CTA was the page's only route to booking, keep a plain link to Lessons in
    its place and report it.

## About

18. Size per item 1. Under Instructors, delete Eric Pfisterer.

## Verify

1. `npm run verify`, `check:payments`, `check:enquiry`, `check-jsonld` pass.
2. Grep the built site: no "5,500", no "6-18" in academy-wide copy, no
   "Pfisterer", no "Two payments", no "Taught by", no "Pick the instructor".
3. Grep public pages and sitemap for "IHA", "Fair Lawn HS", "Old Tappan":
   only on their own unlisted pages. Open each of the three URLs on the
   preview: page loads, noindex present, register works with the mock.
4. Mock checkout for Infield Camp: one option, $950.
5. Check Home, Camps, Lessons, Instructors at 390 and 1440 once.

## Report

1. Step 0.
2. Each task 1 to 18: done, or why not, with the changed text.
3. The three team program URLs.
4. Verify results.
5. Commits and the preview URL.
6. Anything out of scope, including anything for round 23 (images).

## Out of scope (report, don't fix)

Images and video, new copy beyond what is listed, price changes, consent
banner, Event schema.

End of prompt.
