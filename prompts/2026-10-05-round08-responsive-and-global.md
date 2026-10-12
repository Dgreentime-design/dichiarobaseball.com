# Round 08 - Responsive system, heroes and global navigation

DiChiaro Baseball & Softball Academy. Written 5 October 2026.
Scope: layout, components and global behaviour. No copy changes beyond the
three named in A2. No backend.

Precondition: round 07 is finished (B10 reported) and Daniel has said
"start round 08". If round 07 is not finished, stop and report.

Reference images, committed with this prompt. Open them, do not work from
the descriptions alone:

- `docs/reference/round08/hero-dark-mobile.png` - how the image hero looks
  and behaves on mobile. **Layout reference only.** Its copy ("Real
  instruction...", "twenty-five years", "Find your program") and its coral
  button fill are from an older version. Keep the current approved copy and
  the current desktop button styles.
- `docs/reference/round08/eyebrow-with-icon.png` and
  `eyebrow-icon-closeup.png` - the eyebrow with the baseball icon replacing
  the line. Layout and icon reference only, the copy in it is old.
- `docs/reference/round08/lou-alignment-desktop.png` - the bug in B1.
- `docs/reference/round08/program-schedule.png` - context only, nothing to
  change this round.

---

## Step 0 - identity check

Run and report:

    pwd
    git remote -v
    git branch --show-current
    git status --porcelain
    git fetch origin && git rev-list --left-right --count origin/review...HEAD

Expected: ~/projects/dichiarobaseball.com, remote
Dgreentime-design/dichiarobaseball.com, branch review, clean tree, 0 0.
Any mismatch: stop and report. Do not fix it yourself.

---

## Boundaries, restated in full

1. Work on review only. Push to review. Never push or merge to main. No
   force-push.
2. Edit `pages/`, `partials/`, `assets/css/`, `assets/js/site.js` and
   `assets/img/`. Never hand-edit the generated HTML in the repo root. Run
   `node build.mjs`. `legal.json` is off limits.
3. Do not touch `api/`, `assets/js/register.js` logic, payment code,
   Airtable code or anything in the money path.
4. No copy changes except the three in A2. Facts, prices, dates
   and review notes stay exactly as they are. Every amber review or
   prototype note stays on the page.
5. Content parity: the same words at 390 and 1440. `npm run verify` must
   pass. You may add checks to `verify.mjs`. Never weaken or remove one.
6. Stay unindexed. Do not set `SITE_ORIGIN`.
7. Never use an em dash anywhere, including commit messages and CSS
   comments. Use a hyphen or a comma.
8. Delete nothing a task does not name. Out-of-scope problems become
   findings, not commits.
9. Fix at the source. A shared component is fixed once in the shared rule,
   never patched per page. If a fix needs a page-level override, report why.
10. Stop at each checkpoint.

---

## The responsive rule for this site

Daniel's standing direction: **responsive, not adaptive**, unless breaking
the rule fixes or clearly improves the experience.

Responsive means, at every width from 360 to 1600:

1. **Same content, same order, same hierarchy.** Nothing reordered, hidden
   or duplicated for mobile.
2. **Same component.** One set of markup per component. No mobile-only or
   desktop-only copies switched with `display: none`.
3. **Same visual language.** Same colors, same type styles, same icon, same
   button styles, same overlays. Only size changes, through the existing
   fluid scale, and layout reflows: columns stack, grids wrap.
4. **Same treatment of media.** An image that is a full-bleed background on
   desktop is a full-bleed background on mobile, not a card above the text.

Allowed adaptations, each one recorded in `docs/responsive-decisions.md`:
the menu, horizontally scrolling filter rows, tables that stack, and
anything else you can justify. Each entry says where it is, what changes
between widths, why the adaptation is the better experience, and what a
design change could do to remove it. Daniel reads this file to decide what
to solve in design.

---

# Part A - global, then the heroes

Commit per task. Run `npm run verify` before each push.

## A1. Sticky navigation with a hiding announcement bar

All pages, all widths. Source: `partials/header.html`, `components.css`,
`site.js`.

1. The whole `.site-header` is sticky at `top: 0` at every width.
2. **Scrolling down** past the header's own height: the red announcement
   bar slides up out of view and the nav bar stays pinned. **Scrolling up**
   by any amount: the bar slides back in. At the very top of the page the
   bar is always shown.
3. Move it with `transform: translateY()` on the header, by the bar's
   measured height. Do not animate `height` or `margin`, they cause layout
   shift. The bar wraps to two lines at 390, so measure it with a
   `ResizeObserver` into a CSS custom property, never hardcode it.
4. Motion: 600ms, `cubic-bezier(0.16, 1, 0.3, 1)`. That is Daniel's motion
   system: reveals at 600 to 800ms, ease-out. It reads as a gentle settle.
   Put both values in `tokens.css` as `--dur-reveal` and `--ease-reveal`
   so the curve is a one-line change if Daniel wants ease-in-out.
   `prefers-reduced-motion`: no travel, a 150ms opacity fade only.
5. A scroll listener that is passive and rAF-throttled, with a 6px
   dead zone so trackpad jitter does not flicker the bar.
6. Never hide the bar while the mobile menu is open. If keyboard focus
   enters the bar (its Register link), show it.
7. Everything else that sticks has to sit below the header, not under it.
   Known cases: the camps filter bar (`camps.css`, `top: 0`), the register
   summary (`register.css`), the legal TOC (`legal.css`), the homepage Lou
   image (`home.css`). Give each one `top: var(--header-h)` plus its
   existing offset. Add `scroll-margin-top: var(--header-h)` to anchor
   targets so in-page links (`#code`, `#hittrax`, the team camps form) do
   not land under the header. Find any others.

Proof: at 390 and 1440, scroll down 600px and the bar is gone with the nav
visible. Scroll up 20px and the bar is back. Scroll the camps page and the
filter bar sits flush under the nav. Click "Have a town or league code?" on
the program page and the target is not hidden. Report each one pass or fail.

## A2. Copy changes, the only three

1. Header button (`partials/header.html`): label **Open camps**, href
   `camps-and-clinics.html`. Sentence case, per the copy rules.
2. Mobile menu button (`partials/menu.html`): the same, **Open camps**.
3. Announcement bar link: **unchanged**. It stays "Register" and goes to
   the fall Little League registration. Daniel approved that link on
   3 October.
4. Lou's bio on `pages/instructors.html`: "Owner and instructor since
   2000." becomes "Founder and head instructor since 2000." Decided
   5 October, to match the role line. The rest of the bio stays word for
   word. This is the only bio change.

## A3. Eyebrow: baseball icon and two colors

The eyebrow is one component, `.eyebrow` in `components.css`, used about
60 times. Change the component, not the pages.

1. **Icon.** Replace the 34px line drawn by `.eyebrow::before` with the
   baseball icon at `assets/img/icon-baseball.svg`. It is Daniel's Figma
   export, committed with this prompt: 18 by 18 viewBox, light grey ball
   (`#E6E6E6`) with red seams (`#E86C60`). Use the file as it is, as an
   image (for example `background-image` on the `::before`), so its two
   colors are kept and it does not inherit the eyebrow text color. Do not
   redraw or recolor it. Size it to roughly the eyebrow's cap height, with
   the same gap as today, and keep it the same size at every width. It is
   decorative, so it carries no alt text. `.eyebrow--bare` stays iconless.
2. **Color, two values, set by background, never by breakpoint.**
   - Light backgrounds (bone, surface, white): `#5A524C`, the existing
     `--c-muted` token.
   - Dark and image backgrounds (ink, panel, every image hero):
     `#E15C57`, the existing `--c-red-bright` token. Daniel chose this over
     `#CB2923` on 5 October because `#CB2923` is about 3.4:1 on the dark
     background, below the 4.5:1 AA minimum at eyebrow size.
   - Drive it with one custom property, for example `--eyebrow-color`, set
     on the dark section and hero classes. Remove the scattered per-page
     overrides (`home.css` `.hero__copy .eyebrow`, `.eyebrow--dim`, and
     the others) so there is one place that decides the color.
   - If an eyebrow sits on a red band, stop and report it, there is no
     color for that yet.
3. **"In all instances."** Search for elements styled like an eyebrow
   (mono, uppercase, `--t-eyebrow`, a leading line) that do not use the
   `.eyebrow` class. Convert each real eyebrow to the component. List the
   ones you left alone (meta labels, chips, table heads) and why.
4. Add a check to `verify.mjs`: on every page at 390 and 1440, every
   `.eyebrow` has the same computed color at both widths, and that color is
   one of the two values above. This is the proof that the colors match
   between desktop and mobile.

## A4. One image hero, on five pages

Today there are three hero components: `.hero` (image: home, instructors,
program), `.page-hero` (plain dark: camps, lessons) and `.hero-light` (about,
team camps, Lou's journey, contact, rentals).

1. **Fix `.hero` at mobile** to match `hero-dark-mobile.png`. The image
   stays a full-bleed background at every width, under the same dark
   overlay as desktop. It is not a card above the copy. The copy sits on the
   image, left aligned, lower in the frame, in the same order as desktop:
   eyebrow, H1, sub, buttons, then the stat strip where the page has one.
   Buttons stack at mobile at their natural width, or full width if that is
   what the existing button rule does. Keep the desktop button colors.
   Choose `object-position` per page so the subject stays in frame at 390.
   The overlay has to keep the sub text at 4.5:1 or better over the
   brightest part of the image. Measure it and report the number.
2. This fixes the homepage, instructors and the program page at the same
   time, because they share the component. Check all three.
3. **Camps and Lessons move to the same image hero**, the same component
   as Instructors. Images: Camps uses `dbsa-07-little-league.jpg`, Lessons
   uses `dbsa-03-hitting-cage.jpg`. Copy unchanged. Their hero has no stat
   strip, so it ends after the sub, or the buttons if they have any. Retire
   `.page-hero` if nothing else uses it. Report it if something does.
4. **`.hero-light`** stays a light hero on its five pages. Bring it under
   the responsive rule: same order and treatment at every width, image
   handling consistent with the rule above. Report what you changed.

5. **Stat strips, one component.** Round 07 changed the item counts and
   both strips now break at desktop: the Instructors hero strip has two
   items in a four-column grid, so "Since 2000" wraps onto two lines, and
   the About numbers strip has four items in a five-column grid, leaving an
   empty slot. Today there are at least two strip components
   (`.stat-strip` and `.numbers` in `pages.css`), plus the stat rows in
   the Rentals hero and the homepage "Why DiChiaro" band. Make one stat
   component whose columns follow its item count, so it never leaves an
   empty slot or wraps a figure. Keep the figure on one line at every
   width. Use it everywhere a stat strip appears. Report any that could not
   move to it.

Proof: screenshots of the hero on home, instructors, camps, lessons and
program at 390 and 1440, side by side per page.
Add the Instructors and About strips at 390 and 1440.

## A5. Report Part A, then stop

1. Step 0 output.
2. Commits, one line each.
3. The A1 proof list, pass or fail per item.
4. A3: the icon size you set, the overrides you removed, and every eyebrow-like element converted or left, and why.
5. A4: the hero screenshots, the overlay contrast numbers, and what
   happened to `.page-hero`.
6. Verify output, including the new eyebrow check, and the preview URL.
   Confirm the preview is serving your last commit, not an older build.

**Stop here.** Part B starts only when Daniel says "continue to Part B".

---

# Part B - page fixes and the responsive sweep

## B1. Program page, "Who teaches it" alignment

Bug, desktop: the Lou copy column starts below the bottom of the image
instead of beside it (see `lou-alignment-desktop.png`).

Root cause, already found: `home.css` loads on every page and sets
`.lou__copy { grid-column: 2; grid-row: 2; }` for the homepage Lou section.
`program.html` reuses the class `lou__copy` inside `.instructor-split`, so
the homepage rule pushes the copy into row 2. Fix it by scoping the
homepage rules to the homepage section, not by adding an override in
`program.css`.

Proof: at 1440, the top of the eyebrow aligns with the top of the image.
At 390 the image stacks above the copy, unchanged.

Because every page stylesheet loads on every page, look for other selectors
that leak the same way: a class defined in one page's CSS and used with a
different meaning on another page. List each one. Fix the ones that cause a
visible problem and report the rest.

## B2. Rentals, "What you can rent" first

Today the hero section holds the eyebrow, H1, lede, the large image and
the stat strip, followed by "What you can rent".

1. The eyebrow, H1 and lede stay at the top of the page. The H1 has to be
   the first heading.
2. "What you can rent" (the three rental cards) comes next.
3. The large image and the stat strip (5,500, $35, $60, 365) move to
   directly after "What you can rent", as their own block, unchanged.

If that split cannot be made without new markup patterns, stop and report
rather than inventing a component.

## B3. Instructors, no booking buttons

Round 07 B5 removed the booking button from every instructor card. Confirm
none remains, at both widths, including Gianna's card. "See Lou's camps"
stays. Report only, unless one slipped through.

## B4. The responsive sweep

Walk every page at 390, 768 and 1440, all ten pages plus the three legal
pages. Measure each against the responsive rule above.

1. Fix every clear breach: content hidden or reordered by breakpoint,
   duplicated mobile markup, colors or type styles that change by width,
   media treated differently by width.
2. Where breaking the rule is the better experience, keep it and record it
   in `docs/responsive-decisions.md`.
3. Where you are not sure, record it as an open question in the same file
   and do not change it.
4. Commit per page.

## B5. Report Part B, then stop

1. Commits, one line each.
2. B1 before and after at 1440, and the list of leaking selectors.
3. B2 before and after at 390 and 1440.
4. B3 result.
5. B4: the list of breaches fixed, per page, one line each.
6. The full contents of `docs/responsive-decisions.md`.
7. Final verify output and the preview URL.

**Stop.** Then update section 8, "Where things stand", in
`docs/build-thread-briefing.md` and commit that on its own.

---

## Out of scope, report but do not fix

- Any copy change other than A2, including the old copy shown in the
  reference images.
- The Superdome split lines and the Feb 6 question.
- "See dates and details" opening the Infield Camp for every program. The
  program template routing is its own round.
- Review notes and prototype notes, which come off at launch prep.
- The money path, `/api/config-check`, the confirmation email.
- Clean URLs, `netlify.toml`.
- Giving the `.hero-light` pages an image hero. Recommend it if you think
  it is right, do not build it.

End of prompt.
