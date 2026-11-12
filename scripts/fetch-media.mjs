// Step 5: external identifiers and free film images. IMDb/MusicBrainz ids for links, Commons images (with licence) for films.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { sparql, qid, v, sleep, curl } from "./lib.mjs";
const lib = JSON.parse(readFileSync("public/data/library.json", "utf8"));
const OUT = "scripts/.cache/media.json";
const media = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { people: {}, films: {} };
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const save = () => writeFileSync(OUT, JSON.stringify(media));

for (const part of chunk(Object.keys(lib.people).filter((i) => !media.people[i]), 50)) {
  const rows = sparql(`SELECT ?p (SAMPLE(?i) AS ?imdbN) (SAMPLE(?m) AS ?mbN) WHERE { VALUES ?p { ${part.map((i) => "wd:" + i).join(" ")} } OPTIONAL { ?p wdt:P345 ?i } OPTIONAL { ?p wdt:P434 ?m } } GROUP BY ?p`);
  for (const r of rows) media.people[qid(v(r, "p"))] = { imdb: v(r, "imdbN") || null, mb: v(r, "mbN") || null };
  for (const i of part) media.people[i] ||= { imdb: null, mb: null };
  save(); log("people", Object.keys(media.people).length); await sleep(2500);
}
for (const part of chunk(Object.keys(lib.films).filter((i) => !media.films[i]), 30)) {
  const rows = sparql(`SELECT ?f (SAMPLE(?i) AS ?imdbN) (SAMPLE(?img) AS ?imgN) (SAMPLE(?e) AS ?enN) (SAMPLE(?h) AS ?heN) WHERE {
    VALUES ?f { ${part.map((i) => "wd:" + i).join(" ")} }
    OPTIONAL { ?f wdt:P345 ?i } OPTIONAL { ?f wdt:P18 ?img }
    OPTIONAL { ?w1 schema:about ?f ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?e }
    OPTIONAL { ?w2 schema:about ?f ; schema:isPartOf <https://he.wikipedia.org/> ; schema:name ?h }
  } GROUP BY ?f`);
  for (const r of rows) media.films[qid(v(r, "f"))] = { imdb: v(r, "imdbN") || null, img: v(r, "imgN") || null, en: v(r, "enN") || null, he: v(r, "heN") || null };
  for (const i of part) media.films[i] ||= { imdb: null, img: null, en: null, he: null };
  save(); log("films", Object.keys(media.films).length); await sleep(2500);
}
// Commons metadata + thumbnails for film images
mkdirSync("public/films", { recursive: true });
const withImg = Object.entries(media.films).filter(([, f]) => f.img && !f.meta);
const strip = (h) => (h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const fileOf = (u) => decodeURIComponent(u.split("/Special:FilePath/").pop()).replace(/_/g, " ");
for (const part of chunk(withImg, 20)) {
  const titles = part.map(([, f]) => "File:" + fileOf(f.img));
  const j = JSON.parse(curl(["https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=520&titles=" + encodeURIComponent(titles.join("|"))]));
  const by = {}; for (const pg of Object.values(j.query?.pages || {})) by[pg.title] = pg;
  for (const n of j.query?.normalized || []) by[n.from] = by[n.to];
  for (const [id, f] of part) {
    const ii = by["File:" + fileOf(f.img)]?.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|webp)/.test(ii.mime || "")) { f.meta = null; continue; }
    const m = ii.extmetadata || {};
    f.meta = { thumb: ii.thumburl, page: ii.descriptionurl, author: strip(m.Artist?.value) || "לא צוין", license: strip(m.LicenseShortName?.value), licenseUrl: m.LicenseUrl?.value || "" };
  }
  save(); log("film image meta", part.length); await sleep(1500);
}
let n = 0;
for (const [id, f] of Object.entries(media.films)) {
  if (!f.meta?.thumb) continue;
  const dest = `public/films/${id}.jpg`;
  if (existsSync(dest) && statSync(dest).size > 2000) continue;
  try { curl(["-L", "-o", dest, f.meta.thumb]); n++; } catch { log("fail", id); }
  await sleep(700);
}
log("DONE images", n, "with image", Object.values(media.films).filter((f) => f.meta).length);
