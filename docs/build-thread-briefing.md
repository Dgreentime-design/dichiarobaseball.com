# Build thread briefing

DiChiaro Baseball & Softball Academy, dichiarobaseball.com.
Current as of 3 October 2026.

This is the handover document for a dedicated Claude Code build thread. It
assumes no prior conversation. Read it, then read `CLAUDE.md` for the standing
rules, then read whatever the round in flight points you at.

Update the "Where things stand" section at the end of every phase so the next
thread does not have to reconstruct it.

---

## 1. The project

A year-round indoor baseball and softball academy in Fair Lawn, New Jersey.
Lessons, camps and clinics, cage and facility rentals, for ages 6 to 18.

- Founder and head instructor: Lou DiChiaro
- Client contact: Michael
- Facility: 18-01 Pollitt Drive, Fair Lawn, NJ 07410
- Phone used across the site: (201) 773-6858
- Target go-live: 9 October 2026

Built by Box to Box Design. Daniel is the designer, director and the only
person who merges to `main`.

The site replaces an existing Framer site. It is a hand-built static site so
the academy is not paying a platform subscription to take registrations.

## 2. What the site does

Marketing pages plus a working registration and payment flow.

- Ten pages, listed in section 4.
- A parent picks a program, adds players, signs a waiver once a season, and
  pays by card, at the facility, or by check.
- Card payments go through Clover Hosted Checkout. Registrations are recorded
  in Airtable.

## 3. Repo and environments

| | |
|---|---|
| Local path | `~/projects/dichiarobaseball.com` |
| Remote | `Dgreentime-design/dichiarobaseball.com` |
| Production branch | `main` (frozen behind `review`, Daniel merges) |
| Working branch | `review` |
| Vercel project | `dichiarobaseball.com-rgr6` |
| Review preview | `https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app` |
| Production preview | `https://dichiarobaseballcom-rgr6.vercel.app` (old, do not send to anyone) |
| Live domain | `dichiarobaseball.com`, not yet pointed at Vercel |

Deployment protection is off for Preview, so Clover and the client can reach
it. The site is deliberately unindexed until cutover.

## 4. Repo map

    CLAUDE.md                     standing rules, read first
    build.mjs                     resolves partials into flat HTML at the root
    verify.mjs                    link, overflow, parity and route checks
    vercel.json                   buildCommand, outputDirectory ".", headers
    package.json                  scripts: build, start, verify, dev, check:payments

    pages/                        SOURCE for every page. Edit here.
      index.html                  homepage
      camps-and-clinics.html      program listing with filters
      program.html                program detail template, ?p=<slug>
      lessons.html                private and semi-private lessons
      facility-and-rentals.html   cages, full facility, HitTrax
      instructors.html            the eight coach bios
      about.html                  the academy
      lous-journey.html           Lou's story
      team-camps.html             team blocks plus enquiry form
      contact.html                contact form and FAQ
      register.html               the registration and payment flow
      _legal.html                 template for the legal pages
      _stub.html                  template for stub pages

    partials/                     head, header, footer, menu, marquee
    data/programs.json            THE pricing and program source of truth
    legal.json                    legal page content. Off limits by default.
    stubs.json                    stub page definitions

    api/
      checkout/session.js         creates a checkout session, prices server side
      webhooks/clover.js          the only writer of a confirmed registration
      registration/[id]/status.js polled by the confirming screen
      programs/[slug].js          public program data for the register page
      config-check.js             PREVIEW ONLY diagnostic. Publicly readable.
      health.js
      mock-checkout.js            the mock provider's fake payment page
      _lib/
        providers/index.js        selects mock or clover from PAYMENT_PROVIDER
        providers/clover.js       Clover Hosted Checkout adapter
        providers/mock.js         mock adapter
        providers/signature.js    HMAC signing and verification
        match.js                  matches a webhook to a registration BY VALUE
        store.js                  Airtable read and write
        programs.js               server-side pricing
        guard.js                  refuses to start if mock meets production
        http.js

    scripts/                      check-payments, check-deployed, check-jsonld,
                                  check-mock-guard, check-prototype,
                                  check-register-links, dev-server

    prompts/                      one file per round, committed before it runs
    docs/                         this file, the playbook, the principles

    assets/                       images and media

Generated HTML sits at the repo root (`index.html`, `about.html` and so on).
**Never edit those by hand.** They are build output and they are committed.

## 5. The money path, in one screen

1. Parent opens `register.html?program=<slug>`. Prices come from
   `/api/programs/<slug>`, which uses the same pricing function that charges.
2. `POST /api/checkout/session` sends IDs only. The server recomputes the
   amount from `data/programs.json` and ignores any amount in the request.
3. The server writes a `pending` row to Airtable, then creates a Clover
   checkout session and stores its session ID on the row.
4. The parent pays on Clover's hosted page and is sent back to
   `register.html?registration=<id>`, which shows "Confirming your payment"
   and polls the status endpoint.
5. Clover posts a signed webhook to `/api/webhooks/clover`. **Only this moves
   the row to `confirmed`**, with the Clover order ID.
6. Pay at the facility and pay by check skip 3 to 5 and write `confirmed`
   directly, with nothing charged.

Proven end to end with a real $30 card payment on 1 October 2026, then voided.

Full detail, including the real Clover payload and both silent failure modes:
`docs/clover-hosted-checkout-playbook.md`. The provider-agnostic method:
`docs/payments-integration-principles.md`.

## 6. Environment variables

All on Vercel, read from `process.env`, never in a file.

| Variable | Notes |
|---|---|
| `PAYMENT_PROVIDER` | `mock` or `clover`. Currently `mock` on Preview |
| `MOCK_WEBHOOK_SECRET` | any long random string, preview only |
| `CLOVER_ENV` | `sandbox` or `production` |
| `CLOVER_MERCHANT_ID`, `CLOVER_PRIVATE_TOKEN` | Clover ecommerce credentials |
| `CLOVER_WEBHOOK_SECRET` | the Hosted Checkout signing secret |
| `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` | storage |
| `SITE_ORIGIN` | unset until cutover. Unset keeps every page noindex |

**A changed variable needs a redeploy.** An existing deployment keeps the
values it was built with. An empty commit to `review` is enough.

Airtable currently points at `Registrations Review` on Preview, so the client's
test registrations stay out of the handover table (`Registrations`).

## 7. Round history

| Round | Date | What it did |
|---|---|---|
| 01 | 30 Sep | Deploy verification. Routes, overflow, parity, links |
| 02 | 30 Sep | Payment backend on the mock. Adapter, checkout, webhook, status, Airtable |
| 03 | 30 Sep | Honest prototype. Real program slugs, server pricing, demo code removed |
| 04 | 30 Sep to 1 Oct | Clover live test. First real payment, adversarial checks |
| 05 | 1 Oct | Webhook payload captured, by-value matching, unmatched tracking |
| 06 | 1 Oct | Playbook revision, docs added |
| 07 | 3 to 5 Oct | Copy overhaul across every page. Finished, B10 reported. `prompts/2026-10-03-round07-copy-overhaul.md` |
| 08 | 5 Oct | Sticky header, eyebrow icon and colors, one image hero, one stat strip, responsive sweep. Parts A and B accepted, closing fixes done. `prompts/2026-10-05-round08-responsive-and-global.md` |
| 09 | 7 Oct | Item 0, the mobile hero hotfix, shipped in round 10. Items 1 to 4 ran in round 11. `prompts/2026-10-05-round09-program-pages.md` |
| 10 | 7 Oct | Launch plan and the 7 October client review guide, hero hotfix. `prompts/2026-10-07-round10-launch-review.md` |
| 11 | 7 Oct | Client review changes and the generated program pages. `prompts/2026-10-07-round11-client-changes-and-program-pages.md` |

Every round is a committed prompt file in `prompts/`. Read the round in flight
before doing anything.

## 8. Where things stand, 7 October 2026

**Done in rounds 10 and 11, 7 October**

- `docs/launch-plan.md` and `docs/client-review-2026-10-07.md` written.
  Go-live target Tuesday 13 October.
- Mobile hero hotfix: lighter dim over the top of the image hero on phones,
  stacked natural-width buttons, homepage hero is `dbsa-07`.
- **Program pages are generated.** `build.mjs` writes one page per program
  in `data/programs.json` that is `live` and not `gated`, at
  `programs/<slug>.html`, plus `programs/<slug>.ics` with one event per
  session date. Six today. Facts come only from `data/programs.json`, words
  only from `data/program-copy.json` (keyed by slug), the page shell is
  `pages/_program.html`. A section with no data and no copy is left out.
  Change either data file and every page rebuilds, no template edit.
- `program.html` is now a noindex forwarder: `program.html?p=<old slug or
  data slug>` goes to the program page, anything else to
  `camps-and-clinics.html`.
- Every "See dates and details" link points at its own program page.
- Instructor selection removed (Lessons hero sub, og description, the
  "Choose who teaches" band, the Contact FAQ). Lessons links to Instructors
  from the end of Rates. `pages/instructors.html` untouched, Daniel owns it.
- About staff teaser has the `dbsa-09` photo. Homepage Lou band links to
  Instagram. Homepage HitTrax button is "Request a HitTrax session" to
  `contact.html?about=hittrax`.
- `verify.mjs` walks the six program pages and checks the calendar files.

**Decisions taken on 7 October, already answered, do not re-ask**

- Families can no longer choose or request an instructor anywhere on the
  site.
- HitTrax stays a promotion with a "Request a HitTrax session" option. It is
  not sold online yet. Michael is setting its pricing.
- Michael is sending 9 PDFs as the new baseline for every camp, lesson and
  purchasable item. A later round re-baselines `data/programs.json` from
  them (round 13), with the Teams filter, three more camps, flyer buttons
  and the final copy sweep. Round 12 is launch hardening.

**Done before 7 October**

- Full front end built across ten pages, unindexed, on `review`.
- Registration and payment path proven end to end against Clover production,
  then reverted to the mock for client review.
- Three live $30 payments across the diagnosis, all voided. Net zero.
- Adversarial checks passing: bad signature, redirect without payment,
  tampered amount, duplicate delivery.
- Unmatched and unconfirmable webhooks write a traceable Airtable row.
- Signing secret rotated and verified.

**In flight**

- Round 07, the copy overhaul, is finished and reported. Three TEST
  registrations on the preview prove each payment path, references
  `DBSA-6Y5A4MQ36H` (card, mock), `DBSA-N9CHAWZKHY` (facility) and
  `DBSA-64J2UYNXAJ` (check), all in Registrations Review. Do not delete them.
  - Still held: the two program-page lines stating the academy and Superdome
    split (11 and 4 on the page, 12 and 3 in `programs.json`). Waiting on
    the Feb 6 answer.
- Round 08, responsive system, heroes and global navigation. Parts A and B
  accepted on 5 October, including the rule that every image band keeps at
  least 200px of photograph above its copy on a phone. Closing fixes done:
  internal files no longer deployed, proof images untracked into `_proof/`,
  register progress labels 12px at every width. **The round is closed
  pending Daniel's sign-off on the closing report.**
  - Sticky header with a hiding announcement bar. Motion tokens
    `--dur-reveal` and `--ease-reveal` in `tokens.css`.
  - Eyebrow: Daniel's baseball icon, color set only by background through
    `--eyebrow-color`. verify.mjs checks it.
  - One image hero (`.hero` in `home.css`) on Home, Camps, Lessons,
    Instructors and the program page, sharing one copy-anchored scrim rule
    with the homepage HitTrax band. One stat strip component. verify.mjs
    checks the strips.
  - The responsive rule and every deliberate exception live in
    `docs/responsive-decisions.md`. Read it before any layout work.
  - Proof images for the round are in `_proof/`, local only. From now on
    every round's proof images go there and nowhere else.
  - Next: the next round, once Daniel writes it.

**Decisions taken on 5 October, already answered, do not re-ask**

- The hero overlay follows the copy: left to right on wide screens, bottom up
  on phones. Accepted as an adaptation.
- Card kickers stay red. Only `.eyebrow` takes the icon and the two colors.
- The green confirmation band keeps its light green eyebrow until there is a
  third approved color.
- The net texture stays off photographs and only on plain dark surfaces.
- The HitTrax links go to `facility-and-rentals.html#hittrax`. The empty
  `#hittrax` marker at the end of Lessons stays.
- Lou's bio reads "Founder and head instructor since 2000."
- Every image band keeps at least 200px of photograph above its copy on a
  phone.
- Register progress labels are one size at every width, 12px, never smaller.
- Internal files are not deployed and proof images are not tracked by git.

**Decisions taken on 3 October, already answered, do not re-ask**

- **Part A is approved.** Daniel reviewed the homepage and the global elements
  on the preview at both sizes.
- **The announcement bar link is approved.** CC repointed it from the broken
  register page to the fall Little League registration. Keep that change.
- **Remove the Hall of Fame claim from marketing copy**, in all three places it
  is totalled up: the Instructors hero sub, the Instructors stat strip and the
  About staff teaser. **Keep it in Fran Fitzgerald's own bio**, which is his
  real credential and stays word for word. Replacements:
  - Instructors hero sub: Three Major League draft picks on staff, all still
    teaching on the floor.
  - Instructors stat strip, two items: "3" MLB draft picks, and "Since 2000"
    Teaching in Fair Lawn. If the component needs a third, report it rather
    than inventing one.
  - About staff teaser body: Coaches who played in college and the pros,
    teaching every session.
- **Remove the owner tag from Lou.** Keep "Founder and head instructor".
  Report every place "Owner" appeared.
- **The Instructors stat "25 years teaching here" becomes "Since 2000".** A
  hardcoded year count goes stale every January.
- **About's "15+" stays as it is.** Understated rather than wrong.
- **A final copy sweep happens before go-live.** Small wording inconsistencies
  found along the way are logged as findings, not fixed mid-round.

**Waiting on Michael**

- Whether the confirmation email comes from the site or Constant Contact. The
  recommendation already sent: send it from the site so it is immediate and
  never suppressed by a marketing unsubscribe, and push the contact record to
  Constant Contact separately.
- How the second instalment on the two-payment option is collected.
- Hit Night winter pricing, lesson package pricing, the instructor roster,
  opening hours, the check payee name.

**Launch blockers** are listed in `docs/clover-hosted-checkout-playbook.md`
under "Before go-live". The two that bite silently:

1. `SITE_ORIGIN` must be exactly `https://dichiarobaseball.com`. Any other
   value leaves the live site noindex and nothing reports an error.
2. The Clover signing secret in the dashboard and in Vercel must match.
   If they drift, every payment is taken and no registration is ever
   confirmed, with no trace anywhere a person looks.

## 9. Known issues not yet fixed

- `/api/config-check` is publicly readable on any preview and returns
  registration status, amount and order ID. Remove or lock before launch.
- A voided or refunded payment leaves the registration `confirmed`, because
  Clover sends no webhook for it. Manual for now.
- Repeated signature failures only reach the Vercel log. Nobody reads logs
  unprompted. A visible counter or alert is a launch blocker.
- The success page promises a confirmation email that is not built.
- A registration that cannot be confirmed leaves the parent on "Confirming
  your payment" indefinitely. Correct as a rule, a dead end as an experience.
  It needs a third state.
- Clover sandbox access was never granted. It needs their support team.
- `netlify.toml` is dead. Clean URLs are off. `verify.mjs` has gaps.
- **"Have a town or league code?" link removed** from the program template
  in round 11, because the code field no longer exists. It comes back if
  codes come back.
- **Premium review gate, first run, round 11** (`review.config.mjs`, routes
  touched in round 11, 1440/1024/768/390). Passing: overflow, truncation,
  type, order, reveal. Fixed in round 11: the header overflowed by 9px at
  1024 on every page, and the red register band body text was 4.48:1. Still
  failing, all site-wide and older than round 11, for Daniel to decide:
  - Edges: at 1440 the header runs to the gutter (59.8 to 1380.2) while
    content sits in the 1280px container (80 to 1360), 20px apart.
  - Touch targets under 44px at 390: footer links 28px, arrow links and
    breadcrumbs 32px, compact buttons 40px, skip link 43px. `verify.mjs`
    checks 24px.
  - Rhythm and hover: the site's band spacing is fluid (`--band-y`) and
    hover is per component, so the kit's one-gap, one-colour checks cannot
    pass without a system change.
  - Contrast: the amber "To confirm with Michael" hours placeholder on
    Contact is 4.36:1. It comes off before launch.
- **Register progress connector at 360px**, fixed in round 11: the steps are
  equal columns on phones and each connector stops 8px short of the next
  marker.
- **There is a second Vercel project called plain `dichiarobaseball.com`**,
  separate from `dichiarobaseball.com-rgr6`, last touched 1 October. Two
  projects and one domain is a cutover hazard: the domain can only point at
  one, and if the old project is still connected to the repo it may be
  building on every push. Three read-only questions decide what happens to it:
  is the domain attached to it, is it connected to the GitHub repo, does it
  hold environment variables `-rgr6` does not. **Record the answers in the
  cutover checklist, then decide delete or deliberately keep.** Do not delete
  it before those answers exist.
  Answers from CC's read-only check on 3 October: the domain is not attached
  to it, it is connected to the repo and builds every push, and it holds no
  environment variables at all.
- **Internal docs are no longer deployed.** `.vercelignore` excludes `docs/`,
  `prompts/`, `CLAUDE.md` and `README.md`, so they return 404 on every
  deployment. Anything else at the repo root is still publicly served.
- **`_proof/` is local only.** Proof images live there, ignored by git and by
  Vercel. The 41 MB of round 08 proof images committed earlier stays in git
  history, accepted, and is not served.

## 10. Where the truth lives

| Question | Answer |
|---|---|
| What are the rules for working here | `CLAUDE.md` |
| What is the state of the build | this file |
| What does a program cost, when does it run | `data/programs.json`. Never a page |
| How does the Clover integration work | `docs/clover-hosted-checkout-playbook.md` |
| How should payments be built anywhere | `docs/payments-integration-principles.md` |
| What was asked for in round N | `prompts/` |
| What is still open before launch | the playbook, "Before go-live" |

Daniel keeps a fuller set of director-level documents in the Claude project
for this client: the cutover checklist, the design and copy punchlist, the
payment integration status, the brand foundation, the instructor bios, the
proposal and the meeting notes. **Those are not in this repo and you cannot
read them.** If a round depends on one, Daniel pastes the relevant part into
the round prompt. Do not guess at their contents.

## 11. How Daniel works

- One workstream at a time, with a checkpoint before the next.
- Reports are short and structured. Detail belongs in a document, not a reply.
- He is not a developer. Terminal instructions need to be exact and
  copy-pasteable, with no placeholders to fill in.
- He wants to be told when he is wrong, with the reasoning.
- "CC" always means Claude Code.
