import { readFileSync, writeFileSync } from "node:fs";
import { sparql, qid, v, esc, sleep } from "./lib.mjs";
const seed = JSON.parse(readFileSync("scripts/seed.json", "utf8"));
const out = {}; const missing = [];
for (const [role, def] of Object.entries(seed)) {
  const names = [...new Set(def.names)];
  const q = `SELECT ?name ?p ?sl WHERE {
    VALUES ?name { ${names.map((n) => `"${esc(n)}"@en`).join(" ")} }
    ?p rdfs:label ?name . ?p wdt:P31 wd:Q5 . ?p wdt:P106 ?o .
    VALUES ?o { ${def.occupation.map((o) => "wd:" + o).join(" ")} }
    ?p wikibase:sitelinks ?sl }`;
  const rows = sparql(q);
  const best = {};
  for (const r of rows) { const n = v(r, "name"); const sl = +v(r, "sl"); if (!best[n] || sl > best[n].sl) best[n] = { id: qid(v(r, "p")), sl }; }
  out[role] = names.filter((n) => best[n]).map((n) => ({ name: n, id: best[n].id }));
  for (const n of names) if (!best[n]) missing.push(role + ": " + n);
  console.log(role, out[role].length + "/" + names.length);
  await sleep(1500);
}
writeFileSync("scripts/.cache/resolved.json", JSON.stringify(out, null, 1));
console.log("MISSING:\n" + missing.join("\n"));
