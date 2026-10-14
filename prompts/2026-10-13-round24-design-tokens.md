# Round 24: design tokens as the single source

Date: 13 Oct 2026. Branch: `review`. Do not merge or push to `main`.

## Why

The design system is now locked in Figma (DiChiaro Design System,
https://www.figma.com/design/Pya5eSt7JhqI8NzDwO8b2e). Its variables mirror
`assets/css/tokens.css`. From here on, one file in the repo is the source of
truth and every output (site CSS, email, PDF, Figma) is generated from or
checked against it. This round creates that file. It must not change how the
live site looks.

## Step 0

Read `CLAUDE.md`, `assets/css/tokens.css`, `assets/css/base.css`,
`assets/css/components.css` and `build.mjs`. Note the current `tokens.css`
byte for byte; you will diff against it.

## Build

1. Create `tokens/tokens.json` in W3C DTCG format (`$value`, `$type`,
   `$description`). Groups, names matching the CSS custom properties:
   - `color`: every `--c-*` value, plus a new `red-hover` = `#B02019`.
   - `font`: `sans` (Archivo stack), `mono` (JetBrains Mono stack).
   - `type`: each `--t-*` size, keeping the phone and desktop ends of every
     clamp as `min` and `max` (px), plus line heights and letter spacing.
   - `space`: `--s-1` to `--s-14`.
   - `radius`, `layout` (container, gutter min/max, band-y min/max, tap),
     `motion` (ease, dur-reveal, ease-reveal, ui 180ms).
   - Semantic aliases where the CSS already uses them (`--c-focus` ->
     `{color.red}`).
2. Add `scripts/build-tokens.mjs` (no new dependencies) that writes:
   - `assets/css/tokens.css`: same custom property names, same values,
     same clamp() expressions, same order and comments. Add
     `--c-red-hover`. Header comment: generated, edit tokens.json.
   - `tokens/build/email.json`: flat hex colours, px sizes, email-safe font
     stacks (Archivo falls back to Arial/Helvetica; mono to Courier New).
     No CSS variables, no clamp.
   - `tokens/build/print.css`: `@page` (Letter, 0.6in margins) and a
     `:root` block in pt for PDF and flyer templates.
3. Wire it in: `npm run tokens` runs the script; `build.mjs` runs it first so
   the build always uses fresh tokens.
4. Replace the two hard-coded hovers with the token:
   `components.css` `.btn--primary:hover` and `instructors.css`
   `.person__toggle:hover` -> `var(--c-red-hover)`. CSS only; do not edit
   `pages/instructors.html`.
5. Add `docs/design-system.md`: where the source lives, how to change a token
   (edit tokens.json, run npm run tokens, commit both), the Figma file link,
   and the rule that Figma follows the repo, never the reverse.

## Verify

1. `diff` old vs new `tokens.css`: only the header comment and the added
   `--c-red-hover` line differ. Paste the diff.
2. Rebuild, run `verify.mjs`, then screenshot Home and Lessons at 1440 and
   390 on the preview. No visual change; primary button hover still #B02019.
3. `grep -rn "#B02019" assets/css` returns only generated or minified files.

## Report

1. Step 0 notes.
2. The tokens.css diff.
3. Token counts by group, and anything in the CSS you could not express
   cleanly in DTCG (say how you handled it).
4. Verify results and screenshots.
5. Commits and the preview URL:
   https://dichiarobaseballcom-rgr6-git-review-box-to-box-product-design.vercel.app/

## Out of scope (report, don't fix)

Any value change, new tokens beyond red-hover, the hero video, email or PDF
templates themselves, page copy.

End of prompt.
