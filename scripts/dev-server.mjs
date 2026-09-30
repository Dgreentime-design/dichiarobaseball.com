/* ==========================================================================
   Local server for the site and its functions, standing in for `vercel dev`.

     node --env-file-if-exists=.env.local scripts/dev-server.mjs [port]

   Serves the repo root as static files, as Vercel does with
   outputDirectory ".", and routes /api/* to the files in api/, including
   [param] segments. A function exports GET/POST taking a web Request and
   returning a Response, or a default (req, res) handler.
   ========================================================================== */

import { createServer } from "node:http";
import { readFile, stat, readdir } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".txt": "text/plain", ".xml": "application/xml",
  ".woff2": "font/woff2", ".ico": "image/x-icon"
};

const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);
const isDir = (p) => stat(p).then((s) => s.isDirectory(), () => false);

/* /api/registration/X/status -> api/registration/[id]/status.js */
async function findFunction(segments) {
  let dir = join(ROOT, "api");
  for (let i = 0; i < segments.length; i++) {
    const last = i === segments.length - 1;
    const seg = segments[i];
    if (last && await isFile(join(dir, seg + ".js"))) return join(dir, seg + ".js");
    if (!last && await isDir(join(dir, seg))) { dir = join(dir, seg); continue; }
    const dyn = (await readdir(dir).catch(() => [])).find((n) => /^\[.+\]/.test(n));
    if (!dyn) return null;
    if (last && dyn.endsWith(".js")) return join(dir, dyn);
    if (!last && await isDir(join(dir, dyn))) { dir = join(dir, dyn); continue; }
    return null;
  }
  return null;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

async function runFunction(file, req, res) {
  const mod = await import(pathToFileURL(file).href);
  const body = await readBody(req);
  const origin = `http://${req.headers.host}`;

  const web = mod[req.method];
  if (web) {
    const request = new Request(origin + req.url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : body
    });
    const response = await web(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  if (mod.default) {
    res.status = (s) => { res.statusCode = s; return res; };
    res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    await mod.default(req, res);
    return;
  }
  res.writeHead(405).end("Method not allowed");
}

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.startsWith("/api/")) {
      const file = await findFunction(path.slice(5).split("/").filter(Boolean));
      if (file) return await runFunction(file, req, res);
    }
    let file = join(ROOT, path);
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    if (await isDir(file)) file = join(file, "index.html");
    if (!(await isFile(file))) return res.writeHead(404).end("Not found");
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500);
    res.end("Server error");
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
