/* ==========================================================================
   Registrations storage. The only module that knows where rows live.

   A record is an object keyed by the Airtable field names, so what the code
   writes and what Michael reads in Airtable are the same words:

     registration_id, status, program, option, players, parent_name,
     parent_email, parent_phone, amount, payment_method, provider_order_id,
     checkout_session_id, waiver_accepted, photo_consent, webhook_note

   webhook_note is optional: where the table lacks it, writes go ahead
   without it.

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

/* One table in the base, with the token and base every table shares. */
function airtableTable(table) {
  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!base || !table) throw new StoreUnavailable("AIRTABLE_BASE_ID and a table name must be set");
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

  async function findAll(field, value, max = 1) {
    const q = new URLSearchParams({ filterByFormula: `{${field}}=${quote(value)}`, maxRecords: String(max) });
    const { records } = await call(`?${q}`);
    return records;
  }

  return { call, quote, findAll };
}

function airtable() {
  const { call, quote, findAll } = airtableTable(process.env.AIRTABLE_TABLE_NAME);
  const findOne = async (field, value) => (await findAll(field, value))[0] || null;

  /* webhook_note is optional in the table. If Airtable says it does not
     exist, write the same fields without it rather than lose the row. */
  async function write(path, method, fields, wrap) {
    try {
      return await call(path, { method, body: JSON.stringify(wrap(fields)) });
    } catch (e) {
      if (!("webhook_note" in fields) || !/UNKNOWN_FIELD_NAME/.test(e.message) || !/webhook_note/.test(e.message)) throw e;
      const { webhook_note, ...rest } = fields;
      console.warn("Airtable has no webhook_note field; the note was not stored");
      return call(path, { method, body: JSON.stringify(wrap(rest)) });
    }
  }

  return {
    async create(fields) {
      await write("", "POST", fields, (f) => ({ records: [{ fields: f }], typecast: true }));
    },
    async get(id) {
      const r = await findOne("registration_id", id);
      return r ? r.fields : null;
    },
    async all(id) {
      return (await findAll("registration_id", id, 10)).map((r) => r.fields);
    },
    async findBySession(sessionId) {
      const r = await findOne("checkout_session_id", sessionId);
      return r ? r.fields : null;
    },
    /* One query for several candidate values: the first registration whose
       session ID is any of them. */
    async findBySessionAmong(values) {
      if (!values.length) return null;
      const formula = `OR(${values.slice(0, 20).map((v) => `{checkout_session_id}=${quote(v)}`).join(",")})`;
      const q = new URLSearchParams({ filterByFormula: formula, maxRecords: "1" });
      const { records } = await call(`?${q}`);
      return records[0] ? records[0].fields : null;
    },
    async update(id, fields) {
      const r = await findOne("registration_id", id);
      if (!r) throw new Error(`No registration ${id}`);
      await write(`/${r.id}`, "PATCH", fields, (f) => ({ fields: f, typecast: true }));
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
    async all(id) { return read().filter((r) => r.registration_id === id); },
    async findBySession(sessionId) { return read().find((r) => r.checkout_session_id === sessionId) || null; },
    async findBySessionAmong(values) { return read().find((r) => r.checkout_session_id && values.includes(r.checkout_session_id)) || null; },
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

/* --- Enquiries ------------------------------------------------------------

   The Contact and Team camps forms. Their own table, named by
   ENQUIRIES_TABLE_NAME, in the same base with the same token. With no table
   name there is nowhere to write, and it never falls back to the
   registrations table. */

export function enquiryStore() {
  const table = process.env.ENQUIRIES_TABLE_NAME;
  if (!table) throw new StoreUnavailable("ENQUIRIES_TABLE_NAME is not set");

  if (process.env.AIRTABLE_TOKEN) {
    const { call, findAll } = airtableTable(table);
    return {
      async create(fields) { await call("", { method: "POST", body: JSON.stringify({ records: [{ fields }], typecast: true }) }); },
      async get(reference) { return (await findAll("reference", reference))[0]?.fields || null; }
    };
  }
  if (process.env.VERCEL) throw new StoreUnavailable("AIRTABLE_TOKEN is not set");

  const dir = new URL("../../.data/", import.meta.url);
  const file = new URL("enquiries.json", dir);
  const read = () => { try { return JSON.parse(readFileSync(file, "utf8")); } catch { return []; } };
  return {
    async create(fields) { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify([...read(), fields], null, 2)); },
    async get(reference) { return read().find((r) => r.reference === reference) || null; }
  };
}
