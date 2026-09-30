/* The provider adapter. Every provider implements:

     createCheckoutSession({ registrationId, lineItems, amountCents, returnUrl, customer })
       -> { redirectUrl, sessionId }
     verifyWebhook({ rawBody, headers })
       -> { valid, orderId, sessionId, status, amountCents }

   status is normalised to "succeeded", "failed" or "other". sessionId is
   how a webhook finds its registration: Clover's webhook carries the
   checkout session, not anything of ours. */

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
