/* Small helpers shared by the functions. */

import { randomBytes } from "node:crypto";

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

/* DBSA- plus ten characters from an alphabet with no 0/O or 1/I/L, so the
   reference can be read over the phone. About 50 random bits: the ID is what the
   status endpoint is keyed on, so it must not be guessable. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function newRegistrationId() {
  const bytes = randomBytes(10);
  return "DBSA-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export const REGISTRATION_ID = /^DBSA-[2-9A-Z]{10}$/;
