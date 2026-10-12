# Round 05 - Capture the real Clover webhook payload

## Context

Round 04 took one real $30 payment through Clover hosted checkout. The payment
succeeded and has since been voided. The registration row DBSA-32W7P94JA6 is
still pending.

Vercel preview logs show exactly one request:

  SEP 30 23:05:10  POST 200  /api/webhooks/clover  "webhook for unknown session undefined"

That is 03:05 UTC, inside the window you polled. It is the real webhook for
that payment. A 200 with that message means the signature check and the
merchant ID check both passed, and the session match failed. The literal
"undefined" means the field you read for the checkout session is absent from
the payload.

The webhook URL in Clover is confirmed correct:
https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/api/webhooks/clover

## Step 0 - project identity check

  pwd
  git remote get-url origin
  git status --porcelain
  git rev-list --left-right --count origin/review...HEAD

Expect the dichiarobaseball origin, a clean tree, and 0 0 after you push this
prompt. If any of that is wrong, stop and report before touching anything.

## Task 1 - confirm the failure point from our own code

Read api/webhooks/clover.js. Confirm in writing that a 200 carrying
"webhook for unknown session" can only be reached after signature verification
and the merchant ID check have both passed. If that is not true, say so
plainly, because then the log evidence means something different and the rest
of this round is built on a wrong premise.

## Task 2 - add temporary diagnostic logging

On the review branch only. Log, for every inbound webhook:

  - the HTTP method
  - every header NAME, never a header value
  - the raw body length in bytes
  - the full parsed JSON body

Hard rules: never log the Clover-Signature value, never log any environment
variable. The payload carries no card data, so logging the body whole is safe.
Keep returning 200.

## Task 3 - deploy to review

Push, wait for the deployment, confirm it is ready.

## Task 4 - stop and hand over

Report that the logging is live and stop. Daniel will click TEST URL in the
Clover hosted checkout settings, which sends a webhook with no payment, and
paste the resulting log line back to you. Do not proceed on your own.

## Task 5 - fix the matching

Once you have the real payload:

  - identify the field that carries the checkout session, the field that
    carries the order ID, and the field that carries the amount
  - read the Clover hosted checkout webhook documentation to confirm those
    field names rather than inferring them from one sample
  - rewrite the matching logic to use them

The rule does not change: a registration is confirmed when a verified webhook
says the payment succeeded, and at no other moment. The amount must still be
checked against the server-priced amount.

## Task 6 - make an unmatched webhook loud

Today an unmatched webhook is a silent 200, which is how a taken payment ended
up with nobody knowing. Returning 200 is still correct, since a retry storm
helps nobody. But it must leave a trace a human can find. Propose the smallest
version that works, for example a row in Airtable with a status of unmatched,
and implement it only after stating what you propose.

## Task 7 - remove the diagnostic logging

Strip the Task 2 logging before this round is reported as done. Keep a single
one-line log that records whether a webhook matched, with no payload contents.

## Constraints

  - No payment. Do not create a checkout session. Do not ask Daniel to pay.
  - Do not push to main.
  - Do not touch the signing secret or any environment variable.

End of prompt.
