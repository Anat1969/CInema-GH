// Step 2: portraits from Wikimedia Commons only (free licences), with author, licence and source page. Thumbnails are saved into public/people.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { curl, sleep } from "./lib.mjs";
const raw = JSON.parse(readFileSync("scripts/.cache/raw.json", "utf8"));
mkdirSync("public/people", { recursive: true });
const OUT = "scripts/.cache/images.json";
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const fileOf = (u) => decodeURIComponent(u.split("/Special:FilePath/").pop());
const todo = Object.values(raw.persons).filter((p) => p.img && !out[p.id]);
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const strip = (h) => (h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
for (const part of chunk(todo, 20)) {
  const titles = part.map((p) => "File:" + fileOf(p.img).replace(/_/g, " "));
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=360&titles=" + encodeURIComponent(titles.join("|"));
  const j = JSON.parse(curl([url]));
  const byTitle = {};
  for (const pg of Object.values(j.query?.pages || {})) byTitle[pg.title] = pg;
  for (const norm of j.query?.normalized || []) byTitle[norm.from] = byTitle[norm.to];
  for (const p of part) {
    const pg = byTitle["File:" + fileOf(p.img).replace(/_/g, " ")];
    const ii = pg?.imageinfo?.[0];
    if (!ii) { out[p.id] = null; continue; }
    const m = ii.extmetadata || {};
    out[p.id] = {
      file: pg.title.replace(/^File:/, ""), thumb: ii.thumburl, page: ii.descriptionurl,
      author: strip(m.Artist?.value) || "לא צוין", license: strip(m.LicenseShortName?.value), licenseUrl: m.LicenseUrl?.value || "",
    };
  }
  writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log("meta", Object.keys(out).length, "/", Object.values(raw.persons).filter((p) => p.img).length);
  await sleep(1500);
}
// download thumbnails
let n = 0;
for (const p of Object.values(raw.persons)) {
  const m = out[p.id]; if (!m?.thumb) continue;
  const dest = `public/people/${p.id}.jpg`;
  if (existsSync(dest) && statSync(dest).size > 2000) continue;
  try { curl(["-L", "-o", dest, m.thumb]); n++; } catch (e) { console.log("fail", p.id); }
  if (statSync(dest).size < 2000) { console.log("small", p.id, statSync(dest).size); }
  await sleep(700);
}
console.log("downloaded", n);
