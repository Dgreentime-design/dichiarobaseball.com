# Round 23 - Michael's approved photos into the slots

DiChiaro Baseball & Softball Academy. Monday 12 October 2026. Runs after
round 22 is reported. Images only. One run, one report. Follow CLAUDE.md
and the swap steps in `docs/review/image-map.md`.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt if not pushed. Expect 0 0.
Round 22 is committed (64034f5). Daniel has added `PAYMENT_PROVIDER=mock`
for Preview, so the preview checkout works again once this round's push
redeploys it. Confirm by name that it exists for Preview.

## Boundaries

1. Review branch only. Never push or merge to main. No force-push.
2. Images, alts, focal points and the image map only, plus rule 4 below. No other copy, prices,
   dates or money path changes.
3. `pages/instructors.html`: only the hero slot 48 swap, Gianna Sarlo's card photo, and removing the amber note (rule 5a).
4. No team names on any public page in an image or alt. `dbsa-24` (IHA
   team photo) is allowed only on the unlisted IHA program page.
5. Never use an em dash.
6. Stop at the checkpoint and report. Out of scope: report, don't fix.

## The photos

Seventeen new originals are already in `assets/img/src/`, `dbsa-21` to
`dbsa-37` (JPG, about 1450 px on the long side; `31` and `37` are 1665 x 944).
Michael approved all of them today. Commit them with this round.

| File | What it shows |
|---|---|
| dbsa-21-portrait-lou | Lou, head and shoulders, in front of the red D in a cage. Portrait. |
| dbsa-22-superdome-team-talk | Lou talking to a big mixed group on the Superdome turf |
| dbsa-23-softball-players-with-lou | Lou with four softball players in academy shirts, red D behind. Portrait. |
| dbsa-24-iha-softball-team | IHA softball team photo with coaches. **IHA page only.** |
| dbsa-25-academy-logo-wall | The DiChiaro sign on the red wall with a bat. Portrait. |
| dbsa-26-lou-with-player | Lou with a former player in front of the D. Portrait. |
| dbsa-27-cages-coaches-throwing | Three cages, coaches throwing BP behind L screens |
| dbsa-28-cages-young-hitters | Young hitters in two cages, coaches throwing |
| dbsa-29-portrait-gianna-sarlo | Gianna Sarlo, instructor, in an academy shirt in front of the D. Portrait. |
| dbsa-30-cage-hitter-wide | A young hitter mid swing, long cage, players waiting |
| dbsa-31-fielding-drill-turf | Throwing and fielding drill on the academy turf |
| dbsa-32-softball-clinic-group | Softball clinic group with Lou and coaches |
| dbsa-33-superdome-fielding | Fielding warm ups at the Superdome |
| dbsa-34-hitting-clinic-talk | Lou addressing a large group of hitters in helmets at the academy |
| dbsa-35-tournament-team | Academy team with trophies after a tournament, outdoors |
| dbsa-36-superdome-lou-teaching | Lou pointing, teaching a group at the Superdome |
| dbsa-37-fielding-drill-warm | Same drill as 31, warmer grade. Use 37, not 31, wherever both would fit. |

## Slot plan

Keep as they are: 1 (Home hero, approved Friday), 5, 36, 37, 38 (HitTrax and
the turf band), 23, 24, 45, 47 (maps), 49 to 53 (instructor portraits).
Slots 15 to 17 were removed with the team cards in round 22.

| Slot | Where | New file | Alt (write it to match the photo) |
|---|---|---|---|
| 2 | Home, Little League card | 28 | Young hitters taking swings in the cages |
| 3 | Home, Hit Night card | 30 | A hitter mid swing in a long cage, players waiting their turn |
| 4 | Home, Infield Camp card | 33 | Infielders warming up on the Superdome turf |
| 6 | Home, Lessons card | 27 | Coaches throwing batting practice in three cages |
| 7 | Home, Rentals card | keep dbsa-01 | |
| 8 | Home, Fundamentals band (3:1) | 37 | Players working a throwing and fielding drill on the academy turf |
| 9 | Home, Lou (4:5) | 23 | Lou DiChiaro with four softball players in front of the academy logo |
| 10 | Camps hero | 36 | Lou DiChiaro teaching a group of players at the Superdome |
| 11 | Camps, LL Fall card | 28 | |
| 55 | Camps, LL Winter card (added in round 22, temporarily on dbsa-07) | 31 | Players throwing and fielding on the academy turf |
| 12 | Camps, Infield card | 33 | |
| 13 | Camps, Hit Night card | 34 | Lou talking a large group of hitters through the session |
| 14 | Camps, LL March card | 22 | Lou talking to a group of players on the Superdome turf |
| 18 | LL Fall hero | 28 | |
| 19 | LL Winter hero | 37 | |
| 20 | LL March hero | 22 | |
| 21 | Infield hero | 36 | |
| 22 | Infield, Lou (4:5) | 21 | Lou DiChiaro at the academy |
| 25 | Hit Night Fall hero | 30 | |
| 26 | Hit Night Winter hero | 34 | |
| 27 | IHA hero (unlisted page) | 24 | The IHA softball team with academy coaches |
| 28 | Fair Lawn HS hero (unlisted) | 31 | |
| 29 | Old Tappan HS hero (unlisted) | 27 | |
| 30 | Lessons hero | 28 | |
| 31 | Lessons, Hitting card | 30 | |
| 32 | Lessons, Pitching card | 27 | Coaches throwing to hitters from behind L screens |
| 33 | Lessons, Semi-private (5.2:1) | 37 | |
| 34 | Facility, Cage rental | 27 | |
| 35 | Facility, Full facility | 31 | |
| 39 | Team camps band (3:1) | 35 | An academy team with its trophies after a tournament |
| 40 | About band (3:1) | 34 | |
| 41 | About gallery | 30 | |
| 42 | About gallery | 33 | |
| 43 | About gallery | 32 | A softball clinic group with Lou and the coaches |
| 44 | About, Meet the coaches (4:5) | 26 | Lou DiChiaro with a former player at the academy |
| 46 | Lou's journey band (3:1) | 36 | |
| 48 | Instructors hero | 34 | |
| Gianna card | Instructors, Gianna Sarlo (her card has no real photo yet; it points at a placeholder named `dbsa-19-portrait-gianna-sarlo`) | 29 | Gianna Sarlo. Crop 4:3 like the other cards, head and shoulders, eyes in the top third. Keep her name spelled Gianna as on the page. |

Where the alt cell is empty, reuse the alt from the row that uses the same
file, adjusted if the crop changes what is visible. Hero slots with an empty
alt today stay empty (decorative).

Rules:
1. **Focal points.** Set `focal` and `focal_mobile` so faces and the ball
   stay in frame at 1440 and 390. Group photos in 3:1 bands (8, 39, 40, 46):
   keep heads inside the band, never cut a face at the top edge. Portraits in
   4:5 slots: eyes in the top third.
2. **No photo twice on one page.** If the plan above repeats a file on a
   page (count heroes, cards and bands), swap the second use for the nearest
   fit from the list and report it.
3. **Size.** These originals are about 1450 px wide, below the 2880 export
   for full width heroes. Build them as they are, do not upscale past the
   original. Report any slot where the image looks soft at 1440.
4. **One text change, approved by Michael:** Diana Schraer is no longer an
   instructor. Remove her name everywhere it is left after round 22
   (pages, partials, data, llms.txt, JSON-LD, and the HTML comment near
   line 451 of `pages/instructors.html`). Grep must find no "Schraer".
   Also confirmed by Michael, no change needed: pitching stays 30-minute
   lessons ($75 single, $355 for 5, $680 for 10); semi-private stays
   60 minutes, $44 to $48 a player.
5. **Three small text fixes, approved by Daniel:**
   a. Delete the amber "Needs confirming with Michael" block on
      `pages/instructors.html`. It is visible to the public. Remove the whole
      block; nothing replaces it.
   b. Camps, Hit Night card: match Home. Under the price show "$30 per
      session" and "Monthly packages" instead of "packages from $100".
   c. The coaching credits that name schools (Old Tappan, IHA, Immaculate
      Heart Academy) on Instructors, Lou's journey and Infield stay. They are
      instructor history, not team programs.
6. Update `docs/review/image-map.md`: new files per slot, and a short
   "Unused" list (25 logo wall, any file left over).

## Verify

1. `npm run build`, `npm run verify`, `check:payments`, `check:enquiry` pass.
   Verify must report no photo used twice on a page.
2. Screenshot Home, Camps, Lessons, Facility, About, Infield program page
   and Instructors at 390 and 1440. Check every crop by eye: faces whole,
   nothing awkward cut at an edge.
3. Speed check on Home and one program page at 390: LCP within round 21's
   numbers plus 10%.
4. Grep alts on public pages: no IHA, Fair Lawn HS, Old Tappan or other team
   names.

## Report

1. Step 0.
2. The slot table as built: slot, file, focal, any change from the plan and why.
3. Soft or awkward crops, with a screenshot path.
4. Verify and speed results.
5. Commits and the preview URL.
6. Unused photos, and anything out of scope.

## Out of scope (report, don't fix)

Copy, videos, new slots beyond the LL Winter card and Gianna's card photo.

End of prompt.
