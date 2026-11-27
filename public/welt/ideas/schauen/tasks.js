// The tasks of the idea "Schauen": look closely. Find the differences, copy a pattern, remember it,
// find the twin (preschool). The sky on the map ("Himmel").
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = level 1, 2 or 3:
//     1  2 × 2 places, one difference, very different pictures
//     2  3 × 3 places, one difference
//     3  3 × 3 places, two differences, pictures that look alike (🍎 and 🍏)
//
//   sehen     { size, left, right, diffs }     two pictures (lists of icons): tap the differences on the right
//   machen    { size, model }                  colour the same places as in the model (model: list of places)
//   forschen  { size, model, show }            the same from memory: the model is seen for `show` ms
//   anwenden  { model, choices, answer, grid }  which one is just like the model? (grid: 2 × 2, else a row)
//   pruefen   { size, left, right, diffs, same }  the owl says: "They are the same." Is it right?
//   key – short text that tells tasks apart.
//
// This is the idea of the old game "Genau hinschauen", in the frame of the new world. Copying mirrored
// is in the town's workshop (ideas/formen/).

export const ICONS = ["🍎", "🐟", "⭐", "🌸", "🚗", "🎈", "🐞", "🍌", "🌙", "🐸", "☂️", "🍄"];
/** Look-alikes for level 3. */
const ALIKE = { "🍎": "🍏", "🐟": "🐠", "⭐": "🌟", "🌸": "🌼", "🚗": "🚙", "🎈": "🍒", "🐞": "🐝", "🍌": "🌽", "🌙": "🌛", "🐸": "🐢", "☂️": "🌂", "🍄": "🌰" };
const SIZE = { 1: 2, 2: 3, 3: 3 };
const DIFFS = { 1: 1, 2: 1, 3: 2 };
const levelOf = (range) => (SIZE[range] ? range : 1);

/** A changed icon: something else, or (level 3) a look-alike. */
const change = (icon, L, r) => (L === 3 ? ALIKE[icon] : r.pick(ICONS.filter((x) => x !== icon)));

/** Two pictures with `d` differences: { left, right, diffs } */
function pair(n, d, L, r) {
  const left = Array.from({ length: n }, () => r.pick(ICONS));
  const diffs = r.sample(Array.from({ length: n }, (_, i) => i), d).sort((a, b) => a - b);
  const right = left.map((x, i) => (diffs.includes(i) ? change(x, L, r) : x));
  return { left, right, diffs };
}

const makers = {
  sehen(L, r) {
    const size = SIZE[L];
    const p = pair(size * size, DIFFS[L], L, r);
    return { size, ...p, key: p.right.join("") };
  },
  machen(L, r) {
    const size = SIZE[L];
    const count = { 1: 2, 2: 3, 3: 4 }[L];
    const model = r.sample(Array.from({ length: size * size }, (_, i) => i), count).sort((a, b) => a - b);
    return { size, model, key: model.join(".") };
  },
  forschen(L, r) {
    const size = SIZE[L];
    const count = { 1: 1, 2: 2, 3: 3 }[L];
    const model = r.sample(Array.from({ length: size * size }, (_, i) => i), count).sort((a, b) => a - b);
    return { size, model, show: { 1: 3000, 2: 3500, 3: 4000 }[L], key: model.join(".") };
  },
  anwenden(L, r) {
    const grid = L === 3;
    const n = L === 1 ? 2 : grid ? 4 : 3;
    const model = r.sample(ICONS, n);
    const variants = [];
    // A twin with two places swapped, and one with a picture changed.
    const swapped = model.slice();
    const [i, j] = r.sample(Array.from({ length: n }, (_, k) => k), 2);
    [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
    variants.push(swapped);
    const changed = model.slice();
    const k = r.int(0, n - 1);
    changed[k] = L === 3 ? ALIKE[changed[k]] : r.pick(ICONS.filter((x) => !model.includes(x)));
    variants.push(changed);
    const choices = r.shuffle([model, ...variants]);
    return { model, choices, answer: choices.indexOf(model), grid, key: model.join("") };
  },
  pruefen(L, r) {
    const size = SIZE[L];
    const same = r.chance(0.4);
    const p = pair(size * size, same ? 0 : 1, L, r);
    return { size, ...p, same, key: p.right.join("") };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`schauen: unknown perspective ${level.p}`);
  const L = levelOf(level.range);
  return { p: level.p, level: L, ...make(L, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const differ = (a, b) => a.map((x, i) => (x !== b[i] ? i : -1)).filter((i) => i >= 0);
  if (level.p === "sehen" || level.p === "pruefen") {
    if (JSON.stringify(differ(t.left, t.right)) !== JSON.stringify(t.diffs)) problems.push("diffs");
    if (level.p === "pruefen" && (t.diffs.length === 0) !== t.same) problems.push("same");
    if (level.p === "sehen" && t.diffs.length !== DIFFS[levelOf(level.range)]) problems.push("count");
  }
  if ((level.p === "machen" || level.p === "forschen") && (new Set(t.model).size !== t.model.length || t.model.some((i) => i >= t.size * t.size))) problems.push("model");
  if (level.p === "anwenden") {
    const same = t.choices.filter((c) => c.join() === t.model.join());
    if (same.length !== 1 || t.choices[t.answer] !== t.model) problems.push("not one twin");
    if (t.choices.some((c) => c.some((x) => !x))) problems.push("an empty picture");
  }
  return problems;
}
