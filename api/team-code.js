/* ==========================================================================
   POST /api/team-code

   Body: { code }

   A town or team code in, that group's live camps out:
     200 { group: { name, type, sport }, camps: [...] }
   A valid code with no live camps is a success with an empty list.

   Every failure, whatever its cause (no such code, an inactive group, test
   data on production, a malformed request), is the same 404 with the same
   body, and takes the same minimum time. Never a list of groups or codes.
   Only when Airtable cannot be reached at all (network error, 5xx or its
   rate limit) is the answer different: a 503 saying so, decided before any
   code is looked at, so it says nothing about the code.
   Five attempts a minute per address, then 429.

   Each attempt is logged with a hashed address and the result, never the
   code that was typed. Only POST is exported, so there is no GET to crawl.
   ========================================================================== */

import "./_lib/guard.js";
import { lookup, limited, clientIp, hashIp, holdUntil, NOT_RECOGNISED, TOO_MANY, UNAVAILABLE, AirtableUnreachable } from "./_lib/teams.js";
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
  let unreachable = false;
  try {
    const raw = await request.text();
    const body = raw.length <= MAX_BODY ? JSON.parse(raw) : null;
    const db = store();
    if (body && typeof body.code === "string") result = await lookup(body.code, (ref) => db.countConfirmedTeamCamp(ref));
  } catch (e) {
    /* Any other error reads as the generic failure. The log names the
       type only. */
    console.error("team-code error", e.name);
    unreachable = e instanceof AirtableUnreachable;
    result = null;
  }

  await holdUntil(started);
  if (unreachable) {
    log("unavailable");
    return json(UNAVAILABLE, 503);
  }
  if (!result) {
    log("fail");
    return json(NOT_RECOGNISED, 404);
  }
  log("ok");
  return json(result);
}
