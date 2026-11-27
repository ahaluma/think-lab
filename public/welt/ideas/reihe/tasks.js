// The tasks of the idea "Reihe": every number has its place in the row (the number line, order,
// comparing, ordinal numbers). The station in the town: the track is the number line, the train stops
// at a number. One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 20, 100 or 1000 (the end of the track).
//
//   sehen     { range, n }                       the train stops on the track: at which number?
//   machen    { range, n }                       the train must stop at n: tap the place on the track
//   forschen  { range, from, step, len, gap, answer }  wagons with numbers in a row (+step each, or
//                                                −step: the row goes down); one number is missing
//   anwenden  { range, kind, … }                 kind "compare" { a, b, answer: "<" | "=" | ">" }
//                                                kind "next"    { n, side: "before" | "after", answer }
//                                                kind "ordinal" { len, pos, animal, answer: pos }: tap the
//                                                                 pos-th wagon (from the engine)
//   pruefen   { range, a, b, said, right }       the owl says "a said b" (said: "<", ">", "="): is that
//                                                right? Her mistake: she looks at the last digit first
//   key – short text that tells tasks apart, for "not the same task again".
//
// These are the ideas of the old game "Zahlenzug" (order, before and after) and "Wer ist Erster?"
// (ordinal numbers), with numbers up to 1000 in the frame of the new world.

export const RANGES = [20, 100, 1000];
/** The ticks on the track: every `tick` a short line, every `long` a long line with its number. */
export const TRACK = { 20: { tick: 1, long: 5 }, 100: { tick: 5, long: 10 }, 1000: { tick: 50, long: 100 } };
/** The steps of the rows in "explore". */
export const STEPS = { 20: [1, 2], 100: [2, 5, 10], 1000: [10, 50, 100] };
/** How many digits the number pad takes (100 and 1000 themselves fit). */
export const DIGITS = { 20: 2, 100: 3, 1000: 4 };
export const ANIMALS = ["🐻", "🐰", "🦊", "🐸", "🐷", "🐱", "🐶", "🐼"];
const WAGONS = 5;

const rangeOf = (range) => (RANGES.includes(range) ? range : 100);

/** A stop on the track: a tick that is not the start or the end. Up to 100 and 1000 sometimes a short tick. */
function stop(R, r, onlyLong = false) {
  const { tick, long } = TRACK[R];
  const step = onlyLong ? long : tick;
  return step * r.int(1, R / step - 1);
}

/** A number of the range, for comparing and neighbours. */
function number(R, r) {
  return R === 20 ? r.int(1, 20) : R === 100 ? r.int(10, 99) : r.int(100, 999);
}

const makers = {
  sehen(R, r) {
    // First the long ticks (they carry a number nearby), then also the short ones.
    const n = stop(R, r, r.chance(0.5));
    return { range: R, n, key: `${n}` };
  },
  machen(R, r) {
    const n = stop(R, r, r.chance(0.4));
    return { range: R, n, key: `${n}` };
  },
  forschen(R, r) {
    const step = r.pick(STEPS[R]);
    const down = r.chance(0.35);
    const span = (WAGONS - 1) * step;
    // Bigger steps start on their own multiples (5, 10, 15 …), the smallest step anywhere.
    const unit = step === STEPS[R][0] ? 1 : step;
    const lowest = R === 20 ? 0 : step;
    let from;
    do {
      from = unit * r.int(Math.ceil(lowest / unit), Math.floor((R - span) / unit));
    } while (from + span > R);
    if (down) from += span;
    const s = down ? -step : step;
    const gap = r.int(1, WAGONS - 1);
    return { range: R, from, step: s, len: WAGONS, gap, answer: from + gap * s, key: `${from}:${s}:${gap}` };
  },
  anwenden(R, r) {
    const kinds = R === 20 ? ["compare", "next", "ordinal", "ordinal"] : ["compare", "compare", "next"];
    const kind = r.pick(kinds);
    if (kind === "ordinal") {
      const len = r.int(5, 8);
      const pos = r.int(1, len);
      return { range: R, kind, len, pos, animal: r.pick(ANIMALS), answer: pos, key: `o${len}:${pos}` };
    }
    if (kind === "next") {
      const side = r.chance(0.5) ? "before" : "after";
      let n = number(R, r);
      // Across a ten or a hundred now and then: 39 → 40, 300 → 299.
      if (R > 20 && r.chance(0.4)) n = side === "after" ? (R === 100 ? 10 * r.int(1, 9) - 1 : 100 * r.int(2, 9) - 1) : R === 100 ? 10 * r.int(2, 9) : 100 * r.int(2, 9);
      if (side === "before" && n < 2) n = 2;
      if (side === "after" && n >= R) n = R - 1;
      return { range: R, kind, n, side, answer: side === "before" ? n - 1 : n + 1, key: `n${n}${side}` };
    }
    // Compare: the same tens digit (47 and 43) or swapped digits (36 and 63) make it worth looking.
    const a = number(R, r);
    let b;
    const roll = r.int(1, 10);
    if (roll <= 2) b = a;
    else if (roll <= 5 && R > 20 && a % 10 !== Math.floor(a / 10) % 10 && a % 10 > 0) b = R === 100 ? 10 * (a % 10) + Math.floor(a / 10) : 100 * Math.floor(a / 100) + 10 * (a % 10) + (Math.floor(a / 10) % 10);
    else do b = R === 20 ? r.int(1, 20) : a + r.pick([-1, 1]) * r.int(1, R === 100 ? 9 : 90); while (b === a || b < (R === 20 ? 1 : R / 10) || b >= R);
    const answer = a < b ? "<" : a > b ? ">" : "=";
    return { range: R, kind: "compare", a, b, answer, key: `c${a}:${b}` };
  },
  pruefen(R, r) {
    // The owl's mistake: she compares the last digits (38 > 52, because 8 > 2). Most pairs are ones
    // where that goes wrong, so her mistake can show.
    const last = (x) => x % 10;
    const tricky = r.chance(0.7);
    let a, b;
    do {
      a = number(R, r);
      b = number(R, r);
    } while (a === b || (tricky && (last(a) === last(b) || (last(a) < last(b)) === (a < b))));
    const truth = a < b ? "<" : ">";
    const owl = last(a) === last(b) ? truth : last(a) < last(b) ? "<" : ">";
    const right = r.chance(0.4);
    const said = right ? truth : owl !== truth ? owl : truth === "<" ? ">" : "<";
    return { range: R, a, b, said, right, answer: truth, key: `${a}${said}${b}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`reihe: unknown perspective ${level.p}`);
  return { p: level.p, ...make(rangeOf(level.range), r) };
}

const cmp = (a, b) => (a < b ? "<" : a > b ? ">" : "=");

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const R = rangeOf(level.range);
  const problems = [];
  const fits = (x) => Number.isInteger(x) && x >= 0 && String(x).length <= DIGITS[R];
  if (t.range !== R) problems.push("range");
  if (level.p === "sehen" || level.p === "machen") {
    if (t.n <= 0 || t.n >= R || t.n % TRACK[R].tick) problems.push(`stop ${t.n} not on a tick`);
  } else if (level.p === "forschen") {
    const last = t.from + (t.len - 1) * t.step;
    if (Math.min(t.from, last) < 0 || Math.max(t.from, last) > R) problems.push("row leaves the track");
    if (!STEPS[R].includes(Math.abs(t.step))) problems.push(`step ${t.step}`);
    if (t.gap < 1 || t.gap >= t.len || t.answer !== t.from + t.gap * t.step) problems.push("gap");
    if (!fits(t.answer)) problems.push("answer does not fit the pad");
  } else if (level.p === "anwenden") {
    if (t.kind === "compare") {
      if (t.answer !== cmp(t.a, t.b)) problems.push("compare answer");
      if (Math.max(t.a, t.b) > R || Math.min(t.a, t.b) < 1) problems.push(`compare ${t.a} ${t.b}`);
    } else if (t.kind === "next") {
      if (t.answer !== t.n + (t.side === "after" ? 1 : -1) || t.answer < 1 || t.answer > R || !fits(t.answer)) problems.push(`next ${t.n} ${t.side}`);
    } else if (t.kind === "ordinal") {
      if (R !== 20 || t.pos < 1 || t.pos > t.len) problems.push("ordinal");
    } else problems.push(`kind ${t.kind}`);
  } else if (level.p === "pruefen") {
    if (t.a === t.b || t.answer !== cmp(t.a, t.b)) problems.push("pruefen answer");
    if ((t.said === t.answer) !== t.right) problems.push("right does not match");
  }
  return problems;
}
