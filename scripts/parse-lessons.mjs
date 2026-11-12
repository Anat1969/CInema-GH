// Extracts the four lessons and their 20 image prompts from lessons.md into src/data/lessons.json
import { readFileSync, writeFileSync } from "node:fs";
const src = readFileSync(process.argv[2], "utf8");
const ids = ["director", "cinematographer", "screenwriter", "musician"];
const parts = src.split(/\n## שיעור \d+ — /).slice(1);
const kinds = ["theme", "principle", "rule1", "rule2", "rule3"];
const out = parts.map((p, i) => {
  const title = p.split("\n")[0].replace(/"/g, "").trim();
  const principle = (p.match(/\*\*עיקרון:\*\*\s*(.+)/) || [])[1]?.trim();
  const anchor = (p.match(/\*\*עוגן:\*\*\s*(.+)/) || [])[1]?.trim();
  const rules = [...p.matchAll(/^\d+\.\s+(.+)$/gm)].map((m) => m[1].trim());
  const images = [...p.matchAll(/### (.+)\n```\n([\s\S]*?)\n```/g)].map((m, k) => ({
    kind: kinds[k],
    title: m[1].trim(),
    prompt: m[2].trim(),
    file: `rooms/${ids[i]}/${k}.jpg`,
  }));
  return { id: ids[i], title, principle, anchor, rules, images };
});
for (const l of out) if (l.rules.length !== 3 || l.images.length !== 5) throw new Error("parse " + l.id);
writeFileSync("src/data/lessons.json", JSON.stringify(out, null, 1));
console.log(out.map((l) => `${l.id}: ${l.rules.length} rules, ${l.images.length} images`).join("\n"));
