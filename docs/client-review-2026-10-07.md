# Client review, 7 October 2026, 2pm Eastern

Daniel's walkthrough for the meeting with Michael. Read only: nothing in this
document changes the site, the data or any setting.

Preview base: `https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app`
(written as `B` below). Do not send the old production preview.

Before the meeting, three things to say up front:

- **Program pages are not shipping today.** `program.html` is a fixed Infield
  Camp page. Every "See dates and details" link, including the ones on the
  Little League, Hit Night and Spring cards, lands on the Infield Camp page.
  Tell Michael before he clicks one.
- **Review notes are on the page.** Boxed "Needs confirming" and "One flag"
  notes on Lessons, Team camps, the program page and Register are for this
  review. They come off before launch.
- **The homepage hero is now the Little League photo** (`dbsa-07-little-league.jpg`),
  from the mobile hero hotfix.

---

## 1. Page by page, in visit order

### 1.1 Home - `B/` (or `B/index.html`)

Check:
- The hero photo and headline, at phone and desktop width.
- The three "Open for registration" cards: are these the right three programs
  to lead with?
- "4 spots left" on the Hit Night card. **Nothing in the data supports this
  number.** Keep, change or remove?
- Lou's timeline and the "Why DiChiaro" stat strip.
- The three quotes (Mike Sheppard Jr., Ed Blankmeyer, Jack and Barbara Gross):
  permission to publish?

Facts shown: announcement bar "Little League camp starts Sunday, Oct 25";
ages 6 to 18; Little League ages 6-12, 8 Sundays, 2:30-4:00pm, $320, starts
Oct 25; Hit Night ages 10-18, softball 7-8pm, baseball 8-9pm, $30 a session,
packages from $75; Infield grades 4-8 and high school, 15 Saturdays,
9:00am-12:00pm, $950, 2-payment plan, starts Nov 14; Since 2000; 365 days;
5,500 sq ft; Lou 1980-83 Seton Hall, 1982 Cape Cod .321, 1983 Orioles draft.

### 1.2 Camps and clinics - `B/camps-and-clinics.html`

Check:
- The four cards and the filters (Baseball, Softball, Ages 6-12, Ages 10-18,
  Weekends, Weeknights).
- **The Spring Little League card does not match the data** (see section 2,
  row M1). This is the most important fact question on this page.
- The Infield card says "Baseball" only. The data and the program page say
  baseball and softball.
- Winter Little League ($350, 9 Sundays) and Winter Hit Night are in the data
  but not on the site. Are they on sale at launch?
- "More than thirty teams train here each winter": confirm the count.

Facts shown: Little League Fall, ages 6 to 12, Sundays, 2:30 to 4:00pm, 8
sessions, Oct 25 to Dec 13, $320. Infield, grades 4 to 8 and high school,
Saturdays, 9:00am and 10:30am, 15 sessions, Nov 14 to Mar 6, $950, two
payments. Hit Night, ages 10 to 18, Mondays, softball 7pm, baseball 8pm,
weekly, September to December, $30 a session, packages from $75. Spring
Little League, ages 6 to 12, Sundays, time "To confirm", 8 sessions, Spring
2027, $320. Team blocks of six to ten weeks.

### 1.3 Program page (Infield Camp only today) - `B/program.html`

Check:
- The Superdome split. The page says 11 at Pollitt Drive and 4 at the
  Superdome, including Feb 6, "in February and March". The data says 12 and 3
  (Feb 13, 20, 27 only). Held since round 07, waiting on Michael's Feb 6 answer.
- "Six places left in grades 4-8" and "High school: Full, waitlist open".
  Neither comes from the data. Are they true today?
- "Refund up to 14 days before": a placeholder. Michael sets the window.
- "Have a town or league code?" goes nowhere (codes are not built).
- The flyer PDF link.
- Both venue cards show the same Fair Lawn map image, including the Superdome
  card.

Facts shown: Winter 2026-27; grades 4-8 and high school; 15 Saturdays,
9:00am-12:00pm; 14 Nov 2026 to 6 Mar 2027; grades 4-8 Saturdays 9:00-10:30am;
high school 10:30am-12:00pm; Superdome 8:00-10:00am both groups combined; the
15 dates; $950, about $63 a Saturday; two payments $475 now, $475 on 1 Jan
2027; Lou: 1980-83 Seton Hall, 1983 19th round Orioles, 2008-13 Don Bosco
Prep, 2021- Old Tappan; both venue addresses.

### 1.4 Lessons - `B/lessons.html`

Check:
- **Every price on this page comes from page copy, not the data file.**
  Michael confirms each one in section 2.
- The package flag on the page: 5 hitting lessons at $430 is $86 each and 10
  at $820 is $82 each, both above a single 30-minute lesson at $75. Are the
  packages 45-minute lessons? If so the page should say so.
- **The coach list does not match the Instructors page.** Lessons names Diana
  Schraer and Sam Keating (softball pitching), who have no bio on Instructors.
  Instructors has Gianna Sarlo, who is not in the Lessons list.
- "Seven days a week, year round": true?
- "8 to 15 sessions, from $320" on the "Just starting out" card. If the March
  Little League camp (4 sessions, $165) goes on sale, this line is wrong.

Facts shown: see section 2, rows L1 to L17.

### 1.5 Facility and rentals - `B/facility-and-rentals.html`

Check:
- Cage prices, $35 and $60. Full facility and HitTrax both "On request": is
  that what Michael wants public?
- "Typical block 90 to 120 mins", "5,500 square feet", "365 days a year".
- "Pay at the desk" for rentals.

Facts shown: cage 30 minutes $35, 60 minutes $60; full facility rate on
request, typical block 90 to 120 minutes; HitTrax on request; lessons from $75.

### 1.6 Instructors - `B/instructors.html`

Check:
- **The roster.** The page shows 7: Lou DiChiaro, Fran Fitzgerald, Gianna
  Sarlo, Christopher DiChiaro, Mike Warden, Scott Fischer, Eric Pfisterer.
  The briefing expected eight. Diana Schraer and Sam Keating teach on the
  Lessons page but have no bio. Is the roster complete and current?
- Gianna Sarlo has no photo (placeholder). The staff group photo is a
  placeholder.
- "3 MLB draft picks": counted from the bios as Lou (Orioles 1983), Fran
  (Orioles 1982) and one more instructor (Reds, 15th round, 2008). Correct?
- Each bio word for word, especially dates, teams and honors.

Facts shown: since 2000; every bio year and statistic (Lou 112 walks, 86
steals, .321; Fran .384, .402, Hall of Fame 1998 and 2012; Christopher since
2016, IHA 2021 to present; Mike Warden 1996 to 1999, Caldwell 2001 to 2002;
Scott Fischer 2005 and 2006, William Paterson 2007 to 2008).

### 1.7 About - `B/about.html`

Check: "15+ years of the academy", "2,000+ athletes trained", "5,500 square
feet", Ed Blankmeyer "has known Lou for 30 years". The 2,000+ figure has no
source in the repo.

### 1.8 Lou's journey - `B/lous-journey.html`

Check: the timeline, word for word. The video slot is a placeholder ("Asset
needed. 16:9, captions required"). Does a video exist?

### 1.9 Team camps - `B/team-camps.html`

Check: "30+ teams each winter", "6-10 week blocks", "four cages", "7 days a
week"; the two on-page questions (invoiced blocks open to anyone, minimum
roster or deposit); permission to list the five named programs (IHA softball,
Fair Lawn HS softball, Old Tappan HS, Ridgewood 12U to 14U, Fair Lawn Little
League).

### 1.10 Contact - `B/contact.html`

Check: phone (201) 773-6858, info@dichiarobaseball.com, the address, "We reply
the same day during opening hours" (opening hours are still open with
Michael), the FAQ answer "Six to eighteen".

### 1.11 Register - `B/register.html?program=hit-night-fall-2026`

Walk it in section 4. Check the waiver text, the photo consent wording, the
three payment options and the check payee and mailing address.

### 1.12 Legal pages

`B/waiver-and-policies.html`, `B/privacy-policy.html`,
`B/terms-and-conditions.html`. Michael or his counsel signs off on the waiver
text and the refund window.

---

## 2. Every price, date, time and age

Source key: **DATA** = `data/programs.json`. **PAGE ONLY** = the figure exists
only in page copy, with no data source in the repo; Michael is the source.
**BIO** = instructor bio copy (Daniel's bio document, not in the repo).

Rows marked **MISMATCH** disagree with the data. Rows marked **CHECK** have no
source or are placeholders.

### 2a. Programs (source: DATA)

| # | Page | Page shows | `programs.json` says | Status | Michael: correct / wrong |
|---|---|---|---|---|---|
| P1 | All pages, announcement bar | Little League starts Sunday, Oct 25 | `little-league-fall-2026` first date 2026-10-25, Sunday | Match | |
| P2 | Home, Camps | Little League ages 6-12 / 6 to 12 | ages "6 to 12" | Match | |
| P3 | Home, Camps | 8 Sundays, 2:30-4:00pm | 8 dates, Sunday, 2:30pm - 4:00pm | Match | |
| P4 | Camps | Oct 25 to Dec 13 | 2026-10-25 to 2026-12-13 | Match | |
| P5 | Home, Camps | $320 full camp | option `full` $320 | Match | |
| P6 | Home, Camps | Hit Night ages 10-18 | ages "10 to 18" | Match | |
| P7 | Home, Camps | Softball 7-8pm, baseball 8-9pm | Fall: softball 7:00pm - 8:00pm, baseball 8:00pm - 9:00pm | Match | |
| P8 | Camps | Mondays, September to December | Fall dates 2026-09-14 to 2026-12-28, Monday | Match | |
| P9 | Home, Camps | $30 a session | `drop-in` $30 | Match | |
| P10 | Home, Camps | Packages from $75 | `sept` package $75 (3 sessions). October $100, November $125, December $100 | **CHECK**: the $75 package is September, already past on 7 October. Remaining packages start at $100. Is September still on sale? | |
| P11 | (data note) | Site follows the schedule: November $125, December $100 | Flyer prints November $25 and December $125, flagged as a flyer error | **CHECK**: confirm $125 and $100 | |
| P12 | Home, Camps, Program | Infield grades 4-8 and high school | ages "Grades 4 to 8 and high school" | Match | |
| P13 | Camps | Infield: "Baseball" | sport: baseball, softball | **MISMATCH** (program page says Baseball & Softball) | |
| P14 | Home, Program | 15 Saturdays, 9:00am-12:00pm | 15 dates, Saturday, groups 9:00am - 10:30am and 10:30am - 12:00pm | Match | |
| P15 | Camps | Time 9:00am and 10:30am | group start times | Match | |
| P16 | Camps, Program | Nov 14 to Mar 6 / 14 Nov 2026 to 6 Mar 2027 | 2026-11-14 to 2027-03-06 | Match | |
| P17 | Program | Grades 4-8: Saturdays 9:00 - 10:30am | `grades-4-8` 9:00am - 10:30am | Match | |
| P18 | Program | High school: 10:30am - 12:00pm | `high-school` 10:30am - 12:00pm | Match | |
| P19 | Program | 15 dates: Nov 14, 21; Dec 5, 12, 19; Jan 2, 9, 16, 23, 30; Feb 6, 13, 20, 27; Mar 6 | same 15 dates | Match | |
| P20 | Program | Superdome 4 of 15, Pollitt Drive 11 of 15, Feb 6 at the Superdome, "February and March" | Combined Superdome dates Feb 13, 20, 27 only (3), so 12 at the facility. `needs_confirming` on Feb 6 | **MISMATCH, held** since round 07, waiting on Michael | |
| P21 | Program | Superdome 8:00-10:00am, both groups | combined time 8:00am - 10:00am | Match | |
| P22 | Home, Camps, Program | $950, 2-payment plan | `full` $950, `two-payments` $950 | Match | |
| P23 | Program | $475 now, then $475 on 1 Jan 2027 | schedule $475 at registration, $475 on 2027-01-01 | Match. How the second $475 is collected is still open | |
| P24 | Program | About $63 a Saturday | $950 / 15 = $63.33 | Match (rounded) | |
| P25 | Camps | **Spring Little League: Sundays, time "To confirm", 8 sessions, Spring 2027, $320** | `little-league-march-2027`: "March 2027", 4 Sundays Mar 7, 14, 21, 28 2027, 2:30pm - 4:00pm, **$165** | **MISMATCH (M1)**. Sessions, price, dates and time all differ. Which is right? | |
| P26 | Lessons | Camps "8 to 15 sessions, from $320" | Shortest open camp in data is 4 sessions, $165 (March) | **MISMATCH** if March is on sale | |
| P27 | not on site | Little League Winter 2027 | 9 Sundays Jan 3 to Feb 28 2027, 2:30pm - 4:00pm, $350, status live | **CHECK**: on sale at launch? | |
| P28 | not on site | Hit Night Winter 2027 | Jan 4 to Jun 28 2027, softball 7:30pm - 8:30pm, baseball 8:30pm - 9:30pm, $30 drop-in, packages $100 / $125. Start times 30 minutes later than fall, flagged | **CHECK**: times and pricing (Hit Night winter pricing is an open question) | |
| P29 | not on site (gated) | IHA Softball, Fair Lawn HS Softball, Old Tappan HS | $330 / 9 Mondays 3:00pm - 4:30pm; $295 / 8 Wednesdays 8:30pm - 10:00pm; $550 / 15 Sundays 4:00pm - 5:30pm, moving to 7:00pm from 3 January | **CHECK**: reached only through a team link. Old Tappan time change must show | |
| P30 | Program | Refund up to 14 days before | not in data | **CHECK**: placeholder, Michael sets it | |
| P31 | Home | Hit Night "4 spots left" | not in data | **CHECK**: unsourced | |
| P32 | Program | "Six places left in grades 4-8", high school "Full, waitlist open" | not in data | **CHECK**: unsourced | |
| P33 | Register | Check payable to DiChiaro Baseball & Softball Academy, mailed to 80 Carnot Avenue, Woodcliff Lake, NJ 07677 | `check_payable_to`, `check_mail_to` (flyers) | Confirm payee (open question) | |

### 2b. Lessons and rentals (source: PAGE ONLY)

None of these are in `data/programs.json`. The Lessons page says "These are
the current prices and they stand", so they were approved, but the approval is
not in the repo. Michael is the source for every row.

| # | Page | What | Page shows | Arithmetic | Michael: correct / wrong |
|---|---|---|---|---|---|
| L1 | Lessons, Facility | Private hitting / fielding / catching, 30 minutes | $75 | | |
| L2 | Lessons | Private, 45 minutes | $90 | | |
| L3 | Lessons | 5-lesson package | $430 ($86 a lesson) | 430 / 5 = 86. Above the $75 single | |
| L4 | Lessons | 10-lesson package | $820 ($82 a lesson) | 820 / 10 = 82. Above the $75 single | |
| L5 | Lessons | Pitching, 30 minutes | $75 | | |
| L6 | Lessons | Pitching 5-pack | $355 ($71 a lesson) | 355 / 5 = 71 | |
| L7 | Lessons | Pitching 10-pack | $680 ($68 a lesson) | 680 / 10 = 68 | |
| L8 | Lessons | Semi-private, length | 60 minutes, 2 to 4 players | | |
| L9 | Lessons | 2 players, per session / per player | $150 / $75 | 150 / 2 = 75 | |
| L10 | Lessons | 2 players, ten pack / per player per lesson | $1,360 / $68 | 1360 / 20 = 68 | |
| L11 | Lessons | 3 players, per session / per player | $170 / $57 | 170 / 3 = 56.67, rounded up | |
| L12 | Lessons | 3 players, ten pack / per player per lesson | $1,560 / $52 | 1560 / 30 = 52 | |
| L13 | Lessons | 4 players, per session / per player | $190 / $48 | 190 / 4 = 47.50, rounded up | |
| L14 | Lessons | 4 players, ten pack / per player per lesson | $1,760 / $44 | 1760 / 40 = 44 | |
| L15 | Lessons | Headline "Cheapest per player" | $44 | matches L14 | |
| L16 | Facility | Cage, 30 minutes | $35 | | |
| L17 | Facility | Cage, 60 minutes | $60 | | |
| L18 | Facility | Full facility | On request, typical block 90 to 120 mins | | |
| L19 | Facility | HitTrax session | On request | | |
| L20 | Lessons | Availability | Seven days a week, year round | | |

### 2c. Ages, stats and bio dates (source: BIO or PAGE ONLY)

| # | Page | Page shows | Source | Michael: correct / wrong |
|---|---|---|---|---|
| A1 | Every page (marquee), Home, Camps, Contact | Ages 6 to 18 | Briefing, program ages span 6 to 18 | |
| A2 | Home, Instructors, About | Since 2000 | BIO | |
| A3 | Home, Facility, About, Team | 5,500 square feet | PAGE ONLY | |
| A4 | Team | Four cages | PAGE ONLY | |
| A5 | Home, Facility | 365 days a year | PAGE ONLY | |
| A6 | Team, Camps | 30+ teams each winter, 6-10 week blocks | PAGE ONLY, count not verified | |
| A7 | About | 15+ years of the academy, 2,000+ athletes trained | PAGE ONLY. 15+ kept by decision on 3 Oct. 2,000+ unverified | |
| A8 | About | Ed Blankmeyer has known Lou for 30 years | PAGE ONLY | |
| A9 | Home, Instructors, Program, Lou's journey | Lou: Seton Hall 1980-83, captain 1983; Cape Cod 1982 .321; drafted 1983 19th round Orioles; Don Bosco 2008-13, 2008 national champions; Old Tappan 2021 onward; 112 walks (10th), 86 steals (7th) | BIO | |
| A10 | Instructors | 3 MLB draft picks | Counted from BIO: Lou 1983, Fran 1982, one 2008 Reds pick | |
| A11 | Instructors | Every other bio year (Fran, Christopher, Mike Warden, Scott Fischer, Eric Pfisterer, Gianna Sarlo) | BIO | |

---

## 3. Every image

All files in `assets/img/`. Placeholders are marked; they are not files.

| Page | Where | File | Keep / replace |
|---|---|---|---|
| Home | Hero (hotfix) | dbsa-07-little-league.jpg | |
| Home | Little League card | dbsa-07-little-league.jpg | |
| Home | Hit Night card | dbsa-03-hitting-cage.jpg | |
| Home | Infield card | dbsa-04-fielding-turf.jpg | |
| Home | HitTrax band | dbsa-08-hittrax-screen.jpg | |
| Home | Lessons card | dbsa-06-group-semi-private.jpg | |
| Home | Rentals card | dbsa-01-facility-in-use.jpg | |
| Home | Why DiChiaro band | dbsa-02-facility-empty.jpg | |
| Home | Lou feature | dbsa-09-lou-coaching.jpg | |
| Home | Social share image | dbsa-01-facility-in-use.jpg | |
| Camps | Hero | dbsa-07-little-league.jpg | |
| Camps | Little League card | dbsa-07-little-league.jpg | |
| Camps | Infield card | dbsa-04-fielding-turf.jpg | |
| Camps | Hit Night card | dbsa-08-hittrax-screen.jpg | |
| Camps | Spring Little League card | dbsa-07-little-league.jpg (third use on the page) | |
| Program | Hero | dbsa-04-fielding-turf.jpg | |
| Program | Who teaches it | dbsa-09-lou-coaching.jpg | |
| Program | Academy venue map | dbsa-18-map-fair-lawn.png | |
| Program | Superdome venue map | dbsa-18-map-fair-lawn.png (**the Fair Lawn map on the Waldwick card**) | |
| Lessons | Hero | dbsa-03-hitting-cage.jpg | |
| Lessons | Private lessons card | dbsa-03-hitting-cage.jpg | |
| Lessons | Pitching card | dbsa-05-pitching-mound.jpg | |
| Lessons | Semi-private card | dbsa-06-group-semi-private.jpg | |
| Facility | Cage rental card | dbsa-03-hitting-cage.jpg | |
| Facility | Full facility card | dbsa-01-facility-in-use.jpg | |
| Facility | HitTrax card | dbsa-08-hittrax-screen.jpg | |
| Facility | Stat band | dbsa-02-facility-empty.jpg | |
| Facility | HitTrax section | dbsa-08-hittrax-screen.jpg | |
| Instructors | Hero | dbsa-01-facility-in-use.jpg | |
| Instructors | Staff group photo | **Placeholder** ("shot list 05, the staff together on the turf") | |
| Instructors | Lou | dbsa-10-portrait-lou-dichiaro.jpg | |
| Instructors | Fran Fitzgerald | dbsa-11-portrait-fran-fitzgerald.jpg | |
| Instructors | Gianna Sarlo | **Placeholder** (dbsa-19, no file) | |
| Instructors | Christopher DiChiaro | dbsa-14-portrait-christopher-dichiaro.jpg | |
| Instructors | Mike Warden | dbsa-13-portrait-mike-warden.jpg | |
| Instructors | Scott Fischer | dbsa-15-portrait-scott-fischer.jpg | |
| Instructors | Eric Pfisterer | dbsa-12-portrait-eric-pfisterer.jpg | |
| About | Story band | dbsa-01-facility-in-use.jpg | |
| About | Facility gallery | dbsa-03-hitting-cage.jpg | |
| About | Facility gallery | dbsa-04-fielding-turf.jpg | |
| About | Facility gallery | dbsa-08-hittrax-screen.jpg | |
| About | Map | dbsa-18-map-fair-lawn.png | |
| Lou's journey | Hero | dbsa-09-lou-coaching.jpg | |
| Lou's journey | Video | **Placeholder** ("Asset needed. 16:9, captions required") | |
| Lou's journey | Social share image | dbsa-10-portrait-lou-dichiaro.jpg | |
| Team camps | Hero | dbsa-01-facility-in-use.jpg | |
| Contact | Map | dbsa-18-map-fair-lawn.png | |

Not used anywhere: `dbsa-17-portrait-sam-keating.jpg` (Sam Keating has no bio).
No portrait exists for Diana Schraer or Gianna Sarlo.

---

## 4. Payment walkthrough

### 4a. On the preview with the mock provider (no money moves)

The preview runs `PAYMENT_PROVIDER=mock`. The mock payment page posts a signed
webhook to the real webhook handler, exactly as Clover would, and the
registration is written to Airtable table `Registrations Review`. Nothing is
charged.

Do it twice: once at 390 wide (Chrome, View > Developer > Developer Tools,
device toolbar, "iPhone 12 Pro", 390 x 844) and once at 1440 wide (a normal
desktop window, or the device toolbar set to Responsive, 1440).

1. Open `B/camps-and-clinics.html`. On the Monday Hit Nights card, click
   **Register for Hit Night**. (Direct link:
   `B/register.html?program=hit-night-fall-2026`.)
2. **Step 1 of 3, Who is playing?** Pick the single session ($30). Player:
   first name `TEST`, any last name, a date of birth, a grade. Parent: first
   and last name, a real email you can read, a mobile number. Optionally add a
   second player to show the total doubling. Click **Continue to the waiver**.
3. **Step 2 of 3, Sign the waiver.** Point out: once per player per season;
   the required waiver box; the separate, optional photo and film consent
   ("Saying no changes nothing"). Type a name to sign. Continue.
4. **Step 3 of 3, Review and pay.** Point out that the total is worked out by
   the server, not the page. Leave **Pay online** selected and continue.
5. **The mock payment page** (`/api/mock-checkout`), a plain page with a
   yellow warning. This is where Clover's hosted page will sit. Click
   **Approve**.
6. Back on the site: **"Confirming your payment"** shows first, then the
   registered screen with a `DBSA-...` reference. Explain: the place is
   confirmed only when the payment provider tells the server directly, never
   because the parent came back to this page.
7. Optional: repeat at the other width with **Decline** on the mock page, to
   show a declined card is never confirmed.
8. Optional: repeat choosing **At the facility** or **By check**. These
   confirm straight away with nothing charged, and show the check payee and
   mailing address.
9. Afterwards, the rows are in Airtable `Registrations Review` with `TEST` in
   the player name. Leave them; do not delete the three earlier proof rows
   (`DBSA-6Y5A4MQ36H`, `DBSA-N9CHAWZKHY`, `DBSA-64J2UYNXAJ`).

Say out loud: no email arrives yet (the "Review copy" note at the foot of
the register page says so), and town or league codes are not available yet.

### 4b. Optional: show Michael the real Clover hosted page

**Daniel decides. Nothing here has been done.**

What changes: one Vercel environment variable, `PAYMENT_PROVIDER`, on the
**Preview** environment of project `dichiarobaseball.com-rgr6`, from `mock` to
`clover`. The code reads it in `api/_lib/providers/index.js`. The Clover
variables (`CLOVER_ENV`, `CLOVER_MERCHANT_ID`, `CLOVER_PRIVATE_TOKEN`,
`CLOVER_WEBHOOK_SECRET`) were set on Preview for the 1 October live test.
`CLOVER_ENV` is `production`: Clover sandbox access was never granted, so
**this is the live Clover account and a real card.**

Steps:
1. Vercel, project `dichiarobaseball.com-rgr6`, Settings, Environment
   Variables, `PAYMENT_PROVIDER`, Preview only: change to `clover`. Do not
   touch Production.
2. **Redeploy.** A changed variable does nothing until a new deployment. On
   Deployments, open the latest `review` deployment, menu, **Redeploy**. Or ask
   Claude Code for an empty commit to `review`. Allow 1 to 2 minutes.
3. Check every Clover variable is set on Preview in the Vercel dashboard.
   While on `clover`, `B/api/mock-checkout` returns "Not found".
4. In Clover's Hosted Checkout settings, click **TEST URL**. It must say
   "verification succeeded". If not, stop; do not take a card.
5. Register as in 4a. "Pay online" now opens Clover's real hosted page.
   **Showing the page costs nothing. Stop there** unless Daniel has decided
   to complete one payment.
6. If a payment is completed, it is **a real charge**. Use the cheapest option
   (Hit Night single session, $30), pay within 15 minutes of starting, then
   **void the order in the Clover dashboard the same day**. A void sends no
   webhook, so the Airtable row stays `confirmed`: mark it by hand as a voided
   test.

Switch back, the same day, before the link goes to anyone else:
1. `PAYMENT_PROVIDER` on Preview back to `mock`.
2. Redeploy as in step 2.
3. Run one mock registration (4a) to see the mock page again.

Risk while it is on `clover`: anyone with the preview link who pays is charged
for real.

---

## 5. Constant Contact

### 5a. What the site would send, and when

**When:** only at the moment a registration becomes `confirmed`. That is
inside the verified Clover webhook handler for card payments, and at the
confirmed write for "at the facility" and "by check". Never at the `pending`
row, never on the return to the site, never on a page load. If Constant
Contact is down, the registration must still confirm; the failure is recorded
on the Airtable row for a retry, not shown to the parent.

**Which fields** (parent, not player):

| Constant Contact field | From the registration |
|---|---|
| `email_address` | Parent email |
| `first_name`, `last_name` | Parent first and last name |
| `phone_numbers` (mobile) | Parent mobile, only if Michael wants it there |
| `list_memberships` | One list per audience, for example "Registered families" and a season list such as "Fall 2026" |
| custom fields | Program name, season, option, registration reference, sport. Player first name only if Michael wants personalisation |

Do not send the player's date of birth, grade, the second contact, the coach
note or anything from the waiver. Constant Contact is a marketing tool and
this is children's data.

Endpoint: `POST /v3/contacts/sign_up_form` creates the contact or updates it
if the email already exists, which suits families who register more than once.
It requires `email_address` and `list_memberships` and takes up to 50 custom
fields. Access is OAuth2 against Michael's Constant Contact account; the keys
become Vercel environment variables like every other credential.

### 5b. Marketing consent, separate from the waiver

- The register flow has a required waiver box and an optional photo consent
  box. There is **no marketing consent box today.**
- Add one optional, unticked box, on its own, for example: "Send me news about
  camps and programs. Unsubscribe any time." It is not part of the waiver and
  not required to register.
- Store the answer, the wording shown and the time on the Airtable row.
- Constant Contact's API terms allow adding contacts only "using
  permission-based standards", and its docs say to use the create endpoints
  only when the contact has given explicit permission. `sign_up_form` marks
  the contact `explicit` (or `pending_confirmation` if double opt-in is on).
  So: **only parents who tick the box go to Constant Contact.** Parents who do
  not tick it are not sent.

### 5c. Can the confirmation email come from Constant Contact?

What the v3 API supports, from Constant Contact's own documentation:

- **No single, immediate, per-person transactional send.** The v3 API sends
  campaigns to lists and segments, plus birthday and anniversary
  autoresponders. There is no endpoint to send one email to one contact on
  demand. Source:
  https://developer.constantcontact.com/api_guide/v3_features.html
- **The nearest workaround is a list-join Welcome email**, and it does not fit:
  - It only fires when the contact is added with `create_source=Contact`, and
    waits for confirmation if double opt-in is on.
  - **A contact receives an autoresponder only once**, even if added to the
    list again. A family's second registration would get no confirmation.
  - It is switched on in the Constant Contact app, not through the API.
  - It depends on marketing consent, so a parent who did not opt in, or who
    later unsubscribes, gets no confirmation of a paid registration.
  - Source:
    https://developer.constantcontact.com/api_guide/contacts_autoresponder.html
- Automated email series can start on a list join, with delays. Constant
  Contact now points to its Automation Path Builder; I could not confirm from
  its help pages whether tag or custom-field triggers exist, or whether custom
  fields (program, dates) personalise automated emails. Sources:
  https://knowledgebase.constantcontact.com/articles/KnowledgeBase/27939-End-Your-Automated-Email-Series?lang=en_US
  and
  https://knowledgebase.constantcontact.com/email-digital-marketing/articles/KnowledgeBase/6916-add-contact-details-using-the-next-generation-editor?lang=en_US
- Contact create and update rules:
  https://developer.constantcontact.com/api_guide/contacts_create.html,
  https://developer.constantcontact.com/api_guide/contacts_create_or_update.html,
  API terms:
  https://v3.developer.constantcontact.com/api_guide/api_terms_and_conditions.html

**Recommendation (unchanged from the one already sent to Michael):** the
confirmation email comes from the site, through a transactional email service,
sent at the confirmed moment, every time, whatever the parent's marketing
choice. Constant Contact receives the contact separately, only with consent,
and only on confirmation, and does the newsletters and season announcements.
Constant Contact cannot send a per-registration confirmation reliably: once per
contact, consent-dependent and configured outside the code.

Decisions for Michael: (1) agree the confirmation comes from the site; (2)
which Constant Contact lists exist, and their names; (3) the consent wording;
(4) who authorises the API connection on his Constant Contact account.

Until the email is built, the success page must stop promising one, or the
email is a launch blocker (see `docs/launch-plan.md`).
