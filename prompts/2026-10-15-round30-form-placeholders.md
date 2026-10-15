# Round 30: Form placeholder copy, no personal names

Date: 15 Oct 2026. Branch: `review`. Copy only. Approved by Daniel for the
next push to main.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records.
- Do not edit `pages/instructors.html`.
- Delete nothing.
- Change `placeholder` attribute values only. No labels, `autocomplete`,
  validation, ids, names, layout or styles.
- Stop at the checkpoint and report. Anything outside scope: report, don't
  fix.

## Rule

Placeholders never use personal names or real teams. They describe what goes
in the field (whose details) or show a generic format.

## The changes

Exact text, as written. Write apostrophes the way each file already does
(the pages mostly use `&rsquo;`).

`pages/register.html`

| id | Current | New |
|---|---|---|
| `p1-first` | Mia | Player's first name |
| `p1-last` | Rodriguez | Player's last name |
| `g-first` | Elena | Your first name |
| `g-last` | Rodriguez | Your last name |
| `g-email` | elena@example.com | name@example.com |
| `sign-name` | Elena Rodriguez | Your full name |

`pages/contact.html`

| id | Current | New |
|---|---|---|
| `first-name` | Jane | Your first name |
| `last-name` | Rodriguez | Your last name |
| `email` | jane@example.com | name@example.com |

`pages/team-camps.html`

| id | Current | New |
|---|---|---|
| `tc-name` | Jane Rodriguez | Your full name |
| `tc-email` | jane@example.com | name@example.com |
| `tc-team` | Ridgewood 12U softball | Team name and age group, e.g. 12U softball |
| `tc-notes` | Sunday mornings work best. We skip President's week. | Sunday mornings work best. We skip Presidents' Day week. |

Leave every other placeholder as it is (phone `(201) 555 0148`, date
format, `Optional`, `Head coach, 12U`, `14`, `First week of December`, the
coach note and the contact message).

Rebuild so the built root HTML files match.

## Check, don't change

1. Grep the whole repo, excluding `prompts/` and `node_modules`, for `Mia`,
   `Elena`, `Jane`, `Rodriguez` and `Ridgewood`. After the change there
   should be no hits in pages, partials, built HTML, `assets/js` or `data`.
   List any remaining hits (for example in `register.js`, test fixtures,
   `verify.mjs` or docs) and do not change them.
2. Confirm the register form still submits end to end on the preview with
   test data in each step, up to the Clover handoff (do not pay). Pay at
   the facility path through to its confirmation screen.
3. Check the longest new placeholder ("Team name and age group, e.g. 12U
   softball") is not cut off at 390 wide. Report only.

## Verify

1. Screenshots of the three forms with empty fields at 1440 and 390.
2. `verify.mjs` passes.

## Report

1. Every file and line changed.
2. The grep results from Check 1.
3. Screenshots and the results of Checks 2 and 3.
4. Commits pushed to `review` and the preview URL:
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/
5. The full list of commits on `review` not yet on `main`, so Daniel can
   open the pull request from `review` to `main` and merge.

## Out of scope (report, don't fix)

- Any other copy, page or component.
- Labels, helper text and error messages.

End of prompt.
