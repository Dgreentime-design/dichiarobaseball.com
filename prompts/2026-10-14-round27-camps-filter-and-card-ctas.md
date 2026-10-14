# Round 27: Camps filter bar and program card buttons

Date: 14 Oct 2026. Branch: `review`. The site is live and Daniel wants this
round, together with round 26, live today. Small, exact, verified.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records.
- Do not edit `pages/instructors.html`.
- Delete nothing. Hide instead, and say where.
- Touch only the Camps filter bar and the program card buttons. The Home
  video hero from round 26 is approved as built: do not change it.
- Round 24 (design tokens) has not run. Do not start it.
- Stop at the checkpoint and report. Anything outside scope: report, don't
  fix.

## Verdict on round 26

Approved as built, including the scrim that follows the lede, the 2px
video trim and the poster-first source loading. The autoplay failure Daniel
saw was Chrome blocking it on his machine, not the build. LCP at 4.37s
against live 4.06s is accepted as noise for now; speed gets its own round.

## Why this round

The filter bar is too tall. On a phone it takes about a third of the screen
under the sticky header before any program shows, and on desktop it wraps
to two rows. Families know how filter pills work; the programs are what
they came for. The goal is the shortest possible bar, one row, always.

## Tasks

### A. Filter bar (camps-and-clinics.html, camps.css, site.js)

1. Remove the visible `Filter` label and the visible `Showing N` count.
   - Keep the accessible name: the pill group gets
     `aria-label="Filter programs"` in place of `aria-labelledby`.
   - Keep the count for screen readers only: the `data-filter-count`
     element stays, with `aria-live="polite"`, but visually hidden
     (`.visually-hidden`), so a filter change is still announced.
   - The `No programs match those filters` empty state stays as it is.
2. One row at every width, never wrapping. The pills become a horizontal
   scroller:
   - `flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x proximity;`
     each pill `flex: none; scroll-snap-align: start`.
   - Hide the scrollbar (`scrollbar-width: none` and the webkit rule), keep
     it scrollable by touch, trackpad, shift-wheel and keyboard (Tab moves
     through pills; the focused pill scrolls into view).
   - At the right edge, when more pills are hidden, show a short fade
     (about 32px, `--c-bone` to transparent) as the scroll cue. Hide the
     fade once scrolled to the end. If every pill fits (wide desktop), no
     fade and no scroll.
   - The scroller bleeds to the screen edge on phones (gutter inside the
     scroll, not outside it), so pills slide off the edge rather than
     stopping short of it.
3. Minimum height. Bar padding 12px top and bottom (was 20). Pills keep
   their 44px tap height and current type; gap 8. Target: the whole bar
   is 69px tall (12 + 44 + 12 + 1px rule) at every width. Report the
   measured height at 1440, 1024, 768 and 390.
4. The bar stays sticky under the header, as it is today, and anchor jumps
   still land below both.
5. When a pill is chosen, scroll it fully into view inside the bar
   (`scrollIntoView({inline: "nearest", block: "nearest"})`) so the active
   pill is never half hidden.

### B. Program card buttons, phones only (under 768px)

6. Camps cards (`.card--wide .card__actions`): primary reads `Register`,
   secondary reads `More information`. On 768px and up the labels stay as
   today (`Register for this camp`, `See dates and details`).
7. Home program cards (`.card__action`): on phones the primary reads
   `Register`, and the arrow link reads `More information`. Desktop labels
   unchanged. This also fixes round 26's finding that `Register for this
   camp` wraps at 390.
8. Do it once, in markup and CSS, not with JS: each button holds a short
   and a long label span, toggled at 768px. Every button and link keeps a
   full accessible name with the program in it, for example
   `Register for Little League Training Camp` and
   `More information about Little League Training Camp`, through a
   visually hidden span or `aria-label`. Screen readers must never hear
   only `Register` or `More information` without the program name.
9. No button label wraps to two lines at 390, 360 or 320. Check every
   program card on Home and Camps, including cards that are hidden by the
   default filter.

## Verify

1. Before and after screenshots of the Camps filter bar at 1440, 1024, 768,
   390 and 320, at rest and scrolled to the end, with the fade visible
   where pills are hidden.
2. Phone shot at 390 of the first Camps card: how much card content is
   visible below the sticky header and bar, before and after. Report the
   gain in px.
3. Keyboard: Tab through all seven pills at 390; each comes into view and
   shows the focus ring. Screen reader name check for every card button
   (axe or the accessibility tree), pasted as a list.
4. Filtering still works: each pill, the count announcement, the empty
   state and `Clear filters`.
5. Regression: no other page changes. Pixel diff Home (outside the program
   cards), Lessons, Rentals and About at 1440 and 390.
6. `verify.mjs` passes. No horizontal page scroll at 320 or 390 (the pill
   scroller scrolls, the page does not).

## Report

1. Step 0 notes.
2. Each task: done, files and lines.
3. Filter bar heights at each width, and the content gain at 390.
4. Screenshots and the accessible name list.
5. Commits and the preview URL:
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/
6. Confirm `review` holds rounds 25, 26 and 27 and is ready for Daniel to
   merge to `main`, with the list of commits that will go live.

## Out of scope (report, don't fix)

- The Home video hero (approved).
- Re-encoding the hero videos.
- Page speed (its own round).
- Any other button, card or page.
- Design tokens (round 24).

End of prompt.
