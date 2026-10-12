# Round 16 - Visual review pack, image map, core flow check

DiChiaro Baseball & Softball Academy. Written 9 October 2026. Go-live
target: Tuesday 13 October. Today's goal: the build as close to launch as we
can get, and a URL Daniel can send Michael to test end to end. This round
gets Daniel to a visual review fast. Images and copy edits come next round,
from his answers. One run, one report. Follow CLAUDE.md.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if it is committed but not
pushed. Expect a clean tree and 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`. Daniel owns it.
3. No changes to `api/`, prices, dates, options or `data/programs.json`
   this round. This round reads and measures; it changes only docs and the
   one fix in item 4.
4. Screenshots and the contact sheet go in `_proof/` (gitignored), never in
   the deployed root.
5. Never use an em dash.

## Decisions from Daniel, 9 October (do not re-ask)

- All site alerts go to info@dichiarobaseball.com. Daniel and Claude handle
  this in Airtable; nothing to build.
- Daniel and Michael defer technical decisions to us. Make them, state them
  in the report, keep moving.

## 1. Contact sheet, first (target 15 minutes)

Full-page screenshots of every public page on the review preview, at 1440
and 390:

- Home, Camps, the 9 program pages, Lessons, Facility and rentals, Team
  camps, About, Lou's journey, Contact, Instructors (as it is), Register at
  each step, the confirmation screen, and the legal pages.

Build one local HTML contact sheet, `_proof/round16/contact-sheet.html`:
desktop and mobile side by side per page, page name and preview URL above
each pair, in site order. Open it for Daniel when done.

## 2. Image map

Write `docs/review/image-map.md`, one table, one row per image slot on the
site (not per file):

| # | Page | Section | Current file | Rendered size at 1440 / 390 (px) | Aspect ratio | Crop or focal note | Alt text |

Number the slots so Daniel can say "slot 7: use photo X". Then:

- The export size Daniel should supply per slot: the largest rendered width
  times 2, with the aspect ratio. Group slots that share a size.
- Each file's current weight in KB. Flag anything over 300 KB.
- Slots using the same photo twice on one page, or a portrait where the
  layout wants landscape.

## 3. Core flows, end to end on the preview, at 390 in a fresh private browser

Time each one and note any friction, a step that confuses, a label that
misleads, a tap target that misses:

1. Home, then a camp, then Register, then pay online (mock), then the
   confirmation.
2. The same with pay at the facility, and with check.
3. Contact message, and a Team camps enquiry.
4. "Request a HitTrax session" from Home through to the sent message.
5. Add to calendar from a program page (Apple and Google).

Read each resulting row back from the Review tables. Then delete only the
rows this round created.

## 4. Fix only what blocks a client test

If any flow in item 3 breaks or reads wrong to a parent, fix it, commit it on
its own, and say why. Anything bigger than a small fix goes in the report as
a recommendation with your call on it.

Also add to `docs/launch-plan.md`, cutover section: "The academy's email is
hosted at mail.dichiarobaseball.com (MX record). When the domain points at
Vercel, change only the website records (A, CNAME for www). Do not remove or
change the MX record or the mail host's A record, or the academy's email
stops."

## 5. Performance snapshot

Lighthouse, mobile, on the preview for Home, Camps, one program page and
Register: Performance, Accessibility, Best practices, SEO, plus LCP and CLS.
Name the three biggest wins, with your recommendation. Do not change them
this round; images are likely the biggest and they change next round.

## 6. Client test guide

Write `docs/review/client-test-guide.md`, written for Michael, plain
words, one screen long:

- The preview URL and what it is (a private test copy, no real charges).
- Five things to try, in order, matching item 3.
- What a test card or test payment looks like here, and that nothing is
  charged.
- How to send feedback: page, what he expected, what happened, a
  screenshot if he can.

## Report, then stop

1. The preview link, and the commit it serves.
2. Commits, one line each.
3. The contact sheet path (and that it is open).
4. The image map summary: slot count, export sizes, heavy files, problems.
5. Flow results: time per flow, friction found, fixes made.
6. Lighthouse numbers and your top three wins.
7. Decisions you made for us.

Update section 8 of the briefing and stop. Next round swaps images and copy
from Daniel's answers.

End of prompt.
