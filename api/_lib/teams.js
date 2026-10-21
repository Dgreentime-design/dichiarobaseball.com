/* ==========================================================================
   Team and town camps. Private camps a town or team buys, each group with
   one code printed on its flyer.

   Read from Airtable at runtime, so a camp is added or a code changed in
   Airtable without a deploy: the Groups and Team camps tables, by field
   ID, so renaming a column in Airtable breaks nothing. Each instance keeps
   what it read for at most 60 seconds.

   Nothing here is in data/programs.json, any built page or any GET
   endpoint. The only way in is a code, and a code returns that one group's
   live camps and nothing about any other group. contact and notes are read
   by nobody: they are never requested from Airtable.

   Test groups and camps (is_test ticked) exist only off production: on a
   production deployment they behave exactly like a code that does not
   exist.

   With no AIRTABLE_TOKEN and not on Vercel, the two tables are read from
   .data/team-groups.json and .data/team-camps.json (same field IDs), so
   the flow can be run on a laptop.
   ========================================================================== */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { StoreUnavailable } from "./store.js";
import { todayEastern, VENUES, CHECK_PAYABLE_TO, CHECK_MAIL_TO } from "./programs.js";

const GROUPS_TABLE = () => process.env.TEAM_GROUPS_TABLE || "tblSu6t5sbfuyb34X";
const CAMPS_TABLE = () => process.env.TEAM_CAMPS_TABLE || "tbljL2xLu9CdvXTr9";

/* Field IDs. contact and notes are deliberately absent. */
const G = {
  name: "fldn0l9fNU1WcLXGs",
  type: "fld3AzETxmg5iiKlG",
  sport: "fldvbcFW9C24RffzI",
  code: "fldhwo9Ns2iin9bMv",
  active: "fldgDuztayuwp9FXf",
  isTest: "flds9DroUE9vhgZiR"
};
const C = {
  name: "fldaiV3cJ8o9k2aFl",
  group: "fldfWZwTyU95BFLzD",
  ref: "fld9PH7m64TkifCuG",
  status: "fldiSMQ0TAxqj5vWR",
  sport: "fldis9Xb4fgIR4qvh",
  ages: "fldmWs15ptbQ0572H",
  weeks: "fldTwWCTBY890bZF2",
  sessionHours: "fldJoV2DCD9FMWB01",
  day: "fldqMTIh8BXUR2r2U",
  time: "fldSj86dIUSaWoLNo",
  startDate: "flds7aZWZfBHXospM",
  dates: "fldFE8HDpKYSRJtio",
  venue: "fldkRFjH5lqmppMqL",
  price: "fld1M30J2Jaju6xCE",
  paymentMethods: "fldEwXiuwtKSkogJl",
  capacity: "fldMrKb4NZcclhxGr",
  summary: "fldHy9f4DPOSEsbpR",
  isTest: "fldaTJO4GVAblJoXs"
};

const METHODS = ["online", "facility", "check"];
const CACHE_MS = 60000;

/* A team or town camp paid online carries a flat processing fee, once per
   registration, not per player. Set here only: the browser is told it to
   show it, and anything a request sends as a fee or total is ignored. At
   the facility or by check there is no fee, and public programs never
   have one. */
export const TEAM_ONLINE_FEE_CENTS = 1000;

const production = () => process.env.VERCEL_ENV === "production";

/* --- Reading the tables -------------------------------------------------- */

/* Airtable could not be reached at all, or answered with a server error or
   its own rate limit. Said honestly to the family, and decided before any
   code is compared, so it says nothing about whether a code is valid. */
export class AirtableUnreachable extends Error {}

/* Every record of a table, only the named fields, keyed by field ID. */
async function readTable(table, fieldIds) {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!base) throw new StoreUnavailable("AIRTABLE_BASE_ID must be set");
  const out = [];
  let offset = "";
  do {
    const q = new URLSearchParams({ returnFieldsByFieldId: "true", pageSize: "100" });
    for (const f of fieldIds) q.append("fields[]", f);
    if (offset) q.set("offset", offset);
    let res;
    try {
      res = await fetch(`https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}?${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      throw new AirtableUnreachable(`Airtable unreachable: ${e.name}`);
    }
    if (res.status >= 500 || res.status === 429) throw new AirtableUnreachable(`Airtable ${res.status}`);
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const page = await res.json();
    out.push(...page.records.map((r) => ({ id: r.id, fields: r.fields || {} })));
    offset = page.offset || "";
  } while (offset);
  return out;
}

function readLocal(name) {
  try { return JSON.parse(readFileSync(new URL(`../../.data/${name}`, import.meta.url), "utf8")); } catch { return []; }
}

let cache = null;

async function tables(now = Date.now()) {
  if (cache && now - cache.at < CACHE_MS) return cache.data;
  let groups, camps;
  if (process.env.AIRTABLE_TOKEN) {
    [groups, camps] = await Promise.all([
      readTable(GROUPS_TABLE(), Object.values(G)),
      readTable(CAMPS_TABLE(), Object.values(C))
    ]);
  } else if (process.env.VERCEL) {
    throw new StoreUnavailable("AIRTABLE_TOKEN is not set");
  } else {
    groups = readLocal("team-groups.json");
    camps = readLocal("team-camps.json");
  }
  cache = { at: now, data: { groups, camps } };
  return cache.data;
}

/* --- Codes --------------------------------------------------------------- */

/* Case, spaces and hyphens do not matter: "abcd 2345" is ABCD-2345. A
   parent reading the flyer may type the hyphen as a space or leave it out. */
export const normalizeCode = (v) => (typeof v === "string" ? v.slice(0, 64).replace(/[\s-]+/g, "").toUpperCase() : "");

/* Both sides hashed to the same length, then compared in constant time,
   and every group is compared whatever matched earlier, so the time taken
   says nothing about how close a guess was or where the group sits. */
const digest = (s) => createHash("sha256").update(s).digest();

function groupForCode(groups, code) {
  const typed = digest(code);
  let found = null;
  for (const g of groups) {
    const stored = normalizeCode(g.fields[G.code] || "");
    const same = timingSafeEqual(typed, digest(stored));
    if (same && stored && !found) found = g;
  }
  if (!found) return null;
  if (found.fields[G.active] !== true) return null;
  if (found.fields[G.isTest] === true && production()) return null;
  return found;
}

/* --- Camps --------------------------------------------------------------- */

const selectName = (v) => (v && typeof v === "object" ? v.name : v) || "";

/* One YYYY-MM-DD per line. A camp with no dates listed falls back to its
   start date, so a camp is never shown with nothing to say when it runs. */
function campDates(f) {
  const listed = String(f[C.dates] || "").split(/\s+/).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (listed.length) return listed;
  return /^\d{4}-\d{2}-\d{2}$/.test(f[C.startDate] || "") ? [f[C.startDate]] : [];
}

function venueOf(f) {
  const v = selectName(f[C.venue]);
  if (!v || /^Academy/i.test(v)) return VENUES.facility;
  return { name: "Venue to be confirmed", address: "Venue to be confirmed. Call (201) 773-6858" };
}

/* What a family with the code may see of one camp. */
function publicCamp(rec, full) {
  const f = rec.fields;
  const dates = campDates(f);
  const methods = (f[C.paymentMethods] || []).map(selectName).filter((m) => METHODS.includes(m));
  return {
    ref: f[C.ref],
    name: f[C.name] || "",
    sport: selectName(f[C.sport]),
    ages: f[C.ages] || "",
    weeks: typeof f[C.weeks] === "number" ? f[C.weeks] : null,
    sessionHours: typeof f[C.sessionHours] === "number" ? f[C.sessionHours] : null,
    day: f[C.day] || "",
    time: f[C.time] || "",
    dates,
    venue: venueOf(f),
    priceCents: Math.round(Number(f[C.price] || 0) * 100),
    paymentMethods: METHODS.filter((m) => methods.includes(m)),
    summary: f[C.summary] || "",
    onlineFeeCents: TEAM_ONLINE_FEE_CENTS,
    full
  };
}

/* A camp a family can see: live, this group's, with a session still to
   come, a price and at least one way to pay, and not test data on
   production. */
function showable(rec, groupId, today) {
  const f = rec.fields;
  if (selectName(f[C.status]) !== "live") return false;
  if (!(f[C.group] || []).includes(groupId)) return false;
  if (f[C.isTest] === true && production()) return false;
  if (!(Number(f[C.price]) > 0)) return false;
  if (!(f[C.paymentMethods] || []).some((m) => METHODS.includes(selectName(m)))) return false;
  return campDates(f).some((d) => d >= today);
}

/* { group: { name, type, sport }, camps: [...] } or null for every kind of
   failure alike. countConfirmed(ref) returns the confirmed registrations
   for a camp; it is asked only for camps with a capacity. */
export async function lookup(code, countConfirmed) {
  const normalized = normalizeCode(code);
  const { groups, camps } = await tables();
  const group = groupForCode(groups, normalized);
  if (!group || !normalized) return null;

  const today = todayEastern();
  const mine = camps.filter((c) => showable(c, group.id, today))
    .sort((a, b) => (campDates(a.fields)[0] || "").localeCompare(campDates(b.fields)[0] || "") || a.fields[C.ref] - b.fields[C.ref]);

  const out = [];
  for (const rec of mine) {
    const cap = rec.fields[C.capacity];
    const full = typeof cap === "number" && cap > 0 ? (await countConfirmed(rec.fields[C.ref])) >= cap : false;
    out.push(publicCamp(rec, full));
  }
  return {
    group: { name: group.fields[G.name] || "", type: selectName(group.fields[G.type]), sport: selectName(group.fields[G.sport]) },
    camps: out,
    check: { payableTo: CHECK_PAYABLE_TO, mailTo: CHECK_MAIL_TO }
  };
}

/* --- Attempts ------------------------------------------------------------ */

/* Five code attempts a minute per address, in memory. Each warm instance
   keeps its own count, so this is best effort: it stops one browser or
   script guessing quickly, not a patient attacker spread over many
   addresses or cold starts. The codes' own length is the real defence. */
const LIMIT = 5;
const WINDOW_MS = 60000;
const seen = new Map();

export function limited(ip, now = Date.now()) {
  const recent = (seen.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  seen.set(ip, recent);
  if (seen.size > 5000) for (const [k, v] of seen) if (now - v[v.length - 1] >= WINDOW_MS) seen.delete(k);
  return recent.length > LIMIT;
}

export const clientIp = (request) =>
  request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";

/* The address in a log line, hashed with a key that is not in the repo so
   the hash cannot be reversed by trying every address. */
export const hashIp = (ip) =>
  createHmac("sha256", process.env.AIRTABLE_TOKEN || "local").update(ip).digest("hex").slice(0, 12);

/* Every failure takes at least this long from the start of the request,
   whatever caused it and whether the tables were cached. */
export const FLOOR_MS = 700;
export async function holdUntil(started, ms = FLOOR_MS) {
  const left = started + ms - Date.now();
  if (left > 0) await new Promise((r) => setTimeout(r, left));
}

/* The one failure, for every cause. */
export const NOT_RECOGNISED = { error: "not_recognised", message: "We don't recognise that code. Check your flyer, or call us at (201) 773-6858." };
export const UNAVAILABLE = { error: "unavailable", message: "We couldn\u2019t check your code just now. Please try again in a minute, or call (201) 773-6858." };
export const TOO_MANY = { error: "too_many", message: "Too many tries. Please wait a minute and try again." };
