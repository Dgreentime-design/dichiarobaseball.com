/* ==========================================================================
   Registrations storage. The only module that knows where rows live.

   A record is an object keyed by the Airtable field names, so what the code
   writes and what Michael reads in Airtable are the same words:

     registration_id, status, program, option, players, parent_name,
     parent_email, parent_phone, amount, payment_method, provider_order_id,
     checkout_session_id, waiver_accepted, photo_consent

   created_at is Airtable's own created-time field and is never written.

   Two backends:
     Airtable      when AIRTABLE_TOKEN is set
     a local file  when it is not AND the code is not running on Vercel,
                   so the whole flow can be exercised on a laptop without
                   credentials. On Vercel with no token, every call fails
                   loudly rather than pretending to store anything.
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

export class StoreUnavailable extends Error {}

/* --- Airtable ------------------------------------------------------------ */

function airtable() {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME;
  if (!base || !table) throw new StoreUnavailable("AIRTABLE_BASE_ID and AIRTABLE_TABLE_NAME must be set");
  const url = `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`;

  async function call(path, init = {}) {
    const res = await fetch(url + path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json();
  }

  /* Values in a formula are quoted, so escape the quote and the escape. */
  const quote = (v) => `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

  async function findOne(field, value) {
    const q = new URLSearchParams({ filterByFormula: `{${field}}=${quote(value)}`, maxRecords: "1" });
    const { records } = await call(`?${q}`);
    return records[0] || null;
  }

  return {
    async create(fields) {
      await call("", { method: "POST", body: JSON.stringify({ records: [{ fields }], typecast: true }) });
    },
    async get(id) {
      const r = await findOne("registration_id", id);
      return r ? r.fields : null;
    },
    async findBySession(sessionId) {
      const r = await findOne("checkout_session_id", sessionId);
      return r ? r.fields : null;
    },
    async update(id, fields) {
      const r = await findOne("registration_id", id);
      if (!r) throw new Error(`No registration ${id}`);
      await call(`/${r.id}`, { method: "PATCH", body: JSON.stringify({ fields, typecast: true }) });
    }
  };
}

/* --- Local file, development only ---------------------------------------- */

function localFile() {
  const dir = new URL("../../.data/", import.meta.url);
  const file = new URL("registrations.json", dir);
  const read = () => { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return []; } };
  const write = (rows) => { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify(rows, null, 2)); };

  return {
    async create(fields) { write([...read(), { ...fields, created_at: new Date().toISOString() }]); },
    async get(id) { return read().find((r) => r.registration_id === id) || null; },
    async findBySession(sessionId) { return read().find((r) => r.checkout_session_id === sessionId) || null; },
    async update(id, fields) {
      const rows = read();
      const row = rows.find((r) => r.registration_id === id);
      if (!row) throw new Error(`No registration ${id}`);
      Object.assign(row, fields);
      write(rows);
    }
  };
}

export function store() {
  if (process.env.AIRTABLE_TOKEN) return airtable();
  if (process.env.VERCEL) throw new StoreUnavailable("AIRTABLE_TOKEN is not set");
  return localFile();
}
