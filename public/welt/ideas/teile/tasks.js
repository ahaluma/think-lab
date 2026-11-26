// The tasks of the idea "Teile": numbers are made of numbers (a whole and its two parts).
// One function per perspective makes one task as plain data (see shared/gen.js): no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 5, 10 or 20 (the biggest whole).
//
//   sehen     { total, inside, outside, animal }   animals live in the burrow; `outside` are seen,
//                                                   `inside` are hiding: how many?
//   machen    { total, thing }                      put `total` things on two leaves, in two different ways
//   forschen  { total }                             the hollow tree: x nuts in, total − x nuts out
//   anwenden  { scene, total, known, answer }       a little scene: the whole and one part are known
//   pruefen   { a, b, said, right, thing }          the owl says "a and b are `said`": is that right?
//   key – short text that tells tasks apart, for "not the same task again".

export const WHOLES = { 5: [3, 5], 10: [6, 10], 20: [11, 20] }; // the wholes of each range
const TO_LAY_OUT = 15; // "make": the child moves every thing by hand, so not more than this
export const BURROW = ["rabbit", "fox", "ant", "ladybird", "snail", "turtle"]; // animals that hide in a burrow
export const TO_SHARE = ["apple", "strawberry", "flower", "carrot", "banana", "star"]; // things to lay out
export const SCENES = ["frogs", "eggs", "apples"];

const whole = (range, r, min = 0) => {
  const [lo, hi] = WHOLES[range] || WHOLES[5];
  return r.int(Math.max(lo, min), hi);
};

const makers = {
  sehen(range, r) {
    const total = whole(range, r);
    const inside = r.int(1, total - 1);
    return { total, inside, outside: total - inside, animal: r.pick(BURROW), key: `${total}:${inside}` };
  },
  machen(range, r) {
    const total = Math.min(whole(range, r), TO_LAY_OUT);
    return { total, thing: r.pick(TO_SHARE), key: `${total}` };
  },
  forschen(range, r) {
    const total = whole(range, r, 4); // at least 4, so there are three numbers to try
    return { total, key: `${total}` };
  },
  anwenden(range, r) {
    const total = whole(range, r);
    const known = r.int(1, total - 1);
    return { scene: r.pick(SCENES), total, known, answer: total - known, key: `${total}:${known}` };
  },
  pruefen(range, r) {
    const total = whole(range, r);
    const a = r.int(1, total - 1);
    const b = total - a;
    const right = r.chance(0.5);
    // A wrong claim is one or two off, never below the bigger part (that would be too easy to see).
    let said = total;
    if (!right) {
      const off = r.shuffle([-1, 1, 2, -2]).map((d) => total + d).filter((n) => n > Math.max(a, b) && n !== total);
      said = off[0] ?? total + 1;
    }
    return { a, b, said, right, thing: r.pick(TO_SHARE), key: `${a}+${b}=${said}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  return { p: level.p, range: level.range, ...make(level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const [lo, hi] = WHOLES[level.range];
  const total = t.p === "pruefen" ? t.a + t.b : t.total;
  if (total < lo || total > hi) problems.push(`whole ${total} outside ${lo}–${hi}`);
  if (t.p === "sehen" && (t.inside < 1 || t.outside < 1 || t.inside + t.outside !== t.total)) problems.push("parts do not make the whole");
  if (t.p === "forschen" && t.total < 4) problems.push("tree needs a whole of at least 4");
  if (t.p === "anwenden" && (t.known < 1 || t.answer < 1 || t.known + t.answer !== t.total || !SCENES.includes(t.scene))) problems.push("bad scene task");
  if (t.p === "pruefen") {
    if (t.a < 1 || t.b < 1) problems.push("empty part");
    if (t.right !== (t.said === t.a + t.b)) problems.push("right does not match the claim");
    if (t.said < 1) problems.push("claim below 1");
  }
  return problems;
}
