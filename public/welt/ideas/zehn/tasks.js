// The tasks of the idea "Zehn": two numbers that fill a ten together are friends (Zehnerfreunde).
// Burrow and pond on the map, next to "Teile". One function per perspective makes one task as plain
// data (see shared/gen.js): no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 5, 10 or 20:
//     5  – friends of five (a hand: 3 and 2), the first step
//     10 – friends of ten (the ten-frame: 7 and 3)
//     20 – filling up to twenty: one full ten and some more (13 and 7), the same friends one ten higher
//
//   sehen     { whole, n, answer }                 lily pads in rows of five, n frogs sit on them:
//                                                  how many pads are free?
//   machen    { whole, n, answer }                 the nut box has `whole` holes, n are full: take as many
//                                                  nuts as still fit, then pour them in
//   forschen  { whole, rows, gap, answer }         range 5 and 10: a staircase of friends (6 + 4, 7 + 3 …),
//                                                  one partner is missing. rows: [[a, b], …], gap: index
//             { whole: 20, a, b, n, answer }       range 20: a + b = 10 is shown, then n + ? = 20 (n = 10 + a)
//   anwenden  { whole, n, gap, answer }            just the numbers: n + ? = whole (gap "b") or ? + n = whole (gap "a")
//   pruefen   { whole, a, b, right }               the owl says "a and b are friends of `whole`": is that right?
//   key – short text that tells tasks apart, for "not the same task again".

export const WHOLES = [5, 10, 20];
/** The numbers a task may start from: never 0 or the whole, so both friends are there.
 *  Up to twenty: 11 to 19, so the answer is again a friend of ten (1 to 9). */
export const FROM = { 5: [1, 4], 10: [1, 9], 20: [11, 19] };
/** The answer buttons go from 1 to this number. */
export const MOST = { 5: 4, 10: 9, 20: 9 };
const ROWS = 4; // the staircase in "explore"

const whole = (range) => (WHOLES.includes(range) ? range : 10);
const from = (range, r) => r.int(...FROM[whole(range)]);

const makers = {
  sehen(range, r) {
    const w = whole(range);
    const n = from(w, r);
    return { whole: w, n, answer: w - n, key: `${n}` };
  },
  machen(range, r) {
    const w = whole(range);
    const n = from(w, r);
    return { whole: w, n, answer: w - n, key: `${n}` };
  },
  forschen(range, r) {
    const w = whole(range);
    if (w === 20) {
      const a = r.int(1, 9);
      return { whole: 20, a, b: 10 - a, n: 10 + a, answer: 10 - a, key: `${a}` };
    }
    // ROWS rows in a row: a goes up by one each time (sometimes down), b goes the other way.
    const start = r.int(0, w - ROWS + 1);
    let rows = Array.from({ length: ROWS }, (_, i) => [start + i, w - start - i]);
    if (r.chance(0.4)) rows = rows.reverse();
    // Never the first row (the rule needs a row before it), and never a partner of 0 or of the whole
    // itself: those have no button.
    const gaps = [1, 2, 3].filter((i) => rows[i][1] >= 1 && rows[i][1] <= MOST[w]);
    const at = r.pick(gaps);
    return { whole: w, rows, gap: at, answer: rows[at][1], key: `${rows[0][0]}:${at}:${rows[1][0]}` };
  },
  anwenden(range, r) {
    const w = whole(range);
    const n = from(w, r);
    const gap = r.chance(0.7) ? "b" : "a";
    return { whole: w, n, gap, answer: w - n, key: `${n}:${gap}` };
  },
  pruefen(range, r) {
    const w = whole(range);
    const a = from(w, r);
    const right = r.chance(0.5);
    let b = w - a;
    if (!right) {
      // One off: the mistake children make most. Never 0, never past the buttons.
      const off = r.shuffle([-1, 1]).map((d) => b + d).filter((x) => x >= 1 && x <= MOST[w]);
      b = off[0] ?? b + 1;
    }
    return { whole: w, a, b, right, key: `${a}:${b}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`zehn: unknown perspective ${level.p}`);
  return make(level.range, r);
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const w = whole(level.range);
  if (t.whole !== w) problems.push(`whole ${t.whole}, range ${level.range}`);
  const inButtons = (x) => Number.isInteger(x) && x >= 1 && x <= MOST[w];
  if (level.p === "forschen") {
    if (w === 20) {
      if (t.a + t.b !== 10 || t.n !== 10 + t.a || t.n + t.answer !== 20) problems.push("the friends to twenty do not fit");
    } else {
      if (t.rows.some(([a, b]) => a + b !== w || a < 0 || b < 0)) problems.push("a row is not a pair of friends");
      if (t.gap < 1 || t.gap >= t.rows.length) problems.push(`gap ${t.gap}`);
      if (t.rows[t.gap]?.[1] !== t.answer) problems.push("the answer is not the missing partner");
    }
    if (!inButtons(t.answer)) problems.push(`answer ${t.answer} has no button`);
    return problems;
  }
  if (level.p === "pruefen") {
    if (!inButtons(t.b) || t.a < 1 || t.a >= w) problems.push("the owl's numbers are out of range");
    if ((t.a + t.b === w) !== t.right) problems.push("right does not match the numbers");
    return problems;
  }
  const [lo, hi] = FROM[w];
  if (t.n < lo || t.n > hi) problems.push(`n ${t.n} outside ${lo}–${hi}`);
  if (t.n + t.answer !== w) problems.push("n and the answer are not friends");
  if (!inButtons(t.answer)) problems.push(`answer ${t.answer} has no button`);
  return problems;
}
