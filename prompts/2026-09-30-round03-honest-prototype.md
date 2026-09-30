# Round 03 - Make the prototype honest before the client sees it

Scope: fix the findings from round 02 where the site tells a parent one thing and does another, plus
one production safety guard. Nothing here is new functionality. Every item is a place where the page
and the truth disagree.

This round runs on the `review` branch, same as round 02.

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
- Never write a secret, token, key or merchant ID into any file in the repository.
- Never invent a price, a date, an address or a policy. If a value is not in `data/programs.json` or
  already in the page, stop and report rather than filling the gap with something plausible.
- Anything outside this round's scope goes in the report as a finding, not a fix.
- Stop at the checkpoint at the end and report.

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
`https://github.com/Dgreentime-design/dichiarobaseball.com.git`, branch `review`, a clean tree, `0 0`.

If any of the five does not match, STOP, write nothing, report and wait.

## Tasks, in priority order

### 1. Register links point at programs that do not exist

`register.html?program=infield-camp`, `?program=little-league-training-camp` and
`?program=monday-hit-night` match nothing in `data/programs.json`, whose slugs are
`infield-camp-2026-27`, `hit-night-fall-2026` and so on. The page silently falls back to Little
League fall, so a parent arriving from the Infield Camp link is registered and charged for a
different program.

Fix both halves:

- Correct every `register.html?program=` link in `pages/` so the slug matches `data/programs.json`.
  Where a link is ambiguous, for example whether "Monday Hit Night" means the fall or winter
  program, report the ambiguity and leave that link alone rather than guessing.
- Make the fallback loud instead of silent. An unknown or missing slug must show a clear "we could
  not find that program" state with a link back to the programs page. It must never quietly render a
  different program. A silent fallback on a page that takes money is how a parent pays for the wrong
  thing.

### 2. The mock provider must be impossible in production

With `PAYMENT_PROVIDER=mock` set on a production deployment, anyone can approve their own
registration without paying. Add a hard guard: if the provider resolves to `mock` while
`VERCEL_ENV === "production"`, the process must refuse to serve, loudly, at startup or on the first
request. Not a warning in a log. A configuration mistake here is free money for whoever notices.

### 3. The DEMO25 code shows one price and charges another

The page shows $180, the server charges $320. Discount codes are out of scope for this round, so do
not build the code system. Either make the displayed total come from the same server calculation
that charges the card, or remove the DEMO25 affordance from the page entirely and report which you
chose. What must not survive this round is a screen showing a total that is not the total.

### 4. `programs.json` publishes a discount rate

The file contains "Ridgewood residents, 10% off", and because `vercel.json` sets
`outputDirectory: "."` the whole repo root is publicly readable, `data/programs.json` included. That
breaks the project's own rule that no rate ever appears publicly.

Remove the public-facing discount text from `data/programs.json` and report where the rate now
lives. Do not build the code system to do it. If the only honest answer is that it needs the code
system to exist first, say so and leave the file alone rather than half-moving it.

### 5. Copy that is no longer true

- `register.html` still says "Nothing is stored, nothing is charged". As of round 02 both are false
  on the online path. Rewrite the note so it describes what actually happens now.
- The check-payment note gives `18-01 Pollitt Drive` as the mailing address. `data/programs.json`
  says checks go to `80 Carnot Avenue, Woodcliff Lake, NJ 07677`, confirmed on all nine flyers.
  Pollitt Drive is the facility, not the mailing address. Correct the page to match
  `data/programs.json`.

### 6. The hard-coded signature date

The waiver signature date is hard-coded to 21 September 2026. Make it the actual date of signing.
A waiver carrying a date the signer was not there for is worthless.

## What to verify

Deploy to `review` and check on the preview URL:

- Every `register.html?program=` link on the site lands on the program named in the link it was
  clicked from. Walk them all, do not sample.
- An invalid slug, for example `?program=does-not-exist`, shows the not-found state and never a
  program.
- The mock guard: confirm by inspection and by test that a production-like environment with
  `PAYMENT_PROVIDER=mock` refuses to serve.
- No total appears anywhere on screen that differs from what the server would charge.
- `curl` the deployed `/data/programs.json` and confirm no discount rate is in it.
- The check-payment address on the page matches `data/programs.json`.
- Your round 02 test suite still passes.

## Report

Numbered, in this order:

1. Step 0 output, verbatim.
2. Task 1: the before and after slug for every link changed, and any link left alone with the reason.
3. Task 2: how the guard works and how you proved it fires.
4. Task 3: which option you chose for DEMO25 and why.
5. Task 4: where the Ridgewood rate now lives, or why you left it.
6. Tasks 5 and 7: the old and new copy, quoted.
7. Verification results.
8. The preview URL.
9. Anything else you found, as findings only.

## Explicitly out of scope, carried to a later round

These are all real and all deferred. Report them if you touch them, do not fix them:

- Discount and town code system.
- Missing form fields: second contact, typed waiver signature storage, coach note as its own field.
- Abandoned `pending` rows never cleaned up.
- Rate limiting on the checkout endpoint.
- Alerting a human on a duplicate payment or an amount mismatch. Currently log only.
- The "two payments" option charging only the first instalment. This needs a decision from Michael
  about how the second is collected, not a fix.
- Clean URLs, `netlify.toml`, the `verify.mjs` gaps.
- Constant Contact, confirmation and reminder emails.

End of prompt.
