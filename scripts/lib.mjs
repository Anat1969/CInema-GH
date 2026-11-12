import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const UA = "kolnoe-library-builder/1.0 (educational film knowledge base)";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function curl(args, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const out = execFileSync("curl", ["-sS", "-m", "90", "-A", UA, ...args], { maxBuffer: 1 << 28 }).toString();
      if (out.includes("too many requests") || out.startsWith("<!DOCTYPE") ) throw new Error("rate");
      return out;
    } catch (e) {
      if (i === tries - 1) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20000 * (i + 1));
    }
  }
}
export function sparql(query) {
  writeFileSync("/tmp/claude-0/q.rq", query);
  const out = curl(["-X", "POST", "-H", "Accept: application/sparql-results+json", "--data-urlencode", "query@/tmp/claude-0/q.rq", "https://query.wikidata.org/sparql"]);
  try { return JSON.parse(out).results.bindings; } catch { throw new Error("bad sparql: " + out.slice(0, 300)); }
}
export const qid = (u) => u.split("/").pop();
export const v = (b, k) => b[k]?.value;
export const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
