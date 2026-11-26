// The tasks of "Wer ist Erster?": one function makes one task (see shared/gen.js).
//
//   task(level, r, animalIds?) → { kind, queue, target, ref, dir, askLast, choices, key }
//     kind    – one of level.kinds: "ends", "tap", "which", "beside" or "back" (see levels.js)
//     queue   – ids of the animals in the queue (shared/things.js), front first, all different
//     target  – index (front = 0) of the animal the child has to find
//     ref     – "beside": the animal the question is about; dir – "front" or "behind"
//     askLast – "ends" / "tap": the question is "the last animal"
//     choices – "which": three places to pick from (1 = first), smallest first: the right one and
//               the usual mistakes (one off, or counted from the back); empty for the other kinds
//     key     – short text that tells tasks apart, for "not the same task again"

import { THING_IDS } from "../../shared/things.js";

/** The right place and two neighbours (the usual mistake: one off, or counted from the back). */
function choices(r, target, size) {
  const answer = target + 1;
  const ok = (k) => k >= 1 && k <= size && k !== answer;
  const likely = r.shuffle([answer - 1, answer + 1, size - target].filter(ok));
  const more = [answer - 2, answer + 2, 1, size].filter(ok);
  return [answer, ...[...new Set([...likely, ...more])].slice(0, 2)].sort((a, b) => a - b);
}

export function task(level, r, animalIds = THING_IDS) {
  const kind = r.pick(level.kinds);
  const size = r.int(level.n[0], level.n[1]);
  const queue = r.sample(animalIds, size);
  let target, ref = null, dir = null, askLast = false;
  if (kind === "ends") {
    askLast = r.chance(0.5);
    target = askLast ? size - 1 : 0;
  } else if (kind === "tap") {
    // Sometimes "the last one", so the child learns that the last has a place too.
    askLast = r.chance(0.2);
    target = askLast ? size - 1 : r.int(1, Math.min(level.upTo, size)) - 1;
  } else if (kind === "which") {
    target = r.int(0, size - 1);
  } else if (kind === "beside") {
    dir = r.pick(["front", "behind"]);
    ref = dir === "front" ? r.int(1, size - 1) : r.int(0, size - 2);
    target = dir === "front" ? ref - 1 : ref + 1;
  } else {
    // From the back: the second, third … (the first from the back is simply the last).
    target = size - r.int(2, size - 1);
  }
  return {
    kind, queue, target, ref, dir, askLast,
    choices: kind === "which" ? choices(r, target, size) : [],
    key: `${kind}${askLast}${dir}${size}-${target}`,
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const size = t.queue.length;
  if (!level.kinds.includes(t.kind)) problems.push("kind not in level");
  if (size < level.n[0] || size > level.n[1] || new Set(t.queue).size !== size) problems.push("bad queue");
  if (t.target < 0 || t.target >= size) problems.push("target outside queue");
  if (t.kind === "ends" && t.target !== 0 && t.target !== size - 1) problems.push("ends: not first or last");
  if (t.kind === "tap" && !t.askLast && t.target + 1 > level.upTo) problems.push("tap: place above upTo");
  if (t.askLast && t.target !== size - 1) problems.push("last is not last");
  if (t.kind === "beside" && t.target !== t.ref + (t.dir === "front" ? -1 : 1)) problems.push("beside: wrong neighbour");
  if (t.kind === "back" && (size - t.target < 2 || size - t.target > size - 1)) problems.push("back: place outside 2 … size − 1");
  if (t.kind === "which") {
    if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
    if (!t.choices.includes(t.target + 1)) problems.push("answer missing in choices");
    if (t.choices.some((k) => k < 1 || k > size)) problems.push("choice outside the queue");
  }
  return problems;
}
