# DiChiaro Baseball & Softball Academy - working rules

Read `docs/build-thread-briefing.md` before starting any round. It carries the
current state, the architecture and what is in flight.

This file is the standing rules. They do not change between rounds.

## The repo

- Local: `~/projects/dichiarobaseball.com`
- Remote: `Dgreentime-design/dichiarobaseball.com`
- Branches: `main` is production. `review` is where all work happens and is
  the client review preview.

## Branch discipline

- Work on `review`. Commit to `review`. Push to `review`.
- **Never push or merge to `main`.** Daniel merges. A local hook,
  `builder-guard.mjs`, blocks it anyway.
- Never force-push.
- Every push to `review` produces a Vercel preview you can verify yourself.
  Use it. Do not ask Daniel to check something you can check.

## Step 0, every round

Before touching anything, run and report:

    pwd
    git remote -v
    git branch --show-current
    git status --porcelain
    git fetch origin && git rev-list --left-right --count origin/review...HEAD

Expect this repo, branch `review`, clean tree, `0 0`. Any mismatch: stop and
report. Do not fix it yourself.

Never write a commit SHA into a prompt file. It is wrong the moment the file
is committed.

## The build

- Source lives in `pages/` and `partials/`. `build.mjs` resolves
  `{{> partial }}` tokens and writes flat HTML to the repo root.
- **Never hand-edit the generated HTML in the repo root.** Edit the source and
  run `node build.mjs`.
- `legal.json` plus `pages/_legal.html` generate the legal pages. `legal.json`
  is off limits unless a round says otherwise.
- Commands: `npm run build`, `npm start` (builds and serves on 8080),
  `npm run verify` (needs the server up), `npm run dev`,
  `npm run check:payments`.
- `npm start` serves in the foreground. Background it, wait for the port, run
  verify, then stop it. Do not block a round on it.

## Boundaries

1. Stay unindexed. Do not set `SITE_ORIGIN`. It is the switch that makes the
   site crawlable and it is pulled at cutover, by Daniel.
2. No secrets in files. Every credential is a Vercel environment variable read
   from `process.env`. `outputDirectory` is the repo root, so **everything
   committed is publicly readable**, including function source and
   `data/programs.json`.
3. Delete nothing that a round did not ask you to delete. If something looks
   wrong and is not in scope, report it as a finding.
4. Out-of-scope work becomes a finding, not a commit.
5. One stop per round by default. Run the whole round, push, check the
   preview yourself, then report once and stop. Stop early only for: anything
   that would break production, touching the money path when the round is
   not about it, deleting content, or a fact conflict. Extra checkpoints only
   when a round names them.
6. Never use an em dash anywhere, including commit messages. Use a hyphen or a
   comma. This is a hard rule of Daniel's across every deliverable.

## Facts are not copy

Prices, dates, times, ages, session counts, option labels, instructor
credentials and stats are facts. If new copy contradicts `data/programs.json`
or an instructor bio, **the data wins**. Stop and report the conflict rather
than publishing either version.

Aggregate claims ("three draft picks", "more than thirty teams") must be
counted against the source before they are written.

## Metadata

Search and share text must describe the real page.

- A page's `<title>` and meta description are its only source.
  `build.mjs` copies them into `og:` and `twitter:` title and description.
  Never write those tags by hand.
- Any count, price, date, age or program name in a description is
  generated from the data the page renders (`data/programs.json`, the
  cards, `data/program-copy.json`), never typed. Program pages build theirs
  from the program's data. Where a fact cannot be generated, write the
  description without it.
- `npm run verify` checks it: unique titles and descriptions, share tags
  equal to them, 70 to 160 characters, and every number in a description
  also on the page.

## The money path

A registration is confirmed when a verified webhook says the payment
succeeded, and at no other moment. Not on the redirect, not on a page load.

- Do not touch `api/`, the payment code, the Airtable code or the money path
  unless the round is explicitly about it.
- The browser sends IDs. The server prices everything from
  `data/programs.json`.
- `api/_lib/match.js` matches webhooks by value, not by key name. Do not
  "simplify" it back to reading a named field.
- An unmatched or unconfirmable webhook must leave a trace in Airtable. A
  silent 200 is how money gets taken with nothing recorded.

Full detail: `docs/clover-hosted-checkout-playbook.md` and
`docs/payments-integration-principles.md`.

## Evidence, not assertion

Every claim in a report is backed by something: a curl, a browser walk at 390
and 1440, an Airtable row read back, a test shown to fail when the code was
broken. "It should work" is not a report.

Diagnostics return booleans, key names, lengths and error types. Never a
secret, never a header value.

## Speed

- At the start of a round, if prompt files are committed but not pushed,
  push them. Daniel does not run git commands.
- Evidence matches risk. Copy and layout rounds: verify output, the preview
  URL and a short list of what changed. Screenshots only when the round asks,
  saved to `_proof/` (never committed). The money path keeps full evidence.
- Pick the sensible option for small open choices, list them under
  Assumptions, and keep going. Do not stop to ask.

## Reporting

End every round with: Step 0 output, files changed one line each, anything you
could not find or found twice, any fact conflict, verify output, and the
preview URL. Then stop.

Do not ask for feedback on the process. Daniel asks at the end of launch.
