# Taking payments on a static site - principles

Box to Box Design. Written 1 October 2026, from the DiChiaro Baseball build.

> **Work in progress.** Drawn from one build that is proven but not yet live.
> These principles held under live payments on a preview deployment; none of
> them has yet survived a production cutover or a second provider. Review this
> once DiChiaro is live, and again the first time it is applied to another
> project.

Provider-agnostic. Everything here applies equally to Clover, Stripe, Square or
anything else that redirects a customer to a hosted payment page and calls a
webhook afterwards. Provider-specific facts belong in a build playbook of their
own, not here.

---

## 1. The rule

**A registration is confirmed when a verified webhook says the payment
succeeded, and at no other moment.**

The redirect back from the payment page is not proof. A customer can pay and
close the tab before the redirect fires. Anyone can type the success URL into a
browser without paying. Both of those happen, and both of them produce a page
that looks like a successful purchase if the redirect is what you trust.

The cost of this rule is an intermediate state. Between paying and the webhook
arriving, the customer sees "confirming your payment" rather than "you are
registered". That is correct, and it is also a design problem you have to solve
rather than ignore. See principle 6.

## 2. The browser sends IDs, the server decides money

The request that starts a checkout carries a program ID, an option ID and a
count. It carries no price, no total, no discount and no amount. The server
recomputes the amount from its own data and ignores anything price-shaped in the
request.

Test this adversarially before you ship. Send `amount`, `amountCents`, `total`
and `price` all set to 1, and confirm the session is still created for the real
figure.

The same pricing function must serve both the display price and the charge. Two
code paths that are supposed to agree will eventually disagree, and the version
the customer saw is the one they will quote back at you.

## 3. One adapter, two implementations

Define a small interface and implement it twice: a mock and the real provider.
Select between them with an environment variable.

    createCheckoutSession({ registrationId, lineItems, amountCents, returnUrl })
      -> { redirectUrl }

    verifyWebhook({ rawBody, headers })
      -> { valid, orderId, status, amountCents }

Build and prove the whole money path on the mock first. Every branch, including
the failure branches, should be exercised before a real card is involved. By the
time you reach the live provider the only thing being tested is the provider.

**Guard the mock.** If the provider is `mock` and the environment is
production, the functions must refuse to start. A mock payment provider running
on a production site is the worst available outcome, and it is one wrong
variable away at all times.

## 4. Match by value, not by key name

When a webhook arrives, you need to find which registration it belongs to. The
obvious approach is to read the session ID from a documented field. Do not do
that.

You already generated and stored the checkout session ID. So flatten the
payload into every value it contains, and look for one that equals a stored
session ID. A value match is exact. It does not depend on the provider's field
naming, it survives the provider renaming things, and it survives documentation
that is wrong or absent.

Log the key path where the value was found. That is how you learn the real
payload shape for free, without needing the provider to publish it.

Apply the same approach to the outcome and the amount. Look for a recognisable
approved value anywhere in the payload. **If you find no recognisable outcome at
all, do not confirm.** An unreadable webhook is not an approval.

The cost of reading a documented field that turns out to be wrong is a customer
who paid and was never registered. The cost of matching by value is about thirty
lines of code.

## 5. The two silent failures

Both of these take the customer's money and record nothing. Both produce
identical symptoms: a paid customer stuck on "confirming your payment", a row
that stays pending, and no error anywhere a person is looking. A future you
debugging this needs to know there are two causes, because finding one and
stopping leaves the other live.

**Failure one: the handler cannot find the registration.** A field name is
wrong, the payload shape changed, or the match logic has a gap. The webhook
arrives, the signature verifies, and the handler answers 200 while quietly
doing nothing.

**Failure two: the signature does not verify.** The signing secret was rotated
in the provider's dashboard and not updated in the environment, or a deployment
is serving an older build with the old value. Every webhook is rejected with 401
before the handler ever looks at it.

Rejecting unverified requests is correct and must not change, because the
webhook URL is public and anyone can post to it. The problem is not the
rejection. The problem is that the rejection is invisible.

## 6. Make every failure leave a trace a person will find

Returning 200 to an unmatched webhook is right, because a retry storm helps
nobody. Returning 200 and saying nothing is how money gets taken with no record.

- An unmatched webhook writes a row a human can see, with the reason and the
  payload, keyed so redeliveries do not pile up.
- A matched webhook that cannot be confirmed, because the amount is wrong or the
  outcome is unreadable, marks the registration for review rather than leaving
  it quietly pending.
- A run of signature failures is surfaced somewhere other than a log file.
  Nobody reads logs unprompted. A counter, a status row, an alert, anything
  that reaches a person.
- Somebody at the client knows which view to look at, and knows that rows
  appearing there mean a customer is waiting.

The last point is the one that gets skipped. A view nobody checks is the same as
no view.

## 7. The intermediate state is a design problem

A customer who cannot be confirmed sits on "confirming your payment"
indefinitely, which is correct behaviour and a dead end as an experience. They
have paid, they are watching a spinner, and they do not know whether their money
is gone.

After a reasonable wait the page must say plainly that the payment went
through, that the registration is being confirmed, and how to reach a human.
Write that copy deliberately. It is the screen that generates the phone calls.

## 8. Testing with real money

One real payment proves the path. It is worth the money and it cannot be
substituted.

- The person pays, on their own card. The agent writes code and reads results.
  It never enters card details and never initiates a payment.
- Choose the cheapest real option available.
- Void or refund immediately afterwards. Do not leave it to later.
- If the first attempt fails, **stop and diagnose**. Never retry a live charge
  to see whether it works the second time. Budget for diagnosis rather than
  repetition: the DiChiaro build took three live payments across two days
  before one confirmed, and every one of those was a diagnostic step, not a
  retry.
- Before paying, prove everything that can be proved for free: the provider
  reaches you, the store reads and writes, the signature verifies on a test
  request.

## 9. Change one thing at a time

Nearly every hour lost on this build came from changing two things and not
knowing which one broke it.

- Environment variables are read at build time on most platforms. Setting one
  without redeploying changes nothing, and produces a confident wrong diagnosis.
- Rotating a secret is three steps in one sitting: copy, set, redeploy. Never
  start it and leave it.
- After a redeploy, verify the new value is live before testing anything that
  depends on it.

## 10. Before a real customer's money is involved

- One live payment has moved a registration to confirmed on production, and has
  been voided or refunded.
- Diagnostic endpoints are removed or locked. Anything readable on a preview is
  readable by anyone who has the URL.
- Nothing secret is committed. If the deploy serves the repo root, the function
  source and every data file are public.
- The failure traces from principle 6 exist, and a named person knows where to
  look.
- Test rows are out of the table the client will use.
- Refunds and voids are accounted for. Most providers do not send a webhook for
  them, so a refunded payment leaves a registration confirmed until somebody
  changes it by hand. Decide whether that is manual or handled, but decide.

---

## What this does not cover

Transactional email, which is its own decision with its own failure modes. The
short version: a confirmation or receipt is transactional, not marketing. Do not
send it from a marketing platform, because the platform's unsubscribe list will
eventually suppress a receipt for somebody who paid. Push the contact record to
the marketing platform, send the receipt from somewhere else, and remember that
sending from the client's own domain needs SPF and DKIM records in place before
launch or the mail quietly lands in spam.
