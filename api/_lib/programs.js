/* ==========================================================================
   The price of a cart, worked out on the server from data/programs.json.

   The browser sends IDs: a program slug, an option ID and the players. It
   never sends a price that is used for anything. Whatever amount arrives in
   a request is ignored, and the one computed here is the only amount that
   is stored, sent to the payment provider or compared against a webhook.
   ========================================================================== */

import { readFileSync } from "node:fs";

const DATA = JSON.parse(readFileSync(new URL("../../data/programs.json", import.meta.url), "utf8"));

export const PAYMENT_METHODS = DATA._meta.defaults.payment_methods;
export const MAX_PLAYERS = DATA._meta.multi_player.max;

export const VENUES = DATA._meta.venues;
export const CHECK_PAYABLE_TO = DATA._meta.check_payable_to;
export const CHECK_MAIL_TO = DATA._meta.check_mail_to;

export class CartError extends Error {}

export const findProgram = (slug) => DATA.programs.find((p) => p.slug === slug) || null;

/* Returns { program, option, amountCents, lineItems } or throws CartError.

   Gated programs are refused: they are priced by town and league codes,
   and codes are not built yet. Rates are refused for the same reason.
   Refusing is the safe failure, a silent fallback to the standard price
   would charge a family the wrong amount. */
export function priceCart({ programSlug, optionId, rateId, playerCount }) {
  const program = findProgram(programSlug);
  if (!program || program.status !== "live") throw new CartError("Unknown program");
  if (program.gated) throw new CartError("This program needs a code, and codes are not available yet");

  const option = program.options.find((o) => o.id === optionId);
  if (!option) throw new CartError("Unknown option");
  if (rateId) throw new CartError("Rates are not available yet");

  if (!Number.isInteger(playerCount) || playerCount < 1 || playerCount > MAX_PLAYERS) {
    throw new CartError(`Between 1 and ${MAX_PLAYERS} players`);
  }

  /* An option with a payment schedule charges its first instalment now. */
  const perPlayer = option.schedule ? option.schedule[0].amount : option.price;
  const unitCents = Math.round(perPlayer * 100);

  return {
    program,
    option,
    amountCents: unitCents * playerCount,
    lineItems: [{
      name: `${program.name}, ${program.season}. ${option.label}`,
      unitCents,
      quantity: playerCount
    }]
  };
}
