// The tasks of the idea "Größe": longer, higher, more water, heavier; putting things in order of size
// (preschool). Hill and lake on the map. Measuring with a ruler is in the town's workshop (ideas/formen/).
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = level 1, 2 or 3:
//     1  two things, far apart in size, standing on one line; "longer", "higher"
//     2  three things, also "shorter", "lower" and water in glasses
//     3  three or four things, closer in size; snakes no longer start at one line
//
//   A row of things: sizes (in % of the longest possible, 25 … 100), offsets (where each starts, in %).
//
//   sehen     { kind, ask, sizes, offsets, answer }   kind "lang" | "hoch" | "wasser", ask "more" | "less":
//                                                     which one is longer / the longest …? answer = index
//   machen    { kind, sizes, order }                  tap them from the smallest to the biggest
//                                                     (order = indexes, smallest first)
//   forschen  { pair: [heavy, light], tricky, heavy }  the balance: which one is heavier? Think first.
//                                                     heavy = the index (0 or 1) of the heavy one on screen
//   anwenden  { item, bear, sizes, answer }           the small bear needs a bed: which one fits?
//                                                     bear = 0 small, 1 middle, 2 big; sizes of the items
//   pruefen   { kind, sizes, offsets, said, answer, right }  the owl points at one snake: "this is the
//                                                     longest". At level 3 she looks only at the right end.
//   key – short text that tells tasks apart.
//
// This is the idea of the old game "Größen vergleichen", in the frame of the new world.

const levelOf = (range) => ([1, 2, 3].includes(range) ? range : 1);

/** Things on the balance: [heavy, light]. tricky: the heavy one is small, the light one big. */
export const PAIRS = [
  ["🐘", "🐭"], ["🍉", "🍒"], ["🪨", "🪶"], ["🎃", "🍓"], ["🐻", "🐦"], ["🧱", "🍃"],
];
export const TRICKY = [["🪨", "🎈"], ["🔨", "🧸"], ["🥥", "🪁"], ["🧲", "🪶"]];
export const ITEMS = ["bett", "stuhl", "schuessel", "pulli", "schuh"];

/** n sizes, all different by at least `gap`, from lo to 100. */
function sizes(n, r, gap, lo = 28) {
  for (;;) {
    const s = Array.from({ length: n }, () => r.int(lo, 100));
    const sorted = [...s].sort((a, b) => a - b);
    if (sorted.every((x, i) => i === 0 || x - sorted[i - 1] >= gap)) return s;
  }
}
const GAP = { 1: 30, 2: 18, 3: 10 };
const argmax = (a) => a.indexOf(Math.max(...a));
const argmin = (a) => a.indexOf(Math.min(...a));

const makers = {
  sehen(L, r) {
    const kind = L === 1 ? r.pick(["lang", "hoch"]) : r.pick(["lang", "hoch", "wasser"]);
    const ask = L === 1 ? "more" : r.pick(["more", "less"]);
    const n = L === 1 ? 2 : L === 2 ? 3 : r.int(3, 4);
    const s = sizes(n, r, GAP[L], kind === "lang" && L === 3 ? 40 : 28);
    // Level 3: the snakes start at different places, but every one still fits in the box.
    const offsets = s.map((x) => (L === 3 && kind === "lang" ? r.int(0, Math.max(0, 100 - x)) : 0));
    const answer = ask === "more" ? argmax(s) : argmin(s);
    return { kind, ask, sizes: s, offsets, answer, key: `${kind}${ask}${s.join(",")}` };
  },
  machen(L, r) {
    const kind = r.pick(["lang", "hoch"]);
    const n = L + 2;
    const s = sizes(n, r, { 1: 22, 2: 16, 3: 12 }[L], 20);
    const order = s.map((_, i) => i).sort((a, b) => s[a] - s[b]);
    return { kind, sizes: s, order, key: `${kind}${s.join(",")}` };
  },
  forschen(L, r) {
    const tricky = L === 3 && r.chance(0.6);
    const pair = r.pick(tricky ? TRICKY : PAIRS);
    const heavy = r.int(0, 1);
    return { pair, tricky, heavy, key: pair.join("") };
  },
  anwenden(L, r) {
    const item = r.pick(ITEMS);
    const n = L === 1 ? 2 : 3;
    const bear = n === 2 ? r.pick([0, 2]) : r.int(0, 2);
    // Items in random order: sizes small / (middle) / big
    const levels = n === 2 ? [0, 2] : [0, 1, 2];
    const order = r.shuffle(levels);
    return { item, bear, sizes: order, answer: order.indexOf(bear), key: `${item}${bear}` };
  },
  pruefen(L, r) {
    const n = L === 1 ? 2 : 3;
    let s;
    let offsets;
    let said;
    const right = r.chance(0.4);
    for (;;) {
      s = sizes(n, r, GAP[L], 36);
      offsets = s.map((x) => (L === 3 ? r.int(0, 100 - x) : 0));
      const longest = argmax(s);
      if (right) {
        said = longest;
        break;
      }
      // Her mistake at level 3: the one that reaches furthest to the right.
      const ends = s.map((x, i) => x + offsets[i]);
      const far = argmax(ends);
      if (L === 3 && far !== longest) {
        said = far;
        break;
      }
      if (L < 3) {
        said = r.pick(s.map((_, i) => i).filter((i) => i !== longest));
        break;
      }
    }
    return { kind: "lang", sizes: s, offsets, said, answer: argmax(s), right, key: `${s.join(",")}:${said}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`groesse: unknown perspective ${level.p}`);
  const L = levelOf(level.range);
  return { p: level.p, level: L, ...make(L, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const inBox = (s, o) => s.every((x, i) => x + o[i] <= 100 && o[i] >= 0);
  if (level.p === "sehen") {
    const want = t.ask === "more" ? Math.max(...t.sizes) : Math.min(...t.sizes);
    if (t.sizes[t.answer] !== want || t.sizes.filter((x) => x === want).length !== 1) problems.push("answer");
    if (!inBox(t.sizes, t.offsets)) problems.push("out of the box");
  }
  if (level.p === "machen" && t.order.some((i, k) => k > 0 && t.sizes[i] <= t.sizes[t.order[k - 1]])) problems.push("order");
  if (level.p === "anwenden" && t.sizes[t.answer] !== t.bear) problems.push("answer");
  if (level.p === "pruefen") {
    if ((t.said === t.answer) !== t.right || t.sizes[t.answer] !== Math.max(...t.sizes)) problems.push("pruefen");
    if (!inBox(t.sizes, t.offsets)) problems.push("out of the box");
  }
  return problems;
}
