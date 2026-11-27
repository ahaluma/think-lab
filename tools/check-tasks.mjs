// Checks the task generators of all games (see public/shared/gen.js). Optional, nothing to install:
//
//   node tools/check-tasks.mjs            → every game with a tasks.js
//   node tools/check-tasks.mjs zahlen-memory  → one game
//
// For every level it makes many tasks with fixed seeds, runs the game's check() on each, and
// prints how many different tasks a level has and how the answers are spread.

import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { kit } from "../public/shared/gen.js";

const N = 2000; // tasks per level
const gamesDir = join(dirname(fileURLToPath(import.meta.url)), "../public/games");
const only = process.argv[2];
let failed = 0;

for (const id of readdirSync(gamesDir).sort()) {
  if (only && id !== only) continue;
  const file = join(gamesDir, id, "tasks.js");
  if (!existsSync(file)) continue;
  const { task, check } = await import(pathToFileURL(file));
  const { LEVELS } = await import(pathToFileURL(join(gamesDir, id, "levels.js")));
  console.log(`\n${id}`);
  for (const level of LEVELS) {
    const r = kit(1);
    const seen = new Set();
    const answers = {};
    let problems = 0;
    for (let i = 0; i < N; i++) {
      const t = task(level, r);
      seen.add(JSON.stringify(t));
      const a = t.answer ?? t.count;
      if (a !== undefined) answers[a] = (answers[a] || 0) + 1;
      for (const p of check ? check(t, level) : []) {
        if (problems++ < 3) console.log(`  ✗ ${level.id}: ${p}  ${JSON.stringify(t)}`);
      }
    }
    failed += problems;
    const spread = Object.keys(answers).sort((a, b) => a - b).map((a) => `${a}:${Math.round((answers[a] / N) * 100)}%`).join(" ");
    console.log(`  ${problems ? "✗" : "✓"} ${level.id.padEnd(14)} ${String(seen.size).padStart(5)} different of ${N}   ${spread}`);
  }
}
if (failed) {
  console.log(`\n${failed} problems`);
  process.exit(1);
}
