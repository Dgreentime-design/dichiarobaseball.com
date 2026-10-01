# Custom Ecomm Solution - Clover Integration

Oct 1, 2026 · Daniel

> **Work in progress.** Written at the end of Phase 1, while the client review
> is still open and the site is not yet live. Everything here was true and
> tested on 1 October 2026, but the build is not finished: the launch blockers
> below are open, the site fixes list will grow with the client's feedback, and
> nothing has yet run against production. **Review and rewrite this playbook
> once the site is officially live**, when the cutover and the first real
> customer payments have either confirmed what is written here or corrected it.

A static site on Vercel takes registrations and card payments through Clover
Hosted Checkout, with Airtable as the record. Phase 1 is complete: the live
payment path was proven end to end on 1 October 2026 and the client is reviewing
the site on the mock provider. This playbook is how to repeat it.

**The method behind this build is written up separately in "Taking payments on
a static site - principles".** That document is provider-agnostic and applies to
Stripe or Square tomorrow. This one is the Clover build playbook: the facts,
the gotchas and the protocol specific to Clover Hosted Checkout. Read the
principles first if you are building this for a different provider.

**What Phase 1 actually cost.** Three live $30 payments across two days, all
voided, net zero. The first two never confirmed, for two different reasons, and
diagnosing them is where the time went. Budget for diagnosis, not for one clean
test.

---

## The rule and the money path

A registration is confirmed when a verified webhook says the payment succeeded,
and at no other moment. The redirect back from the payment page is not proof: a
parent can pay and close the tab, and anyone can load the success URL without
paying.

1. The parent fills in the form on `register.html?program=<slug>`. The page
   shows prices from `/api/programs/<slug>`, which uses the same pricing
   function that charges the card.
2. `POST /api/checkout/session` sends IDs only (program, option, players). The
   server recomputes the amount from `data/programs.json` and ignores any amount
   in the request.
3. The server writes a `pending` row to Airtable, then asks the provider for a
   checkout session and stores its session ID on the row.
4. The parent pays on Clover's hosted page. Clover sends them back to
   `register.html?registration=<id>`, which shows "Confirming your payment" and
   polls `/api/registration/<id>/status`.
5. Clover posts a signed webhook to `/api/webhooks/clover`. Only this moves the
   row to `confirmed`, with the Clover order ID.
6. Pay at the facility or by check skips 3 to 5: the row is written `confirmed`
   directly, with nothing charged.

The browser only ever sends IDs and reads status. The checkout writes a pending
row before Clover is called, and the webhook is the one writer of `confirmed`.

## How the webhook finds its registration

The handler does not read the session from a named field. It flattens the
payload into every value with its key path, and looks for a value that equals a
stored `checkout_session_id`. The same approach finds the outcome, the amount
and the order ID, and the matching key path is logged so the payload shape is
learned rather than assumed.

This exists because the first live payment failed on exactly this. The code read
`payload.data`, which is what Clover's documentation implies, and Clover sends
`checkoutSessionId`. A value match is exact, does not depend on Clover's naming,
and survives Clover renaming things later.

If no recognisable outcome is found anywhere in the payload, the handler does
not confirm. An unreadable webhook is not an approval.

## The two silent failures

Both take the money and record nothing. Both look identical from outside: the
parent sits on "Confirming your payment", the row stays `pending`, and nothing
reports an error. Phase 1 hit both, in sequence, and finding the first one and
stopping would have left the second live.

| | Cause | Symptom in logs | Fix |
|---|---|---|---|
| **Key mismatch** | Handler read `data`, Clover sends `checkoutSessionId` | 200, `webhook for unknown session undefined` | By-value matching, above. Fixed in round 05 |
| **Secret drift** | Generate clicked in Clover, Vercel not updated | 401, `invalid signature` | Copy the current secret to Vercel, redeploy, pass TEST URL |

Rejecting unverified requests is correct and must not change: the URL is public
and anyone can post to it. The problem was never the rejection, it was that the
rejection was invisible. The handler now logs a result line per webhook, and
unmatched webhooks write an Airtable row. **A visible counter or alert on
repeated signature failures is still to be built. It is on the launch blockers
below.**

## How we work

Work runs in numbered rounds, each a prompt file committed to `prompts/` before
it runs, so the record of what was asked lives beside the code.

- **Step 0 identity check.** Every round starts with `pwd`, the git remote, the
  branch, `git status --porcelain` and
  `git rev-list --left-right --count origin/review...HEAD`. Any mismatch means
  stop and report. Never name a commit SHA in a prompt: it is wrong the moment
  the prompt is committed.
- **The review branch.** All work is committed and pushed to `review`; every
  push makes a Vercel preview the agent can verify itself. A local hook,
  `builder-guard.mjs`, blocks pushes to `main`. Daniel merges `review` into
  `main` after review.
- **Boundaries restated every round.** Stay unindexed, no secrets in files,
  delete nothing, no force-push, out-of-scope items become findings, stop at the
  checkpoint.
- **Evidence, not assertion.** Each claim in a report is backed by a check: a
  curl, a browser walk, an Airtable row read back, or a test that was shown to
  fail when the code was broken.
- **Diagnose without values.** Diagnostic endpoints return booleans, key names,
  lengths and error types, never a secret or a header value.
- **Change one thing at a time.** Most of the time lost in Phase 1 came from
  changing two things and not knowing which one broke it.

## Build log

Five rounds took the site from a static prototype to a proven live payment in
two days.

| Date | Round | Outcome |
|---|---|---|
| 1 Oct 2026 | 05 Webhook payload | Real payload captured; matching reads values, not key names; unmatched webhooks leave an Airtable row; diagnostics removed; $30 payment confirmed end to end, then voided |
| 30 Sep–1 Oct 2026 | 04 Clover live test | Clover production API reached; Airtable write path proven; first $30 payment stayed pending (webhook key mismatch, then a changed signing secret); adversarial checks passed; preview returned to mock |
| 30 Sep 2026 | 03 Honest prototype | Register links use real program slugs; unknown slug shows not found; all totals come from server pricing; demo code removed; mock blocked in production |
| 30 Sep 2026 | 02 Payment backend | Provider adapter (mock and Clover), checkout, webhook, status and Airtable store; six money-path checks pass on mock |
| 30 Sep 2026 | 01 Deploy verify | Vercel built the right commit; routes, overflow, parity and links pass; committed HTML rebuilt to drop an expired preview URL |

## Clover facts

Clover's documentation labels the webhook fields but does not give their JSON
keys, and the real keys differ from the labels. **Trust the captured payload
below over the docs.**

| Item | Value | How we know |
|---|---|---|
| API base, North America | `https://api.clover.com` (sandbox `https://apisandbox.dev.clover.com`) | Clover environments doc |
| Create session | `POST /invoicingcheckoutservice/v1/checkouts`, headers `Authorization: Bearer <private token>` and `X-Clover-Merchant-Id` | Create checkout reference; live call returned `href` and `checkoutSessionId` |
| Return URLs | `redirectUrls.success`, `.failure`, `.cancel` in the request body, per session | Create checkout reference |
| Session lifetime | 15 minutes from creation | Hosted Checkout session doc |
| Prices | Integer cents, `price` × `unitQty` per line item | Create checkout reference |
| Webhook signature | Header `Clover-Signature: t=<unix seconds>,v1=<hex>`; `v1` = HMAC-SHA256 of `<t>.<raw body>` with the signing secret | Webhook doc; confirmed live |
| Webhook payload keys | `type`, `id` (payment ID), `merchantId`, `created` (seconds, decimal), `status` (`APPROVED` or `DECLINED`), `message` ("Approved for 3000"), `checkoutSessionId` | Captured from the live $30 payments |
| Amount in the webhook | **Only inside `message`, in cents. There is no separate amount field** | Captured payload |
| TEST URL button | Sends a signed `{"test":"dummy"}`, not a payment; Clover shows "verification succeeded" only on a 2xx | Captured, 1 Oct 2026 |
| Retries | None seen after a 401 within 10 minutes. Treat a rejected webhook as lost | Watched live |
| Signing secret | Clicking **Generate** replaces it at once. Copy it to Vercel in the same sitting, then redeploy | Caused the second failed payment |
| Sandbox | Not self-serve. Requires Clover support. Phase 1 was built without it | Attempted, 30 Sep 2026 |

The captured payload, in full:

    {
      "type": "PAYMENT",
      "id": "ZFDH10N8SX4VA",
      "merchantId": "...",
      "created": 1790858833.844,
      "status": "APPROVED",
      "message": "Approved for 3000",
      "checkoutSessionId": "92be8d6f-a31e-4cc9-b27f-8980e7fec529"
    }

**On the "verification failed" banner.** Before the secret matched, clicking
TEST URL showed "Webhook url verification failed" in Clover. That banner is
about Clover's own test probe and says nothing about whether real webhooks are
being delivered. Real signed webhooks were arriving and verifying throughout.
Do not chase it as if delivery were broken.

## Airtable setup

One table per environment: `Registrations` for live payments,
`Registrations Review` for the client review on mock. Field names must match
exactly, lowercase with underscores; Airtable names are case-sensitive.

| Field | Type | Notes |
|---|---|---|
| `registration_id` | Single line text, primary | `DBSA-` plus 10 characters, or `UNMATCHED-<hash>` |
| `status` | Single select | `pending`, `confirmed`, `failed`, `needs_review`, `unmatched` (writes use typecast, so options are added if missing) |
| `program` | Single line text | Name and season |
| `option` | Single line text | Option label |
| `players` | Long text | JSON, up to four players, coach note inside |
| `parent_name`, `parent_email`, `parent_phone` | Text, email, phone | |
| `amount` | Currency | Dollars, computed by the server |
| `payment_method` | Single select | `online`, `facility`, `check` |
| `provider_order_id` | Single line text | Clover payment ID, the refund reference |
| `checkout_session_id` | Single line text | How a webhook finds its registration |
| `waiver_accepted`, `photo_consent` | Checkbox | Photo consent is separate and optional |
| `webhook_note` | Long text, optional | Why a webhook could not confirm. Writes go ahead without it if the field is missing |
| `created_at` | Created time | Never written by the code |

- **Token.** A personal access token with `data.records:read` and
  `data.records:write`, and the base added under Access. A regenerated token
  does not keep the old token's base list.
- **401 UNAUTHORIZED.** The token itself is bad: wrong value, revoked, or pasted
  with a stray character.
- **403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND.** The token is fine but cannot
  reach the base or table: missing base access, missing scope, wrong base ID, or
  wrong table name.
- **422 UNKNOWN_FIELD_NAME.** A field the code writes is missing. Airtable names
  only the first one, so check them all.
- A table or field change needs no redeploy. A variable change does.
- **Duplicating the table for review** takes thirty seconds (right-click,
  Duplicate table, without records) and keeps client test rows out of the
  handover table. Do it before the client sees the link, not after.
- **`webhook_note` is optional in the code.** If it is missing or misnamed, rows
  are still written and the reason is dropped to a log line. That is a
  deliberate choice so a missing field never blocks a registration, but it means
  the field's absence is itself silent. Confirm it exists.

## Vercel setup

The site deploys from GitHub to project `dichiarobaseball.com-rgr6`; `main` is
production, `review` is the preview at
`dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app`.
Every variable is read from `process.env` and never written to a file.

| Variable | Read by | Notes |
|---|---|---|
| `PAYMENT_PROVIDER` | All payment functions | `mock` or `clover` |
| `MOCK_WEBHOOK_SECRET` | Mock provider | Any long random string; never leaves the deployment |
| `CLOVER_ENV` | Clover provider | `sandbox` or `production` |
| `CLOVER_MERCHANT_ID`, `CLOVER_PRIVATE_TOKEN` | Clover provider | Ecommerce private key or OAuth token |
| `CLOVER_WEBHOOK_SECRET` | Webhook handler | The Hosted Checkout signing secret |
| `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` | Storage module | Base ID is the `app…` ID |
| `SITE_ORIGIN` | Build | Leave unset until the domain cutover; unset keeps every page noindex |

- **A changed variable needs a redeploy.** An existing deployment keeps the
  values it was built with. An empty commit to `review` does it.
- **The mock is refused in production.** With `PAYMENT_PROVIDER=mock` and
  `VERCEL_ENV=production`, every function refuses to start. The mock can only
  ever run on a preview.
- **Deployment protection is off for Preview** so Clover and the client can
  reach it. Production protection is separate.
- **`outputDirectory` is the repo root**, so every file in the repo is publicly
  readable, including function source and `data/programs.json`. Nothing secret
  or private may be committed.
- **`/api/config-check`** is a preview-only diagnostic: provider name, which
  variables are set (booleans), and a registration's status, amount and order ID
  by registration or session ID. It returns 404 outside a preview. It is still
  publicly readable on any preview, which is a launch blocker below.

## Live payment test protocol

One real payment proves the path; it costs $30 and is voided after. A person
pays on their own card; the agent writes code and reads results, and never
enters card details.

1. Set the Clover variables on Preview, `PAYMENT_PROVIDER=clover`, and redeploy.
2. Check `/api/config-check`: provider `clover`, every variable present.
3. Check Airtable reads and writes work before any money moves: a lookup returns
   rows, and a checkout session creates a `pending` row.
4. Click **TEST URL** in Clover's Hosted Checkout settings. It must say
   "verification succeeded"; anything else means the secret or URL is wrong.
   **Do not pay until it passes.** This step costs nothing and would have saved
   two of Phase 1's three payments.
5. Register for the cheapest option (Monday Hit Night, single session, $30)
   through the real page and pay. Pay within 15 minutes of starting checkout.
6. Read the row back: `confirmed`, amount 30, the Clover order ID stored. The
   page must show "Confirming your payment" before it shows "is registered".
7. Run the adversarial checks with no further payments: unsigned and wrongly
   signed webhooks get 401 and write nothing; an unpaid registration's success
   URL never shows success; a request with a lower amount is priced at the real
   rate.
8. Void the order in the Clover dashboard. Mark or remove the test rows in
   Airtable.
9. **If the first payment fails, stop and diagnose.** Never retry a live charge
   to see if it works the second time.

## Troubleshooting

Every failure met in Phase 1, in the order it was met.

| Symptom | Cause | Fix |
|---|---|---|
| Preview URL redirects to `vercel.com/sso-api` | Vercel Authentication on for Preview | Turn it off for Preview, or send the bypass header |
| Function source readable at `/api/*.js` | `outputDirectory` is the repo root | Accept, and commit nothing private |
| Checkout returns 503 on a deployment | Airtable variables missing | Set them, redeploy |
| Airtable 401, then 403, then 422 | Bad token, then no base access, then a missing field | See Airtable setup; fix in that order |
| Paid, but the row stays `pending`, log shows "unknown session undefined" | Code read the session from `data`; Clover sends `checkoutSessionId` | Fixed: the handler now finds the session by value anywhere in the payload |
| Paid, webhook gets 401, Clover says "verification failed" | Signing secret in Clover no longer matches Vercel | Copy the current secret to Vercel, redeploy, pass TEST URL before paying again |
| A rejected payment never confirms after the fix | Clover does not redeliver after a 401 | Void it; the row stays `pending`, which is accurate |
| A voided payment still shows `confirmed` | Voids and refunds send no webhook | Change the row by hand |
| Each TEST URL click adds an `UNMATCHED-` row | The test body differs per click | Expected; delete those rows |
| A redeploy's first request still shows the old value | The alias is still switching over | Check again a few seconds later, or use the deployment's own URL |

## Before go-live

The target is the site live by 9 October 2026. Phase 2 directions will set the
order; these are the open items Phase 1 left.

### Launch blockers

- [ ] Production variables: `PAYMENT_PROVIDER=clover`, the Clover and Airtable
      variables on Production, `Registrations` as the table
- [ ] Clover webhook URL pointed at the production domain, signing secret copied
      the same sitting, TEST URL passing
- [ ] Domain cutover: set `SITE_ORIGIN=https://dichiarobaseball.com` so pages
      become indexable and the sitemap fills
- [ ] Merge `review` into `main` (Daniel)
- [ ] One live payment on production by the protocol above, then void it
- [ ] Remove `/api/config-check`, or lock it: it is publicly readable on any
      preview and returns registration status and order IDs
- [ ] **Surface repeated signature failures somewhere a person sees.** A run of
      401s on the webhook endpoint currently only reaches the Vercel log, which
      nobody reads unprompted. This is the safeguard against silent failure two
- [ ] **Name who at the academy watches the `unmatched` and `needs_review`
      rows**, and make sure the Airtable view filters on `webhook_note` not
      being empty as well as on `status`, or duplicate payments stay invisible

### Site fixes found in review

- [ ] Point the bare Register buttons (header, menu, footer, contact, camps
      page) at the camps page; today they land on "We could not find that
      program"
- [ ] Fix "Program details" links, which all open the Infield Camp page
- [ ] Stop selling options whose sessions have passed (the Hit Night September
      package)
- [ ] Remove the fake "Signed 4 August 2026" row on the waiver step and the code
      link on the Infield page
- [ ] Confirmation copy promises emails that are not sent: send them, or change
      the copy

Design and copy issues are tracked separately in the design and copy punchlist,
including the success page timeline labels, the navigation wrapping, and the
missing third state for a registration that cannot be confirmed. Work them in
one pass rather than piecemeal.

### Decisions for Michael

- [ ] Two-payment option: how the second $475 instalment is collected
- [ ] Flyer questions in `programs.json`: the Hit Night price error, Infield
      Superdome dates, missing photo consent paragraphs

### Later, not launch-blocking

- [ ] Town and league codes (the Ridgewood rate lives only in the 21 September
      meeting notes)
- [ ] Store the second contact, typed waiver signature and signing date
- [ ] Rate-limit the checkout endpoint; clean up abandoned `pending` rows
- [ ] Handle Clover refund events, or accept that refunds are a manual status
      change
- [ ] Confirmation email: send from the site, push the contact to Constant
      Contact. **Needs SPF and DKIM on dichiarobaseball.com before launch or the
      mail lands in spam.** Not in the original scope

## Sources

- Configure Hosted Checkout webhooks
- Create a Hosted Checkout session request
- Create checkout, API reference
- Clover developer environments
- Customize a Hosted Checkout page
- Captured live webhook payloads and Airtable rows, 30 September to 1 October
  2026
