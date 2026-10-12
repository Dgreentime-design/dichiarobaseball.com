/* The provider adapter. Every provider implements:

     createCheckoutSession({ registrationId, lineItems, amountCents, returnUrl, customer })
       -> { redirectUrl, sessionId }
     verifyWebhook({ rawBody, headers })
       -> { valid, payload }

   verifyWebhook checks the signature and nothing else. The payload is
   read by value in api/_lib/match.js: the session, outcome, amount and
   order ID are found wherever they are, not at an assumed key. */

import { assertSafeConfig } from "../guard.js";
import { MockProvider } from "./mock.js";
import { CloverProvider } from "./clover.js";

const PROVIDERS = { mock: MockProvider, clover: CloverProvider };

export function provider() {
  assertSafeConfig();
  const p = PROVIDERS[process.env.PAYMENT_PROVIDER];
  if (!p) throw new Error("PAYMENT_PROVIDER must be mock or clover");
  return p;
}
