// Checks the task generators of the new world (public/welt/ideas/<idea>/tasks.js). Nothing to install:
//
//   node tools/check-welt.mjs
//
// For every idea, perspective and range it makes many tasks with a fixed seed and runs check().

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { kit } from "../public/shared/gen.js";
import { IDEAS, PERSPECTIVES, MOUNTAIN } from "../public/welt/frame/ideas.js";

const N = 2000;
const root = join(dirname(fileURLToPath(import.meta.url)), "../public/welt/ideas");
let failed = 0;

for (const [id, idea] of Object.entries(IDEAS)) {
  const { task, check } = await import(pathToFileURL(join(root, id, "tasks.js")));
  console.log(`\n${id}`);
  for (const range of idea.ranges) {
    for (const { id: p } of PERSPECTIVES) {
      const r = kit(1);
      const seen = new Set();
      let problems = 0;
      for (let i = 0; i < N; i++) {
        const t = task({ p, range }, r);
        seen.add(JSON.stringify(t));
        for (const problem of check(t, { p, range })) {
          if (problems++ < 3) console.log(`  ✗ ${p} ${range}: ${problem}  ${JSON.stringify(t)}`);
        }
      }
      failed += problems;
      console.log(`  ${problems ? "✗" : "✓"} ${p.padEnd(9)} bis ${String(range).padEnd(3)} ${String(seen.size).padStart(5)} different of ${N}`);
    }
  }
}
// The mountain: a camp needs only camps below it (so every camp can be reached), and a built camp's
// idea lives on the mountain.
console.log("\nberg");
MOUNTAIN.forEach((c, i) => {
  const below = MOUNTAIN.slice(0, i).map((b) => b.id);
  for (const need of c.needs ?? []) {
    if (!below.includes(need)) console.log(`  ✗ ${c.id} needs ${need}, which is not below it`), failed++;
  }
  for (const idea of c.ideas ?? []) {
    if (IDEAS[idea]?.world !== "berg") console.log(`  ✗ ${c.id}: idea ${idea} is not a mountain idea`), failed++;
  }
});
console.log(`  ${MOUNTAIN.filter((c) => c.ideas?.length).length} of ${MOUNTAIN.length} camps built`);

if (failed) {
  console.log(`\n${failed} problems`);
  process.exit(1);
}
