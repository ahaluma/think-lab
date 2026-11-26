// The tasks of "Zehnerfreunde": one function makes one task (see shared/gen.js).
//
//   task(level, r, thingIds?) → { total, have, answer, thing, places, first, choices }
//     total   – 5 (one row) or 10 (the ten-frame), from the level
//     have    – animals in the frame (level.have)
//     answer  – empty places: total − have
//     thing   – id of the thing (shared/things.js), from thingIds (the ones with names in this language)
//     places  – which places hold an animal, smallest first: in order, or random for "scatter"
//     first   – numbers: the gap comes second (7 + ? = 10); false: first (? + 3 = 10), only with level.swap
//     choices – three buttons, smallest first: the answer, the number of animals (a common mix-up), a neighbour

import { THING_IDS } from "../../shared/things.js";

export function task(level, r, thingIds = THING_IDS) {
  const { total } = level;
  const have = r.int(...level.have);
  const answer = total - have;
  const places = level.show === "scatter"
    ? r.sample([...Array(total).keys()], have).sort((a, b) => a - b)
    : [...Array(have).keys()];

  const choices = new Set([answer]);
  if (have !== answer) choices.add(have);
  for (const n of r.shuffle([answer - 1, answer + 1, answer + 2, answer - 2])) {
    if (choices.size >= 3) break;
    if (n >= 0 && n <= total) choices.add(n);
  }

  return {
    total,
    have,
    answer,
    thing: r.pick(thingIds),
    places,
    first: !(level.swap && r.chance(0.5)),
    choices: [...choices].sort((a, b) => a - b),
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (t.have < level.have[0] || t.have > level.have[1]) problems.push("have outside level");
  if (t.answer !== t.total - t.have || t.answer < 1) problems.push("wrong answer");
  if (t.places.length !== t.have || new Set(t.places).size !== t.have || t.places.some((p) => p < 0 || p >= t.total)) problems.push("bad places");
  if (level.show !== "scatter" && t.places.some((p, i) => p !== i)) problems.push("places not in order");
  if (!t.first && !level.swap) problems.push("gap first without swap");
  if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
  if (!t.choices.includes(t.answer)) problems.push("answer missing in choices");
  if (t.choices.some((n) => n < 0 || n > t.total)) problems.push("choice out of range");
  return problems;
}
