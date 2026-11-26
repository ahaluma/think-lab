// The tasks of the idea "Zahl": a number says how many (counting, seeing a number at a glance,
// the order of the numbers, more and fewer). The meadow and the stream on the map.
// One function per perspective makes one task as plain data (see shared/gen.js): no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 5 or 10 (the biggest number).
//
//   sehen     { n, flower }                  flowers on the meadow, seen at a glance: how many?
//   machen    { n, field, flower }           pick n of `field` flowers into the basket
//   forschen  { from, len, gap, answer }     stepping stones from, from+1, …; the stone at `gap` is missing
//   anwenden  { a, b, ask, left, right }     two groups: where are more ("more") or fewer ("fewer")?
//   pruefen   { n, said, right, thing }      the owl says "these are `said`": is that right?
//   key – short text that tells tasks apart, for "not the same task again".
//
// These are the ideas of the old games "Blitzblick" (sehen), "Wie viele?" (machen, pruefen),
// "Zahlenzug" (forschen) and "Wo sind mehr?" (anwenden), in the frame of the new world.

export const NUMBERS = { 5: [1, 5], 10: [4, 10] }; // the numbers of each range
export const FLOWERS = ["🌼", "🌷", "🌻", "🌸"];
export const TO_COUNT = ["apple", "strawberry", "carrot", "banana", "star", "flower"];
export const TO_COMPARE = ["🦋", "🐝", "🐞", "🐌"];
const STONES = 5; // stepping stones in a row

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
    const from = r.int(1, Math.max(5, range) - STONES + 1);
    const gap = r.int(1, STONES - 1); // never the first stone: "after three comes …" needs a stone before
    return { from, len: STONES, gap, answer: from + gap, key: `${from}:${gap}` };
  },
  anwenden(range, r) {
    const [lo, hi] = NUMBERS[range] || NUMBERS[5];
    const a = r.int(lo, hi);
    // Small numbers differ by any amount; bigger ones are close together, so counting is needed.
    const others = [];
    for (let b = lo; b <= hi; b++) if (b !== a && (range <= 5 || Math.abs(a - b) <= 3)) others.push(b);
    const b = r.pick(others);
    const [left, right] = r.shuffle(TO_COMPARE);
    const ask = range > 5 && r.chance(0.4) ? "fewer" : "more";
    return { a, b, ask, left, right, key: `${a}:${b}:${ask}` };
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
    if (t.from < 1 || t.from + t.len - 1 > Math.max(5, level.range)) problems.push("stones outside the range");
    if (t.gap < 1 || t.gap >= t.len || t.answer !== t.from + t.gap) problems.push("bad gap");
  }
  if (t.p === "anwenden") {
    if (!inRange(t.a) || !inRange(t.b) || t.a === t.b) problems.push("bad groups");
    if (t.left === t.right) problems.push("both groups look the same");
  }
  if (t.p === "pruefen") {
    if (t.said < 1) problems.push("claim below 1");
    if (t.right !== (t.said === t.n)) problems.push("right does not match the claim");
  }
  return problems;
}
