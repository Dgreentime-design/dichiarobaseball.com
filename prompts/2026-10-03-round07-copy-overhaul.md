# Round 07 - Copy overhaul

DiChiaro Baseball & Softball Academy. Written 3 October 2026.
Scope: replace page copy across the marketing pages, the global partials and
the register flow. Copy only. No layout, no new components, no backend.

Source of truth: the approved copy doc "DiChiaro website copy overhaul",
decisions of 3 October. Everything you need from it is in this file.

---

## Step 0 - identity check. Do this first, report it, then continue.

Run and report:

    pwd
    git remote -v
    git branch --show-current
    git status --porcelain
    git fetch origin && git rev-list --left-right --count origin/review...HEAD

Expected: ~/projects/dichiarobaseball.com, remote
Dgreentime-design/dichiarobaseball.com, branch review, clean tree, 0 0.

One carve-out: this prompt file is committed and pushed as part of the
invocation that starts this round, so by the time you run Step 0 it should
already be in origin/review. If the tree is dirty only because this prompt
file is untracked, commit and push it first, then run Step 0 again.

Any other mismatch: stop and report. Do not fix it yourself.

---

## Boundaries, restated in full

1. Work on review only. Push to review. Never push or merge to main.
   No force-push.
2. Edit pages/*.html and partials/, and data files only where a listed
   string lives there. legal.json is off limits. Never hand-edit the
   generated HTML in the repo root. Run node build.mjs to regenerate.
3. Do not touch api/, payment code, Airtable code, or anything in the money
   path. This round is words.
4. Never change a fact: prices, dates, times, ages, session counts, option
   labels, instructor credentials, stats. If new copy below seems to
   contradict a fact in data/programs.json or a bio, the data wins. Stop and
   report the conflict.
5. Keep every review note and prototype note on the page. The amber
   "Needs confirming", "Asset needed", "Prototype" and similar blocks stay
   exactly as they are. They come off at launch prep, not now.
6. Content parity: the same words at 390 and 1440. npm run verify must
   pass. Do not weaken verify.mjs to make it pass.
7. Stay unindexed. Do not set SITE_ORIGIN.
8. Never use an em dash anywhere, including commit messages. Use a hyphen or a
   comma.
9. Delete nothing outside the copy changes listed. If something looks wrong
   and is not listed, report it as a finding.
10. Before changing any string, find where it actually lives (page, partial,
    programs.json, legal.json, a JS file). Edit it at its source so it
    changes once.

### Two notes on rule 4

**Aggregate claims must be checked, not assumed.** Several new lines assert
totals: "Two Hall of Fame inductions and three Major League draft picks",
"three Major League draft picks", "Since 2000", "5,500 sq ft", "more than
thirty teams". Before writing any of them, count them against the instructor
bios and the existing data. If a number does not match what the bios support,
stop and report rather than publishing it.

**One decision overrides the data, deliberately.** B4 decides that cage
rentals are cage only, with no machines. If a data file or an existing string
says machines are included, that is the thing being changed, so report where
it lives and change it on this page. Do not treat it as a rule 4 conflict.
Every other fact still follows rule 4.

---

## How this round runs

Three parts with a checkpoint between each.

- **Part A:** global elements, then the homepage. Build, verify, push, then
  **stop and report**. Daniel reviews the homepage on the preview before
  Part B.
- **Part B1 to B4:** camps, program detail, lessons, facility and rentals.
  **Stop and report** after B4. These four carry the most traffic and the
  most buttons, so they get looked at before the rest.
- **Part B5 to B10:** the remaining pages. Only start when told so.
  Commit per page throughout.

### Running verify without hanging

npm start serves in the foreground. Start it in the background, wait for the
port, run npm run verify, then stop it. Do not run npm start in a way that
blocks the round.

---

## Copy rules, so you can handle cases this file does not list

- Headlines carry the message, eight words or fewer.
- Body under a headline is one sentence, twenty words or fewer, or nothing.
- Buttons are verb plus object and say what happens on click. Never
  "Enquire", "Learn more", "Get started", "Submit" or a bare arrow.
- Sentence case. American spelling and date order: organization, optimize,
  program, honors, sneakers, inquiry, Nov 14, 2026.
- No hype words: elite, ultimate, world class, unmatched, premier, best.
  Coach quotes are the exception and stay as said.
- If a string is not listed below and is not a fact, a review note, or legal
  text, leave it unchanged.

Button vocabulary, used everywhere:

| Action | Label | Goes to |
| --- | --- | --- |
| Browse programs | See camps and clinics | camps-and-clinics.html |
| Sign up for one program | Register for this camp (Hit Night: Register for Hit Night) | register.html?program=<slug> |
| Header and menu button | Open camps (changed 5 Oct, applied in round 08, do not change it in round 07) | camps-and-clinics.html |
| Lesson | Book a lesson | Same target the lesson buttons use today |
| Lesson with a coach | Not used. Instructor cards carry no booking button (amended 5 Oct) | - |
| Rental | Request a rental (or Request a cage / Request the full facility / Request a HitTrax session) | Same target the rental buttons use today |
| Team block | Plan your team's block | team-camps.html form |
| Program page | See dates and details | program.html?p=<slug> for that program |
| Phone | Call (201) 773-6858 | tel:+12017736858 |
| Not yet open | Email me when it opens | Same target as today |
| Flyer | Download the flyer (PDF) | Same file as today |

---

# Part A

## A1. Global elements (partials/)

1. Announcement bar text: Little League camp starts Sunday, Oct 25. Link
   label Register, same target as today.
2. Nav labels: Camps, Lessons, Rentals, Instructors, About.
   Targets unchanged. This also fixes the three-line wrap on the two
   ampersand labels.
3. Header Register button: label Register, link changes to
   camps-and-clinics.html. Today it lands on "We could not find that
   program".
4. Mobile menu: same five labels as the nav, plus Contact, plus
   Register (to camps-and-clinics.html) and Call (201) 773-6858.
5. Marquee items: Hitting, Fielding, Pitching, Catching, HitTrax,
   Ages 6 to 18, Year round, Fair Lawn.
6. Footer sign-off "Done the right way." unchanged.
7. Footer columns:
   - Programs: Little League Training Camp, Infield Camp, Monday Hit Night,
     Team camps (to team-camps.html), All camps and clinics. Remove the
     separate "Team & specialty camps" link, it duplicates Team camps.
   - Lessons and rentals: Private lessons, Semi-private lessons, HitTrax
     sessions, Cage and facility rentals. Remove "Lesson packages", it lands
     on the same page as private lessons.
   - Academy: Instructors, About the academy (was "About Lou"), Lou's
     journey, Contact, Waiver and policies.

## A2. Homepage (pages/index.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | Eyebrow | Baseball and softball · Fair Lawn, NJ |
| Hero | H1 | Get better at the game you love. |
| Hero | Sub | Year-round lessons and camps for ages 6 to 18, taught by coaches who played the game. |
| Hero | Buttons | Primary "See camps and clinics" (camps-and-clinics.html). Secondary "Book a lesson" (lessons.html). Today both go to the camps page |
| Programs | Eyebrow | Open for registration |
| Programs | H2 | Fall camps and clinics, open now. |
| Programs | Link | See all camps and clinics |
| Programs | Cards | Chip, title and Who/When/Price rows unchanged. Skills line: first five items only. Button "Register for this camp" (Hit Night card: "Register for Hit Night"). Add text link "See dates and details" to that card's program page |
| HitTrax | Eyebrow / H2 | Unchanged: HitTrax · Every swing, measured. |
| HitTrax | Body | Players see their progress in numbers, not just hear about it. |
| HitTrax | Fact rows | Exit velocity · How hard it leaves the bat. Launch angle · Line drive or pop-up. Distance · How far it carries. |
| HitTrax | Button | Book a HitTrax session (unchanged) |
| Lessons and rentals | Eyebrow / H2 | Beyond the camps · Lessons and rentals, all year. |
| Lessons and rentals | Lessons card | Label "For players", H3 "Private and semi-private lessons", Body "One on one, or bring a teammate. Same coach every week.", Button "Book a lesson" |
| Lessons and rentals | Rentals card | Label "For teams and coaches", H3 "Cage and facility rentals", Body "One cage or the whole floor, by the hour.", Button "Request a rental" |
| Why DiChiaro | Eyebrow / H2 | Why DiChiaro · Fundamentals first. Every level welcome. |
| Why DiChiaro | Four items | Replace the four headed paragraphs with figure plus label, no body: "Since 2000" / Lou teaching in Bergen County, "6 to 18" / First glove to college roster, "365 days" / Indoors, every season, "5,500 sq ft" / Cages, turf, mound and HitTrax. Reuse the existing stat-strip markup from About or Instructors. Do not invent a new component. If no existing component fits, keep the current four-item layout with figure as the H3 and label as the body, and report it |
| Meet Lou | Eyebrow | Founder and head instructor |
| Meet Lou | H2 | Lou DiChiaro (unchanged) |
| Meet Lou | Timeline | Four rows only: 1980-83 Seton Hall, four-year starter, 1983 captain. 1982 Cape Cod League, batted .321. 1983 Drafted by the Baltimore Orioles. 2000 Teaching ever since. Remove the Don Bosco and Old Tappan rows here, they stay on Lou's journey |
| Meet Lou | Stray line | Remove the "Mike Sheppard Jr. - Seton Hall Prep" line that sits above the timeline |
| Meet Lou | Link | Label "Read Lou's story". Remove the description line under it that mentions a video slot |
| Testimonials | Eyebrow / H2 | What coaches and parents say · Coaches send their own players here. |
| Testimonials | Quotes | One line each: Mike Sheppard Jr., Seton Hall Prep: "Lou is the go-to baseball instructor in Bergen County." Ed Blankmeyer, St. John's University: "If you want real instruction done the right way, Lou is your guy." Jack and Barbara Gross, Parents: "He taught them the game, and helped shape them into young men." Remove the extra Sheppard line |
| Closing band | H2 | Find the right program for your player. |
| Closing band | Body | Register online in about three minutes. One waiver covers the whole season. |
| Closing band | Buttons | See camps and clinics · Call (201) 773-6858 |

## A3. Verify Part A

1. node build.mjs, start the server in the background, npm run verify. All
   four checks pass.
2. Push to review. Wait for the Vercel preview to build the pushed commit,
   then confirm the preview serves it, not an older build.
3. On the preview at 390 and 1440, walk the homepage and the header and
   footer on two other pages. Check: no nav label wraps, both hero buttons go
   to different pages, every Register button lands on a real page, no
   "could not find that program".
4. Search pages and partials for an em dash character. Report every hit,
   including ones that were already there.

## A4. Report, then stop

1. Step 0 output.
2. Files changed, one line each.
3. Any string you could not find, or found in more than one place.
4. Any conflict between the new copy and a fact in the data, including the
   aggregate claims named above.
5. Verify output and the preview URL.
6. Screenshots of the homepage hero and the Why DiChiaro band at 390 and 1440.

**Stop here.** Part B starts only when told "continue to Part B".

---

# Part B

One commit per page, in this order. Run npm run verify after each page.

## B1. Camps & Clinics (pages/camps-and-clinics.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | Eyebrow | Open now and coming up |
| Hero | H1 | Camps and clinics for ages 6 to 18. |
| Hero | Sub | Small groups, indoors, coached by people who played. |
| Filters | All | Unchanged |
| Little League card | Description | Eight Sundays of fundamentals: throwing, fielding, hitting and base running. |
| Infield card | Description | Footwork, hands and reading the ball off the bat, all winter. |
| Hit Night card | Description | An hour of high-rep hitting with HitTrax. Drop in or buy the month. |
| Spring Little League card | Description | The fall camp, run again in spring. We email the list first. |
| Spring Little League card | Button | Email me when it opens |
| Open cards | Buttons | "Register for this camp" (Hit Night: "Register for Hit Night"), "See dates and details". Each details link must open its own program. Today every one opens the Infield Camp. If the program page cannot render the other programs yet, keep the link and report it |
| Empty filter state | Text | No programs match those filters. |
| Empty filter state | Actions | "Clear filters" (resets the filter), "Tell us what you need" (contact.html) |
| Teams band | Eyebrow / H2 | Teams and organizations · Bring the whole team in. |
| Teams band | Body | More than thirty teams train here each winter, in blocks of six to ten weeks. |
| Teams band | Button | Plan your team's block |
| Testimonials | All | Same eyebrow, H2 and three quotes as the homepage |
| Closing band | H2 | Not sure which program fits? |
| Closing band | Body | Tell us your player's age and position, and we'll point you to the right one. |
| Closing band | Buttons | Call (201) 773-6858 · Send us a message (contact.html) |

Finding to report, not fix: the Hit Night card says "packages from $75",
which is wrong for winter. Report where that string lives.

## B2. Program detail template (pages/program.html, shown with the Infield Camp)

| Block | Element | New copy |
| --- | --- | --- |
| Hero | Sub (Infield) | Fifteen Saturdays of infield, taught by Lou himself. |
| Hero | Buttons | "Register for this camp · $950" (price from data), "Download the flyer (PDF)" |
| Hero | Status chip | Starts Nov 14 (was "Opens 14 Nov") |
| Groups | Eyebrow / H2 | Two groups · Split by age, same coach. |
| Groups | Body | Both groups join up for four sessions at the Superdome in February. |
| Groups | Grades 4-8 | Body "Fundamentals first, then position work." Button "Register for grades 4-8" |
| Groups | High school | Body "Game speed: double plays, relays and reads." Replace "Join the waitlist" with the label "Full · Call about openings", linked to tel:+12017736858. Waitlists were dropped |
| What is taught | H2 | Nine skills, drilled until they're automatic. |
| What is taught | Item 09 body | The drill Lou is known for. |
| Schedule | Body | Eleven at the academy, four at the Superdome. |
| Schedule | Button | Add all dates to your calendar |
| Pricing | Body | About $63 a Saturday, everything included. |
| Pricing | Pay in full | Remove the body line. Button "Register and pay in full" |
| Pricing | Two payments | Body "Same total, no interest, no fee." Remove "Offered on every camp over $500". Button "Register and pay in two" |
| Instructor | Body | Infield is Lou's position. He has taught it here since 2000. |
| Instructor | Link | Meet all the instructors |
| Venues | Body | Remove the paragraph. Venue cards unchanged. Button "Get directions" |
| FAQ | H2 | Questions parents ask. |
| FAQ | Miss a Saturday | Sessions can't be carried over, but tell us ahead and Lou will catch the player up. |
| FAQ | Gear | Bring a glove. We supply bats, helmets and the rest. Turf shoes or sneakers, no metal cleats. |
| FAQ | Baseball and softball | Yes. The infield work is the same and the groups train side by side. |
| FAQ | Watching | Yes, there's seating along the netting. We ask that the coaching stays with Lou. |
| FAQ | If it's full | Call us and we'll tell you if a place opens. |
| Register band | H2 | Unchanged (driven by the places-left rule) |
| Register band | Body | Registration takes about three minutes. |
| Register band | Button | Register for grades 4-8 |

The review notes on this page ("How this block behaves", the refund note)
stay.

## B3. Lessons (pages/lessons.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | Eyebrow | Private and semi-private |
| Hero | H1 | Work on exactly what your player needs. |
| Hero | Sub | Seven days a week, year round. You pick the coach, the skill and the length. |
| Rates | Body | No membership, no joining fee. Pay per lesson or save with a package. |
| Hitting, fielding, catching card | Body | Remove. Button "Book a private lesson" |
| Pitching card | Body | Remove. Button "Book a pitching lesson" |
| Semi-private | Body | Two to four players, one coach, live reps. The bigger the group, the less each pays. |
| Which one | Eyebrow / H2 | Not sure which · Pick by what your player needs. |
| Which one | Card 1 | H3 "One thing to fix", Body "A swing that drifts, a throw that sails.", Meta unchanged, Button "Book a private lesson" |
| Which one | Card 2 | H3 "Plays better against others", Body "Live reps with a teammate sharpen both.", Meta unchanged, Button "Book semi-private" |
| Which one | Card 3 | H3 "Just starting out", Body "A camp covers the whole game across a season.", Meta unchanged, Button "See camps and clinics" |
| Choose who teaches | Body | Name a coach when you book, or tell us the age and position and we'll suggest one. |
| Choose who teaches | Link | Meet the instructors |
| Before you book | Waiver | H3 "One waiver a season", Signed online when you book. |
| Before you book | Packages | H3 "Packages are final", They last the season, and any instructor can teach them. |
| Before you book | Gear | H3 "Bring what you have", No gear? Use ours, at no extra cost. |
| Before you book | Parents | H3 "Parents can watch", Grab a seat, and save your notes for the drive home. |
| Closing band | Body | Thirty minutes tells you if it's the right fit. |
| Closing band | Buttons | Book a lesson · Call (201) 773-6858 |

The "One flag on the approved pricing" note stays.

## B4. Facility & Rentals (pages/facility-and-rentals.html)

Decision: cage rentals are cage only. No machines. No copy on this page or
any other may offer machines or HitTrax as a rental add-on.

| Band | Element | New copy |
| --- | --- | --- |
| Meta description | All | Rent a cage or the full 5,500 sq ft indoor facility in Fair Lawn, New Jersey. Cages from $35, team workouts by request, HitTrax sessions booked on their own. |
| Hero | Sub | Cages, turf and HitTrax on Pollitt Drive. January works the same as June. |
| Cage card | Body | Extra reps on your own or with a teammate. Call ahead for a specific slot. |
| Cage card | Machine row | Label "Includes", value "Cage only" |
| Cage card | Button | Request a cage |
| Full facility card | Body | The whole floor for team workouts, tryout prep and events. |
| Full facility card | Button | Request the full facility |
| HitTrax card | Body | Exit velocity, launch angle and spray charts on every swing, plus simulated games. |
| HitTrax card | Button | Request a HitTrax session |
| HitTrax band | Body | It also runs simulated games, which is the part the kids come back for. |
| HitTrax band | Link | Request a HitTrax session |
| How booking works | H2 | Booking takes one call or one message. |
| Steps | 01 | "Tell us what you need", A cage, the full floor or HitTrax. |
| Steps | 02 | "We confirm a time", We check around camps and lessons and reply with what's open. |
| Steps | 03 | "Pay and play", Pay at the desk. Bring your gear or use ours. |
| Coaching cross-link | H2 / body | Want a coach in the cage? · Lessons start at $75 for thirty minutes. |
| Coaching cross-link | Button | See lesson prices |
| Closing band | Body | Call and we'll tell you what's free. Same-day slots open up often. |
| Closing band | Buttons | Primary "Call (201) 773-6858", secondary "Request a rental" |

Also search every page and partial for "added to any rental", "add it to a
cage rental", "HitTrax can be added" and "HitTrax on request", and report
each hit. Fix the ones on this page and the homepage. Report the rest.

## B4 checkpoint

After B4: build, verify, push, and **stop and report**. Daniel reviews these
four pages on the preview before B5 to B10 start. Report:

1. Commits, one line per page.
2. Every string you could not find, found twice, or left alone, and why.
3. Every fact conflict.
4. The HitTrax add-on search results.
5. Whether the "See dates and details" links open their own programs yet.
6. Verify output and the preview URL.

Continue only when told "continue to B5".

## B5. Instructors (pages/instructors.html)

Amended 5 October: no instructor card carries a booking button. Lou's "See Lou's camps" link stays, it is not a booking button. The booking band at the foot of the page stays as specified below.

| Band | Element | New copy |
| --- | --- | --- |
| Hero | H1 | Coaches who played the game first. |
| Hero | Sub | Two Hall of Fame inductions and three Major League draft picks, all teaching on the floor. |
| Hero | Stat strip | Three items: "2" Hall of Fame inductions, "3" MLB draft picks, "Since 2000" Teaching in Fair Lawn. Remove "7 instructors on staff" |
| Filters | First pill | All instructors |
| Cards | Bios | Word for word, except "Honours" becomes "Honors" |
| Cards | Bio toggle | Read full bio |
| Cards | Booking button | Remove the booking button from every instructor card (amended 5 Oct). Report each one removed |
| Lou's card | Second link | See Lou's camps |
| Gianna Sarlo card | Role | Instructor |
| Gianna Sarlo card | Disciplines line | Remove "Disciplines to confirm" |
| Gianna Sarlo card | Summary | One line: Bio coming soon. Replaces the three lines about a missing bio sheet |
| Gianna Sarlo card | Full bio | Heading and two lines replaced by: Bio coming soon. |
| Gianna Sarlo card | Button | Remove, same as every other card (amended 5 Oct) |
| Empty filter state | Text / link | No instructor listed for that yet. · Ask us who fits |
| Booking band | Body | Remove. H2, buttons and small print unchanged except "See camps and clinics" |

The roster review note stays.

## B6. About (pages/about.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | H1 | Every player leaves better than they came in. |
| Hero | Sub | That has been the goal since Lou started teaching in 2000. Enjoying the work is the other half. |
| Story | Body | Replace the four paragraphs with two: "Lou played four years at Seton Hall, hit .321 in the Cape Cod League and was drafted by the Orioles in 1983. He started teaching in 2000 and hasn't stopped." / "The academy is 5,500 square feet in Fair Lawn, staffed by coaches who played in high school, college and the pros. Groups stay small, so every player gets the reps and the coach sees every swing." |
| Story | Link | Read Lou's story |
| Numbers strip | Items | Keep 15+, 2,000+, 5,500 and 365 as they are. Remove "7 instructors on staff" |
| How we teach | H2 | Four things we don't compromise on. |
| How we teach | 01 body | More reps per player, and a coach who sees every one. |
| How we teach | 02 body | College and pro experience, including three Major League draft picks. |
| How we teach | 03 body | HitTrax turns progress into a number a player can see. |
| How we teach | 04 | H3 "Fun is part of it", Players who enjoy the work keep showing up, and keep getting better. |
| Facility | Body | On Pollitt Drive in Fair Lawn, ten minutes from Routes 208 and 4. List unchanged |
| Staff teaser | H2 / body | Meet the coaches. · Three Major League draft picks and two Hall of Fame inductions. |
| Staff teaser | Link | Meet the instructors |
| Closing band | Body | Remove. Buttons unchanged |

The roster review note and the hours placeholder stay.

## B7. Team camps (pages/team-camps.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | Sub | High school, travel and town teams, baseball and softball, November to March. |
| Hero | Buttons | Primary "Plan your team's block" (scrolls to the form), "Call (201) 773-6858" |
| How it works | Body | Six to ten weeks, built around your calendar. |
| Steps | 01 | Team, age group, roster size and the weeks you want. |
| Steps | 02 | Every date written out before anything is confirmed. |
| Steps | 03 | Parents register, sign the waiver and pay in about three minutes. |
| Steps | 04 | H3 "You see who's signed up", A live roster, so the chasing is a list, not a guess. |
| Billing | H2 | Two ways to pay. Remove the body line |
| Billing | Option one | Each family registers and pays for their own player. |
| Billing | Option two | We bill you once. Parents still register for the waiver. |
| Form | Body | Winter fills from October. A rough start date is enough. |
| Form | Button | Send team details |
| Form | Small print | We reply within one business day. |
| Just call | Body | Most blocks get set up in one phone call. |
| Closing band | H2 / body | Just one player? · Our camps and clinics are open to anyone. |

Review notes stay, including the programs-list note.

## B8. Lou's journey (pages/lous-journey.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | H1 | From Seton Hall to the Orioles to Fair Lawn. |
| Hero | Sub | Everything Lou learned as a player, he has spent every year since passing on. |
| Video | Body | Remove the public body line. The "Asset needed" note stays |
| Why the academy exists | Body | One paragraph replacing two: "A team practice has twenty players and forty-five minutes. Lou opened the academy in 2000 to teach the way he was taught in the cage: one player at a time, with enough reps to change something." |
| Closing band | H2 | Meet the rest of the staff. Remove the body line |

"The part only Lou can write" and "Coverage" stay as they are.

## B9. Contact (pages/contact.html)

| Band | Element | New copy |
| --- | --- | --- |
| Hero | H1 | Ask us anything about camps, lessons or rentals. |
| Hero | Sub | We reply the same day during opening hours. |
| Form | Label | What's this about? |
| Form | Privacy line | We only use your details to answer you. |
| Details rail | Phone note | Quickest for same-day rentals |
| Register nudge | Body | Sign up online. No need to message first. |
| Register nudge | Button | See camps and clinics |
| FAQ | H2 | Quick answers. |
| FAQ | Sign up | Online. Pick the program, add your player, sign the waiver and pay. About three minutes. |
| FAQ | Waiver | Yes, once per player per season. It's part of sign-up. |
| FAQ | Ages | Six to eighteen. Not sure which program? Tell us the age and position. |
| FAQ | Specific coach | Yes. Name them in your message and we'll check their schedule. |

The prototype note and the hours placeholder stay.

## B10. Register flow (pages/register.html and its JS)

| Screen | Element | New copy |
| --- | --- | --- |
| Step 1 | Body | Add each player and how to reach you. Siblings register together and pay once. |
| Step 1 | Parent helper | We'll contact you about the camp, and you'll sign the waiver next. |
| Step 1 | Second contact helper | Someone we can call if we can't reach you. |
| Step 2 | Body | Once per player, per season. Every booking after this skips this step. |
| Step 2 | Photo consent helper | Optional. Used on our website and Instagram. Saying no changes nothing. |
| Step 2 | Fake signed row | Remove the "Signed 4 August 2026" row. It is demo data |
| Step 3 | Body | Check the details, then pay on Clover's secure page. |
| Step 3 | At the facility | Pay at the front desk. We hold the place for seven days. |
| Step 3 | By check | Payable to DiChiaro Baseball & Softball Academy. We hold the place until it clears. Do not change whether this option is shown |
| Step 3 | Clover step 03 | Clover sends you back here to confirm. |
| Step 3 | Reassurance line | Your registration is saved before you leave this page. |
| Confirming | Body | This usually takes a few seconds. (H2 "Confirming your payment." unchanged) |
| Confirmed | Eyebrow | You're in |
| Confirmed | Timeline labels | Today · Week before · Day one |
| Confirmed | Today line | Keep this page. Your reference number is your proof of registration. |
| Pay at facility | Footnote | Rather pay online? Call (201) 773-6858 and we'll send a payment link. |

Do not change the town and league code copy, the waiver legal text, or any
status logic. A new "still confirming after a minute" state is designed in
the copy doc but is a logic change, so it is out of scope here.

Note: the confirmed screen currently promises a confirmation email that is not
built. That copy is out of scope this round and is tracked separately. Leave it
and report it.

## B verify

After each page: node build.mjs, npm run verify, commit, push. After the
last page, walk all ten pages on the preview at 390 and 1440 and confirm no
review note was removed.

## B report

1. Commits, one line per page.
2. Every string you could not find, found twice, or left alone, and why.
3. Every fact conflict.
4. Final verify output and the preview URL.

---

## Out of scope, report but do not fix

- Removing review notes and prototype notes (launch prep).
- The "still confirming" third state on the success page.
- The confirmation email the success page used to promise.
- Lou's own words, the Lou pull quote slot and any new layout for Lou.
- Town and league code copy and its failure message.
- Hit Night winter pricing, lesson package pricing, roster, hours, check
  payee. All waiting on Michael.
- Clean URLs, netlify.toml, verify.mjs gaps.

End of prompt.
