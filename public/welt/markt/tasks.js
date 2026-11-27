// The tasks of the market (welt/markt/): plus, minus, times and divide in four number ranges.
// Only data, no drawing and no texts, so it also runs in node (tools/check-markt.mjs).
//
//   import { task, choices, classify, way, owl, STEPS } from "./tasks.js";
//   task(op, range, step, r)  → one task: { op, a, b, c, rest, gap, answer, step, key, max }
//                               a + b = c, a − b = c, a · b = c, a : b = c (rest: the remainder, 0 if none)
//                               gap: which number the child finds: "a", "b", "c" or "rest"
//                               step: the index of the sub-step (STEPS), or STEPS[op][range].length = mixed
//                               key: the card in the learning box (facts) or the kind of task (bigger numbers)
//                               max: the biggest number in the task, with the answer (audio up to 20)
//   choices(t, r)             → three numbers, smallest first: the answer and typical mistakes
//   classify(t, given)        → what kind of mistake a wrong answer is ("zehner", "eins", …) or null
//   owl(t, r)                 → a wrong answer the owl gives in "check", with its kind of mistake
//   way(t)                    → the way in small steps, for the third miss: [[a, op, b, result], …]
//   inverse(t)                → the same numbers, the other way round (8 + 5 = 13 → 13 − 5 = 8)
//   check(t)                  → a list of problems (empty: fine)

export const OPS = ["plus", "minus", "mal", "geteilt"];
export const RANGES = [10, 20, 100, 1000];
export const SIGN = { plus: "+", minus: "−", mal: "·", geteilt: ":" };
/** Up to this number a task is read aloud and the feedback is spoken. */
export const AUDIO_MAX = 20;

/** The sub-steps of every number range, easy to hard. After the last one comes "mixed": all of them. */
export const STEPS = {
  plus: { 10: ["bilder", "luecke"], 20: ["verdoppeln", "uebergang", "luecke"], 100: ["zehner", "zeE", "zeze"], 1000: ["hunderter", "plain", "carry"] },
  minus: { 10: ["bilder", "luecke"], 20: ["halbieren", "uebergang", "luecke"], 100: ["zehner", "zeE", "zeze"], 1000: ["hunderter", "plain", "carry"] },
  mal: { 10: ["gruppen"], 20: ["verdoppeln", "fuenfer"], 100: ["kern", "reihen", "alle"], 1000: ["zehner", "zemal", "bis1000"] },
  geteilt: { 10: ["verteilen"], 20: ["umkehr"], 100: ["kern", "alle", "rest"], 1000: ["zehner", "bis1000"] },
};
export const mixed = (op, range) => STEPS[op][range].length;

const digits = (n) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10];
/** Does a + b carry anywhere (ones or tens)? */
export function carries(a, b) {
  const [, ta, oa] = digits(a), [, tb, ob] = digits(b);
  return oa + ob > 9 || ta + tb + (oa + ob > 9 ? 1 : 0) > 9;
}
/** Does a − b borrow anywhere? */
export function borrows(a, b) {
  const [, ta, oa] = digits(a), [, tb, ob] = digits(b);
  return ob > oa || tb + (ob > oa ? 1 : 0) > ta;
}

// ---------- Plus: two numbers whose sum fits the step

function plusPair(range, step, r) {
  for (let i = 0; i < 400; i++) {
    let a, b;
    if (range === 10) {
      const s = r.int(step === "luecke" ? 3 : 2, 10);
      a = r.int(1, s - 1);
      b = s - a;
    } else if (range === 20) {
      if (step === "verdoppeln") {
        a = r.int(2, 10);
        b = Math.min(10, Math.max(1, a + r.pick([0, 0, 1, -1])));
      } else {
        a = r.int(2, 9);
        b = r.int(11 - a, 9);
      }
    } else if (range === 100) {
      if (step === "zehner") {
        if (r.chance(0.5)) {
          a = 10 * r.int(1, 8);
          b = 10 * r.int(1, 10 - a / 10);
        } else {
          a = r.int(21, 88);
          if (a % 10 === 0 || a % 10 === 9) continue;
          b = r.int(1, 9 - (a % 10));
        }
      } else if (step === "zeE") {
        a = r.int(21, 89);
        b = r.int(10 - (a % 10), 9);
        if (a % 10 === 0 || b < 2) continue;
      } else {
        a = r.int(12, 78);
        b = r.int(12, 99 - a);
        if (a % 10 === 0 || b % 10 === 0) continue;
      }
    } else {
      if (step === "hunderter") {
        if (r.chance(0.4)) {
          a = 100 * r.int(1, 8);
          b = 100 * r.int(1, 10 - a / 100);
        } else {
          a = r.int(101, 889);
          b = r.chance(0.5) ? 10 * r.int(1, 9) : 100 * r.int(1, 8);
          if (carries(a, b) || a % 10 === 0) continue;
        }
      } else {
        a = r.int(101, 789);
        b = r.int(101, 999 - a);
        if (carries(a, b) !== (step === "carry") || a % 10 === 0 || b % 10 === 0) continue;
      }
    }
    const c = a + b;
    if (a >= 1 && b >= 1 && c <= range && c > (range > 20 ? range / 5 : 1)) return [a, b];
  }
  return range === 10 ? [2, 3] : range === 20 ? [8, 5] : range === 100 ? [34, 25] : [345, 230];
}

// ---------- Minus: from a plus pair, so every minus task has a fitting plus task

function minusPair(range, step, r) {
  for (let i = 0; i < 400; i++) {
    let s, b;
    if (range === 10) {
      s = r.int(step === "luecke" ? 3 : 2, 10);
      b = r.int(1, s - 1);
    } else if (range === 20) {
      if (step === "halbieren") {
        if (r.chance(0.5)) {
          b = r.int(2, 10);
          s = 2 * b;
        } else {
          b = r.int(1, 9);
          s = 10 + b;
        }
      } else {
        s = r.int(11, 18);
        b = r.int(s - 9, 9);
        if (b <= s % 10) continue;
      }
    } else if (range === 100) {
      if (step === "zehner") {
        if (r.chance(0.5)) {
          s = 10 * r.int(3, 10);
          b = 10 * r.int(1, s / 10 - 1);
        } else {
          s = r.int(22, 99);
          if (s % 10 < 2) continue;
          b = r.int(1, s % 10);
        }
      } else if (step === "zeE") {
        s = r.int(21, 98);
        b = r.int(2, 9);
        if (b <= s % 10) continue;
      } else {
        s = r.int(31, 99);
        b = r.int(12, s - 11);
        if (b % 10 === 0 || s % 10 === 0) continue;
      }
    } else {
      if (step === "hunderter") {
        if (r.chance(0.4)) {
          s = 100 * r.int(3, 10);
          b = 100 * r.int(1, s / 100 - 1);
        } else {
          s = r.int(201, 999);
          b = r.chance(0.5) ? 10 * r.int(1, 9) : 100 * r.int(1, 8);
          if (b >= s || borrows(s, b) || s % 10 === 0) continue;
        }
      } else {
        s = r.int(250, 999);
        b = r.int(101, s - 101);
        if (borrows(s, b) !== (step === "carry") || s % 10 === 0 || b % 10 === 0) continue;
      }
    }
    if (b >= 1 && s - b >= 1 && s <= range && s > (range > 20 ? range / 5 : 1)) return [s, b];
  }
  return range === 10 ? [7, 3] : range === 20 ? [13, 5] : range === 100 ? [65, 28] : [605, 128];
}

// ---------- Times

function malPair(range, step, r) {
  for (let i = 0; i < 400; i++) {
    let a, b;
    if (range === 10) {
      a = r.int(2, 5);
      b = r.int(2, 5);
    } else if (range === 20) {
      if (step === "verdoppeln") {
        a = 2;
        b = r.int(2, 10);
      } else {
        a = r.pick([2, 3, 4, 5]);
        b = r.int(2, 10);
      }
    } else if (range === 100) {
      if (step === "kern") {
        a = r.pick([1, 2, 5, 10]);
        b = r.int(1, 10);
      } else if (step === "reihen") {
        a = r.pick([3, 4, 6, 8]);
        b = r.int(1, 10);
      } else {
        a = r.int(2, 10);
        b = r.int(2, 10);
      }
    } else {
      a = r.int(2, 9);
      if (step === "zehner") b = r.chance(0.7) ? 10 * r.int(2, 9) : 100 * r.int(1, 4);
      else if (step === "zemal") {
        b = r.int(11, 99);
        if (b % 10 === 0) continue;
      } else {
        b = r.int(101, 499);
        if (b % 10 === 0 && b % 50 !== 0) continue;
      }
    }
    if (a * b <= range && a * b > (range === 1000 ? 100 : 1)) return r.chance(0.5) && range <= 100 ? [b, a] : [a, b];
  }
  return [3, 4];
}

// ---------- Divide: a : b = c, rest

function teilen(range, step, r) {
  for (let i = 0; i < 400; i++) {
    let b, c, rest = 0;
    if (range === 10) {
      b = r.int(2, 5);
      c = r.int(1, 5);
    } else if (range === 20) {
      b = r.pick([2, 3, 4, 5, 10]);
      c = r.int(2, 10);
    } else if (range === 100) {
      if (step === "kern") {
        b = r.pick([1, 2, 5, 10]);
        c = r.int(1, 10);
      } else {
        b = r.int(2, 10);
        c = r.int(2, 10);
        if (step === "rest") {
          b = r.int(2, 9);
          rest = r.int(1, b - 1);
        }
      }
    } else {
      b = r.int(2, 9);
      if (step === "zehner") c = r.chance(0.7) ? 10 * r.int(2, 9) : 100 * r.int(1, 4);
      else {
        c = r.int(11, 249);
        if (c % 10 === 0) continue;
      }
    }
    const a = b * c + rest;
    if (a <= range && a >= 2 && (range < 1000 || a > 100)) return [a, b, c, rest];
  }
  return [12, 3, 4, 0];
}

/** The card in the learning box: one card per fact up to 20 (plus, minus) and in the times tables;
 *  above that one card per kind of task. */
function cardKey(op, range, stepId, a, b, gap) {
  const fact = (op === "plus" || op === "minus") ? range <= 20 : range <= 100 && stepId !== "rest";
  return fact ? `${op}:${a},${b}${gap === "c" ? "" : ":" + gap}` : `${op}:${range}:${stepId}${gap === "c" ? "" : ":" + gap}`;
}

/**
 * One task. step = index into STEPS[op][range]; the mixed step (= its length) picks one at random.
 */
export function task(op, range, step, r) {
  const steps = STEPS[op][range];
  const at = step >= steps.length ? r.int(0, steps.length - 1) : Math.max(0, step);
  const id = steps[at];
  let a, b, c, rest = 0, gap = "c";
  if (op === "plus") {
    [a, b] = plusPair(range, id, r);
    c = a + b;
    if (id === "luecke") gap = r.chance(0.75) ? "b" : "a";
  } else if (op === "minus") {
    [a, b] = minusPair(range, id, r);
    c = a - b;
    if (id === "luecke") gap = "b";
  } else if (op === "mal") {
    [a, b] = malPair(range, id, r);
    c = a * b;
    if (id === "alle" && r.chance(0.25)) gap = "b";
  } else {
    [a, b, c, rest] = teilen(range, id, r);
    if (id === "rest") gap = r.chance(0.5) ? "c" : "rest";
  }
  const answer = { a, b, c, rest }[gap];
  return { op, range, a, b, c, rest, gap, answer, step: at, stepId: id, key: cardKey(op, range, id, a, b, gap), max: Math.max(a, b, c) };
}

/** Is this task read aloud? Only when every number, the answer too, is at most 20. */
export const audible = (t) => t.max <= AUDIO_MAX;

/** The same numbers the other way round: 8 + 5 = 13 → 13 − 5 = 8; 3 · 4 = 12 → 12 : 4 = 3. */
export function inverse(t) {
  const base = { range: t.range, rest: 0, gap: "c", step: t.step, stepId: t.stepId };
  let u;
  if (t.op === "plus") u = { ...base, op: "minus", a: t.c, b: t.b, c: t.a };
  else if (t.op === "minus") u = { ...base, op: "plus", a: t.c, b: t.b, c: t.a };
  else if (t.op === "mal") u = { ...base, op: "geteilt", a: t.c, b: t.b, c: t.a };
  else u = { ...base, op: "mal", a: t.c, b: t.b, c: t.a, rest: 0 };
  u.answer = u.c;
  u.max = Math.max(u.a, u.b, u.c);
  u.key = cardKey(u.op, u.range, "umkehr", u.a, u.b, "c");
  return u;
}

const reversed = (n) => Number(String(n).split("").reverse().join(""));

/** What kind of mistake a wrong number is. Only for the number the child had to find. */
export function classify(t, given) {
  if (given === t.answer) return null;
  const { op, a, b, c, gap } = t;
  if (gap === "rest") return "rest";
  if (gap === "c") {
    if (op === "mal" && (given === a + b)) return "rechenart";
    if (op === "plus" && given === Math.abs(a - b) && a !== b) return "rechenart";
    if (op === "minus" && given === a + b) return "rechenart";
    if (op === "geteilt" && (given === a - b || given === a * b)) return "rechenart";
    if (op === "minus" && a > 10) {
      const [ha, ta, oa] = digits(a), [hb, tb, ob] = digits(b);
      const swap = 100 * Math.abs(ha - hb) + 10 * Math.abs(ta - tb) + Math.abs(oa - ob);
      if (swap === given && borrows(a, b)) return "kleinergroesser";
    }
    if (op === "mal" && (given === c + a || given === c - a || given === c + b || given === c - b)) return "nachbar";
  }
  if (t.answer >= 12 && reversed(t.answer) === given && t.answer % 10 !== 0) return "vertauscht";
  const d = Math.abs(given - t.answer);
  if (d === 10 || d === 100) return "zehner";
  if (d === 1) return "eins";
  return null;
}

/** A wrong answer the owl gives in "check", and its kind of mistake. Plausible for this task. */
export function owl(t, r) {
  const { op, a, b, c } = t;
  const options = [];
  if (op === "plus" && carries(a, b)) options.push([c - 10, "zehner"]);
  if (op === "minus" && borrows(a, b)) {
    const [ha, ta, oa] = digits(a), [hb, tb, ob] = digits(b);
    options.push([100 * Math.abs(ha - hb) + 10 * Math.abs(ta - tb) + Math.abs(oa - ob), "kleinergroesser"]);
    if (a > 20) options.push([c + 10, "zehner"]);
  }
  if (op === "mal" && a > 1 && b > 1) options.push([c + a, "nachbar"], [c - b, "nachbar"]);
  if (op === "mal" && a * b > a + b) options.push([a + b, "rechenart"]);
  if (op === "geteilt" && t.rest) options.push([t.rest + 1 < b ? t.rest + 1 : t.rest - 1, "rest"]);
  if (c >= 12 && c % 10 !== 0 && reversed(c) !== c && t.gap !== "rest") options.push([reversed(c), "vertauscht"]);
  options.push([t.answer + 1, "eins"], [t.answer - 1, "eins"]);
  const fine = options.filter(([n]) => n >= 0 && n !== t.answer && n <= Math.max(t.range, t.answer + 10));
  return r.pick(fine.slice(0, -2).length ? fine.slice(0, -2) : fine);
}

/** Three numbers to pick from: the answer and the most typical mistakes. Smallest first. */
export function choices(t, r) {
  const out = new Set([t.answer]);
  const typical = [];
  if (t.gap === "c") {
    if (t.op === "plus" && carries(t.a, t.b)) typical.push(t.answer - 10);
    if (t.op === "mal") typical.push(t.a + t.b, t.answer + t.a);
    if (t.op === "minus" && borrows(t.a, t.b)) typical.push(t.answer + 10);
  } else if (t.gap === "b" || t.gap === "a") typical.push(t.c);
  const near = t.range > 100 ? [1, -1, 10, -10, 100] : t.range > 20 ? [1, -1, 10, -10] : [1, -1, 2, -2];
  for (const n of [...r.shuffle(typical), ...r.shuffle(near.map((d) => t.answer + d))]) {
    if (out.size < 3 && n >= 0 && n <= Math.max(t.range, t.answer)) out.add(n);
  }
  while (out.size < 3) out.add(t.answer + out.size + 1);
  return [...out].sort((x, y) => x - y);
}

/** The way in small steps. Each step is [left, sign, right, result]. The last result is the answer. */
export function way(t) {
  const { op, a, b, c, rest } = t;
  const S = SIGN[op];
  if (t.gap !== "c" && t.gap !== "rest") {
    // A gap: turn it into the task you know. 3 + ? = 7 → 7 − 3; ? · 7 = 56 → 56 : 7
    if (op === "plus") return t.gap === "b" ? [[c, "−", a, b]] : [[c, "−", b, a]];
    if (op === "minus") return [[a, "−", c, b]];
    if (op === "mal") return [[c, ":", a, b]];
    return [[a, ":", c, b]];
  }
  if (op === "plus") {
    if (a < 100 && b < 10 && (a % 10) + b > 10 - 1 && (a % 10) + b !== 10) {
      const fill = 10 - (a % 10);
      return [[a, S, fill, a + fill], [a + fill, S, b - fill, c]];
    }
    if (b >= 10) {
      const big = b - (b % 10);
      return b % 10 ? [[a, S, big, a + big], [a + big, S, b % 10, c]] : [[a, S, b, c]];
    }
    return [[a, S, b, c]];
  }
  if (op === "minus") {
    if (b < 10 && b > a % 10 && a > 10) {
      const down = a % 10;
      return down ? [[a, S, down, a - down], [a - down, S, b - down, c]] : [[a, S, b, c]];
    }
    if (b >= 10) {
      const big = b - (b % 10);
      return b % 10 ? [[a, S, big, a - big], [a - big, S, b % 10, c]] : [[a, S, b, c]];
    }
    return [[a, S, b, c]];
  }
  if (op === "mal") {
    const [x, y] = a <= b ? [a, b] : [b, a];
    if (y > 10) {
      const big = y - (y % 10);
      return y % 10 ? [[x, S, big, x * big], [x, S, y % 10, x * (y % 10)], [x * big, "+", x * (y % 10), c]] : [[x, S, y, c]];
    }
    if (x > 5 && x <= 10) return [[5, S, y, 5 * y], [x - 5, S, y, (x - 5) * y], [5 * y, "+", (x - 5) * y, c]];
    return [[x, S, y, c]];
  }
  // divide: think of the times task; with a rest, what is left over
  if (rest) return t.gap === "rest" ? [[c, "·", b, c * b], [a, "−", c * b, rest]] : [[c, "·", b, c * b], [a, "−", c * b, rest], [a, ":", b, c]];
  if (c > 10 && c % 10) {
    const big = c - (c % 10);
    return [[big, "·", b, big * b], [a - big * b, ":", b, c % 10], [big, "+", c % 10, c]];
  }
  return [[c, "·", b, a], [a, ":", b, c]];
}

/** Problems with a task (tools/check-markt.mjs). */
export function check(t) {
  const out = [];
  const { op, a, b, c, rest, range } = t;
  const ok = op === "plus" ? a + b === c : op === "minus" ? a - b === c : op === "mal" ? a * b === c : b * c + rest === a && rest < b;
  if (!ok) out.push("does not add up");
  if ([a, b, c].some((n) => !Number.isInteger(n) || n < 0)) out.push("not a whole number ≥ 0");
  if (t.max > range) out.push(`a number above ${range}`);
  if (op !== "geteilt" && (a < 1 || b < 1)) out.push("a zero");
  if (t.answer !== { a, b, c, rest }[t.gap]) out.push("wrong answer field");
  if (range > 20 && t.max <= 20 && op !== "mal" && op !== "geteilt") out.push("too small for its range");
  const w = way(t);
  if (w.at(-1)[3] !== t.answer) out.push(`way ends at ${w.at(-1)[3]}`);
  const ch = choices(t, { shuffle: (x) => x });
  if (!ch.includes(t.answer) || new Set(ch).size !== 3) out.push("choices");
  return out;
}
