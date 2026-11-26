// The tasks of "Blitzblick": one function makes one task (see shared/gen.js).
//
//   task(level, r, thingIds?) → { count, thing, kind, marks, choices }
//     count   – how many things flash up (level.min … level.max)
//     thing   – id of the thing (shared/things.js), from thingIds (the ones with names in this language)
//     kind    – the level's kind: "dice", "scatter" or "frame"
//     marks   – where to draw: [{ x, y, empty? }] in % of the field; "frame" also has its empty places
//     choices – three numbers to pick from, smallest first: the count and two neighbours

import { THING_IDS } from "../../shared/things.js";

// Dice patterns on a 3 x 3 grid: [column, row], 0..2.
export const DICE = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

function marks(kind, n, r) {
  if (kind === "dice") {
    const flip = r.chance(0.5); // mirror sometimes, so 2, 3 and 6 are not always the same way round
    return DICE[n].map(([c, row]) => ({ x: 30 + (flip ? 2 - c : c) * 20, y: 22 + row * 28 }));
  }
  if (kind === "scatter") {
    // Random places on a 4 x 3 grid, a little shaken so it does not look like a grid.
    return r.sample([...Array(12).keys()], n).map((i) => ({
      x: 14 + (i % 4) * 24 + r.int(-4, 4),
      y: 20 + Math.floor(i / 4) * 30 + r.int(-4, 4),
    }));
  }
  // 2 x 5 frame: first row full (5), second row the rest. Empty places are dashed.
  return [...Array(10).keys()].map((i) => ({ x: 14 + (i % 5) * 18, y: i < 5 ? 34 : 66, ...(i < n ? {} : { empty: true }) }));
}

export function task(level, r, thingIds = THING_IDS) {
  const count = r.int(level.min, level.max);
  // The count and two neighbours, from one below the level's smallest to one above its biggest.
  const low = Math.max(1, level.min - 1);
  const high = level.max + 1;
  const choices = new Set([count]);
  while (choices.size < 3) {
    const near = count + r.int(-2, 2);
    choices.add(near >= low && near <= high ? near : r.int(low, high));
  }
  return {
    count,
    thing: r.pick(thingIds),
    kind: level.kind,
    marks: marks(level.kind, count, r),
    choices: [...choices].sort((a, b) => a - b),
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (t.count < level.min || t.count > level.max) problems.push(`count ${t.count} outside ${level.min}–${level.max}`);
  if (t.marks.filter((m) => !m.empty).length !== t.count) problems.push("marks ≠ count");
  const spots = new Set(t.marks.map((m) => `${m.x},${m.y}`));
  if (spots.size !== t.marks.length) problems.push("two marks on the same place");
  if (t.marks.some((m) => m.x < 5 || m.x > 95 || m.y < 5 || m.y > 95)) problems.push("mark outside the field");
  if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
  if (!t.choices.includes(t.count)) problems.push("answer missing in choices");
  if (t.choices.some((n) => n < 1 || n > level.max + 1)) problems.push("choice out of range");
  return problems;
}
