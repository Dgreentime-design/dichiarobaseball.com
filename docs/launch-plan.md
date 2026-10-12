# Launch plan

DiChiaro Baseball & Softball Academy. Written 7 October 2026, before the 2pm
client review. Proposed go-live: **Tuesday 13 October 2026**, with Wednesday
14 October as the buffer day.

Sources: `docs/build-thread-briefing.md` (sections 8 and 9),
`docs/clover-hosted-checkout-playbook.md` ("Before go-live"), `prompts/`
rounds 01 to 10, `data/programs.json`, `pages/`, and the live Framer sitemap.

---

## 1. Status in one screen

**Built and proven**

- Ten marketing pages plus register, legal pages and stubs, unindexed, on
  `review` (briefing section 4).
- Money path proven end to end against Clover production: three real $30
  payments on 30 Sep to 1 Oct, all voided. Adversarial checks pass: bad
  signature, redirect without payment, tampered amount, duplicate delivery
  (briefing section 8).
- Webhooks matched by value; unmatched and unconfirmable webhooks leave an
  Airtable row (round 05).
- Copy overhaul done (round 07). Responsive system, sticky header, one hero,
  one stat strip done (round 08).

**On the preview now**

- `https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app`
- `PAYMENT_PROVIDER=mock`, Airtable table `Registrations Review` (briefing
  section 6). Three TEST registrations, one per payment path. Do not delete.
- Round 09 item 0, the mobile hero hotfix, is live on the preview.

**Not built yet**

- Program pages (round 09 items 1 to 4). `program.html` is still a fixed
  Infield Camp page that ignores `?p=`, so every "details" link opens Infield.
  Did not make the 1:15pm cutoff; outstanding.
- Confirmation email (the success page copy still promises one).
- Third state for a registration that cannot be confirmed.
- Any alert for webhook signature failures.
- Analytics: no tag of any kind in `pages/` or `partials/`.
- Redirects from the old Framer URLs: `vercel.json` has headers only.
- Production config: domain not pointed at Vercel, `SITE_ORIGIN` unset,
  `main` frozen behind `review`.

---

## 2. Launch blockers

Effort: S = under an hour, M = half a day, L = a day.

| # | Item | Owner | Effort | Blocks launch? |
|---|---|---|---|---|
| 1 | **Program pages** (round 09 items 1 to 4): six static pages from `data/programs.json`, details links, `program.html?p=` redirects, Hit Night "from $100", Infield sport label, 360px connector | Claude Code | L | **Blocks.** Today every details link opens the Infield page |
| 2 | **`/api/config-check` removed or locked.** Publicly readable, returns registration status, amount and order ID (briefing section 9) | Claude Code | S | **Blocks** |
| 3 | **Webhook 401 alert.** Repeated signature failures only reach the Vercel log. Write a visible Airtable row or email on a 401 (playbook, "Before go-live") | Claude Code | M | **Blocks.** This is the guard against silent failure two |
| 4 | **Third state on the success page.** A registration that never confirms leaves the parent on "Confirming your payment" forever (briefing section 9) | Claude Code | M | **Blocks** |
| 5 | **Confirmation email or copy change.** `pages/register.html` says confirmation and reminder emails are sent; none are. Launch option: change the copy. Sending real email needs SPF and DKIM on the domain (playbook) | Claude Code (copy), Michael (decision) | S for copy, L for email | **Copy change blocks.** The email itself can follow |
| 6 | **Live-mode switch.** `PAYMENT_PROVIDER=clover` on Production, Clover and Airtable variables on Production, table `Registrations`, Clover webhook URL pointed at the production domain, signing secret copied in the same sitting, TEST URL passing, redeploy, one live payment then void (playbook) | Daniel, Claude Code checks | M | **Blocks** |
| 7 | **Name who watches the `unmatched` and `needs_review` rows**, and an Airtable view filtering on `webhook_note` not empty (playbook) | Michael names, Daniel builds view | S | **Blocks** |
| 8 | **Review notes removed.** `build-note` blocks remain in `pages/about.html`, `instructors.html`, `lessons.html`, `lous-journey.html` (3), `program.html`, `register.html`, `team-camps.html` (2). Plus the "To confirm with Michael" hours placeholders in `about.html` and `contact.html` | Claude Code | S | **Blocks** |
| 9 | **Site fixes from the playbook**: bare Register buttons land on "We could not find that program"; past Hit Night September package still sellable; fake "Signed 4 August 2026" row on the waiver step; the dead "town or league code" link | Claude Code | M | **Blocks** (check which are already fixed in the sweep) |
| 10 | **Final copy sweep** with Michael's answers from section 4 (briefing, decisions of 3 October) | Claude Code, Daniel reviews | M | **Blocks** |
| 11 | **`SITE_ORIGIN` and indexing.** Must be exactly `https://dichiarobaseball.com`; any other value leaves the site noindex with no error (briefing section 8) | Daniel | S | **Blocks** (set at cutover, not before) |
| 12 | **The domain and the old Vercel project.** Point `dichiarobaseball.com` and `www` at `dichiarobaseball.com-rgr6`. The second project `dichiarobaseball.com` has no domain, no env vars, but builds on every push: disconnect or delete it (briefing section 9) | Daniel | S | **Blocks** (domain); old project can follow but is quicker done now |
| 13 | **Analytics.** Nothing on the new site. Needs Michael's GA access or a decision for Vercel Web Analytics | Michael (access), Claude Code (tag) | S | Can follow, but launch-day traffic is lost without it. Recommend before |
| 14 | **Redirects from the old Framer URLs.** 301 map below, into `vercel.json` | Claude Code | S | **Blocks.** Old links in Google and on flyers would 404 |
| 15 | **Home Game registration links retired.** Every page of the live Framer site links "register" to `https://app.hmgm.io/venue/85633/dichiaro_baseball_&_softball_academy`. No reference exists in this repo (`git grep -i "homegame\|home game\|hmgm"` finds nothing outside prompts), so the new site is clean. What remains: Michael closes or redirects the Home Game venue listing, and any flyers, emails, social bios or Google Business profile pointing at it move to the new camps page | Michael | S | Can follow, but should happen on go-live day so parents do not pay in two places |
| 16 | **Flyer PDFs.** None of the nine PDFs named in `data/programs.json` are in the repo (`assets/` holds css, img, js only) | Michael supplies, Claude Code adds | S | Can follow. Round 09 leaves the button off until a file exists |
| 17 | **Voids and refunds stay `confirmed`** (no Clover webhook). Manual Airtable change for now | Michael's process | S | Can follow, documented |

### Proposed 301 map from the old Framer site

Fetched from `https://dichiarobaseball.com/sitemap.xml` on 7 October 2026
(`www` serves the same file). 36 URLs. New paths carry `.html` because clean
URLs are off (briefing section 9). Program targets assume round 09 ships.

| Old path | New path |
|---|---|
| `/about-us` | `/about.html` |
| `/template-pages/our-mission` | `/about.html` |
| `/our-instructors` | `/instructors.html` |
| `/camps-and-clinics` | `/camps-and-clinics.html` |
| `/camps-and-clinics/little-league-training-camp-winter` | `/programs/little-league-winter-2027.html` |
| `/camps-and-clinics/little-league-camp` | `/programs/little-league-fall-2026.html` |
| `/camps-and-clinics/infield-camp` | `/programs/infield-camp-2026-27.html` |
| `/camps-and-clinics/monday-hit-nights` | `/programs/hit-night-fall-2026.html` |
| `/lessons-and-rentals` | `/lessons.html` |
| `/template-pages/facilities` | `/facility-and-rentals.html` |
| `/contact-us` | `/contact.html` |
| `/template-pages/faq` | `/contact.html` (FAQ lives there) |
| `/general-registration` | `/camps-and-clinics.html` |
| `/template-pages/events` | `/camps-and-clinics.html` |
| `/template-pages/gallery` | `/facility-and-rentals.html` |
| `/template-pages/blog` and its 6 posts | `/` |
| `/template-pages/facilities/*` (6 pages) | `/facility-and-rentals.html` |
| `/template-pages/events/*` (6 pages) | `/camps-and-clinics.html` |

The `/template-pages/*` blog, facilities and events children are Framer
template filler (aquatics, obstacle races, cardio articles), not academy
content. Redirecting them home is cleaner than a 404 for any stray inbound
link. Hit Night fall points at the fall page while fall runs; Daniel may
prefer the winter page from December.

---

## 3. Day-by-day plan, 7 to 14 October 2026

| Day | Claude Code | Daniel | Michael |
|---|---|---|---|
| **Wed 7** | Round 10: this plan, the review guide, hero hotfix pushed | 2pm review, reads out section 4 | Answers section 4 in the meeting where he can |
| **Thu 8** | Round 09 items 1 to 4: program pages, details links, fixes, verify | Reviews the preview at 390 and 1440 | Sends remaining answers: waiver, refund window, hours, payee, roster, pricing, flyers, GA access |
| **Fri 9** | Round 11, launch hardening: remove or lock `/api/config-check`, 401 alert, third state, email copy change, playbook site fixes (item 9), 301 redirects, analytics tag | Checks the money path evidence. Answers the three read-only questions on the old Vercel project and disconnects it | Names who watches the unmatched rows |
| **Sat 10, Sun 11** | Nothing scheduled | Optional preview pass | Final answers outstanding from Thursday |
| **Mon 12** | Round 12, final copy sweep: Michael's answers in, review notes and placeholders out, full verify, the premium review gate at 1440, 1024, 768, 390 | Approves the sweep. Lowers DNS TTL. Builds the Airtable `needs_review` view | Approves the preview as the launch version |
| **Tue 13, go-live** | Post-cutover checks: routes, redirects, `robots` and sitemap, webhook TEST URL, Airtable row read back | Merges `review` to `main`. Sets Production variables (`PAYMENT_PROVIDER=clover`, Clover, Airtable `Registrations`, `SITE_ORIGIN=https://dichiarobaseball.com`). Points Clover webhook at the domain, copies the secret, TEST URL. Points the domain. One live payment, then void | Retires the Home Game links and listing. Updates Google Business and social links |
| **Wed 14** | Buffer: fixes from go-live day only | Buffer | First real registrations |

### Cutover: the domain and email

The academy's email is hosted at mail.dichiarobaseball.com (MX record). When
the domain points at Vercel, change only the website records (A, CNAME for
www). Do not remove or change the MX record or the mail host's A record, or
the academy's email stops.

### Week after launch

- Confirmation email from the site, contact pushed to Constant Contact
  (needs SPF and DKIM first).
- Town and league codes, built server side (playbook, "Later").
- Flyer PDFs as they arrive.
- Store the second contact, typed waiver signature and signing date.
- Rate limit the checkout endpoint; clean up abandoned `pending` rows.
- Clover refund handling, or a written manual process.
- Cards for Winter Little League and Winter Hit Night if Daniel wants them.
- Clean URLs, `netlify.toml` removed, `verify.mjs` gaps.
- Search Console: submit the sitemap once `SITE_ORIGIN` is live.

---

## 4. Decisions needed from Michael today

1. **The Superdome split.** The Infield page says 11 academy and 4 Superdome
   sessions; `data/programs.json` says 12 and 3. The flyer lists Feb 6 under
   the facility dates; the site shows Feb 6 as a Superdome date. Which is it?
2. **"Six places left".** On the Infield page (`pages/program.html`, chip and
   register heading). No source in the data. Is it true, and who keeps it
   current? Recommendation: remove it.
3. **Spring Little League dates.** The camps card says "Dates coming" and
   "Spring 2027"; the data has dates from Mar 7, 2027
   (`little-league-march-2027`). Publish the dates? **Fact conflict:** the
   card shows 8 sessions, $320 and time "To confirm"; the data has 4
   Sundays (Mar 7 to 28), 2:30-4:00pm, $165. The data wins unless Michael
   says otherwise.
4. **"More than thirty teams".** `pages/camps-and-clinics.html` says "More
   than thirty teams train here each winter"; the team camps meta says "Over
   thirty". Can he count them? Aggregate claims must be counted before launch.
5. **Town and league codes.** Removed from the site; every registration is at
   the standard price (`pages/register.html`). Launch without codes and add
   them after, or hold launch?
6. **The two-payment collection.** Infield shows "$475 now, then $475 on 1 Jan
   2027". The site charges only the first $475. How is the second collected:
   Clover invoice, at the facility, or a second checkout link?
7. **Hit Night winter pricing.** Listed as waiting on Michael (briefing
   section 8). The data also flags winter start times 30 minutes later than
   fall, and a typo in the flyer's March dates.
8. **Lesson package pricing.** `pages/lessons.html` shows $75 for 30 minutes and
   $90 for 45 minutes, a 5-pack at $430 ($86 a lesson) and a 10-pack at $820 ($82 a
   lesson). Correct?
9. **The instructor roster.** Eight bios on `pages/instructors.html`; Gianna
   Sarlo's card is pending with no photo. Is the roster final, and is there a
   photo?
10. **Opening hours.** About and Contact show "To confirm with Michael" in the
    hours slot.
11. **The check payee.** Who checks are made out to. The mailing address is
    not the facility address (`data/programs.json`, venue note).
12. **The refund window.** Reads 14 days on the Infield page and the waiver
    page, marked as a placeholder in `legal.json`. What is the real number?
    Lesson packages are written as non-refundable; confirm.
13. **The waiver text.** The register page shows a four-paragraph assumption
    of risk and release. Has his lawyer or insurer approved it, or does he
    have his own text?
14. **The flyer PDFs.** Nine files named in the data, none supplied. Send
    them, and fix the Hit Night fall flyer's pricing error ($25 and $125
    printed for November and December). Two flyers (Fair Lawn HS, Old Tappan)
    have no photo consent paragraph.
15. **The Google Analytics access.** The new site has no analytics. Does the
    Framer site have a GA property, and can he add Daniel? If not, Vercel Web
    Analytics instead?
16. **Which programs are on sale at launch.** The data has nine live programs:
    three Little League, Infield, two Hit Nights, and three gated team
    programs (IHA, Fair Lawn HS, Old Tappan). Which open for registration on
    13 October?
17. **The confirmation email.** From the site (recommended) or Constant
    Contact? Until it is built, the copy will say no email is sent.
18. **Who watches the `unmatched` and `needs_review` rows** in Airtable.
19. **The Home Game listing.** Can he close or redirect the Home Game venue
    page on go-live day, and update anywhere else it is linked?
20. **Go-live date.** Tuesday 13 October, with the domain switch that day.
21. **The homepage now shows the Little League photo twice** (hero, from
   the hotfix, and the Little League card). Pick another photo for the
   card, or keep both?

---

## 5. Open after launch

Round 13 took every review note and placeholder off the site. Each note whose
question is still open is kept here, so nothing is lost. The removed markup
is in git history on `review`, in the round 13 commit, if a section needs to
come back.

**Before 13 October, not after**

- **The enquiry forms need their table.** Built in round 14: both forms post
  to `/api/enquiry`, which writes to the table named by
  `ENQUIRIES_TABLE_NAME`. Until Daniel adds the variable and the table
  (`Enquiries Review` on Preview, `Enquiries` on Production) and the
  Airtable automation that emails Michael, every message gets "That didn't
  send" with the phone and email.

**Michael**

- Opening hours. About and Contact now say "Call (201) 773-6858 for today's
  hours." Replace with real hours when he sends them.
- Team camps, billing: are invoiced blocks offered to any association that
  asks, or only to ones already set up that way? The page reads as an open
  choice. Is there a minimum roster size or a deposit?
- Team camps, "Programs that train with us": the five names (IHA softball,
  Fair Lawn HS softball, Old Tappan HS, Ridgewood 12U to 14U, Fair Lawn
  Little League) come from the flyers and meeting notes. Listing them uses
  their name and should be cleared. The section works with as few as three.
- The roster. About lists seven names. Lessons lists Diana Schraer and Sam
  Keating as softball pitching coaches. If both are on staff, About gains a
  third Hall of Fame induction and two softball pitching coaches. Same
  question as the Instructors page.
- Lesson package pricing. Five private hitting lessons at $430 is $86 each
  and ten at $820 is $82 each, against a single 30 minute lesson at $75, so a
  parent pays more per lesson to buy in bulk. It resolves if the packages are
  45 minute lessons priced against the $90 rate, and then the page should
  say so. Pitching packages do not have this problem.
- The refund window. "Refund up to 14 days before" on the Infield page and
  the refund sections of the waiver and terms pages are placeholders and must
  agree once Michael sets the number.

**Lou**

- The video on Lou's Journey. One video, two to three minutes, landscape,
  with captions. Filmed on a phone in the room suits the tone. Host on
  YouTube or Vimeo. The weekly interview clip Michael mentioned can reuse
  the slot. The "In his own words" section was removed until it exists.
- Lou's heart transplant and recovery. The meeting notes ask Lou's Journey
  to cover it. We have not written it and should not: it is his own health
  and his own story. What we need, in whatever form suits him (a voice note
  is fine): how much he wants said, what he wants it to do for a parent
  reading it, and whether it belongs on the page at all or in the video. If
  published coverage already says it the way he likes, a short line and a
  link out is cleanest. The "Still to come" section was removed until then.
- Coverage links. The notes mention Fox 5 and other coverage but no URLs.
  Each goes in as a short list titled with the outlet and the year. We will
  not go hunting for them, because linking the wrong piece about someone's
  health is worse than linking nothing. The "Coverage" section was removed
  until then.

**Michael's attorney** (these were "Needs legal review" notes on the legal
pages; `build.mjs` no longer renders note blocks, and they stay in
`legal.json`)

- Waiver, 02 What the waiver covers: a plain-language summary of the consent
  on the paper flyers. The binding text must be drafted or approved by
  Michael's attorney. The note said not to publish the section as written.
- Waiver, 04 Refunds and cancellations: the fourteen-day window is a
  placeholder (see the refund window above).
- Privacy, 06 How long we keep it: retention periods and the rights section
  to be checked against New Jersey requirements and the academy's insurance.
- Terms, 04 Cancellations and refunds: cross-check against the final refund
  window so the two pages cannot contradict each other.
- Terms, 07 Liability: placeholder wording, to be drafted or approved by the
  academy's attorney under New Jersey law.

**Build, after launch**

- More than one player per registration. The register page had an "Add
  another player" button that only showed a prototype message, and a note
  that the waiver card repeats per child. Both removed. Siblings register
  one at a time until it is built.
- The waiver skip. A player who already signed this season should show a
  "Signed" row with the date instead of the waiver. Not built: every booking
  asks for the waiver again.
- Town and league codes, and the confirmation email, were in the register
  prototype note. Both are already listed under "Week after launch".

---

## 6. Closing a full camp, and reopening it

There is no live counting of places. Michael watches Registrations in
Airtable and tells Daniel when a camp is full. One line closes it.

**Close a camp**

1. Open `data/programs.json` on GitHub, on the `review` branch:
   https://github.com/Dgreentime-design/dichiarobaseball.com/edit/review/data/programs.json
2. Find the camp by its `"slug"` (for example `"little-league-fall-2026"`).
   A few lines below it is `"full": false,`. Change it to `"full": true,`
   and change nothing else.
3. Commit straight to `review` with a message such as "Close Little League
   fall: full". (Or ask CC: "Close little-league-fall-2026".)
4. **Check the preview** a minute later:
   - the camp's page shows "Full" in red, and every register button for it
     reads "Ask about openings" and opens the Contact form;
   - its card on Camps (and Home, if it has one) shows a "Full" chip;
   - `register.html?program=<slug>` says "We could not find that program".
   The checkout refuses it too, so nobody can pay for a place that is not
   there.
5. **Production:** merge `review` into `main` as usual, then check the same
   three things on dichiarobaseball.com.

**Reopen it:** the same steps, changing `"full": true,` back to
`"full": false,`.

**Not switched for you:** hand-written lines such as "Six places left" on
the Infield page and "4 spots left" on the homepage Hit Night card are
copy, not data. If a camp closes, those lines need editing too (ask CC).
