// The tasks of the idea "Zahl": a number says how many (counting, seeing a number at a glance,
// the order of the numbers, more and fewer). The meadow and the stream on the map.
// One function per perspective makes one task as plain data (see shared/gen.js): no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 5, 10 or 20 (the biggest number).
//
//   sehen     { n, flower }                  flowers on the meadow, seen at a glance: how many?
//   machen    { n, field, flower }           pick n of `field` flowers into the basket
//   forschen  { kind: "row", from, step, len, gap, answer }  stepping stones from, from+step, …; the stone
//                                            at `gap` is missing. step is ±1; up to 20 sometimes ±2.
//                                            A negative step: the frog hops back (counting backwards)
//             { kind: "order", from, step, len, mixed }  the stones lie mixed up: tap them in order
//   anwenden  { kind: "compare", a, b, ask, left, right }  two groups: where are more ("more") or fewer
//                                            ("fewer")? a = b: "the same" is the answer
//             { kind: "dazu", n, d, answer, animal }  n are there, d come (d > 0) or go: how many now?
//             { kind: "gleich", a, b, how, left, right, answer }  make both the same: send home from
//                                            the fuller side (how "weg") or bring to the other ("dazu")
//   pruefen   { n, said, right, thing }      the owl says "these are `said`": is that right?
//   key – short text that tells tasks apart, for "not the same task again".
//
// These are the ideas of the old games "Blitzblick" (sehen), "Wie viele?" (machen, pruefen),
// "Zahlenzug" (forschen), "Wo sind mehr?", "Wer kommt dazu?" and "Gleich machen" (anwenden), in the
// frame of the new world.

export const NUMBERS = { 5: [1, 5], 10: [4, 10], 20: [11, 20] }; // the numbers of each range
export const FLOWERS = ["🌼", "🌷", "🌻", "🌸"];
export const TO_COUNT = ["apple", "strawberry", "carrot", "banana", "star", "flower"];
export const TO_COMPARE = ["🦋", "🐝", "🐞", "🐌"];
const STONES = 5; // stepping stones in a row
const ORDER = 4; // stones to lay in order

const number = (range, r) => {
  const [lo, hi] = NUMBERS[range] || NUMBERS[5];
  return r.int(lo, hi);
};

const makers = {
  sehen(range, r) {
    const n = number(range, r);
    return { n, flower: r.pick(FLOWERS), key: `${n}` };
  },
  machen(range, r) {
    const n = number(range, r);
    return { n, field: Math.max(5, range), flower: r.pick(FLOWERS), key: `${n}` };
  },
  forschen(range, r) {
    const top = Math.max(5, range);
    const lowest = range > 10 ? 6 : 1;
    const size = range > 10 && r.chance(0.5) ? 2 : 1; // bigger numbers: sometimes steps of two
    // Sometimes the stones are mixed up: lay them in order, the smallest first.
    if (r.chance(range > 5 ? 0.3 : 0.2)) {
      const len = ORDER;
      const from = r.int(lowest, top - (len - 1) * size);
      const stones = Array.from({ length: len }, (_, i) => from + i * size);
      let mixed = r.shuffle(stones);
      if (mixed.every((n, i) => n === stones[i])) mixed = [...mixed.slice(1), mixed[0]];
      return { kind: "order", from, step: size, len, mixed, key: `o${from}:${size}` };
    }
    // Sometimes the frog hops back: the numbers get smaller (counting backwards).
    const back = r.chance(range > 5 ? 0.35 : 0.25);
    const step = back ? -size : size;
    const from = back ? r.int(lowest + (STONES - 1) * size, top) : r.int(lowest, top - (STONES - 1) * size);
    const gap = r.int(1, STONES - 1); // never the first stone: "after three comes …" needs a stone before
    return { kind: "row", from, step, len: STONES, gap, answer: from + gap * step, key: `${from}:${step}:${gap}` };
  },
  anwenden(range, r) {
    const [lo, hi] = NUMBERS[range] || NUMBERS[5];
    const kind = r.pick(["compare", "compare", "dazu", "gleich"]);
    const [left, right] = r.shuffle(TO_COMPARE);
    if (kind === "dazu") {
      // One more, one less: some are there, one comes or goes (up to 20 sometimes two).
      const d = (r.chance(0.5) ? 1 : -1) * (range > 10 && r.chance(0.4) ? 2 : 1);
      const n = r.int(Math.max(range > 5 ? lo - 2 : 1, 1, 1 - d), Math.min(hi, hi - d));
      return { kind, n, d, answer: n + d, animal: left, key: `d${n}:${d}` };
    }
    if (kind === "gleich") {
      // Make both sides the same: send some home from the fuller side, or (from 10) bring some over.
      const most = range <= 5 ? 3 : 5;
      let a, b;
      do {
        a = r.int(lo, hi);
        b = r.int(lo, hi);
      } while (a === b || Math.abs(a - b) > most || Math.min(a, b) < 1);
      const how = range > 5 && r.chance(0.4) ? "dazu" : "weg";
      return { kind, a, b, how, left, right, answer: Math.abs(a - b), key: `g${a}:${b}:${how}` };
    }
    const a = r.int(lo, hi);
    // Sometimes both are the same: "gleich viele" is the answer then.
    if (r.chance(0.2)) return { kind, a, b: a, ask: r.chance(0.5) ? "more" : "fewer", left, right, key: `${a}:${a}` };
    // Small numbers differ by any amount; bigger ones are close together, so counting is needed.
    const others = [];
    for (let b = lo; b <= hi; b++) if (b !== a && (range <= 5 || Math.abs(a - b) <= 3)) others.push(b);
    const b = r.pick(others);
    const ask = range > 5 && r.chance(0.4) ? "fewer" : "more";
    return { kind, a, b, ask, left, right, key: `${a}:${b}:${ask}` };
  },
  pruefen(range, r) {
    const n = number(range, r);
    const right = r.chance(0.5);
    const said = right ? n : n === 1 ? 2 : n + r.pick([-1, 1]);
    return { n, said, right, thing: r.pick(TO_COUNT), key: `${n}=${said}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  return { p: level.p, range: level.range, ...make(level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const [lo, hi] = NUMBERS[level.range];
  const inRange = (n) => n >= lo && n <= hi;
  if ((t.p === "sehen" || t.p === "machen" || t.p === "pruefen") && !inRange(t.n)) problems.push(`number ${t.n} outside ${lo}–${hi}`);
  if (t.p === "machen" && t.field < t.n) problems.push("not enough flowers on the field");
  if (t.p === "forschen") {
    const top = Math.max(5, level.range);
    const last = t.from + (t.len - 1) * t.step;
    if (Math.min(t.from, last) < 1 || Math.max(t.from, last) > top) problems.push("stones outside the range");
    if (![1, 2].includes(Math.abs(t.step)) || (Math.abs(t.step) === 2 && level.range <= 10)) problems.push("bad step");
    if (t.kind === "order") {
      if (t.step < 0 || [...t.mixed].sort((x, y) => x - y).join() !== Array.from({ length: t.len }, (_, i) => t.from + i * t.step).join()) problems.push("mixed stones do not fit");
      if (t.mixed.every((n, i) => n === t.from + i * t.step)) problems.push("not mixed");
    } else if (t.gap < 1 || t.gap >= t.len || t.answer !== t.from + t.gap * t.step) problems.push("bad gap");
  }
  if (t.p === "anwenden") {
    if (t.kind === "dazu") {
      if (t.n < 1 || t.answer < 1 || t.answer > hi || t.answer !== t.n + t.d || t.d === 0) problems.push("bad one more / one less");
    } else {
      if (!inRange(t.a) || !inRange(t.b)) problems.push("bad groups");
      if (t.kind === "gleich" && (t.a === t.b || t.answer !== Math.abs(t.a - t.b) || t.answer > 5)) problems.push("bad make-equal task");
      if (t.left === t.right) problems.push("both groups look the same");
    }
  }
  if (t.p === "pruefen") {
    if (t.said < 1) problems.push("claim below 1");
    if (t.right !== (t.said === t.n)) problems.push("right does not match the claim");
  }
  return problems;
}
