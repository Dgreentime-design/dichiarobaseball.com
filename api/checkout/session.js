/* ==========================================================================
   POST /api/checkout/session

   Body: { programSlug, optionId, rateId?, paymentMethod, players[], parent,
           waiverAccepted, photoConsent }

   The amount is computed here from the IDs. Any amount in the body is
   ignored. Online payment writes a pending row and returns the provider's
   redirect; the row becomes confirmed only when a verified webhook says
   so. Pay at the facility and pay by check have nothing to verify, so they
   are written confirmed straight away with no provider call.
   ========================================================================== */

import { priceCart, CartError, PAYMENT_METHODS, MAX_PLAYERS } from "../_lib/programs.js";
import { store, StoreUnavailable } from "../_lib/store.js";
import { provider } from "../_lib/providers/index.js";
import { json, newRegistrationId } from "../_lib/http.js";

const MAX_BODY = 20000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (v, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function readPlayers(list) {
  if (!Array.isArray(list) || list.length < 1 || list.length > MAX_PLAYERS) return null;
  const players = list.map((p) => ({
    first_name: text(p?.firstName),
    last_name: text(p?.lastName),
    date_of_birth: text(p?.dateOfBirth, 20),
    grade: text(p?.grade, 40),
    coach_note: text(p?.coachNote, 1000)
  }));
  return players.every((p) => p.first_name && p.last_name && p.date_of_birth && p.grade) ? players : null;
}

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "Request too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }

  const players = readPlayers(body.players);
  if (!players) return json({ error: `Between 1 and ${MAX_PLAYERS} players, each with a name, date of birth and grade` }, 400);

  const parent = {
    firstName: text(body.parent?.firstName),
    lastName: text(body.parent?.lastName),
    email: text(body.parent?.email, 200),
    phone: text(body.parent?.phone, 40)
  };
  if (!parent.firstName || !parent.lastName || !EMAIL.test(parent.email) || !parent.phone) {
    return json({ error: "Parent name, email and phone are required" }, 400);
  }
  if (body.waiverAccepted !== true) return json({ error: "The waiver must be accepted" }, 400);

  const method = body.paymentMethod;
  if (!PAYMENT_METHODS.includes(method)) return json({ error: "Unknown payment method" }, 400);

  let cart;
  try {
    cart = priceCart({
      programSlug: body.programSlug,
      optionId: body.optionId,
      rateId: body.rateId,
      playerCount: players.length
    });
  } catch (e) {
    if (e instanceof CartError) return json({ error: e.message }, 400);
    throw e;
  }

  const registrationId = newRegistrationId();
  const record = {
    registration_id: registrationId,
    status: method === "online" ? "pending" : "confirmed",
    program: `${cart.program.name}, ${cart.program.season}`,
    option: cart.option.label,
    players: JSON.stringify(players),
    parent_name: `${parent.firstName} ${parent.lastName}`,
    parent_email: parent.email,
    parent_phone: parent.phone,
    amount: cart.amountCents / 100,
    payment_method: method,
    waiver_accepted: true,
    photo_consent: body.photoConsent === true
  };

  try {
    const db = store();
    await db.create(record);

    if (method !== "online") {
      return json({ registrationId, status: record.status, amountCents: cart.amountCents });
    }

    const origin = new URL(request.url).origin;
    const { redirectUrl, sessionId } = await provider().createCheckoutSession({
      registrationId,
      lineItems: cart.lineItems,
      amountCents: cart.amountCents,
      returnUrl: `${origin}/register.html?registration=${registrationId}`,
      customer: parent
    });
    await db.update(registrationId, { checkout_session_id: sessionId });

    return json({ registrationId, status: "pending", amountCents: cart.amountCents, redirectUrl });
  } catch (e) {
    console.error("checkout/session", registrationId, e);
    const status = e instanceof StoreUnavailable ? 503 : 502;
    return json({ error: "Registration could not be started. Nothing has been charged." }, status);
  }
}
