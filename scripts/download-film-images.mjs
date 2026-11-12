// Downloads thumbnails for films whose Commons metadata is already known. Safe to rerun; skips valid files.
import { readFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { curl, sleep } from "./lib.mjs";
const media = JSON.parse(readFileSync("scripts/.cache/media.json", "utf8"));
mkdirSync("public/films", { recursive: true });
const valid = (f) => existsSync(f) && /image\//.test(execFileSync("file", ["-b", "--mime-type", f]).toString());
let ok = 0, bad = 0;
for (const [id, f] of Object.entries(media.films)) {
  if (!f.meta?.thumb) continue;
  const dest = `public/films/${id}.jpg`;
  if (valid(dest)) { ok++; continue; }
  try { curl(["-L", "-o", dest, f.meta.thumb], 2); } catch { /* next */ }
  if (valid(dest)) ok++; else { bad++; if (existsSync(dest)) unlinkSync(dest); }
  await sleep(400);
  if (bad > 25 && ok < 5) { console.log("throttled, stopping"); break; }
}
console.log("images ok", ok, "bad", bad);
