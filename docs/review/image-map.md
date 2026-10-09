# Image map

Round 16, 9 October 2026, with the swap steps added in round 17. Measured on the review preview at 1440 and 390. One row per image slot, numbered so you can say "slot 7: use photo X". Rendered size is the image box in CSS pixels; the current file's own size is in brackets.

## How to swap a photo

Since round 17 every image on the site (slots 1-47) is read from
`data/images.json` by slot number. Slots 48-54 (Instructors) are not in the
registry yet; that page still names its files directly.

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
| 2 | Home | Fall camps and clinics, open now. > Little League Training Camp | `dbsa-07-little-league.jpg` (1920x1080) | 409x230 / 344x193 | 16:9 | centred | Players working through a drill at the Little League training camp |
| 3 | Home | Fall camps and clinics, open now. > Monday Hit Night | `dbsa-03-hitting-cage.jpg` (1920x1080) | 409x230 / 344x193 | 16:9 | centred | A hitter working in the cage during Monday Hit Night |
| 4 | Home | Fall camps and clinics, open now. > Lou DiChiaro’s Infield Camp | `dbsa-04-fielding-turf.jpg` (2000x1144) | 409x230 / 344x193 | 16:9 | centred | An infielder fielding a ground ball on the turf |
| 5 | Home | Every swing, measured. | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 1440x609 / 390x826 | 21:9 / 0.47:1 | centred; crop changes to 0.47:1 at 390 | (empty) |
| 6 | Home | Lessons and rentals, all year. > Private and semi-private lessons | `dbsa-06-group-semi-private.jpg` (2000x1115) | 220x338 / 344x193 | 2:3 / 16:9 | centred; crop changes to 16:9 at 390 | Three players working with one coach in a semi-private lesson |
| 7 | Home | Lessons and rentals, all year. > Cage and facility rentals | `dbsa-01-facility-in-use.jpg` (2000x1130) | 220x338 / 344x193 | 2:3 / 16:9 | centred; crop changes to 16:9 at 390 | The full academy floor with the batting nets up |
| 8 | Home | Fundamentals first. Every level welcome. | `dbsa-05-pitching-mound.jpg` (1600x1212) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 70% (round 18b) | A HitTrax unit behind the cage net, with the turf and the mound in front |
| 9 | Home | Lou DiChiaro | `dbsa-09-lou-coaching.jpg` (1800x2400) | 440x550 / 346x432 | 4:5 | centred | Lou DiChiaro standing with a softball player in front of the academy logo |
| 10 | Camps | Camps and clinics for ages 6-18. | `dbsa-07-little-league.jpg` (1920x1080) | 1440x660 / 390x620 | 2.18:1 / 0.63:1 | centred; crop changes to 0.63:1 at 390 | (empty) |
| 11 | Camps | Program cards > Little League Training Camp | `dbsa-07-little-league.jpg` (1920x1080) | 626x352 / 344x193 | 16:9 | centred | A young player mid swing with a coach kneeling beside him |
| 12 | Camps | Program cards > Lou DiChiaro’s Infield Camp | `dbsa-04-fielding-turf.jpg` (2000x1144) | 626x352 / 344x193 | 16:9 | centred | An infielder taking a ground ball on the turf with a coach hitting fungo behind |
| 13 | Camps | Program cards > Monday Hit Nights | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 626x352 / 344x193 | 16:9 | centred | A lit cage with the ball coming off the bat and the HitTrax screen glowing behind |
| 14 | Camps | Program cards > Little League Training Camp | `dbsa-07-little-league.jpg` (1920x1080) | 626x352 / 344x193 | 16:9 | centred | The same training camp running in spring with the doors open to the lot |
| 15 | Camps | Program cards > IHA Softball Training Program | `dbsa-01-facility-in-use.jpg` (2000x1130) | 626x352 / 344x193 | 16:9 | centred | A team working through fielding drills on the academy turf |
| 16 | Camps | Program cards > Fair Lawn HS Softball Training Program | `dbsa-06-group-semi-private.jpg` (2000x1115) | 626x352 / 344x193 | 16:9 | centred | A coach kneeling on the turf in front of a group of players |
| 17 | Camps | Program cards > Old Tappan HS Hitting and Fielding | `dbsa-03-hitting-cage.jpg` (1920x1080) | 626x352 / 344x193 | 16:9 | centred | A hitter mid swing in the cage with the HitTrax screen behind |
| 18 | Program: little-league-fall-2026 | Little League Training Camp | `dbsa-07-little-league.jpg` (1920x1080) | 1440x756 / 390x1094 | 1.90:1 / 0.36:1 | focal point 76% 50%; crop changes to 0.36:1 at 390 | (empty) |
| 19 | Program: little-league-winter-2027 | Little League Training Camp | `dbsa-07-little-league.jpg` (1920x1080) | 1440x726 / 390x1067 | 2:1 / 0.37:1 | focal point 76% 50%; crop changes to 0.37:1 at 390 | (empty) |
| 20 | Program: little-league-march-2027 | Little League Training Camp | `dbsa-07-little-league.jpg` (1920x1080) | 1440x726 / 390x1040 | 2:1 / 0.38:1 | focal point 76% 50%; crop changes to 0.38:1 at 390 | (empty) |
| 21 | Program: infield-camp-2026-27 | Lou DiChiaro’s Infield Camp | `dbsa-04-fielding-turf.jpg` (2000x1144) | 1440x726 / 390x1040 | 2:1 / 0.38:1 | centred; crop changes to 0.38:1 at 390 | (empty) |
| 22 | Program: infield-camp-2026-27 | Lou DiChiaro | `dbsa-09-lou-coaching.jpg` (1800x2400) | 440x550 / 346x432 | 4:5 | centred | Lou DiChiaro standing with a softball player in front of the academy logo |
| 23 | Program: infield-camp-2026-27 | Two venues, one camp. > The academy | `dbsa-18-map-fair-lawn.png` (1600x1067) | 626x352 / 344x193 | 16:9 | centred | Map showing the academy on Pollitt Drive in Fair Lawn |
| 24 | Program: infield-camp-2026-27 | Two venues, one camp. > Superdome Sports Center | `dbsa-18-map-fair-lawn.png` (1600x1067) | 626x352 / 344x193 | 16:9 | centred | Map showing the Superdome Sports Center in Waldwick |
| 25 | Program: hit-night-fall-2026 | Monday Hit Night | `dbsa-03-hitting-cage.jpg` (1920x1080) | 1440x687 / 390x998 | 2.10:1 / 0.39:1 | centred; crop changes to 0.39:1 at 390 | (empty) |
| 26 | Program: hit-night-winter-2027 | Monday Hit Night | `dbsa-03-hitting-cage.jpg` (1920x1080) | 1440x660 / 390x1009 | 2.18:1 / 0.39:1 | centred; crop changes to 0.39:1 at 390 | (empty) |
| 27 | Program: iha-softball-winter-2027 | IHA Softball Training Program | `dbsa-01-facility-in-use.jpg` (2000x1130) | 1440x726 / 390x1067 | 2:1 / 0.37:1 | centred; crop changes to 0.37:1 at 390 | (empty) |
| 28 | Program: fair-lawn-hs-softball-2027 | Fair Lawn HS Softball Training Program | `dbsa-06-group-semi-private.jpg` (2000x1115) | 1440x726 / 390x1067 | 2:1 / 0.37:1 | centred; crop changes to 0.37:1 at 390 | (empty) |
| 29 | Program: old-tappan-hs-2026-27 | Old Tappan HS Hitting and Fielding | `dbsa-03-hitting-cage.jpg` (1920x1080) | 1440x753 / 390x1122 | 1.91:1 / 0.35:1 | centred; crop changes to 0.35:1 at 390 | (empty) |
| 30 | Lessons | Work on exactly what your player needs. | `dbsa-03-hitting-cage.jpg` (1920x1080) | 1440x660 / 390x620 | 2.18:1 / 0.63:1 | centred; crop changes to 0.63:1 at 390 | (empty) |
| 31 | Lessons | What a lesson costs. > Hitting, fielding, catching | `dbsa-03-hitting-cage.jpg` (1920x1080) | 626x352 / 344x193 | 16:9 | centred | A hitter mid swing in the cage with the ball just off the bat |
| 32 | Lessons | What a lesson costs. > Pitching | `dbsa-05-pitching-mound.jpg` (1600x1212) | 626x352 / 344x193 | 16:9 | centred | A pitcher at release with the mound and net behind |
| 33 | Lessons | What a lesson costs. > Semi-private lessons | `dbsa-06-group-semi-private.jpg` (2000x1115) | 1278x246 / 344x193 | 5.20:1 / 16:9 | centred; crop changes to 16:9 at 390 | Three players working with one coach, mid rep |
| 34 | Facility | Three ways to use the space. > Cage rental | `dbsa-03-hitting-cage.jpg` (1920x1080) | 409x230 / 344x193 | 16:9 | centred | A hitter mid swing in the cage with the ball just off the bat |
| 35 | Facility | Three ways to use the space. > Full facility rental | `dbsa-01-facility-in-use.jpg` (2000x1130) | 409x230 / 344x193 | 16:9 | centred | The full floor in use with a team session running end to end |
| 36 | Facility | Three ways to use the space. > HitTrax session | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 409x230 / 344x193 | 16:9 | centred | The HitTrax screen mid session with a spray chart visible |
| 37 | Facility | Image band between sections | `dbsa-20-facility-turf-wide.jpg` (2528x1904) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 45% (round 18a) | The academy floor from turf level, with batting cages down both sides and the DiChiaro logo on the far wall |
| 38 | Facility | Every swing, measured. | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 520x520 / 346x346 | 1:1 | centred | The live HitTrax screen mid session with a player in front |
| 39 | Team camps | Bring your team indoors this winter. | `dbsa-01-facility-in-use.jpg` (2000x1130) | 1280x420 / 346x114 | 3.05:1 | centred | The full academy floor with nets up and a group working through stations |
| 40 | About | Every player leaves better than they came in. | `dbsa-01-facility-in-use.jpg` (2000x1130) | 1280x420 / 346x114 | 3.05:1 | centred | The full academy room from the back corner with the nets up and players working |
| 41 | About | 5,500 square feet, and the weather never matters. | `dbsa-03-hitting-cage.jpg` (1920x1080) | 411x231 / 346x195 | 16:9 | centred | A batting cage down the line with the ball in flight |
| 42 | About | 5,500 square feet, and the weather never matters. | `dbsa-04-fielding-turf.jpg` (2000x1144) | 411x231 / 346x195 | 16:9 | centred | A ground ball rep on the turf with a coach hitting fungo |
| 43 | About | 5,500 square feet, and the weather never matters. | `dbsa-08-hittrax-screen.jpg` (1920x1249) | 411x231 / 346x195 | 16:9 | centred | The HitTrax screen showing a live spray chart |
| 44 | About | Meet the coaches. | `dbsa-09-lou-coaching.jpg` (1800x2400) | 480x600 / 346x432 | 4:5 | centred | Lou DiChiaro standing with a softball player in front of the academy logo |
| 45 | About | Fair Lawn, New Jersey. | `dbsa-18-map-fair-lawn.png` (1600x1067) | 720x540 / 346x259 | 4:3 | centred | Map showing the academy on Pollitt Drive in Fair Lawn |
| 46 | Lou's journey | From Seton Hall to the Orioles to Fair Lawn. | `dbsa-09-lou-coaching.jpg` (1800x2400) | 1280x420 / 346x114 | 3.05:1 | focal point 50% 24% | Lou DiChiaro at the academy with a player, in front of the DiChiaro wall logo |
| 47 | Contact | Send us a message | `dbsa-18-map-fair-lawn.png` (1600x1067) | 440x248 / 346x195 | 16:9 | centred | Map showing the academy on Pollitt Drive in Fair Lawn |
| 48 | Instructors | Coaches who played the game first. | `dbsa-01-facility-in-use.jpg` (2000x1130) | 1440x660 / 390x669 | 2.18:1 / 0.58:1 | focal point 82% 50%; crop changes to 0.58:1 at 390 | (empty) |
| 49 | Instructors | Lou DiChiaro | `dbsa-10-portrait-lou-dichiaro.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Lou DiChiaro |
| 50 | Instructors | Fran Fitzgerald | `dbsa-11-portrait-fran-fitzgerald.jpg` (1200x1500) | 409x307 / 344x258 | 4:3 | centred | Fran Fitzgerald |
| 51 | Instructors | Christopher DiChiaro | `dbsa-14-portrait-christopher-dichiaro.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Christopher DiChiaro |
| 52 | Instructors | Mike Warden | `dbsa-13-portrait-mike-warden.jpg` (1200x1500) | 409x307 / 344x258 | 4:3 | centred | Mike Warden |
| 53 | Instructors | Scott Fischer | `dbsa-15-portrait-scott-fischer.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Scott Fischer |
| 54 | Instructors | Eric Pfisterer | `dbsa-12-portrait-eric-pfisterer.jpg` (1200x1500) | 409x306 / 344x258 | 4:3 | centred | Eric Pfisterer |

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

Same photo twice on one page:

- Slot 2 (Home) repeats `dbsa-07-little-league.jpg`, first used in slot 1.
- Slot 11 (Camps) repeats `dbsa-07-little-league.jpg`, first used in slot 10.
- Slot 14 (Camps) repeats `dbsa-07-little-league.jpg`, first used in slot 10.
- Slot 24 (Program: infield-camp-2026-27) repeats `dbsa-18-map-fair-lawn.png`, first used in slot 23.
- Slot 31 (Lessons) repeats `dbsa-03-hitting-cage.jpg`, first used in slot 30.
- Slot 38 (Facility) repeats `dbsa-08-hittrax-screen.jpg`, first used in slot 36.

Wrong image for the place:

- Slots 23 and 24 (Infield, "Two venues, one camp"): both show the Fair Lawn map. Slot 24 is the Superdome card, so it shows the wrong venue. Needs a Superdome photo or map.

Heaviest file:

- `dbsa-18-map-fair-lawn.png` is a 673 KB PNG used in four slots (23, 24, 45, 47). A map tile does not need PNG; as a JPG at the sizes above it should come in well under 300 KB.

Portrait photo in a landscape slot:

- Slot 46 (Lou's journey): `dbsa-09-lou-coaching.jpg`.
- Slot 49 (Instructors): `dbsa-10-portrait-lou-dichiaro.jpg`.
- Slot 50 (Instructors): `dbsa-11-portrait-fran-fitzgerald.jpg`.
- Slot 51 (Instructors): `dbsa-14-portrait-christopher-dichiaro.jpg`.
- Slot 52 (Instructors): `dbsa-13-portrait-mike-warden.jpg`.
- Slot 53 (Instructors): `dbsa-15-portrait-scott-fischer.jpg`.
- Slot 54 (Instructors): `dbsa-12-portrait-eric-pfisterer.jpg`.
