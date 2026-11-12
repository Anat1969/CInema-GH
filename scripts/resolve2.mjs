import { readFileSync, writeFileSync } from "node:fs";
import { sparql, qid, v, esc } from "./lib.mjs";
const res = JSON.parse(readFileSync("scripts/.cache/resolved.json", "utf8"));
const alt = { director: ["Christopher Nolan"], cinematographer: ["Billy Bitzer", "Conrad L. Hall", "Conrad Hall"], screenwriter: ["Greta Gerwig"], musician: ["Tōru Takemitsu", "Toru Takemitsu"] };
for (const [role, names] of Object.entries(alt)) for (const n of names) {
  const rows = sparql(`SELECT ?p ?sl ?d WHERE { ?p rdfs:label "${esc(n)}"@en . ?p wdt:P31 wd:Q5 . ?p wikibase:sitelinks ?sl . OPTIONAL{?p schema:description ?d FILTER(lang(?d)="en")} } ORDER BY DESC(?sl) LIMIT 3`);
  console.log(role, n, rows.map((r) => qid(v(r, "p")) + " " + v(r, "sl") + " " + v(r, "d")).join(" | "));
  if (rows[0] && +v(rows[0], "sl") > 15 && !res[role].some((x) => x.id === qid(v(rows[0], "p")))) res[role].push({ name: n, id: qid(v(rows[0], "p")) });
}
writeFileSync("scripts/.cache/resolved.json", JSON.stringify(res, null, 1));
for (const r of Object.keys(res)) console.log(r, res[r].length);
