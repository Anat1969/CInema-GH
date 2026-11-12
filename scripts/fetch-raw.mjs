// Step 1: pull facts from Wikidata (SPARQL) for the curated people, their notable films and the co-credits of those films.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { sparql, qid, v, sleep } from "./lib.mjs";
const res = JSON.parse(readFileSync("scripts/.cache/resolved.json", "utf8"));
const roles = {};
for (const [role, list] of Object.entries(res)) for (const x of list) (roles[x.id] ||= { id: x.id, seedName: x.name, roles: [] }).roles.push(role);
const ids = Object.keys(roles);
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const CACHE = "scripts/.cache/raw.json";
const raw = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : { persons: {}, links: [], films: {} };
const save = () => writeFileSync(CACHE, JSON.stringify(raw));

// persons
for (const part of chunk(ids.filter((i) => !raw.persons[i]), 40)) {
  const vals = part.map((i) => "wd:" + i).join(" ");
  const rows = sparql(`SELECT ?p (SAMPLE(?he) AS ?heN) (SAMPLE(?en) AS ?enN) (SAMPLE(?dhe) AS ?dheN) (SAMPLE(?den) AS ?denN)
    (MIN(?birth) AS ?birthN) (MIN(?death) AS ?deathN) (SAMPLE(?img) AS ?imgN) (SAMPLE(?hew) AS ?hewN) (SAMPLE(?enw) AS ?enwN)
    (GROUP_CONCAT(DISTINCT ?c; separator="|") AS ?csN) (SAMPLE(?sl) AS ?slN) WHERE {
    VALUES ?p { ${vals} }
    OPTIONAL { ?p rdfs:label ?he FILTER(lang(?he)="he") }
    OPTIONAL { ?p rdfs:label ?en FILTER(lang(?en)="en") }
    OPTIONAL { ?p schema:description ?dhe FILTER(lang(?dhe)="he") }
    OPTIONAL { ?p schema:description ?den FILTER(lang(?den)="en") }
    OPTIONAL { ?p wdt:P569 ?birth } OPTIONAL { ?p wdt:P570 ?death } OPTIONAL { ?p wdt:P18 ?img }
    OPTIONAL { ?w1 schema:about ?p ; schema:isPartOf <https://he.wikipedia.org/> ; schema:name ?hew }
    OPTIONAL { ?w2 schema:about ?p ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?enw }
    OPTIONAL { ?p wdt:P27 ?cc . ?cc rdfs:label ?c FILTER(lang(?c)="he") }
    OPTIONAL { ?p wikibase:sitelinks ?sl }
  } GROUP BY ?p`);
  for (const r of rows) {
    const id = qid(v(r, "p"));
    raw.persons[id] = { id, roles: roles[id].roles, seedName: roles[id].seedName, he: v(r, "heN"), en: v(r, "enN"), dhe: v(r, "dheN"), den: v(r, "denN"),
      birth: v(r, "birthN")?.slice(0, 10), death: v(r, "deathN")?.slice(0, 10), img: v(r, "imgN"), hew: v(r, "hewN"), enw: v(r, "enwN"),
      countries: (v(r, "csN") || "").split("|").filter(Boolean), sl: +v(r, "slN") || 0 };
  }
  save(); log("persons", Object.keys(raw.persons).length); await sleep(2500);
}

// person -> notable film links (director, cinematographer, screenwriter, composer)
const PROPS = [["P57", "director"], ["P344", "cinematographer"], ["P58", "screenwriter"], ["P86", "musician"]];
if (!raw.links.length) {
  for (const part of chunk(ids, 25)) {
    const vals = part.map((i) => "wd:" + i).join(" ");
    const rows = sparql(`SELECT ?p ?film ?role WHERE {
      VALUES ?p { ${vals} }
      VALUES (?prop ?role) { ${PROPS.map(([p, r]) => `(wdt:${p} "${r}")`).join(" ")} }
      ?film ?prop ?p . ?film wdt:P31 wd:Q11424 . ?film wikibase:sitelinks ?sl FILTER(?sl >= 25) }`);
    for (const r of rows) raw.links.push([qid(v(r, "p")), qid(v(r, "film")), v(r, "role")]);
    save(); log("links", raw.links.length); await sleep(2500);
  }
}

// film details with all credited people
const filmIds = [...new Set(raw.links.map((l) => l[1]))].filter((f) => !raw.films[f]);
log("films to fetch", filmIds.length);
for (const part of chunk(filmIds, 60)) {
  const vals = part.map((i) => "wd:" + i).join(" ");
  const cred = PROPS.map(([p, r], i) => `OPTIONAL { ?f wdt:${p} ?x${i} . OPTIONAL { ?x${i} rdfs:label ?xl${i} FILTER(lang(?xl${i})="en") } OPTIONAL { ?x${i} rdfs:label ?xh${i} FILTER(lang(?xh${i})="he") } }`).join("\n");
  const agg = PROPS.map((_, i) => `(GROUP_CONCAT(DISTINCT CONCAT(STRAFTER(STR(?x${i}),"entity/"),"~",COALESCE(?xl${i},""),"~",COALESCE(?xh${i},"")); separator="|") AS ?c${i})`).join(" ");
  const rows = sparql(`SELECT ?f (SAMPLE(?he) AS ?heN) (SAMPLE(?en) AS ?enN) (MIN(YEAR(?d)) AS ?year) (SAMPLE(?sl) AS ?slN) ${agg} WHERE {
    VALUES ?f { ${vals} }
    OPTIONAL { ?f rdfs:label ?he FILTER(lang(?he)="he") } OPTIONAL { ?f rdfs:label ?en FILTER(lang(?en)="en") }
    OPTIONAL { ?f wdt:P577 ?d } OPTIONAL { ?f wikibase:sitelinks ?sl }
    ${cred}
  } GROUP BY ?f`);
  for (const r of rows) {
    const id = qid(v(r, "f"));
    const cr = {};
    PROPS.forEach(([, role], i) => { cr[role] = (v(r, "c" + i) || "").split("|").filter(Boolean).map((s) => { const [p, en, he] = s.split("~"); return { id: p, en, he }; }); });
    raw.films[id] = { id, he: v(r, "heN"), en: v(r, "enN"), year: +v(r, "year") || null, sl: +v(r, "slN") || 0, credits: cr };
  }
  save(); log("films", Object.keys(raw.films).length); await sleep(3000);
}
log("DONE", Object.keys(raw.persons).length, "persons", raw.links.length, "links", Object.keys(raw.films).length, "films");
