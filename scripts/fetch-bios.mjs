// Step 3: short intro text from Wikipedia (Hebrew first, English as fallback). Text is CC BY-SA: source link is kept with every entry.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { curl, sleep } from "./lib.mjs";
const raw = JSON.parse(readFileSync("scripts/.cache/raw.json", "utf8"));
const OUT = "scripts/.cache/bios.json";
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { he: {}, en: {} };
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
for (const [lang, key] of [["en", "enw"], ["he", "hew"]]) {
  const people = Object.values(raw.persons).filter((p) => p[key] && !(p.id in out[lang]));
  for (const part of chunk(people, 20)) {
    const titles = part.map((p) => p[key]).join("|");
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&exsentences=4&exlimit=20&redirects=1&titles=${encodeURIComponent(titles)}`;
    let j;
    try { j = JSON.parse(curl([url], 8)); } catch (e) { console.log(lang, "fail chunk", String(e.message).slice(0, 80)); await sleep(30000); continue; }
    const map = {};
    for (const pg of Object.values(j.query?.pages || {})) map[pg.title] = pg.extract || "";
    const alias = {};
    for (const a of [...(j.query?.normalized || []), ...(j.query?.redirects || [])]) alias[a.from] = a.to;
    for (const p of part) {
      let t = p[key]; for (let i = 0; i < 3 && alias[t]; i++) t = alias[t];
      out[lang][p.id] = map[t] || "";
    }
    writeFileSync(OUT, JSON.stringify(out));
    console.log(lang, Object.keys(out[lang]).length);
    await sleep(2500);
  }
}
console.log("done");
