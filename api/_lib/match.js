/* ==========================================================================
   Reading a payment webhook by value, not by key name.

   Clover documents its webhook fields by label ("Data: Checkout Session
   UUID"), not by JSON key, and the first real payment carried neither of
   the keys that label suggested. So nothing here depends on a key name.
   The payload is flattened to every leaf value with its key path, and:

     session   any string equal to the checkout session ID stored on a
               registration. Found by asking storage, not by guessing.
     outcome   a value that is exactly a recognised approved or declined
               word. Both, or neither, is no outcome.
     amount    numbers at a key path that names an amount or total, and
               the number in a "Approved for N" style message. Absent is
               reported as absent, never assumed.
     order     the provider's payment ID: a string at a key path that is
               an id, other than the session value.

   Every finding carries its key path, so the log teaches the real shape.
   ========================================================================== */

const APPROVED = new Set(["APPROVED", "SUCCEEDED", "SUCCESS"]);
const DECLINED = new Set(["DECLINED", "FAILED", "FAILURE"]);

/* Every leaf as { path, value }. Arrays index as [n]. */
export function leaves(node, path = "") {
  if (node === null || typeof node !== "object") return [{ path: path || "(root)", value: node }];
  const entries = Array.isArray(node) ? node.map((v, i) => [`[${i}]`, v]) : Object.entries(node).map(([k, v]) => [path ? `.${k}` : k, v]);
  return entries.flatMap(([k, v]) => leaves(v, path + k));
}

const lastKey = (path) => path.split(/[.[\]]/).filter(Boolean).pop() || "";

/* Strings that could be an identifier: no spaces, a sensible length. */
export function idCandidates(ls) {
  const seen = new Set();
  return ls.filter((l) => typeof l.value === "string" && /^[\w-]{6,128}$/.test(l.value))
    .filter((l) => (seen.has(l.value) ? false : seen.add(l.value)));
}

export function outcome(ls) {
  const hits = ls.filter((l) => typeof l.value === "string")
    .map((l) => ({ path: l.path, word: l.value.trim().toUpperCase() }))
    .filter((h) => APPROVED.has(h.word) || DECLINED.has(h.word));
  const approved = hits.some((h) => APPROVED.has(h.word));
  const declined = hits.some((h) => DECLINED.has(h.word));
  if (approved && !declined) return { result: "approved", paths: hits.map((h) => h.path) };
  if (declined && !approved) return { result: "declined", paths: hits.map((h) => h.path) };
  return { result: hits.length ? "ambiguous" : "none", paths: hits.map((h) => h.path) };
}

/* expectedCents is the server-priced amount on the registration. A number
   matches if it equals that in cents or in whole dollars; which one is
   reported, since the unit is not documented. */
export function amount(ls, expectedCents) {
  const found = [];
  for (const l of ls) {
    if (/amount|total/i.test(l.path)) {
      const n = typeof l.value === "number" ? l.value : typeof l.value === "string" && /^\d+(\.\d+)?$/.test(l.value) ? Number(l.value) : null;
      if (n !== null) found.push({ path: l.path, value: n });
    }
    if (typeof l.value === "string") {
      const m = l.value.match(/\b(?:approved|declined?)\s+for\s+\$?(\d+(?:\.\d+)?)/i);
      if (m) found.push({ path: `${l.path} (message)`, value: Number(m[1]) });
    }
  }
  if (!found.length) return { result: "absent", found };
  const hit = found.find((f) => f.value === expectedCents) ? "cents"
    : found.find((f) => f.value * 100 === expectedCents) ? "dollars" : null;
  return { result: hit ? "match" : "mismatch", unit: hit, found };
}

export function orderId(ls, sessionValue) {
  const l = ls.find((x) => typeof x.value === "string" && x.value !== sessionValue &&
    /^(id|paymentid|payment_id|orderid|order_id)$/i.test(lastKey(x.path)));
  return l ? { path: l.path, value: l.value } : null;
}

/* Merchant fields that disagree with ours. None present is not a
   disagreement; the signature already proved the sender. */
export function merchantMismatch(ls, merchantId) {
  if (!merchantId) return [];
  return ls.filter((l) => /^merchant_?id$/i.test(lastKey(l.path)) && typeof l.value === "string" && l.value !== merchantId).map((l) => l.path);
}
