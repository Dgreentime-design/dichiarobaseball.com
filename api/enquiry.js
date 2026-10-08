/* ==========================================================================
   POST /api/enquiry

   Body: { form: "contact" | "team-camps", fields: {...}, about?, pageUrl?,
           elapsedMs, trap }

   The Contact and Team camps forms. Each message is one row in the
   enquiries table, and an Airtable automation emails Michael. The site
   sends no email itself.

   Two spam checks answer with a success that writes nothing, so a bot
   learns nothing from the response: the hidden `trap` field filled in,
   or a submit less than 3 seconds after the page loaded. Each address may
   send 5 a minute.

   Logs carry a reference and a status, never what was typed.
   ========================================================================== */

import "./_lib/guard.js";
import { randomBytes } from "node:crypto";
import { enquiryStore } from "./_lib/store.js";
import { TOPICS, ABOUT_TOPICS } from "./_lib/topics.js";
import { todayEastern } from "./_lib/programs.js";
import { json } from "./_lib/http.js";

const MAX_BODY = 12000;
const MIN_ELAPSED_MS = 3000;
const LIMIT = 5;
const WINDOW_MS = 60000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BAD_INPUT = () => json({ error: "Please check the form and try again." }, 400);
const FAILED = () => json({ error: "That didn't send." }, 503);

/* EQ-YYYYMMDD-XXXX, from an alphabet with no 0/O or 1/I/L so it can be read
   over the phone. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function newReference() {
  const code = Array.from(randomBytes(4), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `EQ-${todayEastern().replace(/-/g, "")}-${code}`;
}

/* Per address, in memory. Each warm instance keeps its own count, which is
   enough to stop one browser or script flooding the table. */
const seen = new Map();
function limited(ip, now = Date.now()) {
  const recent = (seen.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  seen.set(ip, recent);
  if (seen.size > 5000) for (const [k, v] of seen) if (now - v[v.length - 1] >= WINDOW_MS) seen.delete(k);
  return recent.length > LIMIT;
}

const clientIp = (request) =>
  request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";

/* Trimmed, capped, and missing when not a string. */
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const tooLong = (v, max) => typeof v === "string" && v.trim().length > max;

/* Each form's fields: [name, cap, required]. */
const FORMS = {
  "contact": [["first-name", 100, true], ["last-name", 100, true], ["email", 200, true],
    ["phone", 40, false], ["topic", 60, true], ["message", 2000, true]],
  "team-camps": [["name", 100, true], ["role", 100, true], ["email", 200, true], ["phone", 40, true],
    ["team", 150, true], ["sport", 20, true], ["players", 3, true], ["weeks", 30, true],
    ["start", 100, true], ["notes", 2000, false]]
};

function read(form, raw) {
  const spec = FORMS[form];
  if (!spec || !raw || typeof raw !== "object") return null;
  if (spec.some(([name, max]) => tooLong(raw[name], max))) return null;
  const f = Object.fromEntries(spec.map(([name, max]) => [name, text(raw[name], max)]));
  if (spec.some(([name, , required]) => required && !f[name])) return null;
  if (!EMAIL.test(f.email)) return null;
  if (form === "contact" && !TOPICS.includes(f.topic)) return null;
  if (form === "team-camps" && !/^\d{1,3}$/.test(f.players)) return null;
  return f;
}

function row(form, f, about, pageUrl, reference) {
  const common = {
    reference,
    created_at: new Date().toISOString(),
    form,
    about,
    email: f.email,
    phone: f.phone,
    page_url: pageUrl,
    status: "new"
  };
  if (form === "contact") {
    return { ...common, name: `${f["first-name"]} ${f["last-name"]}`, topic: f.topic, message: f.message };
  }
  return {
    ...common,
    name: f.name,
    topic: "Team booking",
    message: f.notes,
    details: [`Role: ${f.role}`, `Team: ${f.team}`, `Sport: ${f.sport}`, `Players: ${f.players}`,
      `Weeks: ${f.weeks}`, `Start: ${f.start}`].join("\n")
  };
}

export async function POST(request) {
  if (limited(clientIp(request))) {
    console.warn("enquiry rate_limited");
    return json({ error: "Too many messages. Please wait a minute." }, 429);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return BAD_INPUT();
  let body;
  try { body = JSON.parse(raw); } catch { return BAD_INPUT(); }
  if (!body || typeof body !== "object") return BAD_INPUT();

  const reference = newReference();

  /* Spam: answer as if it worked, write nothing. The log names the check
     that caught it, never the value. The trap field is named so that no
     browser or password manager autofills it: a field called "website"
     was autofilled and real messages were thrown away. */
  const elapsed = Number(body.elapsedMs);
  const caught = text(body.trap, 200) ? "honeypot"
    : !Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS ? "too_fast" : "";
  if (caught) {
    console.log("enquiry", reference, "discarded", caught);
    return json({ reference });
  }

  const form = body.form;
  const fields = read(form, body.fields);
  if (!fields) return BAD_INPUT();

  const slug = text(body.about, 60);
  const about = Object.hasOwn(ABOUT_TOPICS, slug) ? slug : "";
  const pageUrl = text(body.pageUrl, 300);

  try {
    await enquiryStore().create(row(form, fields, about, pageUrl, reference));
  } catch (e) {
    console.error("enquiry", reference, "failed", e.constructor.name);
    return FAILED();
  }
  console.log("enquiry", reference, "saved");
  return json({ reference });
}
