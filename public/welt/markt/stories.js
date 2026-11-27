// The market square (Marktplatz): all four operations together, in little stories from the market.
// Only data: which story, its numbers and the answer. The sentences are in lang/<language>.js
// (platz.stories), so every language tells it with its own grammar.
//
//   import { story, STAGES } from "./stories.js";
//   story(stage, allowed, r) → { stage, kind, op, ops, n: { a, b, d, x }, answer, max, way }
//     allowed: { plus: 20, minus: 10, … } the operations the child may meet here and the biggest
//              number for each (the biggest number range it has finished at that stand)
//     op:      the operation to choose (stage 2) – for a two-step story the first one
//     way:     the steps, as in tasks.js way(): [[left, sign, right, result], …]
//
// Stages: 1 one step, the picture shows what happens · 2 one step, the child first picks + − · : ·
// 3 two steps · 4 two steps and a number nobody needs · 5 backwards ("at the end 7 are left").

export const STAGES = [1, 2, 3, 4, 5];

const ONE = { plus: ["dazu"], minus: ["weg", "mehr"], mal: ["gruppen"], geteilt: ["verteilen", "packen"] };
/** Two steps: the kind and the two operations it needs. */
const TWO = [
  { kind: "dazuWeg", ops: ["plus", "minus"] },
  { kind: "gruppenWeg", ops: ["mal", "minus"] },
  { kind: "gruppenDazu", ops: ["mal", "plus"] },
  { kind: "verteilenTuete", ops: ["geteilt", "minus"] },
];
/** Backwards: the story says one thing, the child computes the other way round. */
const BACK = [
  { kind: "wegZurueck", ops: ["plus"] },
  { kind: "dazuZurueck", ops: ["minus"] },
  { kind: "tueten", ops: ["geteilt"] },
];

/** a + b ≤ max, not too small for a big number range. */
function sumPair(max, r) {
  const low = max > 20 ? Math.floor(max / 5) : 3;
  for (let i = 0; i < 200; i++) {
    const s = r.int(low, max);
    const a = r.int(2, s - 2);
    if (a >= 2 && s - a >= 2) return [a, s - a];
  }
  return [2, 3];
}

/** a · b ≤ max: a small count (cartons, bags) and how many in each. */
function timesPair(max, r) {
  for (let i = 0; i < 200; i++) {
    const a = r.int(2, max >= 100 ? 9 : 5);
    const b = max >= 1000 ? r.int(11, 99) : r.int(2, max >= 100 ? 10 : 5);
    if (a * b <= max) return [a, b];
  }
  return [2, 3];
}

export function story(stage, allowed, r) {
  const ops = Object.keys(allowed);
  if (stage >= 3 && stage <= 4) {
    const fit = TWO.filter((s) => s.ops.every((o) => o in allowed));
    if (fit.length) return two(stage, r.pick(fit), allowed, r);
  }
  if (stage === 5) {
    const fit = BACK.filter((s) => s.ops.every((o) => o in allowed));
    if (fit.length) return back(r.pick(fit), allowed, r);
  }
  const op = r.pick(ops);
  return one(Math.min(stage, 2), op, r.pick(ONE[op]), allowed[op], r);
}

function finish(s) {
  const nums = [s.answer, ...Object.values(s.n), ...s.way.flatMap((w) => [w[0], w[2], w[3]])];
  return { ...s, max: Math.max(...nums.filter((v) => typeof v === "number")) };
}

function one(stage, op, kind, max, r) {
  let n, answer, way;
  if (op === "plus") {
    const [a, b] = sumPair(max, r);
    n = { a, b };
    answer = a + b;
    way = [[a, "+", b, answer]];
  } else if (op === "minus") {
    const [x, b] = sumPair(max, r);
    const a = x + b;
    n = { a, b };
    answer = x;
    way = [[a, "−", b, answer]];
  } else if (op === "mal") {
    const [a, b] = timesPair(max, r);
    n = { a, b };
    answer = a * b;
    way = [[a, "·", b, answer]];
  } else {
    const [c, b] = timesPair(max, r);
    const a = c * b;
    n = { a, b };
    answer = c;
    way = [[a, ":", b, c]];
  }
  return finish({ stage, kind, op, ops: [op], n, answer, way });
}

function two(stage, { kind, ops }, allowed, r) {
  const max = Math.min(...ops.map((o) => allowed[o]));
  let n, answer, way;
  for (let i = 0; i < 300; i++) {
    if (kind === "dazuWeg") {
      const [a, b] = sumPair(max, r);
      const d = r.int(2, Math.max(2, a + b - 2));
      n = { a, b, d };
      answer = a + b - d;
      way = [[a, "+", b, a + b], [a + b, "−", d, answer]];
    } else if (kind === "gruppenWeg") {
      const [a, b] = timesPair(max, r);
      const d = r.int(2, Math.max(2, Math.min(a * b - 2, b)));
      n = { a, b, d };
      answer = a * b - d;
      way = [[a, "·", b, a * b], [a * b, "−", d, answer]];
    } else if (kind === "gruppenDazu") {
      const [a, b] = timesPair(max, r);
      const d = r.int(2, Math.max(2, b - 1));
      n = { a, b, d };
      answer = a * b + d;
      way = [[a, "·", b, a * b], [a * b, "+", d, answer]];
    } else {
      const [c, b] = timesPair(max, r);
      n = { a: c * b, b };
      answer = c * b - c;
      way = [[c * b, ":", b, c], [c * b, "−", c, answer]];
    }
    if (answer >= 2 && way.every((w) => w[3] <= max)) break;
  }
  if (stage === 4) n.x = r.int(2, 6);
  return finish({ stage, kind, op: ops[0], ops, n, answer, way });
}

function back({ kind, ops }, allowed, r) {
  const max = allowed[ops[0]];
  let n, answer, way;
  if (kind === "wegZurueck") {
    // b were sold, c are left: how many were there? c + b
    const [c, b] = sumPair(max, r);
    n = { b, c };
    answer = c + b;
    way = [[c, "+", b, answer]];
  } else if (kind === "dazuZurueck") {
    // b came, now c are there: how many were there before? c − b
    const [x, b] = sumPair(max, r);
    n = { b, c: x + b };
    answer = x;
    way = [[x + b, "−", b, x]];
  } else {
    // b in every bag, a in all: how many bags? a : b
    const [c, b] = timesPair(max, r);
    n = { a: c * b, b };
    answer = c;
    way = [[c * b, ":", b, c]];
  }
  return finish({ stage: 5, kind, op: ops[0], ops, n, answer, way });
}

/** Problems with a story (tools/check-markt.mjs). */
export function checkStory(s, allowed) {
  const out = [];
  if (!s.ops.every((o) => o in allowed)) out.push("an operation the child has not finished");
  if (!Number.isInteger(s.answer) || s.answer < 0) out.push("answer");
  if (s.way.at(-1)[3] !== s.answer) out.push("way");
  const max = Math.max(...s.ops.map((o) => allowed[o]));
  if (s.max > max) out.push(`a number above ${max}`);
  for (const [l, sign, rr, res] of s.way) {
    const v = sign === "+" ? l + rr : sign === "−" ? l - rr : sign === "·" ? l * rr : l / rr;
    if (v !== res) out.push(`step ${l} ${sign} ${rr} ≠ ${res}`);
  }
  return out;
}
