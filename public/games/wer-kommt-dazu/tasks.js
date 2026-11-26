// The tasks of "Wer kommt dazu?": one function makes one task (see shared/gen.js).
//
//   task(level, r, animalIds?) → { animal, change, start, step, answer, firstChoices, choices, key }
//     animal       – id of the animal (shared/things.js), one that can walk onto a meadow
//     change       – "come" or "go" ("mixed" levels pick one)
//     start        – animals on the meadow at the start (step 1: the child counts them)
//     step         – how many come or go
//     answer       – animals there after the change (step 2)
//     firstChoices – three buttons for step 1, smallest first
//     choices      – three buttons for step 2, smallest first; always has start (the usual mix-up)
//     key          – short text that tells tasks apart, for "not the same task again"

export const MAX = 10; // never more than 10 animals on the meadow

// Only animals that can walk or hop onto a meadow.
export const MEADOW = ["rabbit", "duck", "ladybird", "snail", "elephant", "rhino", "unicorn", "giraffe", "lion", "dinosaur",
  "turtle", "penguin", "frog", "owl", "kangaroo", "crocodile", "ant", "fox", "panda", "butterfly", "crab"];

/** Three choices: the right one, the given extra ones and neighbours, smallest first. */
function choices(r, right, extra) {
  const out = new Set([right, ...extra]);
  while (out.size < 3) {
    const near = right + r.int(-2, 2);
    if (near >= 1 && near <= MAX) out.add(near);
  }
  return [...out].sort((a, b) => a - b);
}

export function task(level, r, animalIds = MEADOW) {
  const step = r.int(...level.step);
  const change = level.change === "mixed" ? r.pick(["come", "go"]) : level.change;
  let start = r.int(...level.from);
  if (change === "come" && start + step > MAX) start = MAX - step;
  if (change === "go" && start - step < 1) start = step + 1; // at least one animal stays
  const answer = change === "come" ? start + step : start - step;
  return {
    animal: r.pick(animalIds),
    change,
    start,
    step,
    answer,
    firstChoices: choices(r, start, []),
    choices: choices(r, answer, [start]),
    key: `${change}:${start}:${step}`,
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (level.change !== "mixed" && t.change !== level.change) problems.push("wrong change");
  if (t.step < level.step[0] || t.step > level.step[1]) problems.push("step outside level");
  if (t.start < 1 || t.answer < 1 || t.start > MAX || t.answer > MAX) problems.push("amount outside 1–10");
  if (t.answer !== (t.change === "come" ? t.start + t.step : t.start - t.step)) problems.push("wrong answer");
  for (const [c, right] of [[t.firstChoices, t.start], [t.choices, t.answer]]) {
    if (c.length !== 3 || new Set(c).size !== 3) problems.push("not three different choices");
    if (!c.includes(right)) problems.push("answer missing in choices");
    if (c.some((n) => n < 1 || n > MAX)) problems.push("choice outside 1–10");
  }
  if (!t.choices.includes(t.start)) problems.push("the number from before is missing");
  return problems;
}
