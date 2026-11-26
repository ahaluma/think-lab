// The tasks of "Wie viele?": one function makes one task (see shared/gen.js).
//
//   task(level, r, thingIds?) → { count, thing, places, choices }
//     count   – how many things to count (1 … level.max)
//     thing   – id of the thing (shared/things.js), from thingIds (the ones with names in this language)
//     places  – which of the 12 places of the 4 × 3 tray hold a thing, smallest first
//     choices – three numbers to pick from, smallest first: the count and two near numbers

import { THING_IDS } from "../../shared/things.js";

export const SLOTS = 12; // 4 x 3 places in the tray

export function task(level, r, thingIds = THING_IDS) {
  const count = r.int(1, level.max);
  const thing = r.pick(thingIds);
  const places = r.sample([...Array(SLOTS).keys()], count).sort((a, b) => a - b);

  // The count and two others: mostly near it (one or two more or less), never above the level's
  // biggest number (at least 3, so "up to 3" still has three different buttons).
  const top = Math.max(level.max, 3);
  const choices = new Set([count]);
  while (choices.size < 3) {
    const near = count + r.int(-2, 2);
    choices.add(near >= 1 && near <= top ? near : r.int(1, top));
  }
  return { count, thing, places, choices: [...choices].sort((a, b) => a - b) };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (t.count < 1 || t.count > level.max) problems.push(`count ${t.count} outside 1–${level.max}`);
  if (t.places.length !== t.count) problems.push("places ≠ count");
  if (new Set(t.places).size !== t.places.length || t.places.some((p) => p < 0 || p >= SLOTS)) problems.push("bad places");
  if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
  if (!t.choices.includes(t.count)) problems.push("answer missing in choices");
  if (t.choices.some((n) => n < 1 || n > Math.max(level.max, 3))) problems.push("choice out of range");
  return problems;
}
