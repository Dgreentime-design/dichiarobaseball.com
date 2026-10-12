/* ==========================================================================
   Optional Airtable fields, in process, against a fake Airtable that
   answers 422 UNKNOWN_FIELD_NAME in Airtable's own body shape for any
   column the table lacks. A row is never lost to a missing optional
   column (webhook_note, marketing_opt_in, marketing_opt_in_at), and a
   missing required one still fails. Run by check-enquiry.mjs.
   ========================================================================== */

process.env.AIRTABLE_TOKEN = "test"; process.env.AIRTABLE_BASE_ID = "appTEST";
process.env.AIRTABLE_TABLE_NAME = "Registrations Test"; process.env.ENQUIRIES_TABLE_NAME = "Enquiries Test";
const { store, enquiryStore } = await import("../api/_lib/store.js");
let columns, written;
globalThis.fetch = async (url, init) => {
  const fields = JSON.parse(init.body).records[0].fields;
  const unknown = Object.keys(fields).find((k) => !columns.includes(k));
  if (unknown) return new Response(JSON.stringify({ error: { type: "UNKNOWN_FIELD_NAME", message: `Unknown field name: "${unknown}"` } }), { status: 422 });
  written = fields; return new Response(JSON.stringify({ records: [{ id: "rec1", fields }] }), { status: 200 });
};
const base = { reference: "EQ-1", name: "T", marketing_opt_in: true, marketing_opt_in_at: "2026-10-08T00:00:00Z" };
const cases = [
  ["both fields present", ["reference", "name", "marketing_opt_in", "marketing_opt_in_at"], ["marketing_opt_in", "marketing_opt_in_at"]],
  ["only marketing_opt_in", ["reference", "name", "marketing_opt_in"], ["marketing_opt_in"]],
  ["only marketing_opt_in_at", ["reference", "name", "marketing_opt_in_at"], ["marketing_opt_in_at"]],
  ["neither", ["reference", "name"], []]
];
for (const [label, cols, keep] of cases) {
  columns = cols; written = null;
  await enquiryStore().create({ ...base });
  const ok = written && keep.every((k) => k in written) && !["marketing_opt_in", "marketing_opt_in_at"].filter((k) => !keep.includes(k)).some((k) => k in written) && written.reference === "EQ-1";
  if (!ok) process.exitCode = 1;
  console.log(ok ? "  ok   " : "  FAIL ", "enquiry,", label, "->", written ? Object.keys(written).join(",") : "nothing written");
}
columns = ["registration_id", "status"]; written = null;
await store().create({ registration_id: "DBSA-X", status: "pending", marketing_opt_in: false, webhook_note: "n" });
const regOk = written && Object.keys(written).join(",") === "registration_id,status";
if (!regOk) process.exitCode = 1;
console.log(regOk ? "  ok   " : "  FAIL ", "registration, no optional columns ->", Object.keys(written || {}).join(","));
columns = ["registration_id"]; let threw = false;
try { await store().create({ registration_id: "DBSA-Y", status: "pending" }); } catch { threw = true; }
if (!threw) process.exitCode = 1;
console.log(threw ? "  ok   " : "  FAIL ", "a missing required field still fails the write");
