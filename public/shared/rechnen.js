// The shared task building block of the arithmetic games (Plus now, Minus later, word problems
// in "Rechengeschichten" can dress the same tasks in text). Only numbers, no drawing: each game
// shows a task its own way. The level fields are described in games/plus/levels.js.
//
//   import * as rechnen from "/shared/rechnen.js";
//   const t = rechnen.task(level)   → { a, b, sum, gap, answer }   a + b = sum
//                                     gap: null (the child finds the sum) or "b" (3 + ? = 7: the child finds b)
//   rechnen.choices(t, level)       → three numbers, smallest first: the answer and typical mistakes
//   rechnen.columnSums(a, b)        → the sum of every column, biggest first: 38 + 27 → [50, 15]
//   rechnen.digits(n)               → [hundreds, tens, ones]
//   rechnen.carries(a, b)           → [ten ones made a ten?, ten tens made a hundred?]
//
// A level gives either sum: [smallest, biggest] (up to 20) or big: { digits: 2 | 3, kind } (up to 100
// or 1000; kind "round" = whole tens or hundreds, "plain" = no carrying, "carry" = with carrying).
// gap: true asks for the missing number instead of the sum. Minus will add op "-" here.

import { randInt, shuffle } from "./kit.js";

export const digits = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];

export function carries(a, b) {
  const da = digits(a), db = digits(b);
  const ones = da[2] + db[2] > 9;
  const tens = da[1] + db[1] + (ones ? 1 : 0) > 9;
  return [ones, tens];
}

export function columnSums(a, b) {
  const da = digits(a), db = digits(b);
  return [100, 10, 1].map((unit, c) => (da[c] + db[c]) * unit).filter((n) => n > 0);
}

/** Up to 20: the sum first, then a first number that fits how the task is shown. */
function small(level) {
  const sum = randInt(...level.sum);
  let a;
  if (sum > 10) {
    // Above 10: both numbers below 10, so the ten has to be filled first (sums up to 18).
    a = randInt(Math.max(2, sum - 9), 9);
  } else if (level.show === "bush") {
    // Counting on works best from the bigger number: at least 3 behind the bush.
    a = randInt(Math.max(3, Math.ceil(sum / 2)), sum - 1);
  } else {
    a = randInt(1, sum - 1);
  }
  return [a, sum - a];
}

/** Up to 100 or 1000: two numbers that fit the kind. */
function big(level) {
  const { digits: d, kind } = level.big;
  const top = 10 ** d; // 100 or 1000
  const unit = top / 10; // 10 or 100
  let a = unit, b = unit;
  for (let tries = 0; tries < 1000; tries++) {
    if (kind === "round") {
      a = unit * randInt(1, 8);
      b = unit * randInt(1, 10 - a / unit);
      break;
    }
    a = randInt(unit + 1, top - unit - 1);
    b = randInt(unit + 1, top - a - 1);
    if ((kind === "carry") === carries(a, b).some(Boolean)) break;
  }
  return [a, b];
}

export function task(level) {
  const [a, b] = level.big ? big(level) : small(level);
  const gap = level.gap ? "b" : null;
  return { a, b, sum: a + b, gap, answer: gap ? b : a + b };
}

/** The answer and two typical mistakes or near numbers, smallest first. */
export function choices(t, level) {
  const { a, b, sum, answer } = t;
  const first = []; // typical mistakes come first
  let near;
  if (level.big) {
    const { digits: d, kind } = level.big;
    const unit = 10 ** (d - 1);
    if (t.gap) first.push(sum);
    const [ones, tens] = carries(a, b);
    if (!t.gap && ones) first.push(answer - 10); // forgot the carried ten
    if (!t.gap && tens) first.push(answer - 100); // forgot the carried hundred
    near = kind === "round" ? [unit, -unit, 2 * unit, -2 * unit] : d === 3 ? [1, -1, 10, -10, 100, -100] : [1, -1, 10, -10];
  } else {
    if (t.gap) first.push(sum); // took the sum instead of the missing number
    else if (sum > 10) first.push(sum - 10); // forgot the ten
    near = [1, -1, 2, -2];
  }
  const max = level.big ? 10 ** level.big.digits : 20;
  const out = new Set([answer]);
  for (const n of [...shuffle(first), ...shuffle(near.map((x) => answer + x))]) {
    if (out.size < 3 && n >= 1 && n <= max) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}
