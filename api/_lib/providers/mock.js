/* ==========================================================================
   Mock payment provider, PAYMENT_PROVIDER=mock.

   Behaves like Clover Hosted Checkout from the outside: a session ID, a
   redirect to a payment page, and a signed webhook to /api/webhooks/clover
   when the payer decides. The page is /api/mock-checkout. Nothing is
   charged and no card is ever entered.
   ========================================================================== */

import { randomBytes } from "node:crypto";
import { sign, verify } from "./signature.js";

export const SIGNATURE_HEADER = "mock-signature";

function secret() {
  const s = process.env.MOCK_WEBHOOK_SECRET;
  if (!s) throw new Error("MOCK_WEBHOOK_SECRET must be set when PAYMENT_PROVIDER=mock");
  return s;
}

export const MockProvider = {
  name: "mock",

  async createCheckoutSession({ registrationId, lineItems, amountCents, returnUrl }) {
    secret();
    const sessionId = "mock_" + randomBytes(12).toString("hex");
    const q = new URLSearchParams({
      session: sessionId,
      amount: String(amountCents),
      label: lineItems.map((l) => `${l.name} x ${l.quantity}`).join("; "),
      ref: registrationId,
      return: returnUrl
    });
    return { redirectUrl: `/api/mock-checkout?${q}`, sessionId };
  },

  /* Builds the webhook the mock checkout page posts. One payment ID per
     session, so approving twice is a duplicate delivery, not a new charge. */
  signedWebhook({ sessionId, approved, amountCents }) {
    const body = JSON.stringify({
      type: "PAYMENT",
      status: approved ? "APPROVED" : "DECLINED",
      id: "mockpay_" + sessionId.replace(/^mock_/, ""),
      data: sessionId,
      amount: amountCents,
      createdTime: Date.now()
    });
    return { body, headers: { "Content-Type": "application/json", [SIGNATURE_HEADER]: sign(body, secret()) } };
  },

  verifyWebhook({ rawBody, headers }) {
    if (!verify(rawBody, headers.get(SIGNATURE_HEADER), process.env.MOCK_WEBHOOK_SECRET)) return { valid: false };
    const e = JSON.parse(rawBody);
    return {
      valid: true,
      orderId: e.id,
      sessionId: e.data,
      status: e.status === "APPROVED" ? "succeeded" : e.status === "DECLINED" ? "failed" : "other",
      amountCents: Number.isInteger(e.amount) ? e.amount : null
    };
  }
};
