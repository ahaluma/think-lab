// The tasks of the idea "Formen": shapes and solids, symmetry, measuring. The workshop in the town.
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = 1, 2 or 3 (a level, not a number):
//     1 the plain shapes (circle, triangle, square, rectangle), lying straight; ruler from 0
//     2 also five and six corners, shapes turned and uneven; the thing does not start at 0
//     3 solids (cube, cuboid, sphere, cylinder, cone, pyramid); how much longer is one than the other?
//
//   sehen     { range, shape, turn, uneven, choices }     which shape is this? (three names)
//   machen    { range, rows, cols, axis, cells }           mirror: the left (or top) half is coloured,
//                                                          colour the other half. cells: [[row, col]] of
//                                                          the given half; cols = columns of one half
//   forschen  { range, shape, turn, uneven, ask, answer }  shapes: tap every corner (ask "corners");
//                                                          solids: how many faces, edges, corners?
//   anwenden  { range, kind, thing, from, len, other?, answer }   a thing lies on the ruler:
//                                                          kind "length": how long? kind "diff": two
//                                                          things, how much longer is the long one?
//   pruefen   { range, shape, turn, uneven, said, right, choices }  the owl names the shape
//   key – short text that tells tasks apart, for "not the same task again".
//
// These are the ideas of the old game "Formen" (naming shapes), with symmetry, solids and measuring
// for school in the frame of the new world.

export const RANGES = [1, 2, 3];
export const FLAT = { 1: ["kreis", "dreieck", "quadrat", "rechteck"], 2: ["kreis", "dreieck", "quadrat", "rechteck", "fuenfeck", "sechseck"] };
export const SOLIDS = ["wuerfel", "quader", "kugel", "zylinder", "kegel", "pyramide"];
export const CORNERS = { kreis: 0, dreieck: 3, quadrat: 4, rechteck: 4, fuenfeck: 5, sechseck: 6 };
/** Faces, edges, corners of the solids that have them all clearly (no round ones). */
export const COUNTS = { wuerfel: { faces: 6, edges: 12, corners: 8 }, quader: { faces: 6, edges: 12, corners: 8 }, pyramide: { faces: 5, edges: 8, corners: 5 } };
/** What the owl (and children) mix up. */
const MIXUPS = { quadrat: ["rechteck"], rechteck: ["quadrat"], dreieck: ["fuenfeck"], fuenfeck: ["sechseck"], sechseck: ["fuenfeck"], kreis: ["sechseck"], wuerfel: ["quader", "quadrat"], quader: ["wuerfel", "rechteck"], kugel: ["kreis", "zylinder"], zylinder: ["kegel", "quader"], kegel: ["pyramide", "dreieck"], pyramide: ["kegel", "dreieck"] };
export const THINGS = ["pencil", "key", "nail", "crayon", "spoon"];

const rangeOf = (range) => (RANGES.includes(range) ? range : 1);

/** A shape (or solid) of the level, with how it lies. */
function shape(R, r) {
  if (R === 3 && r.chance(0.75)) return { shape: r.pick(SOLIDS), turn: 0, uneven: false };
  const s = r.pick(FLAT[R === 1 ? 1 : 2]);
  const turn = R === 1 || s === "kreis" ? 0 : r.pick([0, 0, 15, 30, 45]);
  // An uneven triangle or rectangle still is one: the hard part of naming.
  const uneven = R > 1 && s === "dreieck" && r.chance(0.5);
  return { shape: s, turn, uneven };
}

/** Three names to pick from: the right one, the usual mix-up, one more. */
function choices(s, R, r) {
  const pool = SOLIDS.includes(s) ? SOLIDS : FLAT[R === 1 ? 1 : 2];
  const set = new Set([s]);
  for (const m of MIXUPS[s] ?? []) if (pool.includes(m) && set.size < 2) set.add(m);
  while (set.size < 3) set.add(r.pick(pool));
  return r.shuffle([...set]);
}

const makers = {
  sehen(R, r) {
    const s = shape(R, r);
    return { range: R, ...s, choices: choices(s.shape, R, r), key: `${s.shape}${s.turn}${s.uneven ? "u" : ""}` };
  },
  machen(R, r) {
    const rows = R === 1 ? 4 : R === 2 ? 5 : 6;
    const cols = R === 1 ? 2 : 3;
    const axis = R === 3 && r.chance(0.4) ? "h" : "v"; // h: mirror line across, the top half is given
    const want = R === 1 ? r.int(2, 4) : R === 2 ? r.int(4, 6) : r.int(5, 8);
    const all = [];
    if (axis === "v") for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) all.push([y, x]);
    else for (let y = 0; y < cols; y++) for (let x = 0; x < rows; x++) all.push([y, x]);
    // Up to level 1 the shape touches the mirror line, so it is one figure (a heart, a house).
    let cells = r.shuffle(all).slice(0, want);
    if (R === 1 && axis === "v" && !cells.some(([, x]) => x === cols - 1)) cells[0] = [cells[0][0], cols - 1];
    cells = cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return { range: R, rows, cols, axis, cells, key: `${axis}${cells.map((c) => c.join("")).join(".")}` };
  },
  forschen(R, r) {
    if (R === 3) {
      const s = r.pick(Object.keys(COUNTS));
      const ask = r.pick(["faces", "edges", "corners"]);
      return { range: R, shape: s, turn: 0, uneven: false, ask, answer: COUNTS[s][ask], key: `${s}:${ask}` };
    }
    const s = r.pick(FLAT[2].filter((x) => x !== "kreis"));
    const turn = R === 1 ? 0 : r.pick([0, 15, 30]);
    return { range: R, shape: s, turn, uneven: R > 1 && s === "dreieck" && r.chance(0.5), ask: "corners", answer: CORNERS[s], key: `${s}:${turn}` };
  },
  anwenden(R, r) {
    const thing = r.pick(THINGS);
    if (R === 3 && r.chance(0.6)) {
      const len = r.int(5, 14);
      const other = r.int(2, len - 1);
      return { range: R, kind: "diff", thing, other: r.pick(THINGS.filter((x) => x !== thing)), from: 0, len, otherLen: other, answer: len - other, key: `d${len}:${other}` };
    }
    const len = R === 1 ? r.int(2, 10) : r.int(3, 12);
    const from = R === 1 ? 0 : r.int(1, 15 - len);
    return { range: R, kind: "length", thing, from, len, answer: len, key: `${from}:${len}` };
  },
  pruefen(R, r) {
    const s = shape(R, r);
    const right = r.chance(0.4);
    const said = right ? s.shape : r.pick(MIXUPS[s.shape].filter((m) => R === 3 || !SOLIDS.includes(m)));
    // A square turned by 45 degrees looks like a diamond: still a square. The owl likes to say no.
    if (s.shape === "quadrat" && R > 1 && r.chance(0.5)) s.turn = 45;
    return { range: R, ...s, said, right, choices: choices(s.shape, R, r), key: `${s.shape}${s.turn}=${said}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`formen: unknown perspective ${level.p}`);
  return { p: level.p, ...make(rangeOf(level.range), r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const R = rangeOf(level.range);
  const problems = [];
  const known = (s) => s in CORNERS || SOLIDS.includes(s);
  if (level.p === "sehen" || level.p === "pruefen") {
    if (!known(t.shape)) problems.push(`shape ${t.shape}`);
    if (R < 3 && SOLIDS.includes(t.shape)) problems.push("a solid below level 3");
    if (t.choices.length !== 3 || new Set(t.choices).size !== 3 || !t.choices.includes(t.shape)) problems.push(`choices ${t.choices}`);
    if (level.p === "pruefen" && (t.said === t.shape) !== t.right) problems.push("right does not match");
    if (level.p === "pruefen" && !known(t.said)) problems.push(`said ${t.said}`);
  } else if (level.p === "machen") {
    const [h, w] = t.axis === "v" ? [t.rows, t.cols] : [t.cols, t.rows];
    if (!t.cells.length || t.cells.some(([y, x]) => y < 0 || x < 0 || y >= h || x >= w)) problems.push("cells outside the half");
    if (new Set(t.cells.map((c) => c.join())).size !== t.cells.length) problems.push("a cell twice");
  } else if (level.p === "forschen") {
    if (R === 3 ? COUNTS[t.shape]?.[t.ask] !== t.answer : CORNERS[t.shape] !== t.answer || t.ask !== "corners") problems.push("answer");
  } else if (level.p === "anwenden") {
    if (t.from < 0 || t.from + t.len > 15 || t.len < 1) problems.push(`ruler ${t.from}+${t.len}`);
    if (t.kind === "diff" ? t.answer !== t.len - t.otherLen || t.answer < 1 : t.answer !== t.len) problems.push("answer");
  }
  return problems;
}
