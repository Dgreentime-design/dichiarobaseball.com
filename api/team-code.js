/* ==========================================================================
   POST /api/team-code

   Body: { code }

   A town or team code in, that group's live camps out:
     200 { group: { name, type, sport }, camps: [...] }
   A valid code with no live camps is a success with an empty list.

   Every failure, whatever its cause (no such code, an inactive group, test
   data on production, a malformed request), is the same 404 with the same
   body, and takes the same minimum time. Never a list of groups or codes.
   Five attempts a minute per address, then 429.

   Each attempt is logged with a hashed address and the result, never the
   code that was typed. Only POST is exported, so there is no GET to crawl.
   ========================================================================== */

import "./_lib/guard.js";
import { lookup, limited, clientIp, hashIp, holdUntil, NOT_RECOGNISED, TOO_MANY } from "./_lib/teams.js";
import { store } from "./_lib/store.js";
import { json } from "./_lib/http.js";

const MAX_BODY = 1000;

export async function POST(request) {
  const started = Date.now();
  const ip = hashIp(clientIp(request));
  const log = (result) => console.log("team-code", JSON.stringify({ ip, result }));

  if (limited(clientIp(request))) {
    log("rate_limited");
    await holdUntil(started);
    return json(TOO_MANY, 429);
  }

  let result = null;
  try {
    const raw = await request.text();
    const body = raw.length <= MAX_BODY ? JSON.parse(raw) : null;
    const db = store();
    if (body && typeof body.code === "string") result = await lookup(body.code, (ref) => db.countConfirmedTeamCamp(ref));
  } catch (e) {
    /* An Airtable outage reads as a failure too, so it cannot be told
       apart from a wrong code. The log names the type only. */
    console.error("team-code error", e.name);
    result = null;
  }

  await holdUntil(started);
  if (!result) {
    log("fail");
    return json(NOT_RECOGNISED, 404);
  }
  log("ok");
  return json(result);
}
