// Step 4: merge raw Wikidata facts, images, bios and eras into public/data/library.json
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
const raw = JSON.parse(readFileSync("scripts/.cache/raw.json", "utf8"));
const imgs = existsSync("scripts/.cache/images.json") ? JSON.parse(readFileSync("scripts/.cache/images.json", "utf8")) : {};
const bios = existsSync("scripts/.cache/bios.json") ? JSON.parse(readFileSync("scripts/.cache/bios.json", "utf8")) : { he: {}, en: {} };
const eras = JSON.parse(readFileSync("scripts/eras.json", "utf8"));
const resolved = JSON.parse(readFileSync("scripts/.cache/resolved.json", "utf8"));
const hebrewBios = existsSync("scripts/bios-he.json") ? JSON.parse(readFileSync("scripts/bios-he.json", "utf8")) : {};

const nameToId = {};
for (const list of Object.values(resolved)) for (const x of list) nameToId[x.name] = x.id;
const clip = (t, n = 420) => {
  t = (t || "").replace(/\s*\([^)]*\)/g, (m) => (m.length > 40 ? "" : m)).replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n); const i = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("."));
  return (i > 120 ? cut.slice(0, i + 1) : cut).trim();
};
const hasHeb = (s) => /[֐-׿]/.test(s || "");

// links: person -> films
const films = raw.films;
const byPerson = {}; const byFilm = {};
for (const [p, f, role] of raw.links) {
  if (!films[f] || !raw.persons[p]) continue;
  (byPerson[p] ||= []).push({ f, role });
  (byFilm[f] ||= []).push({ p, role });
}
const people = {};
for (const p of Object.values(raw.persons)) {
  const img = imgs[p.id];
  const mine = (byPerson[p.id] || []).sort((a, b) => (films[b.f].sl || 0) - (films[a.f].sl || 0));
  const seen = new Set(); const fl = [];
  for (const x of mine) { if (seen.has(x.f)) { fl.find((y) => y.f === x.f).roles.push(x.role); continue; } seen.add(x.f); fl.push({ f: x.f, roles: [x.role] }); }
  people[p.id] = {
    id: p.id, roles: p.roles,
    he: p.he && hasHeb(p.he) ? p.he : "", en: p.en || p.seedName,
    born: p.birth ? +p.birth.slice(0, 4) : null, died: p.death ? +p.death.slice(0, 4) : null,
    countries: p.countries.slice(0, 2),
    descHe: hasHeb(p.dhe) ? p.dhe : "", descEn: p.den || "",
    bioHe: hebrewBios[p.id] || clip(bios.he?.[p.id]), bioEn: clip(bios.en?.[p.id]),
    img: img?.thumb ? { src: `/people/${p.id}.jpg`, author: img.author, license: img.license, licenseUrl: img.licenseUrl, page: img.page } : null,
    wiki: { he: p.hew || null, en: p.enw || null },
    films: fl.slice(0, 14),
    nFilms: fl.length,
  };
}
// films kept: those on any person's top list
const keep = new Set(Object.values(people).flatMap((p) => p.films.map((x) => x.f)));
const filmsOut = {};
const addFilm = (id) => {
  if (filmsOut[id] || !films[id]) return;
  const f = films[id];
  const cr = {};
  for (const role of ["director", "cinematographer", "screenwriter", "musician"]) {
    cr[role] = (f.credits[role] || []).slice(0, 4).map((c) => ({ id: people[c.id] ? c.id : null, name: (hasHeb(c.he) ? c.he : "") || c.en || "", en: c.en || "" }));
  }
  filmsOut[id] = { id, he: hasHeb(f.he) ? f.he : "", en: f.en || "", year: f.year, credits: cr };
};
for (const id of keep) addFilm(id);
// collaboration edges among key people (shared notable films, 25+ sitelinks)
const pair = {};
for (const [f, arr] of Object.entries(byFilm)) {
  const ids = [...new Set(arr.map((x) => x.p))];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const [a, b] = [ids[i], ids[j]].sort();
    const k = a + "|" + b; (pair[k] ||= new Set()).add(f);
  }
}
const edges = Object.entries(pair).map(([k, s]) => { const [a, b] = k.split("|"); return { a, b, films: [...s].sort((x, y) => (films[y].sl || 0) - (films[x].sl || 0)) }; });
const collab = {};
for (const e of edges) { (collab[e.a] ||= []).push({ id: e.b, films: e.films }); (collab[e.b] ||= []).push({ id: e.a, films: e.films }); }
for (const [id, arr] of Object.entries(collab)) people[id].collab = arr.sort((x, y) => y.films.length - x.films.length).slice(0, 10).map((c) => ({ id: c.id, films: c.films.slice(0, 5), n: c.films.length }));
const strong = edges.filter((e) => e.films.length >= 2 && people[e.a].roles[0] !== people[e.b].roles[0]).map((e) => ({ a: e.a, b: e.b, n: e.films.length, films: e.films.slice(0, 4) }));
for (const p of Object.values(people)) for (const c of p.collab || []) c.films.forEach(addFilm);
for (const e of strong) e.films.forEach(addFilm);
// eras
const erasOut = {};
const unknown = [];
for (const [role, list] of Object.entries(eras)) {
  erasOut[role] = list.map((e) => ({ ...e, people: e.people.map((n) => { const id = nameToId[n]; if (!id) unknown.push(n); return id; }).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) }));
}
mkdirSync("public/data", { recursive: true });
const lib = { generated: new Date().toISOString().slice(0, 10), source: "Wikidata (CC0), Wikipedia (CC BY-SA), Wikimedia Commons", people, films: filmsOut, strong, eras: erasOut };
writeFileSync("public/data/library.json", JSON.stringify(lib));
const P = Object.values(people);
console.log({ people: P.length, withHe: P.filter((p) => p.he).length, withImg: P.filter((p) => p.img).length, bioHe: P.filter((p) => p.bioHe).length, bioEn: P.filter((p) => p.bioEn).length, films: Object.keys(filmsOut).length, filmsHe: Object.values(filmsOut).filter((f) => f.he).length, edges: edges.length, strong: strong.length, unknownEraNames: [...new Set(unknown)] });
