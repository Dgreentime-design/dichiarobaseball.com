/* The signature scheme both providers use:

     header   t=<unix seconds>,v1=<hex HMAC-SHA256>
     signed   "<t>.<raw body>"

   Clover signs its webhooks this way, and the mock signs the same way so
   the mock exercises the same verification path. */

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 300;

export function sign(rawBody, secret, t = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

export function verify(rawBody, header, secret) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.trim().split("=")).filter((kv) => kv.length === 2)
  );
  const t = Number(parts.t);
  if (!Number.isInteger(t) || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;

  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex"));
  const given = Buffer.from(parts.v1);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/* TEMPORARY, round 05: why a signature failed, without the signature. Only
   shapes, the clock skew and which signing variant matches, as booleans.
   Remove with the webhook capture. */
export function explain(rawBody, header, secret) {
  const out = { header: Boolean(header), secret: Boolean(secret) };
  if (!header || !secret) return out;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.trim().split("=")).filter((kv) => kv.length === 2));
  out.keys = Object.keys(parts);
  out.tDigits = parts.t ? parts.t.length : 0;
  out.skewSeconds = parts.t ? Math.round(Date.now() / 1000 - Number(parts.t.length > 10 ? Number(parts.t) / 1000 : parts.t)) : null;
  out.v1Length = parts.v1 ? parts.v1.length : 0;
  const mac = (s, enc) => createHmac("sha256", secret).update(s).digest(enc);
  const v1 = parts.v1 || "";
  out.matches = {
    "t.body hex": mac(`${parts.t}.${rawBody}`, "hex") === v1,
    "t.body base64": mac(`${parts.t}.${rawBody}`, "base64") === v1,
    "tbody hex": mac(`${parts.t}${rawBody}`, "hex") === v1,
    "body hex": mac(rawBody, "hex") === v1,
    "body base64": mac(rawBody, "base64") === v1
  };
  return out;
}
