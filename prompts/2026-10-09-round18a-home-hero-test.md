# Round 18a - Two photos: the new Home hero and the facility band (look and feel test)

Small, fast round. Daniel wants to see one new photo live before the rest.

## Step 0

Repo `~/Builds/Claude/dichiarobaseball.com`, branch `review`. Run the
CLAUDE.md Step 0 commands. Push this prompt commit if not pushed.

## What is already done (committed with this prompt)

- New original: `assets/img/src/dbsa-19-coach-fielding-drill.jpg` (1428 x 816,
  a coach on one knee hitting ground balls to a group, warm grade).
- `data/images.json` slot 1 (Home hero) points at it, with `focal`
  "70% 55%" and `focal_mobile` "74% 50%" so the coach stays in frame.
- New original: `assets/img/src/dbsa-20-facility-turf-wide.jpg` (2528 x 1904,
  the academy floor from turf level, cages down both sides, the red D logo
  on the far wall). It replaces `dbsa-02-facility-empty.jpg` in slot 8 (Home
  image band) and slot 37 (Facility image band), `focal` "50% 45%", new alt.

The build could not run in Claude's sandbox (sharp is installed for macOS),
so the generated images and HTML are not built yet.

## Do

1. `npm run build`, then `npm run verify`.
2. Check Home and Facility at 390, 768, 1024 and 1440 on the preview.
   For slots 8 and 37: the logo on the far wall should sit inside the 3:1
   band at every width; adjust `focal` only if it doesn't. If
   `dbsa-02-facility-empty.jpg` is no longer used anywhere, leave it in
   `src/` and say so. For the hero:
   - The coach stays in frame at every width, especially the 390 portrait
     crop. If not, adjust `focal` / `focal_mobile` only.
   - Headline and buttons stay readable on the photo. If contrast fails,
     use the hero's existing overlay token, not a new style.
3. Note in the report: the original is 1428 px wide, so desktop gets the
   1280 version at most and will look soft on retina screens. Daniel will
   supply the full-size original for the final.
4. Commit the generated files, push, and report: the preview link, the
   commit, screenshots of Home and Facility at 390 and 1440, and any focal change. Stop.

End of prompt.
