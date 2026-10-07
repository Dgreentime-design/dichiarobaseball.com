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
