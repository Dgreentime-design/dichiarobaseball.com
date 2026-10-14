# Round 26: Home video hero

Date: 14 Oct 2026. Branch: `review`. The site is live. This round changes the
Home page hero and nothing else.

## Boundaries

- Work on `review` only. Never merge or push to `main`; Daniel merges.
- Never print secrets. Vercel variables by name only.
- Never touch DNS, MX or mail records.
- Do not edit `pages/instructors.html`.
- Delete nothing. Hide instead, and say where.
- Home hero only. The `.hero` class is shared by Camps, Lessons, Rentals,
  About, Contact, Team camps and Lou's journey. Every change lives under a
  new modifier, `.hero--video`, used only on Home. The header, nav, marquee
  and every other page must render exactly as before.
- Round 24 (design tokens) has not run. Do not start it. Use the existing
  custom properties in tokens.css; no new tokens.
- Stop at the checkpoint and report. Anything outside scope: report, don't
  fix.

## Verdict on round 25

Accepted, on two conditions:
- The premium review gate was still running when round 25 stopped. Read its
  result first. If it flags anything in round 25's scope, fix that and
  report it before starting this round. If it is clean, say so in one line.
- Good calls in round 25: finding that sticky failed with JS off (the nav
  scrolled away) rather than only patching the JS path, and catching
  `semi-private` splitting at the hyphen as the same fault as the time
  ranges. Keep fixing faults at the class level like that.

Commits f72179b and 1922c6a are the base for this round.

## Source of truth

The approved design is the Claude Design canvas "DiChiaro Home Hero"
(desktop 1440 x 720, phone 390 x 760). Every value you need is written
below, so you do not need to open it.

## Assets (already in the repo, uncommitted)

`assets/video/`:
- `dichiaro-hero-desktop-web.mp4`: 1280 x 720, 15s, 30fps, H.264, silent, 4.4 MB
- `dichiaro-hero-mobile-web.mp4`: 720 x 900 (4:5), 15s, silent, 2.4 MB
- `dichiaro-hero-desktop-poster.webp` / `.jpg`: frame at 0.5s
- `dichiaro-hero-mobile-poster.webp` / `.jpg`: frame at 0.5s

Commit them in this round. Check that `build.mjs` and `vercel.json` serve
`assets/video/` with a long cache header like the images, and that `.mp4`
is not ignored by `.gitignore` or `.vercelignore`.

## Tasks

1. Copy (Home hero only, `pages/index.html`):
   - Eyebrow: `Baseball &amp; softball training &nbsp;·&nbsp; Fair Lawn, NJ`
     (CSS sets caps, so it reads BASEBALL & SOFTBALL TRAINING · FAIR LAWN, NJ)
   - Headline (unchanged): `Get better at the game you love.`
   - Lede (unchanged): `Year-round lessons and camps for ages 6 and up,
     taught by coaches who played the game.`
   - Actions (unchanged): primary `See camps and clinics`, ghost
     `Book a lesson`, same hrefs as today.
2. Remove the `Scroll` label from the Home hero only (`.hero__scroll`).
3. Video. Replace the Home hero's photo with a background video:
   - `<video class="hero__video" autoplay muted loop playsinline
     preload="metadata" poster="…" aria-hidden="true" tabindex="-1">` with
     a `<source>` per breakpoint: the mobile file under 768px, the desktop
     file from 768px up. Because `<source media>` is unreliable in some
     browsers, pick the source in site.js on load (and on a breakpoint
     change), with the desktop file as the markup default.
   - The poster shows until the first frame plays: webp, jpg fallback,
     matching the breakpoint. The poster is the LCP element; give it
     `fetchpriority="high"` through a preload link for the desktop and the
     mobile poster with matching `media` queries.
   - No play or pause control. Daniel decided against one.
   - `prefers-reduced-motion: reduce`: never play. Show the poster as a
     still image and do not download the video.
   - Save-Data on, or no autoplay allowed: stay on the poster without errors.
   - `object-fit: cover`. Desktop `object-position: 62% 50%`; phone
     `50% 40%`.
   - The loop is a deliberate cut every 15s. Do not crossfade.
4. Scrim, desktop (768px and up). Darker on the left, nearly clear on the
   right, so the action on the right reads:
   `linear-gradient(90deg, rgba(23,18,15,.95) 0%, rgba(23,18,15,.93) 32%,
   rgba(23,18,15,.84) 44%, rgba(23,18,15,.56) 56%, rgba(23,18,15,.26) 68%,
   rgba(23,18,15,.08) 82%, rgba(23,18,15,.02) 100%)`
   plus a bottom shade `linear-gradient(0deg, rgba(23,18,15,.55) 0%,
   rgba(23,18,15,0) 24%)`. These replace the old scrim for `.hero--video`
   only; the shared `.hero__media::before` stays for every other hero.
5. Layout, desktop: hero height 720px (min 660px when the viewport is
   shorter). Copy column max 760px, left-aligned at the container gutter,
   vertically centred. Gap 24 between items, 12 extra above the actions.
   Display XL headline (fluid, as today), lede body-l `--c-dim`, max 58ch.
6. Layout, phone (under 768px): video at the top, 488px tall at 390 wide,
   with the 4:5 file. Copy anchored to the bottom, padding 0 20 40, gap 20.
   Headline 40px at 390 (keep it fluid). Both buttons full width, stacked,
   gap 12, min height 48. Scrim rises from the bottom:
   `linear-gradient(0deg, rgba(23,18,15,1) 0%, rgba(23,18,15,.97) 40%,
   rgba(23,18,15,.78) 52%, rgba(23,18,15,.34) 64%, rgba(23,18,15,.08) 78%,
   rgba(23,18,15,0) 100%)`. Total hero height about 760px at 390.
7. Load animation, once per page load, never on scroll or repeat:
   - Eyebrow, headline, lede and actions each rise 16px and fade in over
     `--dur-reveal` (600ms) on `--ease-reveal`. Delays 150, 250, 380 and
     500ms.
   - The video fades in over 900ms on `--ease-reveal` once it can play;
     until then the poster shows.
   - Start the copy hidden only when JavaScript is running (a class on
     `<html>`), so the copy is never invisible without JS.
   - Reduced motion: no movement, no fade, copy visible at once.
   - Use CSS for the motion. Do not reuse the band reveal observer for the
     hero.
8. Accessibility: the video is decorative (`aria-hidden`, no tab stop). The
   headline stays the page's only `h1`. Lede contrast holds 4.5:1 over the
   brightest frame of all three clips at 1440 and 390. Measure it and
   report the lowest ratio.

## Verify

1. Screenshots at 1440, 1024, 768 and 390 of the Home hero: one at load
   (poster), one mid-animation, one at rest with the video playing, taken at
   about 2s, 7s and 12s so all three clips show.
2. Reduced motion on: no video request in the network panel, poster shown,
   copy static.
3. Regression: screenshot the hero of Camps, Lessons, Rentals, About,
   Contact and Lou's journey at 1440 and 390, before and after. They must be
   identical. Paste a pixel diff summary.
4. Performance, Home at 390, Lighthouse mobile, median of three runs on
   the preview, measured the same way as round 25 (live 4.01s, round 25
   preview 4.31s; both noisy between about 1.7s and 4.2s):
   - LCP (the poster) no worse than 4.31s, and report what is holding it
     above 2.5s. Findings only; do not chase it in this round.
   - CLS 0.
   - The video must not count toward LCP or block it: it starts loading
     only after the poster has painted.
   - Report total bytes before first interaction and the network timing
     of the mobile mp4.
5. The mobile file loads on phones and the desktop file loads on desktop,
   never both.
6. `verify.mjs` passes. No horizontal scroll at 390.

## Report

1. Step 0 notes: where the shared hero styles live and how `.hero--video`
   is scoped.
2. Each task: done, files and lines.
3. Screenshots from Verify 1 to 3.
4. Lowest lede contrast measured, and on which frame.
5. Performance numbers and the video byte sizes as served (compressed or
   not).
6. Commits and the preview URL:
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/

## Out of scope (report, don't fix)

- Any other hero, the header, nav, marquee or announce bar.
- A play/pause control (decided against).
- Re-encoding the videos. If a file is too heavy, report the numbers and a
  suggested target; Daniel owns the edit.
- Design tokens (round 24) and program page hero weight.

End of prompt.
