# Round 18b - Phone hero: a different photo on phones

Small round. Decision made for Daniel (he defers visual calls to us).

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if not pushed.

## The problem (from round 18a)

The coach photo works on desktop. On phones the hero shows the photo's
full height and the coach sits in the lower half, under the headline and
buttons. No focal point fixes that.

## Decision

Art-direct the Home hero: a different photo below 768px.

1. Add `file_mobile` to the image registry. When set, the slot renders a
   `<picture>` with a `media="(max-width: 767px)"` source set from that file
   (its own sizes, WebP plus JPG, same pipeline), and the desktop file for
   everything wider. `focal_mobile` applies to `file_mobile`. Document it in
   the `_about` notes and in `docs/review/image-map.md`.
2. Slot 1 (Home hero): keep `dbsa-19-coach-fielding-drill.jpg` for desktop.
   Set `file_mobile` to `dbsa-20-facility-turf-wide.jpg`, `focal_mobile`
   "50% 40%". Its subject (the far wall, the red D, the lights) sits in the
   upper half, and the empty turf in the lower half sits behind the copy.
3. To avoid the same photo twice on Home, slot 8 (Home image band,
   "Fundamentals first") moves to `dbsa-05-pitching-mound.jpg`, focal
   "50% 50%", alt from the existing slot 32 alt. Slot 37 (Facility band)
   keeps the turf photo.
4. The duplicate check must treat `file` and `file_mobile` both as uses on
   that page.
5. The preload for the hero must preload the right file per breakpoint
   (two preloads with `media`), so phones don't download the desktop photo.

## Check, then report once

At 390, 768, 1024 and 1440 on the preview: Home hero (copy readable, the
logo and lights visible above the copy on phones, the coach in frame on
desktop) and the Home band. Lighthouse mobile on Home: LCP and CLS.
`npm run verify` passes.

Report: preview link and commit, screenshots of Home at 390 and 1440, LCP
and CLS, anything you changed from the above and why. Stop.

End of prompt.
