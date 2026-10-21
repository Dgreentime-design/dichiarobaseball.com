/* ==========================================================================
   POST /api/checkout/session

   Body: { programSlug, optionId, rateId?, paymentMethod, players[], parent,
           waiverAccepted, photoConsent, marketingOptIn? }
     or, for a team or town camp,
         { code, campRef, paymentMethod, players[], parent, ... }

   The amount is computed here from the IDs. Any amount in the body is
   ignored. Online payment writes a pending row and returns the provider's
   redirect; the row becomes confirmed only when a verified webhook says
   so. Pay at the facility and pay by check have nothing to verify, so they
   are written confirmed straight away with no provider call.

   A team camp is checked again here from its code: the code must still
   open that camp, the price comes from Airtable (price x players), the
   payment method must be one the camp allows, and a camp at capacity is
   refused. A bad code gets the same answer as on /api/team-code, after
   the same delay, and counts against the same five a minute.
   ========================================================================== */

import "../_lib/guard.js";
import { priceCart, CartError, PAYMENT_METHODS, MAX_PLAYERS } from "../_lib/programs.js";
import { store, StoreUnavailable } from "../_lib/store.js";
import { provider } from "../_lib/providers/index.js";
import { json, newRegistrationId } from "../_lib/http.js";
import { lookup, limited, clientIp, hashIp, holdUntil, NOT_RECOGNISED, TOO_MANY } from "../_lib/teams.js";

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
  let team = null;
  if (body.code !== undefined || body.campRef !== undefined) {
    const priced = await priceTeamCamp(request, body, method, players.length);
    if (priced.response) return priced.response;
    ({ cart, team } = priced);
  } else {
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
  }

  const registrationId = newRegistrationId();
  const record = {
    registration_id: registrationId,
    status: method === "online" ? "pending" : "confirmed",
    program: team ? team.campName : `${cart.program.name}, ${cart.program.season}`,
    option: team ? "Team camp" : cart.option.label,
    ...(team ? { team_group: team.groupName, team_camp_ref: team.campRef } : {}),
    players: JSON.stringify(players),
    parent_name: `${parent.firstName} ${parent.lastName}`,
    parent_email: parent.email,
    parent_phone: parent.phone,
    amount: cart.amountCents / 100,
    payment_method: method,
    waiver_accepted: true,
    photo_consent: body.photoConsent === true,
    /* News about camps and clinics, never pre-ticked. The time is set only
       when the box was ticked. Both fields are optional in the table. */
    marketing_opt_in: body.marketingOptIn === true,
    ...(body.marketingOptIn === true ? { marketing_opt_in_at: new Date().toISOString() } : {})
  };

  let stage = "store.create";
  try {
    const db = store();
    await db.create(record);

    if (method !== "online") {
      return json({ registrationId, status: record.status, amountCents: cart.amountCents });
    }

    stage = "provider";
    const origin = new URL(request.url).origin;
    const { redirectUrl, sessionId } = await provider().createCheckoutSession({
      registrationId,
      lineItems: cart.lineItems,
      amountCents: cart.amountCents,
      returnUrl: `${origin}/register.html?registration=${registrationId}`,
      customer: parent
    });
    stage = "store.update";
    await db.update(registrationId, { checkout_session_id: sessionId });

    return json({ registrationId, status: "pending", amountCents: cart.amountCents, redirectUrl });
  } catch (e) {
    console.error("checkout/session", registrationId, e);
    const status = e instanceof StoreUnavailable ? 503 : 502;
    const body = { error: "Registration could not be started. Nothing has been charged." };
    /* On a preview only, say which step failed and the upstream status and
       error type, so a failure can be read without logs. No values. */
    if (process.env.VERCEL_ENV === "preview") {
      const m = String(e.message).match(/^(Airtable|Clover checkout) (\d+): (.*)$/s);
      const type = m && (m[3].match(/"(?:type|code|errorCode)"\s*:\s*"([A-Za-z_]+)"/) || [])[1];
      /* Airtable names an unknown field in its message. A field name is
         schema, not configuration, so it is safe to show. */
      const field = m && (m[3].match(/Unknown field name: \\?"([\w ]{1,64})\\?"/) || [])[1];
      body.diagnostic = {
        stage,
        registrationId,
        upstream: m ? { service: m[1], status: Number(m[2]), type: type || null, field: field || null } : { kind: e.name, message: m ? null : String(e.message).slice(0, 80) }
      };
    }
    return json(body, status);
  }
}

/* { cart, team } for a team camp, or { response } refusing it. */
async function priceTeamCamp(request, body, method, playerCount) {
  const started = Date.now();
  const ip = clientIp(request);
  const log = (result) => console.log("team-code", JSON.stringify({ ip: hashIp(ip), result, at: "checkout" }));
  if (limited(ip)) {
    log("rate_limited");
    await holdUntil(started);
    return { response: json(TOO_MANY, 429) };
  }

  let found = null;
  try {
    const db = store();
    found = typeof body.code === "string" ? await lookup(body.code, (ref) => db.countConfirmedTeamCamp(ref)) : null;
  } catch (e) {
    console.error("checkout/session team lookup", e.name);
    found = null;
  }
  const camp = found && found.camps.find((c) => c.ref === Number(body.campRef));
  if (!camp) {
    log("fail");
    await holdUntil(started);
    return { response: json(NOT_RECOGNISED, 404) };
  }
  log("ok");

  if (camp.full) return { response: json({ error: "This camp is full." }, 400) };
  if (!camp.paymentMethods.includes(method)) return { response: json({ error: "This camp does not take that payment method." }, 400) };

  const unitCents = camp.priceCents;
  return {
    team: { campName: camp.name, groupName: found.group.name, campRef: camp.ref },
    cart: {
      amountCents: unitCents * playerCount,
      lineItems: [{ name: camp.name, unitCents, quantity: playerCount }]
    }
  };
}
