# Round 20 - SEO baseline check and Google Analytics 4 with the checkout funnel

DiChiaro Baseball & Softball Academy. Written 11 October 2026, run Monday
12 October from 8:00am. **Go-live: Monday 12 October, 2:00pm Eastern.**
The build is frozen except for this round and round 21 (photos and final
pass). One run, one report. Follow CLAUDE.md.

Why this round: the site must launch with baseline SEO and GA4 in place, and
we must be able to see where families drop off between a program page and a
confirmed payment. That funnel is the most important thing this round ships.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if not pushed. Expect 0 0.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Do not touch `pages/instructors.html`.
3. No changes to prices, dates, options, or the money path logic. Analytics
   calls are added around the money path, never inside its decisions. If an
   analytics call throws or is blocked, checkout must behave exactly as now.
4. Do not change any Vercel or Clover setting. Read only. Never print a
   secret or a variable's value; names and environments only.
   (`GA4_MEASUREMENT_ID` is public by nature, but still report it by name.)
5. No personal data in analytics, ever: no names, emails, phones, dates of
   birth, grades, free text, or anything typed into a form. Opaque ids,
   program slugs, prices, step numbers and error categories only.
6. Never use an em dash.
7. Stop at the checkpoint and report. Anything outside scope, report it,
   don't fix it.

## Verdict on round 19

Accepted. The frozen build, the production build rehearsal, the 404 page and
the runbook were exactly right. The runbook's clock times move two hours
later (launch is now 2:00pm); the steps do not change. Update the times in
`docs/go-live-runbook.md` to match: merge 1:45, Clover webhook and secret
2:00, DNS 2:10, live checks 2:20, after-launch 2:45.

## 1. SEO baseline (audit first, fix only what is safe)

Most of this exists already (metadata from round 15, JSON-LD, robots and
sitemap by environment, llms.txt, 301s). Prove it with a production build
into a temp folder (not committed), then fix gaps.

1. robots.txt allows indexing, disallows only `/register.html`, and points
   at the sitemap. Sitemap lists every public page on
   `https://dichiarobaseball.com`, with `<lastmod>` if cheap to add.
   No `noindex` left on a public page. Review build still `noindex`.
2. Every public page: one `<h1>`, unique `<title>` (aim 60 characters or
   fewer) and meta description (aim 120 to 160), self canonical, `og:url`,
   `og:image` and `twitter:card` present. List outliers. Fix length only by
   trimming wording already on the page; never invent claims.
3. Every content image has a non-empty `alt`; decorative ones `alt=""`.
4. JSON-LD validates (`scripts/check-jsonld.mjs`). The facility block has
   name, address, phone, email, url, image, sameAs. Do not add opening hours,
   ratings, prices or geo coordinates we have not been given. If program
   pages have no structured data, report it as a week-after item; do not
   add Event schema today.
5. Report the result as a table: check, pass or fail, pages affected.

## 2. GA4 tag, environment driven

1. New build variable `GA4_MEASUREMENT_ID` (Daniel sets it in Vercel for
   Production and Preview this morning). When set, `build.mjs` writes the
   standard gtag snippet into the existing "GOOGLE ANALYTICS SLOT" comment
   on every page, including `register.html` and `404.html`. When not set,
   nothing is written and the site behaves as now. If the variable isn't in
   Vercel yet when you start, build and test locally with `G-TEST000000`
   and say so in the report.
2. Config: `send_page_view: true`, `allow_google_signals: false`,
   `allow_ad_personalization_signals: false`. On any build that is not
   production (`IS_PROD` false) add `debug_mode: true`, so preview and local
   traffic land in DebugView and the "Developer traffic" filter keeps them
   out of real reports.
3. Load it `async` and keep it out of the critical path. Re-run the speed
   check on Home and one program page at 390 and 1440: LCP and CLS must stay
   within 10% of round 18b's numbers. Report before and after.
4. One small wrapper in `assets/js/site.js`, e.g. `window.dbsaTrack(name,
   params)`, that no-ops when `gtag` is missing and swallows any error. All
   events below go through it.

## 3. The checkout funnel (the crucial part)

Use GA4's recommended ecommerce events so the standard funnel reports work.
Every ecommerce event carries `currency: "USD"`, `value` in dollars, and
`items: [{ item_id: <program slug>, item_name: <program title>,
item_category: "baseball" | "softball" | "both", price, quantity:
<players> }]`.

| # | Event | When it fires | Extra params |
|---|---|---|---|
| 1 | `view_item` | A program page loads (programs/*.html and program.html) | |
| 2 | `begin_checkout` | `register.html` opens with a program in the cart; once per cart per session | |
| 3 | `checkout_progress` (custom) | Each step form passes validation and moves on | `step: 1 \| 2 \| 3`, `step_name: "players" \| "waiver" \| "review"` |
| 4 | `add_payment_info` | Step 3 submit, before the API call | `payment_type: "online" \| "facility" \| "check"` |
| 5 | `checkout_redirect` (custom) | `/api/checkout/session` returned a `redirectUrl`, just before leaving for Clover | `transaction_id` |
| 6 | `purchase` | Confirmation shows status `confirmed` (online return from Clover, or facility and check, which confirm at once) | `transaction_id: registrationId`, `payment_type` |
| 7 | `checkout_unconfirmed` (custom) | Returned from Clover but polling ended without `confirmed` | `transaction_id`, `reason: "pending" \| "failed" \| "timeout"` |
| 8 | `checkout_error` (custom) | The session API call fails | `error_step: "validation" \| "server" \| "network"`, `http_status` |
| 9 | `generate_lead` | A Contact or enquiry form saves successfully | `form` (the form's existing name, no content) |

Rules:

1. Event 5 must not lose the navigation or be lost by it: send with
   `transport_type: "beacon"` and an `event_callback`, and navigate on the
   callback or after 800ms, whichever comes first. If GA is blocked, the
   redirect happens immediately as now.
2. `purchase` fires once per registration: guard with a sessionStorage key
   per `registrationId`, and GA dedupes on `transaction_id` as well. A page
   reload on the confirmation must not send a second purchase.
3. Confirm `registrationId` is an opaque id, not built from a name or email.
   If it carries personal data, stop and report instead of sending it.
4. Gap between 5 and 6 is the drop-off on Clover's own page. Pending rows
   in Airtable Registrations are the same signal from the server side;
   say in the report whether rows that never confirm stay `pending` (so
   Daniel can make an Airtable view of them).

## 4. Privacy policy, cookies section

GA4 sets first-party cookies, so section 08 Cookies is no longer true.
Replace its paragraph in the source (`legal.json` or wherever it lives) with:

"We use Google Analytics to understand how families use the site, such as
which programs they look at and where a registration gets stuck. It sets
cookies that count visits without telling us who you are, and we have turned
off Google's advertising features. We never send your name, email or your
player's details to Google. You can opt out with Google's browser add-on at
tools.google.com/dlpage/gaoptout. A booking in progress is kept in your
browser's session storage, which clears when you close the tab. We also
count visits with Vercel Web Analytics, which sets no cookies."

Link the add-on URL. Update the policy's "last updated" date to 12 October
2026 if it has one. Also update the comment above the GA slot in the
templates so it no longer says the slot is empty on purpose.

## 5. Verify

1. `npm run verify`, `check:payments`, `check:enquiry`, `check-jsonld`
   all pass.
2. With the tag on (real ID or `G-TEST000000`), walk the mock checkout on the
   preview end to end for one online and one facility registration, and
   capture the gtag calls (network `collect` requests or a `dataLayer`
   dump). Show events 1 to 6 in order with their params for the online run,
   and 1 to 4 then 6 for the facility run. Then force a session API error
   and show event 8. Submit one Contact message on preview and show 9.
3. Reload the confirmation page and prove no second `purchase`.
4. Grep every captured event payload for `@`, digits that look like a
   phone, and the test player's name. Must find none.
5. Block `googletagmanager.com` in the browser and complete a mock checkout:
   it must still reach Clover mock and confirm.

## 6. Report

1. Step 0 result.
2. SEO table from section 1, and what you fixed.
3. Where the GA snippet is injected, and whether `GA4_MEASUREMENT_ID` was
   present in Vercel Preview when you built.
4. The event table as implemented, with any deviation and why.
5. Evidence from verify steps 2 to 5.
6. Speed before and after.
7. Privacy policy diff.
8. Whether unconfirmed registrations stay `pending` in Airtable.
9. Commits pushed to `review`, and the preview URL to check.
10. Anything you saw that is out of scope.

## Out of scope (report, don't fix)

- Photo swaps and Michael's feedback (round 21).
- Event schema on program pages, Measurement Protocol (server-side purchase
  from the Clover webhook), consent banner, Google Tag Manager. Week-after
  candidates.
- Anything in Vercel, Clover, Airtable or GA4 admin settings. Daniel does
  those.

End of prompt.
