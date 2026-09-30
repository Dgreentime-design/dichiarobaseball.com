# Round 02 - Payment backend, mock provider first

Scope: build the server side the checkout flow needs, behind a provider adapter, and prove the whole
money path end to end using a mock provider. No Clover credentials are required to complete this
round. Swapping in the real Clover provider afterwards is configuration, not a rewrite.

The current `register.js` is a front-end prototype. It renders the three steps and the confirmation
screens as static copy. Nothing is persisted and no request leaves the browser. This round makes that
flow real.

## Boundaries

Restated in full, every round.

- This is a client review deployment, not a launch. It must stay unindexed.
- Do not remove or weaken the `noindex, nofollow` meta tag on any page.
- Do not change `robots.txt`.
- Do not set `SITE_ORIGIN` in the Vercel environment.
- Do not push to `main`, do not merge into `main`, do not force-push, do not rewrite history.
  Push to `review` freely.
- Delete nothing. If something looks obsolete, report it and leave it.
- Work only inside this repository, `~/projects/dichiarobaseball.com`.
- Never write a secret, token, key or merchant ID into any file in the repository, including
  examples and comments. Secrets are read from `process.env` and nowhere else. `.env*` goes in
  `.gitignore` before you write any code that reads it.
- Never use a real card number anywhere. This round uses the mock provider only.
- Anything outside this round's scope goes in the report as a finding, not a fix.
- Stop at the checkpoint at the end and report. Do not continue into the next piece of work.

## Where this round runs: the `review` branch

This round works on the `review` branch, never on `main`.

A local hook, `builder-guard.mjs`, blocks pushes to `main` and `master` so that publishing waits for
a human. That is deliberate and it stays. But this round needs deployed URLs to verify anything, so
pushing to `review` is how you get them: every push to `review` produces a Vercel preview
deployment, which you can then check yourself without a human in the loop.

So: commit and push to `review` as often as you need. Never push to `main`. Daniel merges `review`
into `main` when he has reviewed the work. If a push to `review` is blocked, stop and report it
rather than trying `main` instead.

## Step 0: project identity check

Before reading or writing anything else, run and report all five:

```
pwd
git remote get-url origin
git rev-parse --abbrev-ref HEAD
git status --porcelain
git rev-list --left-right --count origin/review...HEAD
```

Expected: `/Users/danielgreenwood/projects/dichiarobaseball.com`, remote
`https://github.com/Dgreentime-design/dichiarobaseball.com.git`, branch `review`, a clean tree, and
`0 0`.

No commit SHA is named here on purpose. If any of the five does not match, STOP, write nothing,
report the mismatch and wait. If the branch is not `review`, switching to it is the fix, but report
before you switch.

## The one rule this round exists to enforce

> A registration is confirmed when a verified webhook says the payment succeeded, and at no other
> moment.

The redirect back from the payment page is not proof of payment. A parent can pay and close the tab
without ever loading the success URL, and anyone can load the success URL having paid nothing. Every
design decision below follows from that single rule, so if a task seems to be making things harder
than necessary, this is why.

## Tasks

1. **Verify serverless functions work here before building on the assumption.** `vercel.json` sets
   `outputDirectory: "."` with a custom `buildCommand`, and the repo has no `api/` directory. Add a
   trivial `api/health.js` returning `{ ok: true }`, commit it to `review`, push, wait for the
   preview deployment, and curl `/api/health` on the preview URL. Report the preview URL and the
   response. If `outputDirectory: "."` conflicts with function detection, report the conflict and
   stop rather than restructuring the project unilaterally. Everything else in this round depends on
   this answer, so do not proceed past it on an assumption.

   If the preview URL returns a Vercel login page rather than the site, deployment protection is on
   for preview deployments. Report that and stop. It is a setting only Daniel can change.

2. **Write the provider adapter.** One interface, two implementations:

   ```
   createCheckoutSession({ registrationId, lineItems, amountCents, returnUrl })  ->  { redirectUrl }
   verifyWebhook({ rawBody, headers })  ->  { valid, orderId, status, amountCents }
   ```

   `MockProvider` is selected when `PAYMENT_PROVIDER=mock`. It returns a redirect to a local
   `/api/mock-checkout` page that offers Approve and Decline buttons, and on Approve it posts a
   correctly signed webhook to the real webhook handler. This is what makes the round testable
   without credentials, and it must exercise the real handler, not a shortcut past it.

   `CloverProvider` is selected when `PAYMENT_PROVIDER=clover`. Write it against the Clover Hosted
   Checkout API and its webhook signature scheme, reading every value from `process.env`. It does not
   need to be exercised this round, but it must be complete enough to switch on with only
   configuration.

3. **`POST /api/checkout/session`.** Validates the cart against `data/programs.json` and recomputes
   the amount server side from the program, option and rate IDs. Never trust an amount sent by the
   browser. Creates a `pending` registration record, then calls the provider and returns the
   redirect URL.

4. **`POST /api/webhooks/clover`.** Verifies the signature before parsing anything. Rejects an
   unverified request with 401 and writes nothing. On a verified success, marks the registration
   `confirmed` and records the provider order ID. Idempotent on that order ID, so a retry or a
   duplicate delivery cannot register a child twice or double-charge. Returns 200 quickly, because a
   slow handler gets retried and retries are how duplicates happen.

5. **`GET /api/registration/:id/status`.** Returns `pending`, `confirmed` or `failed`. The success
   page polls this rather than assuming success from the redirect. Show a "confirming your payment"
   state while pending, because on a normal payment the webhook usually arrives within seconds but
   not always before the redirect.

6. **Airtable persistence.** One `Registrations` table, one row per registration, written through a
   thin storage module so the rest of the code never calls Airtable directly. Fields:

   | Field | Type | Notes |
   | --- | --- | --- |
   | `registration_id` | single line text | Our ID, primary field |
   | `status` | single select | pending, confirmed, failed |
   | `program` | single line text | Program name, denormalised for Michael's reading |
   | `option` | single line text | Which purchasable option |
   | `players` | long text | JSON, up to four players |
   | `parent_name` | single line text | |
   | `parent_email` | email | |
   | `parent_phone` | phone | |
   | `amount` | currency | Server-computed, never from the browser |
   | `payment_method` | single select | online, facility, check |
   | `provider_order_id` | single line text | Idempotency key |
   | `waiver_accepted` | checkbox | |
   | `photo_consent` | checkbox | Separate and optional, never bundled with the waiver |
   | `created_at` | created time | |

   `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID` and `AIRTABLE_TABLE_NAME` come from the environment.

7. **Wire `register.js` to the real endpoints.** Keep the existing three-step design and all existing
   copy. The pay-at-facility and pay-by-check paths write a `confirmed` registration directly with no
   provider call, since there is nothing to verify. Only the online path goes through the provider.

## What to verify

Run each of these against a local dev server with `PAYMENT_PROVIDER=mock` and report pass or fail:

- **Happy path.** Complete a registration, approve at mock checkout, confirm the Airtable row moves
  from `pending` to `confirmed` and holds the right amount.
- **Decline.** The row stays `pending` or moves to `failed`, and the success page never claims
  success.
- **Redirect without payment.** Load the success URL directly for a `pending` registration. It must
  not show a confirmed state. This is the rule at the top of this prompt, tested.
- **Duplicate webhook.** Post the same signed webhook twice. Exactly one confirmed registration, one
  charge recorded, no second row.
- **Bad signature.** Post an unsigned or wrongly signed webhook. 401, and nothing written.
- **Tampered amount.** Submit a checkout request with an amount lower than the real rate. The server
  must recompute and ignore the submitted value.

## Report

Numbered, in this order:

1. Step 0 output, verbatim.
2. Task 1 result: the preview URL, whether serverless functions work with the current `vercel.json`,
   and what `/api/health` returned.
3. Files added or changed, with one line each on what they do.
4. The six verification results above, pass or fail, with the failure detail for any fail.
5. Exactly which environment variables the code now reads, by name. Names only, never values.
6. What remains before the Clover sandbox can be switched on.
7. Anything else you found, as findings only.

## Explicitly out of scope

- Constant Contact, confirmation emails, reminder emails.
- Michael's roster view. Airtable's own interface is the roster for now.
- Discount and town codes.
- Team and town camp registration.
- Clean URLs, `netlify.toml`, the `verify.mjs` gaps. Carried from round 01, still deferred.
- Any real Clover credential or live transaction.

End of prompt.
