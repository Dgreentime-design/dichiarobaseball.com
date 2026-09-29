# DiChiaro Baseball & Softball Academy

Front end for the v1 website rebuild. Static HTML, CSS and a small amount of
vanilla JavaScript. No framework, no dependencies to run it.

Built by Box to Box Design. The development principles and the registration
build spec live in the Claude project.

---

## Click through it

**Fastest, no tools.** Double-click `index.html`. It opens in your browser and
every link works, because everything is relative paths. Good enough to walk
through the site on your own screen.

**Better, one command.** A local server behaves exactly like the real thing,
which matters for clean URLs and for testing on your phone.

    npm start

That runs the build and serves the site at `http://localhost:8080`. To open it
on your phone, find your Mac's IP on the same wifi (System Settings, Network)
and visit `http://<that-ip>:8080`.

**For the client review.** Deploy it and send a link. See below.

## What is clickable

Every page is built. Nothing 404s.

| Page | Notes |
| --- | --- |
| Homepage | Eleven bands |
| Camps &amp; Clinics | Working filters, four programs |
| Lessons | Rate cards, semi-private matrix, instructor chips |
| Facility &amp; Rentals | Three rental types, HitTrax, booking steps |
| Instructors | Seven cards, bios expand in place to the full row |
| About | Story, principles, facility, staff, location |
| Contact | Form validates, then says plainly that nothing was sent |
| Program detail | The ten-block template, filled with the Infield Camp |
| Register | Three steps plus confirmation, walkable end to end |
| Waiver, Privacy, Terms | Real structure, amber markers where the attorney is needed |

### Two things to try

**The town rate.** On step 3 of registration, open "Have a town or league
code?" and enter `DEMO25`. The Demo Town Little League rate applies and the
total drops to $180. Any other code returns one generic failure message, the
same for every cause, on purpose. Then switch the payment method between
online, at the facility and by check and finish, to see the three
confirmations.

The town is invented. No real league name may sit against a discounted price
anywhere in this codebase, in a demo or otherwise: the organisation is
findable and the implication that it pays less is exactly the harm the gated
rates are designed to avoid.

**An instructor bio.** On the Instructors page, "Read full bio" expands the card
in place to the full row width and pushes the rest down. No separate page.

### Adding a route later

`pages/_stub.html` and `stubs.json` generate a placeholder page for any route
that is linked but not yet built, so the prototype never dead-ends. `stubs.json`
is empty now because every route is real. Add an entry and run `npm run build`
to bring one back.

## Deploy for a review

Free at this size, on either host. Vercel, from the project folder:

    npx vercel            # first run asks you to sign in, then creates the project
    npx vercel --prod     # deploy, prints the URL

Netlify, if you prefer it:

    npx netlify deploy --prod

Both configs are already here (`vercel.json`, `netlify.toml`). Both run
`node build.mjs` and serve the folder. Neither commits you to a paid plan, and
neither locks the project in: it is plain static files either way.

For a client review, set the deployment to password protected or keep the URL
unlisted. `noindex` is already on the placeholder pages so a half-built site
cannot turn up in search.

---

## Structure

    build.mjs               Resolves {{> partial }} tokens, generates stubs
    pages/                  Page sources. Edit these, not the root HTML
    pages/_stub.html        Template for every placeholder page
    stubs.json              What each placeholder page says
    partials/               header, menu, marquee, footer. Shared by every page
    assets/css/tokens.css   Colour, type, space and radius. Single source of truth
    assets/css/base.css     Reset, document defaults, type primitives, bands
    assets/css/components.css  Buttons, cards, media, header, menu, footer, logo
    assets/css/home.css     Homepage bands
    assets/css/camps.css    Camps & Clinics page and placeholder pages
    assets/css/pages.css    Patterns shared by the inner pages
    assets/css/instructors.css  Roster cards and the expanding bio
    assets/css/program.css  Program detail, ten blocks
    assets/css/register.css Forms, the registration flow, contact layout
    assets/css/legal.css    Legal documents and the placeholder pages
    assets/js/site.js       Mobile menu, filters, bios, forms, marquee, image fallback
    assets/js/register.js   The registration prototype
    legal.json              The words in the three legal pages
    assets/img/             Photography. See the image list doc for file names
    *.html                  Generated. Do not edit by hand

**Edit `pages/`, then run `npm run build`.** The root HTML files are output.

## Images

Every image is a real `<img>` pointing at `assets/img/dbsa-NN-subject.jpg`.
Until a file exists, `site.js` swaps in the labelled placeholder from the Figma
comps, so a review never shows a broken image icon. Drop the files in and the
placeholders disappear on their own. Nothing else needs changing.

Eighteen master files serve every placement on the site. Master sizes and the
reuse map are in the image list doc.

## The machine layer

`build.mjs` generates `robots.txt`, `sitemap.xml` and `llms.txt` from the
pages it actually wrote, so a route cannot appear in one and not the others.
It also writes the JSON-LD: `SportsActivityLocation` on the homepage and the
contact page, and one `Event` per session per group on the program page,
built from the verified dates in `data/programs.json`.

**The origin is one value.** `SITE_ORIGIN`, then the Vercel domain, then
`https://dichiarobaseball.com`. Every canonical and `og:url` is rewritten to
it at build time.

**Indexing is opt in.** A build is only treated as the live site when
`SITE_ORIGIN` is set to the production domain. Anything else, including a
local build and including Vercel's own production deployment before the
domain is pointed here, gets `noindex` on every page and a blanket disallow
in `robots.txt`. At the cutover, set `SITE_ORIGIN=https://dichiarobaseball.com`
in the Vercel project's environment variables.

`register.html` is `noindex` at every origin. It is a transaction, not a page
to arrive at from a search, and it carries no canonical for the same reason.

`llms.txt` lists the open programs only. A gated program appears on no page
of the site, so naming it in the file that exists for crawlers would publish
what the gate withholds. It reads the `gated` flag, so the assignment can
change in the data.

**Clean URLs are off.** `cleanUrls: true` in `vercel.json` served every page
except the site root, which 404ed: `/index.html` redirected to `/` and `/`
resolved to nothing. Every internal link and every canonical in `pages/` is
written with `.html` anyway, so `.html` is now both what is served and what
is declared, and no canonical points at a redirect. If clean URLs are wanted
later, the canonicals in `pages/` have to change with them.

## Checks before a review

    npm start             # in one terminal
    npm run verify        # in another

Four checks across all fourteen pages. Three more scripts go further, and
each takes a deployed URL as well as running against `localhost:8080`:

    node scripts/check-jsonld.mjs [url]      structured data parses and is usable
    node scripts/check-prototype.mjs [url]   the empty card and the demo rate code
    node scripts/check-deployed.mjs <url>    what a deployment actually serves

Four checks across all twelve pages:

1. **Content parity, 1440 against 390.** Every leaf text node must match. This
   is the standing rule: layout changes between breakpoints, content does not.
2. **No horizontal overflow** at 390, 768 or 1440.
3. **Tap targets** at least 24px, excluding links inline in a sentence.
4. **Every internal link resolves.** No dead ends.

It exits non-zero on any failure, so it drops straight into CI when the project
moves to a repository.

## Conventions

- Design tokens are CSS custom properties on `:root`. No hard coded hex values
  anywhere else.
- Type sizes are fluid, clamped between the 390 comp and the 1440 comp.
- No inline `style` attributes.
- `#CB2923` on `#17120F` is 3.43:1, below AA for small text. Use
  `--c-red-bright` for accent text on dark backgrounds.
- All JavaScript is progressive. With it switched off the pages still read,
  navigate and link correctly. The camps filters simply show everything.

## Breakpoints

| Width | Behaviour |
| --- | --- |
| 1440 and up | Full desktop. Content capped at 1280 |
| 1180 to 1439 | Desktop, narrower gutters |
| 1024 to 1179 | Programs drop to two across |
| 900 to 1023 | Lou stacks, split cards go one across |
| 768 to 899 | Hero image moves above the copy |
| 640 to 767 | Section heads stack |
| 390 to 639 | Single column throughout |

## Not yet built

`register.html` is the real front end with no server behind it. Nothing is
stored, nothing is charged, no email is sent, and the town-rate lookup is a
client-side stand-in with two demo codes.

**That stand-in must not ship.** In the built site the lookup is server side and
rate limited, and no rate, code or town name may ever appear in a public
payload. Shipping it as written would let anyone read the page source and see
which towns pay less, which is the exact harm the design exists to prevent. The
rules are in the registration build spec.

The application itself belongs in its own repository: the server-side rate
lookup, the Clover checkout session and webhook, the Constant Contact queue,
and Michael's admin and roster view.

---

## Images and logos

### Logos

`assets/img/logo.svg` (dark on light) and `logo-reversed.svg` (light on dark)
are the supplied lockups, straight from `Logos/vector/`. They use the brand
tokens exactly, so they sit on any band without correction. `mark.svg` is the
D monogram and serves as the favicon.

Height is set in CSS and the width follows from the file's own ratio, so there
is only ever one number to change.

### Photography

Seventeen of the eighteen placements are filled from the academy's own
material: the Images, Graphics, Bios and Videos folders. Sources are recorded
in the image list doc.

**Two things to settle before this goes public.**

1. **Four images come from HitTrax's marketing, not the academy's camera.**
   `dbsa-03-hitting-cage.jpg` and `dbsa-08-hittrax-screen.jpg` carry HitTrax
   branding and data overlays. They sit in HitTrax-related contexts, which is
   defensible, and the academy already uses them on the current site. Michael
   should confirm he has permission before launch.
2. **Several photos show identifiable minors.** Fine for a walkthrough of the
   academy's own material. Before publication the academy needs photo consent
   for the children shown, which is exactly the optional consent checkbox the
   registration flow already collects.

### The one gap

`dbsa-19-portrait-gianna-sarlo.jpg` does not exist, because the academy has
not supplied a photo of her. The card renders the labelled placeholder rather
than a stand-in, on the same principle as her empty bio: no invented content
for a real person.

### The map

`dbsa-18-map-fair-lawn.png` is a real OpenStreetMap render centred on Pollitt
Drive, desaturated toward the brand palette, with the attribution baked in as
the tile usage policy requires.

For production, move to a proper tile provider (MapTiler, Mapbox) or a Google
Maps embed. OSM's public tile servers are not intended to serve a live site.
