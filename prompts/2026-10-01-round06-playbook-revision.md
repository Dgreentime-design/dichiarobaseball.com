# Round 06 - Playbook revision

## Context

Two documents are now sitting in docs/ in this working tree, placed there
outside of git. They replace the single playbook you wrote:

  docs/clover-hosted-checkout-playbook.md   revised version of your playbook
  docs/payments-integration-principles.md   new, provider-agnostic

The split follows Daniel's standing rule that methods stay platform-agnostic
and platform gotchas live in separate build playbooks. The principles document
names no provider and would carry onto a Stripe or Square build unchanged.

What changed from your version:

  - The transferable method was extracted into the principles document.
  - The two silent failure modes, the webhook key mismatch and the signing
    secret drift, are now named as a class rather than sitting as two separate
    troubleshooting rows. They produce identical symptoms, so a reader who
    finds one and stops leaves the other live.
  - By-value webhook matching is stated as a principle with its rationale,
    rather than appearing only in the build log and a troubleshooting row.
  - The opening says three live payments across two days, all voided, not one.
    A reader budgeting a Clover build needs to know diagnosis costs more than
    one clean test.
  - The captured webhook payload is included in full.
  - Two launch blockers were added: surfacing repeated signature failures
    somewhere a person sees, and naming who at the academy watches the
    unmatched and needs_review rows.
  - Design and copy items now point at the punchlist rather than being
    duplicated, so the two cannot drift.
  - Both documents carry a work in progress note. They get reviewed and
    rewritten once the site is officially live.

## Step 0 - project identity check

  pwd
  git remote get-url origin
  git status --porcelain
  git rev-list --left-right --count origin/review...HEAD

Expect the dichiarobaseball origin, the review branch, and the two files under
docs/ showing as untracked. Stop and report anything else.

## Task 1 - read both documents

Read them before committing. Do not edit them. If you find a statement that is
factually wrong about this codebase, report it rather than correcting it
silently. Daniel owns the wording.

## Task 2 - commit and push

Commit both to review with a message naming what they are. Push.

## Task 3 - sync wherever else the playbook lives

You published the original playbook somewhere outside this repo. Find it,
replace its content with docs/clover-hosted-checkout-playbook.md so the two
cannot drift, and add the principles document alongside it.

From this point the repo is the source of truth for both. Anything published
elsewhere is a copy of what is in docs/.

Tell me where the published copies live.

## Task 4 - report

Short report: the commit SHA, where the published copies are, and anything in
either document you believe is wrong.

## Constraints

  - Do not edit the documents.
  - Do not push to main.
  - No deploys. This round changes no code.

End of prompt.
