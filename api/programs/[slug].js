/* ==========================================================================
   GET /api/programs/:slug

   What the registration page renders: the program's public facts, and each
   option priced for one player by priceCart, the same function that prices
   the charge. So a total on the page is the total the server charges, by
   construction rather than by keeping two copies in step.

   404 for anything that cannot be registered for here: unknown, not live,
   or gated behind a code. The page shows "we could not find that program"
   rather than a different one.
   ========================================================================== */

import "../_lib/guard.js";
import { findProgram, priceCart, CartError, VENUES, CHECK_PAYABLE_TO, CHECK_MAIL_TO, PAYMENT_METHODS } from "../_lib/programs.js";
import { json } from "../_lib/http.js";

export async function GET(request) {
  const slug = new URL(request.url).pathname.split("/")[3] || "";
  const program = findProgram(slug);
  if (!program) return json({ error: "Not found" }, 404);

  let options;
  try {
    options = program.options.map((o) => {
      const { amountCents } = priceCart({ programSlug: slug, optionId: o.id, playerCount: 1 });
      return {
        id: o.id,
        label: o.label,
        dueNowCents: amountCents,
        totalCents: Math.round(o.price * 100),
        later: (o.schedule || []).slice(1).map((s) => ({ amountCents: Math.round(s.amount * 100), when: s.when }))
      };
    });
  } catch (e) {
    if (e instanceof CartError) return json({ error: "Not found" }, 404);
    throw e;
  }

  const s = program.schedule || {};
  const venues = s.venue === "split" ? [VENUES.facility, VENUES.superdome] : [VENUES[s.venue]].filter(Boolean);

  return json({
    slug: program.slug,
    name: program.name,
    season: program.season,
    ages: program.ages,
    schedule: {
      day: s.day,
      time: s.time || null,
      groups: s.groups || [],
      dates: s.dates || []
    },
    venues,
    options,
    paymentMethods: PAYMENT_METHODS,
    check: { payableTo: CHECK_PAYABLE_TO, mailTo: CHECK_MAIL_TO }
  });
}
