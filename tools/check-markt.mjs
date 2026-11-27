// Checks the tasks of the market (public/welt/markt/). Nothing to install:
//
//   node tools/check-markt.mjs
//
// For every operation, number range and sub-step it makes many tasks with a fixed seed and runs
// check(): the numbers add up, stay in their range, the way ends at the answer, the choices fit.
// The stories of the market square (stories.js) are checked the same way.

import { kit } from "../public/shared/gen.js";
import { task, check, inverse, owl, classify, OPS, RANGES, STEPS } from "../public/welt/markt/tasks.js";
import { story, checkStory, STAGES } from "../public/welt/markt/stories.js";

const N = 2000;
let failed = 0;

for (const op of OPS) {
  console.log(`\n${op}`);
  for (const range of RANGES) {
    const steps = STEPS[op][range];
    for (let step = 0; step <= steps.length; step++) {
      const r = kit(1);
      const seen = new Set();
      let problems = 0;
      for (let i = 0; i < N; i++) {
        const t = task(op, range, step, r);
        seen.add(`${t.a},${t.b},${t.gap}`);
        const list = [...check(t)];
        const u = inverse(t);
        if (t.gap === "c" && !t.rest) list.push(...check(u).map((p) => `inverse: ${p}`));
        const [wrong, kind] = owl(t, r);
        if (wrong === t.answer) list.push("owl is right");
        if (!kind) list.push("owl without a kind");
        if (classify(t, t.answer) !== null) list.push("classify on the right answer");
        for (const p of list) if (problems++ < 3) console.log(`  ✗ ${range} ${steps[step] ?? "mixed"}: ${p}  ${JSON.stringify(t)}`);
      }
      failed += problems;
      console.log(`  ${problems ? "✗" : "✓"} bis ${String(range).padEnd(4)} ${(steps[step] ?? "gemischt").padEnd(10)} ${String(seen.size).padStart(5)} different of ${N}`);
    }
  }
}

console.log("\nmarktplatz");
const all = { plus: 1000, minus: 1000, mal: 1000, geteilt: 1000 };
const small = { plus: 10, minus: 10 };
for (const allowed of [small, all]) {
  for (const stage of STAGES) {
    const r = kit(1);
    let problems = 0;
    const seen = new Set();
    for (let i = 0; i < N; i++) {
      const s = story(stage, allowed, r);
      seen.add(JSON.stringify(s.n));
      for (const p of checkStory(s, allowed)) if (problems++ < 3) console.log(`  ✗ stage ${stage}: ${p}  ${JSON.stringify(s)}`);
    }
    failed += problems;
    console.log(`  ${problems ? "✗" : "✓"} stage ${stage} (${Object.keys(allowed).join(", ")}) ${String(seen.size).padStart(5)} different of ${N}`);
  }
}

if (failed) {
  console.log(`\n${failed} problems`);
  process.exit(1);
}
