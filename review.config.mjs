// Premium consistency review for dichiarobaseball.com.
// Run: node ~/Documents/Claude/playbooks/premium-review-kit/premium-review.mjs --config ./review.config.mjs --shots
// Serve the built site first with a static server that keeps query strings,
// for example: python3 -m http.server 8081 --bind 127.0.0.1
//
// This site predates the kit. Its system is fluid: type and band spacing are
// clamp() tokens in assets/css/tokens.css, and hover is per component (a
// background change on buttons, an underline on nav links), not one colour.
// The type scale below is every token evaluated at the four capture widths.
export default {
  base: 'http://127.0.0.1:8081',
  routes: ['/', '/camps-and-clinics.html', '/lessons.html', '/contact.html', '/about.html',
    '/programs/little-league-fall-2026.html', '/programs/little-league-winter-2027.html',
    '/programs/little-league-march-2027.html', '/programs/infield-camp-2026-27.html',
    '/programs/hit-night-fall-2026.html', '/programs/hit-night-winter-2027.html',
    '/team-camps.html', '/lous-journey.html', '/facility-and-rentals.html',
    '/register.html?program=little-league-fall-2026', '/waiver-and-policies.html',
    '/privacy-policy.html', '/terms-and-conditions.html'],
  widths: [1440, 1024, 768, 390],
  settleMs: 1200,
  outDir: '_proof/premium-review',

  selectors: {
    edgeLeft: '.nav__logo',
    edgeRight: '.nav__cta, .nav__toggle',
    navRows: ['.nav', '.announce'],
    contentMaxWidth: '1280px',
    section: 'section, footer',
    // the header and menu, the decorative marquee, review notes and image
    // labels (both come off before launch) are not measured
    // .form__hp is the enquiry forms' honeypot, off screen on purpose
    skip: ['.site-header', '.menu', '.marquee', 'noscript', '.build-note', '.media__label', '.hero__scroll', '.form__hp'],
    reveal: '[data-reveal]',
    menuButton: '.nav__toggle',
  },

  typeScale: [11, 12, 14, 15, 16, 17, 17.06, 17.93, 18.52, 19, 20.8, 22.03, 22.08, 24, 26.09, 26.18,
    26.94, 30.27, 32, 32.15, 34.5, 40, 40.83, 50.82, 53.7, 56, 68.29, 72]
    .flatMap((s) => [400, 500, 600, 700, 900].map((w) => `${s}/${w}`)),

  // --band-y at 1440 is 95.36px a side. The band padding is fluid, so one
  // fixed gap is only right at one width.
  rhythm: { gap: 190.72, tolerance: 1, heroContentToContent: false },

  hover: {
    color: 'rgb(203, 41, 35)',
    durationMs: 180,
    interactive: 'a, button, [role=button]',
    exclude: ['[aria-pressed="true"]'],
  },

  targets: { min: 44, maxWidth: 720, exclude: [] },
  contrast: { min: 4.5, large: 3, exclude: [] },
  orderExceptions: {},
};
