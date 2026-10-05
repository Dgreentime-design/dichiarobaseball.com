# Responsive decisions

The rule for this site is responsive, not adaptive: the same content, order,
components, colors, type styles and media treatment at every width from 360
to 1600. Only size changes, through the fluid scale, and layout reflows.

This file records every place the site breaks that rule on purpose, and every
open question. Each entry says where it is, what changes between widths, why
the adaptation is the better experience, and what a design change could do to
remove it. Daniel reads it to decide what to solve in design.

Started in round 08, Part A. Part B adds the full sweep.

---

## Adaptations kept

### 1. Image hero overlay follows the copy

- **Where:** `.hero` in `assets/css/home.css`. Homepage, Camps, Lessons,
  Instructors, program page.
- **What changes:** the image is a full-bleed background under a dark ink
  scrim at every width. On a wide screen the copy is a column on the left,
  so the scrim runs left to right and holds its darkest value to the end of
  the 820px copy column. Below 900px the copy runs the full width at the
  bottom of the frame, so the image takes a light dim and the scrim rises
  from the bottom behind the copy block, fading out above it.
- **Why:** one fixed overlay cannot do both. Measured on all five pages, the
  desktop gradient alone left the sub text at 1.35 to 2.66:1 on a phone,
  because the copy runs into the light side of the gradient. Darkening the
  whole image to compensate hid the photograph at both widths. Anchoring the
  scrim to the copy keeps the sub text at 4.86:1 or better at the brightest
  pixel at both widths, and keeps the photograph visible where there is no
  copy.
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
- **What changes:** below 1024px the nav links and the header button move
  into the full-screen menu behind the toggle.
- **Why:** five links, two social icons and a button do not fit across a
  phone. The menu carries the same links, plus Contact and the phone number.
- **To remove it in design:** not recommended. This is the standard pattern.

---

## Open questions

### 1. Eyebrow on the green confirmation band

- **Where:** `.confirm-band` on the register confirmation screen.
- **The question:** neither approved eyebrow color reads on the green band
  (`#E15C57` is 2.99:1, `#5A524C` is 1.4:1). It keeps the light green it
  had, `#9FD6B4` at 6.51:1, set through `--eyebrow-color`. It needs a
  decision: a third approved value, or a different background.
