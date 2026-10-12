# Image map

Round 16, 9 October 2026, with the swap steps added in round 17. Measured on the review preview at 1440 and 390. One row per image slot, numbered so you can say "slot 7: use photo X". Rendered size is the image box in CSS pixels; the current file's own size is in brackets.

## How to swap a photo

Since round 17 every image on the site is read from `data/images.json` by
slot number. Round 23 added slot 48 (Instructors hero), 55 (Camps, Little
League Winter card) and 56 (Gianna Sarlo's card). Slots 49-53 (the other
instructor portraits) still name their files directly. Slots 15-17 and 54
were removed in round 22 with the team cards and Eric Pfisterer.

1. Put the new original in `assets/img/src/` (JPG, sRGB, at least the export
   size below; it is never served as is).
2. In `data/images.json`, change that slot's `file` to the new name. Change
   `alt` if the picture says something different, and `focal` (CSS
   object-position, "50% 50%" is centred) if the subject is off centre. Add
   `focal_mobile` for a different crop on phones (up to 767px wide). When no
   crop of the photo works on a phone, set `file_mobile` to a second original:
   the slot then shows that photo up to 767px wide and `file` above it, and
   `focal_mobile` applies to `file_mobile`. A phone photo that fills a tall
   box by height cannot move up with the focal point alone; `zoom_mobile`
   (for example "1.2") scales it about `focal_mobile`, so "x% 100%" crops
   from the top and lifts the subject. On a hero the preload follows
   (one per breakpoint), so a phone never downloads the desktop photo.
3. Run `npm run build`. It writes the sized WebP and JPG files to
   `assets/img/gen/` (only for originals that changed), rebuilds every page
   that uses the slot, and the files are committed with the pages. Vercel
   never resizes: a swap that was not built locally fails the deploy.

`npm run verify` fails if a slot points at a missing file. It lists any
photo used twice on one page, counting `file` and `file_mobile` both as uses;
that becomes a failure after the photo round.

## Slots

| # | Page | Section | Current file | Rendered size at 1440 / 390 (px) | Aspect ratio | Crop or focal note | Alt text |
|---|---|---|---|---|---|---|---|
| 1 | Home | Get better at the game you love. | `dbsa-19-coach-fielding-drill.jpg` (1428x816); phones up to 767px: `dbsa-20-facility-turf-wide.jpg` (2528x1904) | 1440x660 / 390x665 | 2.18:1 / 0.59:1 | focal point 70% 80%; phone photo focal 68% 100% with zoom_mobile 1.2, which lifts the wall logo above the copy (round 18b) | (empty) |
| 2 | Home | Fall camps and clinics, open now. > Little League Training Camp | `dbsa-28-cages-young-hitters.jpg` (1448x1086) | 409x230 / 344x193 | 16:9 | focal point 50% 60% (round 23) | Young hitters taking swings in the cages |
| 3 | Home | Fall camps and clinics, open now. > Monday Hit Night | `dbsa-30-cage-hitter-wide.jpg` (1448x1086) | 409x230 / 344x193 | 16:9 | focal point 50% 65% (round 23) | A hitter mid swing in a long cage, players waiting their turn |
| 4 | Home | Fall camps and clinics, open now. > Lou DiChiaro’s Infield Camp | `dbsa-33-superdome-fielding.jpg` (1448x1086) | 409x230 / 344x193 | 16:9 | focal point 50% 55% (round 23) | Infielders warming up on the Superdome turf |
| 5 | Home | Every swing, measured. | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 1440x609 / 390x826 | 21:9 / 0.47:1 | centred; crop changes to 0.47:1 at 390 | (empty) |
| 6 | Home | Lessons and rentals, all year. > Private and semi-private lessons | `dbsa-27-cages-coaches-throwing.jpg` (1448x1086) | 220x338 / 344x193 | 2:3 / 16:9 | focal point 50% 60% (round 23) | Coaches throwing batting practice in three cages |
| 7 | Home | Lessons and rentals, all year. > Cage and facility rentals | `dbsa-01-facility-in-use.jpg` (2000x1130) | 220x338 / 344x193 | 2:3 / 16:9 | centred; crop changes to 16:9 at 390 | The full academy floor with the batting nets up |
| 8 | Home | Fundamentals first. Every level welcome. | `dbsa-37-fielding-drill-warm.jpg` (1666x944) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 37% (round 23) | Players working a throwing and fielding drill on the academy turf |
| 9 | Home | Lou DiChiaro | `dbsa-23-softball-players-with-lou.jpg` (1086x1448) | 440x550 / 346x432 | 4:5 | focal point 50% 100% (round 23) | Lou DiChiaro with four softball players in front of the academy logo |
| 10 | Camps | Camps and clinics for ages 6-18. | `dbsa-36-superdome-lou-teaching.jpg` (1448x1086) | 1440x660 / 390x620 | 2.18:1 / 0.63:1 | focal point 50% 45%; phones 33% 50% (round 23) | Lou DiChiaro teaching a group of players at the Superdome |
| 11 | Camps | Program cards > Little League Training Camp | `dbsa-28-cages-young-hitters.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 50% 60% (round 23) | Young hitters taking swings in the cages |
| 12 | Camps | Program cards > Lou DiChiaro’s Infield Camp | `dbsa-33-superdome-fielding.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 50% 55% (round 23) | Infielders warming up on the Superdome turf |
| 13 | Camps | Program cards > Monday Hit Nights | `dbsa-34-hitting-clinic-talk.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 55% 40% (round 23) | Lou talking a large group of hitters through the session |
| 14 | Camps | Program cards > Little League Training Camp | `dbsa-22-superdome-team-talk.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 50% 60% (round 23) | Lou talking to a group of players on the Superdome turf |
| 18 | Program: little-league-fall-2026 | Little League Training Camp | `dbsa-28-cages-young-hitters.jpg` (1448x1086) | 1440x756 / 390x1094 | 1.90:1 / 0.36:1 | focal point 50% 55%; phones 30% 50% (round 23) | (empty) |
| 19 | Program: little-league-winter-2027 | Little League Training Camp | `dbsa-37-fielding-drill-warm.jpg` (1666x944) | 1440x726 / 390x1067 | 2:1 / 0.37:1 | focal point 50% 50%; phones 66% 50% (round 23) | (empty) |
| 20 | Program: little-league-march-2027 | Little League Training Camp | `dbsa-22-superdome-team-talk.jpg` (1448x1086) | 1440x726 / 390x1040 | 2:1 / 0.38:1 | focal point 50% 75%; phones 62% 50% (round 23) | (empty) |
| 21 | Program: infield-camp-2026-27 | Lou DiChiaro’s Infield Camp | `dbsa-36-superdome-lou-teaching.jpg` (1448x1086) | 1440x726 / 390x1040 | 2:1 / 0.38:1 | focal point 50% 45%; phones 33% 50% (round 23) | (empty) |
| 22 | Program: infield-camp-2026-27 | Lou DiChiaro | `dbsa-21-portrait-lou.jpg` (1086x1448) | 440x550 / 346x432 | 4:5 | focal point 50% 100% (round 23) | Lou DiChiaro at the academy |
| 23 | Program: infield-camp-2026-27 | Two venues, one camp. > The academy | `dbsa-18-map-fair-lawn.png` (1600x1067) | 626x352 / 344x193 | 16:9 | centred | Map showing the academy on Pollitt Drive in Fair Lawn |
| 24 | Program: infield-camp-2026-27 | Two venues, one camp. > Superdome Sports Center | `dbsa-33-superdome-fielding.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 50% 55% (round 23) | Infielders warming up on the Superdome turf |
| 25 | Program: hit-night-fall-2026 | Monday Hit Night | `dbsa-30-cage-hitter-wide.jpg` (1448x1086) | 1440x687 / 390x998 | 2.10:1 / 0.39:1 | focal point 50% 80%; phones 15% 50% (round 23) | (empty) |
| 26 | Program: hit-night-winter-2027 | Monday Hit Night | `dbsa-34-hitting-clinic-talk.jpg` (1448x1086) | 1440x660 / 390x1009 | 2.18:1 / 0.39:1 | focal point 50% 50%; phones 70% 50% (round 23) | (empty) |
| 27 | Program: iha-softball-winter-2027 | IHA Softball Training Program | `dbsa-24-iha-softball-team.jpg` (1448x1086) | 1440x726 / 390x1067 | 2:1 / 0.37:1 | focal point 50% 60%; phones 50% 50% (round 23) | The IHA softball team with academy coaches |
| 28 | Program: fair-lawn-hs-softball-2027 | Fair Lawn HS Softball Training Program | `dbsa-31-fielding-drill-turf.jpg` (1665x944) | 1440x726 / 390x1067 | 2:1 / 0.37:1 | focal point 50% 50%; phones 68% 50% (round 23) | (empty) |
| 29 | Program: old-tappan-hs-2026-27 | Old Tappan HS Hitting and Fielding | `dbsa-27-cages-coaches-throwing.jpg` (1448x1086) | 1440x753 / 390x1122 | 1.91:1 / 0.35:1 | focal point 50% 70%; phones 60% 50% (round 23) | (empty) |
| 30 | Lessons | Work on exactly what your player needs. | `dbsa-28-cages-young-hitters.jpg` (1448x1086) | 1440x660 / 390x620 | 2.18:1 / 0.63:1 | focal point 50% 55%; phones 30% 50% (round 23) | (empty) |
| 31 | Lessons | What a lesson costs. > Hitting, fielding, catching | `dbsa-30-cage-hitter-wide.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 50% 65% (round 23) | A hitter mid swing in a long cage, players waiting their turn |
| 32 | Lessons | What a lesson costs. > Pitching | `dbsa-27-cages-coaches-throwing.jpg` (1448x1086) | 626x352 / 344x193 | 16:9 | focal point 50% 65% (round 23) | Coaches throwing to hitters from behind L screens |
| 33 | Lessons | What a lesson costs. > Semi-private lessons | `dbsa-37-fielding-drill-warm.jpg` (1666x944) | 1278x246 / 344x193 | 5.20:1 / 16:9 | focal point 50% 40% (round 23) | Players working a throwing and fielding drill on the academy turf |
| 34 | Facility | Three ways to use the space. > Cage rental | `dbsa-27-cages-coaches-throwing.jpg` (1448x1086) | 409x230 / 344x193 | 16:9 | focal point 50% 65% (round 23) | Coaches throwing batting practice in three cages |
| 35 | Facility | Three ways to use the space. > Full facility rental | `dbsa-31-fielding-drill-turf.jpg` (1665x944) | 409x230 / 344x193 | 16:9 | focal point 50% 50% (round 23) | Players throwing and fielding on the academy turf |
| 36 | Facility | Three ways to use the space. > HitTrax session | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 409x230 / 344x193 | 16:9 | centred | The HitTrax screen mid session with a spray chart visible |
| 37 | Facility | Image band between sections | `dbsa-20-facility-turf-wide.jpg` (2528x1904) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 45% (round 18a) | The academy floor from turf level, with batting cages down both sides and the DiChiaro logo on the far wall |
| 38 | Facility | Every swing, measured. | `dbsa-30-cage-hitter-wide.jpg` (1448x1086) | 520x520 / 346x346 | 1:1 | focal point 15% 50% (round 23) | A hitter mid swing in a long cage, players waiting their turn |
| 39 | Team camps | Bring your team indoors this winter. | `dbsa-35-tournament-team.jpg` (1424x1104) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 20% (round 23) | An academy team with its trophies after a tournament |
| 40 | About | Every player leaves better than they came in. | `dbsa-34-hitting-clinic-talk.jpg` (1448x1086) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 30% (round 23) | Lou talking a large group of hitters through the session |
| 41 | About | 5,500 square feet, and the weather never matters. | `dbsa-30-cage-hitter-wide.jpg` (1448x1086) | 411x231 / 346x195 | 16:9 | focal point 35% 65% (round 23) | A hitter mid swing in a long cage, players waiting their turn |
| 42 | About | 5,500 square feet, and the weather never matters. | `dbsa-33-superdome-fielding.jpg` (1448x1086) | 411x231 / 346x195 | 16:9 | focal point 50% 55% (round 23) | Infielders warming up on the Superdome turf |
| 43 | About | 5,500 square feet, and the weather never matters. | `dbsa-32-softball-clinic-group.jpg` (1448x1086) | 411x231 / 346x195 | 16:9 | focal point 50% 50% (round 23) | A softball clinic group with Lou and the coaches |
| 44 | About | Meet the coaches. | `dbsa-26-lou-with-player.jpg` (1086x1448) | 480x600 / 346x432 | 4:5 | focal point 50% 100% (round 23) | Lou DiChiaro with a former player at the academy |
| 45 | About | Fair Lawn, New Jersey. | `dbsa-18-map-fair-lawn.png` (1600x1067) | 720x540 / 346x259 | 4:3 | centred | Map showing the academy on Pollitt Drive in Fair Lawn |
| 46 | Lou's journey | From Seton Hall to the Orioles to Fair Lawn. | `dbsa-36-superdome-lou-teaching.jpg` (1448x1086) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 45% (round 23) | Lou DiChiaro teaching a group of players at the Superdome |
| 47 | Contact | Send us a message | `dbsa-18-map-fair-lawn.png` (1600x1067) | 440x248 / 346x195 | 16:9 | centred | Map showing the academy on Pollitt Drive in Fair Lawn |
| 48 | Instructors | Coaches who played the game first. | `dbsa-34-hitting-clinic-talk.jpg` (1448x1086) | 1440x660 / 390x669 | 2.18:1 / 0.58:1 | focal point 50% 50%; phones 70% 50% (round 23) | (empty) |
| 49 | Instructors | Lou DiChiaro | `dbsa-10-portrait-lou-dichiaro.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Lou DiChiaro |
| 50 | Instructors | Fran Fitzgerald | `dbsa-11-portrait-fran-fitzgerald.jpg` (1200x1500) | 409x307 / 344x258 | 4:3 | centred | Fran Fitzgerald |
| 51 | Instructors | Christopher DiChiaro | `dbsa-14-portrait-christopher-dichiaro.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Christopher DiChiaro |
| 52 | Instructors | Mike Warden | `dbsa-13-portrait-mike-warden.jpg` (1200x1500) | 409x307 / 344x258 | 4:3 | centred | Mike Warden |
| 53 | Instructors | Scott Fischer | `dbsa-15-portrait-scott-fischer.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Scott Fischer |
| 55 | Camps | Program cards > Little League Training Camp (winter) | `dbsa-31-fielding-drill-turf.jpg` (1665x944) | 626x352 / 344x193 | 16:9 | focal point 50% 50% (round 22 slot, photo round 23) | Players throwing and fielding on the academy turf |
| 56 | Instructors | Gianna Sarlo | `dbsa-29-portrait-gianna-sarlo.jpg` (1126x1397) | 409x306 / 344x258 | 4:3 | focal point 50% 72%, eyes in the top third (round 23, layout roster) | Gianna Sarlo |

## Round 23, Michael's photos (12 October 2026)

Seventeen originals, `dbsa-21` to `dbsa-37`, approved by Michael, placed by
the round 23 slot plan. Two changes from the plan, both to keep one photo
once per page:

- Slot 24 (Infield, the Superdome venue card) was the Fair Lawn map, a repeat
  of slot 23 and the wrong venue. Now `dbsa-33`, fielding at the Superdome.
- Slot 38 (Facility, "Every swing, measured") repeated the HitTrax screen of
  slot 36. Now `dbsa-30`, a hitter mid swing.

`npm run verify` now fails on any photo used twice on one page.

The new originals are about 1450 px on the long side, so full-width heroes and
bands are built at up to 1280 px and are soft on 2x screens at 1440. Nothing is
upscaled.

### Unused

- `dbsa-25-academy-logo-wall.jpg`: not placed.
- `dbsa-02-facility-empty.jpg`, `dbsa-03-hitting-cage.jpg`,
  `dbsa-04-fielding-turf.jpg`, `dbsa-05-pitching-mound.jpg`,
  `dbsa-06-group-semi-private.jpg`, `dbsa-07-little-league.jpg`,
  `dbsa-09-lou-coaching.jpg`: replaced, no slot uses them. Originals kept in
  `assets/img/src/`; their sized copies were dropped by the build.
- `dbsa-12-portrait-eric-pfisterer.jpg` (in `assets/img/`): unused since
  round 22.

## What to supply, grouped

Measured sizes vary by a few pixels with the copy, so the slots group into
eight exports. Each is the largest rendered width times 2.

| Group | Slots | Supply (px) | Notes |
|---|---|---|---|
| A. Full-width heroes | 1, 10, 18-21, 25-30, 48 | 2880 x 1620 (16:9) | Landscape at 1440 (about 2:1), but a tall portrait crop at 390 (as narrow as 0.35:1). Keep the subject inside the middle third of the frame and the top 40% clear for copy on phones. |
| B. HitTrax band, Home | 5 | 2880 x 1620 (16:9) | Same rule as A; on phones it crops to 0.47:1. |
| C. Wide image bands | 8, 37, 39, 40, 46 | 2560 x 840 (3:1) | Panoramic strip at every width. The subject must sit in a horizontal band; faces near the top or bottom get cut. |
| D. Program cards | 11-17, 23, 24, 31, 32 | 1260 x 710 (16:9) | Cards on Camps and Lessons, and the two venue images on Infield. |
| E. Small cards | 2-4, 34-36, 41-43, 47 | 830 x 470 (16:9) | Home program cards, Facility rate cards, About gallery, Contact map. |
| F. Lou portrait, 4:5 | 9, 22, 44 | 960 x 1200 (4:5) | Upright. The same photo serves all three. |
| G. Square | 38 | 1040 x 1040 (1:1) | HitTrax screen, Facility. |
| H. Instructor cards | 49-54 | 820 x 615 (4:3) | Landscape 4:3 heads and shoulders. Today's files are 4:5 portraits cropped to 4:3. |
| I. One-offs | 6, 7 (Home split cards, 2:3 at 1440, 16:9 at 390), 33 (Lessons, 5.2:1 at 1440), 45 (About map, 4:3) | 6, 7: 680 x 1020 (2:3) with the subject centred so the 16:9 phone crop works. 33: 2560 x 490. 45: 1440 x 1080. | |

## Export size per slot (raw, per slot)

The largest rendered width times 2, at that slot's aspect ratio. Supply JPG, sRGB, quality about 75, under 300 KB each.

| Export size (px) | Slots |
|---|---|
| 2880 x 1218 | 5 |
| 2880 x 1320 | 1, 10, 26, 30, 48 |
| 2880 x 1374 | 25 |
| 2880 x 1452 | 19, 20, 21, 27, 28 |
| 2880 x 1506 | 29 |
| 2880 x 1512 | 18 |
| 2560 x 840 | 8, 37, 39, 40, 46 |
| 2556 x 492 | 33 |
| 1440 x 1080 | 45 |
| 1252 x 704 | 11, 12, 13, 14, 15, 16, 17, 23, 24, 31, 32 |
| 1040 x 1040 | 38 |
| 960 x 1200 | 44 |
| 880 x 1100 | 9, 22 |
| 880 x 496 | 47 |
| 822 x 462 | 41, 42, 43 |
| 818 x 460 | 2, 3, 4, 34, 35, 36 |
| 818 x 612 | 49, 51, 53, 54 |
| 818 x 614 | 50, 52 |
| 688 x 386 | 6, 7 |

## File weight

| File | KB | Flag |
|---|---|---|
| `dbsa-01-facility-in-use.jpg` | 268 |  |
| `dbsa-02-facility-empty.jpg` | 305 | over 300 KB |
| `dbsa-03-hitting-cage.jpg` | 132 |  |
| `dbsa-04-fielding-turf.jpg` | 237 |  |
| `dbsa-05-pitching-mound.jpg` | 278 |  |
| `dbsa-06-group-semi-private.jpg` | 260 |  |
| `dbsa-07-little-league.jpg` | 200 |  |
| `dbsa-08-hittrax-screen.jpg` | 413 | over 300 KB |
| `dbsa-09-lou-coaching.jpg` | 576 | over 300 KB |
| `dbsa-10-portrait-lou-dichiaro.jpg` | 245 |  |
| `dbsa-11-portrait-fran-fitzgerald.jpg` | 298 |  |
| `dbsa-12-portrait-eric-pfisterer.jpg` | 160 |  |
| `dbsa-13-portrait-mike-warden.jpg` | 173 |  |
| `dbsa-14-portrait-christopher-dichiaro.jpg` | 307 | over 300 KB |
| `dbsa-15-portrait-scott-fischer.jpg` | 168 |  |
| `dbsa-18-map-fair-lawn.png` | 673 | over 300 KB |

## Problems

Same photo twice on one page: none since round 23 (verify fails on it).

Wrong image for the place: none known. The Superdome venue card (slot 24) shows
the Superdome since round 23.

Faces in a 4:5 box: slot 22 (Infield, `dbsa-21`) keeps Lou's eyes at about
55% of the box height, not the top third. The photo is a 3:4 portrait with the
head low in the frame, and a 4:5 crop can only trim 6% of its height.
