/* GET /api/registration/:id/status

   { status: "pending" | "confirmed" | "failed", paymentMethod, amountCents,
     processingFeeCents, program, option }

   What the confirmation screen polls after the redirect back from payment.
   Nothing personal comes back, only enough to render the right state, and
   nothing that names a team or town camp. */

import "../../_lib/guard.js";
import { store } from "../../_lib/store.js";
import { json, REGISTRATION_ID } from "../../_lib/http.js";

export async function GET(request) {
  const id = new URL(request.url).pathname.split("/")[3];
  if (!REGISTRATION_ID.test(id || "")) return json({ error: "Not found" }, 404);

  try {
    const reg = await store().get(id);
    if (!reg) return json({ error: "Not found" }, 404);
    return json({
      status: reg.status,
      paymentMethod: reg.payment_method,
      amountCents: Math.round(reg.amount * 100),
      /* The part of amountCents that was a team camp's online fee, 0 for
         everything else. */
      processingFeeCents: Math.round((Number(reg.processing_fee) || 0) * 100),
      /* A team camp is named only to the browser that holds its code:
         this GET says "Team camp", never the camp or the group. */
      program: reg.team_group ? "Team camp" : reg.program,
      option: reg.option
    });
  } catch (e) {
    console.error("registration status", id, e);
    return json({ error: "Temporarily unavailable" }, 503);
  }
}
