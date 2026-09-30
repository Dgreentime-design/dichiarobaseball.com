# Round 04 - Switch to the real Clover provider and prove one payment

Scope: the Clover Hosted Checkout credentials are live on the Preview environment. This round switches
the adapter from mock to Clover, proves one real payment end to end, then switches back to mock and
hands the preview to Daniel for the client review.

This round involves **real money on the academy's live Clover account.** There is no sandbox. Read
the boundaries before anything else.

Runs on the `review` branch.

## Boundaries

Restated in full, every round.

- **You never enter card details, never use a card number, and never initiate a payment.** Daniel
  performs the one checkout by hand, on his own card. Your job is the code and reading the results.
  If a task seems to require you to pay for something, you have misread it. Stop and report.
- **One payment, not two.** If the first attempt fails, report and stop. Do not retry a live charge
  to see if it works the second time.
- This is a client review deployment, not a launch. It must stay unindexed.
- Do not remove or weaken the `noindex, nofollow` meta tag on any page.
- Do not change `robots.txt`.
- Do not set `SITE_ORIGIN` in the Vercel environment.
- Do not change any environment variable yourself. If one is wrong, report it and let Daniel change it.
- Do not disable Vercel deployment protection. It is on deliberately because live payment endpoints
  are deployed behind it.
- Do not push to `main`, do not merge into `main`, do not force-push. Push to `review` freely.
- Delete nothing.
- Work only inside `~/projects/dichiarobaseball.com`.
- Never write a secret, token or merchant ID into any file in the repository.
- Stop at the checkpoint and report.

## Step 0: project identity check

Run and report all five:

```
pwd
git remote get-url origin
git rev-parse --abbrev-ref HEAD
git status --porcelain
git rev-list --left-right --count origin/review...HEAD
```

Expected: `/Users/danielgreenwood/projects/dichiarobaseball.com`, remote
`https://github.com/Dgreentime-design/dichiarobaseball.com.git`, branch `review`, clean tree, `0 0`.
If any does not match, STOP, write nothing, report and wait.

## Environment, already set by Daniel on Preview

Names only. Never print a value, never write one to a file.

```
PAYMENT_PROVIDER=clover
CLOVER_ENV=production
CLOVER_MERCHANT_ID
CLOVER_PRIVATE_TOKEN
CLOVER_WEBHOOK_SECRET
AIRTABLE_TOKEN
AIRTABLE_BASE_ID
AIRTABLE_TABLE_NAME
```

Preview deployments are behind Vercel Authentication. `VERCEL_AUTOMATION_BYPASS_SECRET` is available
to the runtime, and Clover's webhook URL already carries it as the
`x-vercel-protection-bypass` query parameter. Use the same parameter for any request you make to the
preview yourself.

## The one rule, unchanged

> A registration is confirmed when a verified webhook says the payment succeeded, and at no other
> moment.

## Tasks

### 1. Deploy and confirm the configuration reaches the runtime

Push to `review`, wait for the preview deployment, then confirm from the running deployment that the
provider resolved to `clover` and that every variable above is present. Report presence by name and
never by value. If any is missing, stop and report which.

Add a small diagnostic endpoint if you need one, returning only booleans and the resolved provider
name. It must never echo a value. Remove it before the round ends, or gate it so it cannot run
outside preview.

### 2. Settle the webhook registration

Check whether Clover considers the webhook verified. Clover may have sent a verification challenge
when Daniel saved the URL, expecting the endpoint to echo a code back. Round 02's handler was built
for signature verification and may not answer a challenge.

If the webhook is unverified or pending, implement the challenge response, redeploy, and report what
Clover required. If it is already verified, say so and change nothing.

### 3. Verify session creation against the real API

Create a checkout session for the cheapest option in the catalogue:

```
program  hit-night-fall-2026
option   drop-in
amount   $30, recomputed server side, never taken from the request
```

Confirm the adapter reaches Clover's production API, that the response carries a redirect URL, and
that a `pending` row appears in Airtable with the correct amount. This is the first live test of the
Airtable write path, which has never run.

Stop at the redirect URL. Do not follow it, do not pay.

### 4. Hand over for the payment

Report the redirect URL and stop. Daniel opens it, pays $30 on his own card, and tells you when it
is done. Do not proceed past this point on your own.

### 5. Verify the payment landed correctly

Once Daniel confirms he has paid:

- The webhook arrived, its signature verified, and the Airtable row moved `pending` to `confirmed`.
- The recorded amount is $30 and the provider order ID is stored.
- The success page shows a confirmed state only after the webhook, not on the redirect alone.

### 6. Adversarial checks, no further payments

All of these use the one order that now exists. None of them costs money.

- **Replay.** Post the same signed webhook again. Exactly one confirmed registration, no second row,
  no second charge recorded.
- **Bad signature.** Post an unsigned and a wrongly signed webhook. 401 both times, nothing written.
- **Redirect without payment.** Create a second `pending` registration, do not pay it, load the
  success URL directly. It must not show a confirmed state.
- **Tampered amount.** Submit a checkout request with an amount below the real rate. The server
  recomputes and ignores the submitted value.

### 7. Restore mock and hand back

- Report the Clover order ID so Daniel can refund the $30 from the Clover dashboard.
- Tell Daniel exactly which environment variables to change to return to mock, and which Vercel
  setting to change to reopen the preview for Michael. Do not change either yourself.
- Confirm the code path returns to mock cleanly once `PAYMENT_PROVIDER` is changed back.

## Report

Numbered, in this order:

1. Step 0 output, verbatim.
2. Configuration check: provider resolved, variables present by name, preview URL.
3. Webhook registration: verified already, or what you had to implement.
4. Session creation: did it reach Clover, did a `pending` Airtable row appear with the right amount.
5. Payment verification: webhook signature, status transition, recorded amount, order ID.
6. The four adversarial checks, pass or fail.
7. The Clover order ID for the refund.
8. The exact variable and setting changes Daniel needs to make to restore mock and reopen the preview.
9. Anything else you found, as findings only.

## Explicitly out of scope

- Discount and town codes.
- Constant Contact, confirmation and reminder emails.
- Missing form fields, abandoned `pending` cleanup, rate limiting, duplicate-payment alerting.
- The "two payments" option collecting only the first instalment.
- Clean URLs, `netlify.toml`, the `verify.mjs` gaps.
- Any second live payment, for any reason.

End of prompt.
