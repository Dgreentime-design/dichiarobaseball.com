# Responsive decisions

The rule for this site is responsive, not adaptive: the same content, order,
components, colors, type styles and media treatment at every width from 360
to 1600. Only size changes, through the fluid scale, and layout reflows.

This file records every place the site breaks that rule on purpose, and every
open question. Each entry says where it is, what changes between widths, why
the adaptation is the better experience, and what a design change could do to
remove it. Daniel reads it to decide what to solve in design.

Started in round 08 Part A, completed by the Part B sweep: every page plus
the three legal pages, at 390, 768 and 1440, and every breakpoint rule in
the stylesheets read against the rule.

---

## Adaptations kept

### 1. Image hero overlay follows the copy

- **Where:** `.hero` and `.hittrax` in `assets/css/home.css`, one shared
  scrim rule. The image hero on the homepage, Camps, Lessons, Instructors
  and the program page, and the homepage HitTrax band.
- **What changes:** the image is a full-bleed background under a dark ink
  scrim at every width. On a wide screen the copy is a column on the left,
  so the scrim runs left to right and holds its darkest value to the end of
  the 820px copy column. Below 900px the copy runs the full width at the
  bottom of the frame, so the image takes a light dim and the scrim rises
  from the bottom behind the copy block, fading out above it. On a phone
  at least 200px of photograph always shows above the copy, so a tall
  block of copy (the program page, HitTrax) never hides the image.
  Round 10: on a phone the image hero's dim is lighter over its top half
  (8% to 35% height, rising to 32% by 60%), so the photograph reads clearly,
  and the hero buttons sit at their natural width, stacked and left
  aligned. Sub text measured at 5.88:1 or better at the brightest pixel at
  390 on all five pages.
- **Why:** one fixed overlay cannot do both. Measured on all five pages, the
  desktop gradient alone left the sub text at 1.35 to 2.66:1 on a phone,
  because the copy runs into the light side of the gradient. Darkening the
  whole image to compensate hid the photograph at both widths. Anchoring the
  scrim to the copy keeps the sub text at 5.57:1 or better at the brightest
  pixel (measured at 390, 1024, 1440 and 1600 on all five pages), and keeps
  the photograph visible where there is no copy. On wide screens the scrim
  eases out over 720px on a smoothstep curve, so it has no visible edge.
- **To remove it in design:** give the sub text a lighter color than
  `#A8A099` (bone, for example), which needs far less scrim, or give the
  copy its own solid panel on the image at every width.

### 2. "Scroll" cue on the image hero

- **Where:** `.hero__scroll`, homepage only.
- **What changes:** shown bottom right from 900px up, hidden below.
- **Why:** on a phone the copy sits at the bottom of the frame, where the cue
  would collide with the buttons, and a phone user scrolls without being
  told. It is decorative and hidden from assistive technology, so no content
  is lost.
- **To remove it in design:** drop the cue at every width, or place it where
  it cannot meet the copy.

### 3. Mobile menu

- **Where:** `partials/menu.html`, `.nav__toggle` in `components.css`.
- **What changes:** below 1024px the nav links, the two social icons and the
  header button are hidden and the toggle opens a full-screen menu. The menu
  is a second set of markup: the same five links plus Contact, Open camps,
  Call (201) 773-6858, the social icons and the address.
- **Why:** five links, two social icons and a button do not fit across a
  phone, and the menu is where a phone user expects to find them.
- **To remove it in design:** not recommended. This is the standard pattern.

### 4. Filter pills scroll sideways

- **Where:** `.filters__pills` in `camps.css`, on Camps and Instructors.
- **What changes:** below 768px the pills sit on one row that scrolls
  sideways, with the scrollbar hidden, instead of wrapping.
- **Why:** seven pills wrapped onto three rows push the programs below the
  fold, and the bar is sticky, so three rows of it would cover a third of a
  phone screen.
- **To remove it in design:** fewer filters, or a single "Filter" control
  that opens the choices.

### 5. Semi-private rate table stacks

- **Where:** `.rate-table` in `pages.css`, on Lessons.
- **What changes:** below 768px each row becomes a card, the column heads
  are visually hidden (still read by screen readers) and each cell carries
  its column name as a label.
- **Why:** five columns of prices cannot be read at 390. The labels keep
  every number tied to what it means.
- **To remove it in design:** show fewer columns (group size, per player,
  ten pack), which fit a phone as a table.

---

## Checked and left as layout reflow, not a breach

- Sticky elements become static once their layout stacks: the homepage Lou
  image, the register summary, the legal contents. Sticking only makes sense
  beside the content it follows.
- The register progress rule between steps becomes a short connector when
  the steps stack. It is decoration with no content.
- Program page skills: three across, unless four or five fills every row
  (ten skills are two rows of five, eight are two rows of four). Those drop
  to two across below 1180px, and every count drops to one below 600px.
- The footer spacer, a layout element with no content, is dropped when the
  footer stacks.

## Fixed in the sweep

- Footer: the legal links jumped above the copyright below 1024px. They now
  keep their order.
- Homepage HitTrax band: the photograph was a full-bleed background from
  900px up and a card above the copy below. It is now a background at every
  width, on the image hero's scrim rule.
- Homepage Why DiChiaro: the photograph jumped above the eyebrow and heading
  below 640px. It now keeps its place after the stat strip.
- Register progress labels: they dropped to a fixed 9px with tighter
  letter spacing below 768px. They are now 12px with the same spacing at
  every width, and wrap under their markers on a phone instead of shrinking.
  Decided by Daniel, 5 October.

---

## Open questions

### 1. Eyebrow on the green confirmation band

- **Where:** `.confirm-band` on the register confirmation screen.
- **The question:** neither approved eyebrow color reads on the green band
  (`#E15C57` is 2.99:1, `#5A524C` is 1.4:1). It keeps the light green it
  had, `#9FD6B4` at 6.51:1, set through `--eyebrow-color`. It needs a
  decision: a third approved value, or a different background.
