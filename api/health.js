/* Health check. Exists to prove Vercel detects functions in api/ alongside
   the static output at the repo root (vercel.json: outputDirectory "."). */
import "./_lib/guard.js";

export default function handler(req, res) {
  res.status(200).json({ ok: true });
}
