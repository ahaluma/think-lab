// The tasks of the idea "Stellen": ten ones make a ten, ten tens make a hundred (place value).
// Meadow and stream on the map, next to "Zahl": ten flowers are tied into a bunch, ten bunches go
// into a basket. One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 20, 50, 100 or 1000 (the biggest number).
//
//   sehen     { n, scatter }                       bunches and flowers (and baskets): how many flowers?
//                                                  scatter: the flowers lie before the bunches (from 100)
//   machen    { n }                                make n out of bunches and single flowers
//   forschen  { range, start, ops, asks: [{ from, op, answer }] }
//                                                  try +1, −1, +10, −10 (from 1000 also ±100) on `start`,
//                                                  then say what comes out before it is shown
//   anwenden  { range, kind, h, z, e, answer, ask }        just the numbers, in a place-value table:
//               "build"  h hundreds, z tens, e ones → the number
//               "swap"   the same, the ones said first ("4 ones and 3 tens") → the number
//               "over"   more than nine ones ("2 tens and 13 ones") → the number
//               "split"  the number → how many tens (ask "z"), ones ("e") or hundreds ("h")
//   pruefen   { n, said, right, kind }             the owl counts: "these are `said`". kind of mistake:
//                                                  "swap" (43 for 34), "ten" (one bunch too many or too
//                                                  few), "one", "zero" (35 for 305)
//   key – short text that tells tasks apart, for "not the same task again".

export const RANGES = [20, 50, 100, 1000];
/** The numbers of each range. Up to 20: the teens (one bunch and some flowers) and 20. */
export const NUMBERS = { 20: [11, 20], 50: [21, 50], 100: [21, 99], 1000: [101, 999] };
/** The steps a child can try in "explore". */
export const OPS = { 20: [1, -1, 10, -10], 50: [1, -1, 10, -10], 100: [1, -1, 10, -10], 1000: [1, -1, 10, -10, 100, -100] };
/** How many digits the number pad takes. */
export const DIGITS = { 20: 2, 50: 2, 100: 2, 1000: 3 };
const ASKS = 5; // predictions ready in one "explore" task (two right ones finish it)

const rangeOf = (range) => (RANGES.includes(range) ? range : 100);
export const digits = (n) => ({ h: Math.floor(n / 100), z: Math.floor(n / 10) % 10, e: n % 10 });

function number(range, r) {
  const [lo, hi] = NUMBERS[rangeOf(range)];
  // A whole ten (30, 400) now and then: the zero is the hard part.
  if (range >= 50 && r.chance(0.12)) {
    const step = range === 1000 ? 100 : 10;
    return step * r.int(Math.ceil(lo / step), Math.floor(hi / step));
  }
  if (range === 1000 && r.chance(0.2)) {
    // A zero in the middle: 305, 704.
    return 100 * r.int(1, 9) + r.int(1, 9);
  }
  return r.int(lo, hi);
}

/** A starting number for "explore": with the step `op` it stays inside the range, and sometimes the
 *  step crosses a ten (39 + 1, 40 − 1) or a hundred (199 + 1, 300 − 10). */
function startFor(range, op, r) {
  const [lo, hi] = NUMBERS[range];
  const min = range === 20 ? 1 : lo;
  const valid = (x) => x >= min && x <= hi && x + op >= min && x + op <= hi;
  const crosses = (x) =>
    op === 1 ? x % 10 === 9 : op === -1 ? x % 10 === 0 : op === 10 ? x % 100 >= 90 : op === -10 ? x % 100 < 10 : false;
  const all = [];
  for (let x = min; x <= hi; x++) if (valid(x)) all.push(x);
  const crossing = all.filter(crosses);
  return crossing.length && r.chance(0.4) ? r.pick(crossing) : r.pick(all);
}

const makers = {
  sehen(range, r) {
    const n = number(range, r);
    return { n, scatter: range >= 100 && r.chance(0.4), key: `${n}` };
  },
  machen(range, r) {
    const n = number(range, r);
    return { n, key: `${n}` };
  },
  forschen(range, r) {
    const R = rangeOf(range);
    const ops = OPS[R];
    // Up to 20: the step of ten from a single digit (3 → 13) is what it is about.
    const pickOp = () => (R === 20 ? r.pick([10, 10, -10, 1, -1]) : r.pick(ops));
    const start = startFor(R, r.pick([1, 10]), r);
    const asks = [];
    for (let i = 0; i < ASKS; i++) {
      const op = pickOp();
      let from = startFor(R, op, r);
      if (R === 20 && Math.abs(op) === 10) from = op > 0 ? r.int(1, 9) : r.int(11, 19);
      asks.push({ from, op, answer: from + op });
    }
    return { range: R, start, ops, asks, key: asks.map((a) => `${a.from}${a.op > 0 ? "+" : ""}${a.op}`).join(",") };
  },
  anwenden(range, r) {
    const R = rangeOf(range);
    const n = number(R, r);
    const { h, z, e } = digits(n);
    const kinds = ["build", "build", "split", "split"];
    if (e !== z && e > 0) kinds.push("swap");
    if (R >= 50 && n % 100 >= 20 && n % 10 <= 6) kinds.push("over");
    const kind = r.pick(kinds);
    if (kind === "over") {
      // Take one ten apart into ones: 2 tens and 13 ones = 33.
      return { range: R, kind, h, z: z - 1, e: e + 10, answer: n, ask: "n", key: `over:${n}` };
    }
    if (kind === "split") {
      const ask = R === 1000 ? r.pick(["h", "z", "e"]) : r.pick(["z", "e"]);
      return { range: R, kind, h, z, e, answer: { h, z, e }[ask], ask, n, key: `split:${n}:${ask}` };
    }
    return { range: R, kind, h, z, e, answer: n, ask: "n", key: `${kind}:${n}` };
  },
  pruefen(range, r) {
    const R = rangeOf(range);
    const n = number(R, r);
    const [lo, hi] = NUMBERS[R];
    const right = r.chance(0.45);
    if (right) return { n, said: n, right, kind: null, key: `${n}=` };
    const { h, z, e } = digits(n);
    const options = [];
    const swapped = 100 * h + 10 * e + z;
    if (e !== z && e > 0 && swapped <= Math.max(hi, 99)) options.push([swapped, "swap"], [swapped, "swap"]);
    if (n + 10 <= Math.max(hi, 99)) options.push([n + 10, "ten"]);
    if (n - 10 >= 1) options.push([n - 10, "ten"]);
    options.push([n + 1, "one"], [n - 1, "one"]);
    if (R === 1000 && z === 0 && e > 0) options.push([10 * h + e, "zero"], [10 * h + e, "zero"]);
    const most = 10 ** DIGITS[R] - 1; // what the pad can show
    const [said, kind] = r.pick(options.filter(([x]) => x >= 1 && x <= most && x !== n));
    return { n, said, right, kind, key: `${n}:${said}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`stellen: unknown perspective ${level.p}`);
  return make(rangeOf(level.range), r);
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const R = rangeOf(level.range);
  const [lo, hi] = NUMBERS[R];
  const inRange = (x) => Number.isInteger(x) && x >= lo && x <= hi;
  const fits = (x) => Number.isInteger(x) && x >= 0 && String(x).length <= DIGITS[R];
  const problems = [];
  if (level.p === "sehen" || level.p === "machen") {
    if (!inRange(t.n)) problems.push(`n ${t.n} outside ${lo}–${hi}`);
  } else if (level.p === "forschen") {
    for (const a of t.asks) {
      if (!t.ops.includes(a.op)) problems.push(`step ${a.op} not offered`);
      if (a.answer !== a.from + a.op) problems.push("answer is not from + step");
      if (a.from < 1 || a.answer < 1 || a.from > hi || a.answer > hi) problems.push(`${a.from} ${a.op} leaves the range`);
      if (!fits(a.answer)) problems.push(`answer ${a.answer} does not fit the pad`);
    }
    if (t.start < 1 || t.start > hi) problems.push(`start ${t.start}`);
  } else if (level.p === "anwenden") {
    const value = 100 * t.h + 10 * t.z + t.e;
    if (t.kind === "split") {
      if (!inRange(t.n) || t.answer !== digits(t.n)[t.ask]) problems.push("split answer wrong");
    } else {
      if (value !== t.answer || !inRange(t.answer)) problems.push(`${t.kind}: ${t.h}|${t.z}|${t.e} is not ${t.answer}`);
      if (t.kind === "over" ? t.e < 10 || t.z < 0 : t.e > 9) problems.push(`${t.kind}: ones ${t.e}`);
    }
    if (!fits(t.answer)) problems.push(`answer ${t.answer} does not fit the pad`);
  } else if (level.p === "pruefen") {
    if (!inRange(t.n)) problems.push(`n ${t.n} outside ${lo}–${hi}`);
    if ((t.said === t.n) !== t.right) problems.push("right does not match");
    if (t.said < 1 || !fits(t.said)) problems.push(`the owl says ${t.said}`);
  }
  return problems;
}
