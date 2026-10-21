# Round 33b: Code button copy, "Find my camp"

Date: 21 Oct 2026. Branch: `review`. Copy only. Follows round 33 (0791a20).

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. No DNS, MX, Vercel, Airtable or Clover changes.
- Do not edit `pages/instructors.html`. Delete nothing.
- This one copy change only. Stop at the checkpoint and report.

## The change

Every team code button: `Find my camps` becomes `Find my camp`.
That covers the Team/Town card on the Camps page, the code block on the
Team camps page, the code step in the register flow, and any JS that sets
the button text back after "Checking..." (it must restore "Find my camp").
Keep the existing uppercase styling, so it renders as FIND MY CAMP.

Grep the repo (excluding `prompts/` and `_proof/`) for "Find my camps" and
"find my camps" and change every user-facing hit. Leave the camp picker
heading ("[Group] camps") and other copy as it is.

Rebuild. As in earlier rounds, if the rebuild only changes the build date
in `programs/*.ics`, restore those and leave them out of the commit.

## Verify (preview)

1. Grep: no "Find my camps" left in pages, partials, built HTML or JS.
2. Camps page, Team/Town filter: button reads FIND MY CAMP at 1440 and
   390, on one line, no wrap or overflow.
3. Enter a wrong code: button shows "Checking..." then returns to
   FIND MY CAMP.
4. Team camps page code block: same label.
5. Test code still opens the picker.
6. `verify.mjs` passes. Screenshots in `_proof/r33b/`.

## Report

Files and lines changed, verify results, commits on `review` not yet on
`main`, preview URL
https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/

End of prompt.
