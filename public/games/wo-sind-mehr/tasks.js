// The tasks of "Wo sind mehr?": one function makes one task (see shared/gen.js).
//
//   task(level, r, thingIds?) → { counts, thing, places, ask, answer }
//     counts – how many things in group 0 and group 1, e.g. [3, 7]
//     thing  – id of the thing (shared/things.js), from thingIds (the ones with names in this language)
//     places – for each group, which of its 10 places (5 × 2) hold a thing, smallest first
//     ask    – "more" or "fewer" (the question)
//     answer – 0 or 1 (the group to tap) or "same"
//
// Level fields (levels.js): max, minDiff, same (sometimes equal groups, 1 in 4), fewer (half of the
// questions ask "where are fewer?").

import { THING_IDS } from "../../shared/things.js";

export const SLOTS = 10; // 5 x 2 places per group

function counts(level, r) {
  if (level.same && r.chance(0.25)) {
    const n = r.int(1, level.max);
    return [n, n];
  }
  for (;;) {
    const a = r.int(1, level.max);
    const b = r.int(1, level.max);
    if (Math.abs(a - b) >= level.minDiff) return [a, b];
  }
}

export function task(level, r, thingIds = THING_IDS) {
  const [a, b] = counts(level, r);
  const ask = level.fewer && r.chance(0.5) ? "fewer" : "more";
  const more = a > b ? 0 : 1;
  const answer = a === b ? "same" : ask === "fewer" ? 1 - more : more;
  const places = [a, b].map((n) => r.sample([...Array(SLOTS).keys()], n).sort((x, y) => x - y));
  return { counts: [a, b], thing: r.pick(thingIds), places, ask, answer };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const [a, b] = t.counts;
  if ([a, b].some((n) => n < 1 || n > level.max || n > SLOTS)) problems.push("count out of range");
  if (a !== b && Math.abs(a - b) < level.minDiff) problems.push("groups too close");
  if (a === b && !level.same) problems.push("equal groups without the “same” button");
  if (t.ask === "fewer" && !level.fewer) problems.push("“fewer” too early");
  t.places.forEach((p, i) => {
    if (p.length !== t.counts[i] || new Set(p).size !== p.length || p.some((x) => x < 0 || x >= SLOTS)) problems.push("bad places");
  });
  const right = a === b ? "same" : (t.ask === "more") === (a > b) ? 0 : 1;
  if (t.answer !== right) problems.push("wrong answer");
  return problems;
}
