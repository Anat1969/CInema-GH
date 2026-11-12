import { readFileSync, writeFileSync } from "node:fs";
import { sparql, v } from "./lib.mjs";
const res = JSON.parse(readFileSync("scripts/.cache/resolved.json", "utf8"));
const add = { director: [["Christopher Nolan", "Q25191"]], cinematographer: [["Billy Bitzer", "Q329965"]] };
for (const [role, list] of Object.entries(add)) for (const [name, id] of list) {
  const r = sparql(`SELECT ?l ?d WHERE { wd:${id} rdfs:label ?l FILTER(lang(?l)="en") OPTIONAL{wd:${id} schema:description ?d FILTER(lang(?d)="en")} }`);
  console.log(id, v(r[0] || {}, "l"), v(r[0] || {}, "d"));
  if (r[0] && !res[role].some((x) => x.id === id)) res[role].push({ name, id });
}
writeFileSync("scripts/.cache/resolved.json", JSON.stringify(res, null, 1));
console.log(Object.fromEntries(Object.entries(res).map(([k, a]) => [k, a.length])));
