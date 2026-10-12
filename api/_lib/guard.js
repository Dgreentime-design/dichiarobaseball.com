/* ==========================================================================
   Refuse to run the mock payment provider in production.

   The mock lets anyone approve their own payment. On a production
   deployment that is free registrations for whoever notices, so this is
   not a warning: importing this module throws, the function fails to
   start, and every request to it gets Vercel's 500. Every function imports
   it first, so a misconfigured production deployment serves nothing from
   api/ at all until the variable is fixed.
   ========================================================================== */

export function assertSafeConfig(env = process.env) {
  if (env.PAYMENT_PROVIDER === "mock" && env.VERCEL_ENV === "production") {
    throw new Error(
      "REFUSING TO START: PAYMENT_PROVIDER=mock on a production deployment. " +
      "The mock provider approves payments without taking money. " +
      "Set PAYMENT_PROVIDER=clover for Production, or remove it."
    );
  }
}

try {
  assertSafeConfig();
} catch (e) {
  console.error(e.message);
  throw e;
}
