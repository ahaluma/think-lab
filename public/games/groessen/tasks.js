// The tasks of "Größen vergleichen": one function makes one task (see shared/gen.js).
//
//   task(level, r) → one task as plain data, no texts:
//     kind   – "lang", "hoch", "wasser", "waage", "trick", "kette" or "ordnen" (one of level.kinds)
//     dir    – "more" or "less" (ordnen: "up" or "down")
//     items  – lang / hoch / ordnen: { size, off, color }   (steps of 14; off: start line / hill)
//              wasser: { water, width, amount }             (water: height in steps of 12; amount = width × water)
//              waage / trick: { id, icon, kg, scale }       (id: the name in lang/<language>.js "weigh")
//              kette: { color, kg }                         (color: the name in "parcels"; kg 3, 2, 1)
//     answer – index of the right item (not for ordnen)
//     what   – ordnen: "lang" (pencils) or "hoch" (towers); order: the item indexes in tapping order
//     scales – kette: the two balances, each two items: heaviest–middle and middle–lightest
//     key    – the task in short, for "not the same task again"

const TRACK = 14; // steps: the length of the pencil rows, the height of the tower field
export const COLORS = ["#ff5a36", "#2456b8", "#ffc83a", "#12a564", "#e8488a", "#8a5cf6"];
export const PARCEL_COLORS = ["red", "blue", "yellow", "green"];

// Animals on the balance, lightest first: kg roughly, only the order matters.
export const ANIMALS = [
  ["ant", "🐜", 1], ["ladybird", "🐞", 1], ["butterfly", "🦋", 1], ["snail", "🐌", 2], ["frog", "🐸", 3],
  ["duck", "🦆", 5], ["owl", "🦉", 5], ["rabbit", "🐰", 6], ["fox", "🦊", 7], ["penguin", "🐧", 8],
  ["kangaroo", "🦘", 10], ["panda", "🐼", 12], ["lion", "🦁", 13], ["crocodile", "🐊", 14],
  ["giraffe", "🦒", 17], ["rhino", "🦏", 18], ["elephant", "🐘", 20],
].map(([id, icon, kg]) => ({ id, icon, kg }));
// Small but heavy, and big but light: the balance shows what the eyes don't.
export const HEAVY = [["stone", "🪨"], ["apple", "🍎"], ["key", "🔑"], ["carrot", "🥕"]].map(([id, icon]) => ({ id, icon }));
export const LIGHT = [["balloon", "🎈"], ["feather", "🪶"], ["leaf", "🍂"]].map(([id, icon]) => ({ id, icon }));

/** n different whole numbers from lo to hi, each at least `gap` apart. */
function sizes(r, n, gap, lo, hi) {
  for (let tries = 0; tries < 200; tries++) {
    const list = [];
    for (let i = 0; i < n; i++) list.push(r.int(lo, hi));
    const sorted = [...list].sort((a, b) => a - b);
    if (sorted.every((s, i) => i === 0 || s - sorted[i - 1] >= gap)) return list;
  }
  return r.shuffle([...Array(n).keys()].map((i) => lo + i * gap));
}

const count = (r, n) => (Array.isArray(n) ? r.int(n[0], n[1]) : n);
const indexOf = (list, best) => list.indexOf(best(...list));

export function task(l, r) {
  const kind = r.pick(l.kinds);
  const dir = l.ask === "mix" && r.chance(0.45) ? "less" : "more";
  const colors = r.shuffle(COLORS);
  const t = { kind, dir };

  if (kind === "lang" || kind === "hoch") {
    const n = Math.min(count(r, l.n), 4);
    const hi = kind === "lang" ? 11 : 10;
    for (let tries = 0; tries < 30; tries++) {
      const s = sizes(r, n, l.gap, 3, hi);
      t.items = s.map((size, i) => ({
        size,
        off: l.offset ? r.int(0, Math.min(4, TRACK - size)) : 0,
        color: colors[i],
      }));
      t.answer = indexOf(s, dir === "more" ? Math.max : Math.min);
      // Not on one line: mostly the end that sticks out furthest is not the answer, so the child has to compare.
      if (!l.offset || r.chance(0.25)) break;
      const ends = t.items.map((it) => it.size + it.off);
      if (indexOf(ends, dir === "more" ? Math.max : Math.min) !== t.answer) break;
    }
  } else if (kind === "wasser") {
    if (l.widths) {
      // Two glasses of different widths. The amount is width × height. Mostly the higher water is less.
      const tricky = r.chance(0.6);
      for (let tries = 0; tries < 200; tries++) {
        const w = r.shuffle(r.pick([[1, 2], [1, 1.6], [1.3, 2]]));
        const h = [r.int(2, 10), r.int(2, 10)];
        const v = [w[0] * h[0], w[1] * h[1]];
        if (v.some((x) => x > 16) || h[0] === h[1]) continue;
        if (Math.max(...v) < Math.min(...v) * 1.35) continue;
        if (tricky !== (indexOf(v, Math.max) !== indexOf(h, Math.max))) continue;
        t.items = h.map((water, i) => ({ water, width: w[i], amount: v[i] }));
        break;
      }
    } else {
      const n = Math.min(count(r, l.n), 3);
      t.items = sizes(r, n, l.gap, 2, 10).map((water) => ({ water, width: n > 2 ? 1.2 : 1.4, amount: water }));
    }
    const amounts = t.items.map((it) => it.amount);
    t.answer = indexOf(amounts, dir === "more" ? Math.max : Math.min);
  } else if (kind === "waage") {
    let a, b;
    do [a, b] = r.shuffle(ANIMALS);
    while (Math.abs(a.kg - b.kg) < 4);
    t.items = [a, b].map((x) => ({ ...x, scale: 1 }));
    t.answer = indexOf([a.kg, b.kg], dir === "more" ? Math.max : Math.min);
  } else if (kind === "trick") {
    const heavy = { ...r.pick(HEAVY), kg: 2, scale: 0.6 };
    const light = { ...r.pick(LIGHT), kg: 1, scale: 1.6 };
    t.items = r.shuffle([heavy, light]);
    t.answer = t.items.findIndex((x) => x.kg === (dir === "more" ? 2 : 1));
  } else if (kind === "kette") {
    // Three parcels, weights 3, 2, 1. One balance shows the heaviest against the middle one,
    // the other the middle one against the lightest. The child sees no balance with all three.
    const items = r.sample(PARCEL_COLORS, 3).map((color, i) => ({ color, kg: 3 - i }));
    const [h, m, s] = items;
    t.scales = r.shuffle([r.shuffle([h, m]), r.shuffle([m, s])]);
    t.items = r.shuffle(items);
    t.answer = t.items.findIndex((x) => x.kg === (dir === "more" ? 3 : 1));
  } else {
    // Ordering: pencils or towers, from small to big (or big to small).
    t.what = r.pick(["lang", "hoch"]);
    t.dir = l.down && r.chance(0.4) ? "down" : "up";
    const n = count(r, l.n);
    const s = sizes(r, n, l.gap, 3, t.what === "lang" ? 12 : 13);
    t.items = s.map((size, i) => ({ size, off: 0, color: colors[i % colors.length] }));
    t.order = [...t.items.keys()].sort((a, b) => (t.dir === "up" ? s[a] - s[b] : s[b] - s[a]));
  }
  const look = t.items.map((it) => it.id ?? it.color + (it.size ?? it.water ?? "")).join();
  return { ...t, key: `${kind} ${t.dir} ${look}` };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, l) {
  const problems = [];
  if (!l.kinds.includes(t.kind)) problems.push("kind not in the level");
  if (!t.items?.length) return [...problems, "no items"];
  const [lo, hi] = Array.isArray(l.n) ? l.n : [l.n, l.n];
  if (t.kind === "ordnen") {
    if (t.items.length < lo || t.items.length > hi) problems.push("wrong number of things");
    if (t.dir === "down" && !l.down) problems.push("down on a level without down");
    const s = t.order.map((k) => t.items[k].size);
    if (!s.every((x, i) => i === 0 || (t.dir === "up" ? x > s[i - 1] : x < s[i - 1]))) problems.push("order wrong");
    return problems;
  }
  if (t.dir === "less" && l.ask !== "mix") problems.push("less on a level without less");
  const value = (it) => it.amount ?? it.kg ?? it.size;
  const values = t.items.map(value);
  const best = t.dir === "more" ? Math.max(...values) : Math.min(...values);
  if (values.filter((v) => v === best).length !== 1) problems.push("two answers");
  if (values[t.answer] !== best) problems.push("wrong answer");
  if (t.kind === "lang" || t.kind === "hoch") {
    if (t.items.length < Math.min(lo, 4) || t.items.length > Math.min(hi, 4)) problems.push("wrong number of things");
    const s = [...values].sort((a, b) => a - b);
    if (s.some((x, i) => i > 0 && x - s[i - 1] < l.gap)) problems.push("sizes too close");
    if (t.items.some((it) => it.size + it.off > TRACK)) problems.push("does not fit");
    if (!l.offset && t.items.some((it) => it.off)) problems.push("offset on a level without offset");
  }
  if (t.kind === "wasser" && t.items.some((it) => it.water < 1 || it.water > 12)) problems.push("water out of the glass");
  if (t.kind === "waage" && Math.abs(values[0] - values[1]) < 4) problems.push("animals too close");
  if (t.kind === "kette" && t.scales.some(([a, b]) => Math.abs(a.kg - b.kg) !== 1)) problems.push("balances wrong");
  return problems;
}
