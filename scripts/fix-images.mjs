// Re-download any portrait that came back as an HTML error page (rate limit) instead of an image.
import { readFileSync, existsSync, statSync, readdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { curl, sleep } from "./lib.mjs";
const imgs = JSON.parse(readFileSync("scripts/.cache/images.json", "utf8"));
const bad = (f) => !existsSync(f) || !/image\//.test(execFileSync("file", ["-b", "--mime-type", f]).toString());
for (const dir of [["public/people", (id) => imgs[id]?.thumb]]) {
  for (const f of readdirSync(dir[0])) {
    const path = `${dir[0]}/${f}`; const id = f.replace(".jpg", "");
    if (!bad(path)) continue;
    for (let i = 0; i < 6; i++) {
      try { curl(["-L", "-o", path, dir[1](id)]); } catch {}
      if (!bad(path)) { console.log("fixed", id); break; }
      await sleep(15000 * (i + 1));
    }
    if (bad(path)) { console.log("still bad", id); unlinkSync(path); }
  }
}
