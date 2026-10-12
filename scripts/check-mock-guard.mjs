/* ==========================================================================
   The mock payment provider refuses to run in production.

     node scripts/check-mock-guard.mjs

   For every function in api/, imports it in a fresh process with
   PAYMENT_PROVIDER=mock and VERCEL_ENV=production and expects the import
   itself to throw, which on Vercel means the function never starts. Then
   the controls: the same with VERCEL_ENV=preview, and production with
   PAYMENT_PROVIDER=clover, must both load.
   ========================================================================== */

import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const API = join(ROOT, "api");

function functions(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (name.startsWith("_")) return [];
    if (statSync(p).isDirectory()) return functions(p);
    return name.endsWith(".js") ? [p] : [];
  });
}

function load(file, env) {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(file).href)})`], {
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8"
  });
  return { loaded: r.status === 0, stderr: r.stderr };
}

let failures = 0;
const fail = (m) => { failures++; console.log("  FAIL  " + m); };
const ok = (m) => console.log("  ok    " + m);

const files = functions(API);
console.log(`\n${files.length} functions\n`);

for (const f of files) {
  const name = relative(ROOT, f);
  const prod = load(f, { PAYMENT_PROVIDER: "mock", VERCEL_ENV: "production", VERCEL: "1" });
  if (prod.loaded) fail(`${name}: loaded in production with the mock provider`);
  else if (!/REFUSING TO START/.test(prod.stderr)) fail(`${name}: failed, but not because of the guard:\n${prod.stderr}`);
  else ok(`${name}: refuses to start with mock in production`);

  for (const env of [
    { PAYMENT_PROVIDER: "mock", VERCEL_ENV: "preview", VERCEL: "1" },
    { PAYMENT_PROVIDER: "clover", VERCEL_ENV: "production", VERCEL: "1" }
  ]) {
    const r = load(f, env);
    if (!r.loaded) fail(`${name}: did not load with ${JSON.stringify(env)}:\n${r.stderr}`);
  }
}
if (!failures) ok("every function still loads with mock on preview, and with clover in production");

console.log(`\n${failures === 0 ? "Mock guard holds." : failures + " failure(s)."}`);
process.exit(failures === 0 ? 0 : 1);
