/* ==========================================================================
   Clover Hosted Checkout, PAYMENT_PROVIDER=clover.

   Checkout: POST {base}/invoicingcheckoutservice/v1/checkouts, which
   returns { href, checkoutSessionId }. The parent is sent to href.

   Webhook: Clover posts { type, status, id, merchantId, data, message }
   where id is the payment ID and data is the checkout session ID, signed
   in the Clover-Signature header as t=<ts>,v1=<hex HMAC-SHA256 of
   "<ts>.<raw body>"> with the webhook's signing secret.

   returnUrl is sent as redirectUrls.success, .failure and .cancel, so the
   parent comes back to the registration that was just started. Clover's
   dashboard can also hold fixed redirect URLs; the per-request ones are
   the documented way to vary them by session.

   Every value comes from the environment:
     CLOVER_ENV             sandbox | production
     CLOVER_MERCHANT_ID
     CLOVER_PRIVATE_TOKEN   Ecommerce private key or OAuth token
     CLOVER_WEBHOOK_SECRET  the webhook URL's signing secret
   ========================================================================== */

import { verify } from "./signature.js";

const BASES = {
  sandbox: "https://apisandbox.dev.clover.com",
  production: "https://api.clover.com"
};

function config() {
  const env = process.env.CLOVER_ENV;
  const base = BASES[env];
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const token = process.env.CLOVER_PRIVATE_TOKEN;
  if (!base || !merchantId || !token) {
    throw new Error("CLOVER_ENV (sandbox|production), CLOVER_MERCHANT_ID and CLOVER_PRIVATE_TOKEN must be set");
  }
  return { base, merchantId, token };
}

/* Clover's docs show the webhook fields capitalised in places and
   camelCase in others. Read either. */
const field = (obj, name) => obj[name] ?? obj[name[0].toUpperCase() + name.slice(1)];

export const CloverProvider = {
  name: "clover",

  async createCheckoutSession({ registrationId, lineItems, amountCents, returnUrl, customer = {} }) {
    const { base, merchantId, token } = config();

    const cart = lineItems.map((l) => ({
      name: l.name.slice(0, 127),
      price: l.unitCents,
      unitQty: l.quantity,
      note: `Registration ${registrationId}`
    }));
    const total = cart.reduce((sum, l) => sum + l.price * l.unitQty, 0);
    if (total !== amountCents) throw new Error("Line items do not add up to the amount");

    const res = await fetch(`${base}/invoicingcheckoutservice/v1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Clover-Merchant-Id": merchantId,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        customer: {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phone
        },
        shoppingCart: { lineItems: cart },
        redirectUrls: { success: returnUrl, failure: returnUrl, cancel: returnUrl }
      })
    });
    if (!res.ok) throw new Error(`Clover checkout ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const { href, checkoutSessionId } = await res.json();
    if (!href || !checkoutSessionId) throw new Error("Clover checkout returned no href or session");
    return { redirectUrl: href, sessionId: checkoutSessionId };
  },

  verifyWebhook({ rawBody, headers }) {
    if (!verify(rawBody, headers.get("clover-signature"), process.env.CLOVER_WEBHOOK_SECRET)) return { valid: false };
    const e = JSON.parse(rawBody);

    /* A correctly signed message for another merchant is not ours. */
    const merchant = field(e, "merchantId");
    if (merchant && merchant !== process.env.CLOVER_MERCHANT_ID) return { valid: false };

    const status = field(e, "status");
    return {
      valid: true,
      orderId: field(e, "id"),
      sessionId: field(e, "data"),
      status: status === "APPROVED" ? "succeeded" : status === "DECLINED" ? "failed" : "other",
      /* The payload has no amount field, only a message like "Approved for
         100". Its unit is not documented, so it is not relied on. */
      amountCents: null
    };
  }
};
