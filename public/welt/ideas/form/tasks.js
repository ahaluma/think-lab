// The tasks of the idea "Form": circle, triangle, square, rectangle (preschool). Hill and lake on the map.
// The school shapes and solids are in the town's workshop (ideas/formen/). Here: know the four plane
// shapes, also big or small, in any colour and turned, and find them in the world.
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = level 1, 2 or 3:
//     1  circle, triangle, square, upright
//     2  also the rectangle, sizes and colours mixed
//     3  also turned and stretched (a square on its corner, a flat or tall triangle)
//
//   A shape: { kind, color, size (0.6 … 1), turn (degrees), look (0 = plain; triangle: 1 flat, 2 right;
//              rectangle: 1 tall) }
//
//   sehen     { kind, shapes }                tap the circle (exactly one shape of that kind)
//   machen    { picture, pieces: [kinds], tray }   build a picture: fill its outlined pieces one by one
//   forschen  { kind, shapes }                find all triangles (2 to 4 among 6 to 8)
//   anwenden  { thing, kind, choices }        which shape has the clock? (a thing of the world)
//   pruefen   { shape, said, right, choices }  the owl names the shape. Is it right?
//   key – short text that tells tasks apart.
//
// This is the idea of the old game "Formen", in the frame of the new world.

export const KINDS = { 1: ["kreis", "dreieck", "quadrat"], 2: ["kreis", "dreieck", "quadrat", "rechteck"], 3: ["kreis", "dreieck", "quadrat", "rechteck"] };
export const COLORS = ["#ff5a36", "#ffc83a", "#3a8dde", "#57b86a", "#e8488a", "#9b6bd6"];

/** Pictures made of shapes, in a 200 × 200 box. A piece: [kind, x, y, w, h, turn?]. */
export const PICTURES = {
  haus: [["quadrat", 55, 100, 90, 90], ["dreieck", 40, 34, 120, 66]],
  schneemann: [["kreis", 55, 100, 90, 90], ["kreis", 70, 40, 60, 60]],
  baum: [["dreieck", 45, 20, 110, 120], ["quadrat", 82, 140, 36, 36]],
  eis: [["kreis", 62, 30, 76, 76], ["dreieck", 64, 98, 72, 92, 180]],
  auto: [["rechteck", 20, 90, 160, 54], ["kreis", 38, 130, 44, 44], ["kreis", 118, 130, 44, 44]],
  boot: [["rechteck", 30, 140, 140, 34], ["dreieck", 60, 34, 80, 100], ["kreis", 150, 18, 34, 34]],
  rakete: [["rechteck", 70, 70, 60, 100], ["dreieck", 70, 16, 60, 54], ["dreieck", 40, 130, 30, 40], ["dreieck", 130, 130, 30, 40]],
  roboter: [["quadrat", 68, 18, 64, 64], ["rechteck", 50, 86, 100, 70], ["kreis", 78, 36, 18, 18], ["kreis", 104, 36, 18, 18], ["rechteck", 60, 160, 80, 20]],
  zug: [["rechteck", 16, 80, 110, 60], ["quadrat", 126, 84, 56, 56], ["kreis", 30, 134, 40, 40], ["kreis", 82, 134, 40, 40], ["kreis", 136, 134, 40, 40]],
};
const PICTURES_AT = { 1: ["haus", "schneemann", "baum", "eis"], 2: ["auto", "boot", "haus", "baum", "eis"], 3: ["rakete", "roboter", "zug", "boot", "auto"] };

/** Things of the world and their shape. Icons are drawn by the boards. */
export const THINGS = {
  kreis: ["uhr", "keks", "donut", "muenze"],
  dreieck: ["pizza", "kaese", "sandwich", "segel"],
  quadrat: ["fenster", "waffel", "wuerfel"],
  rechteck: ["tuer", "buch", "brief", "handy"],
};

const levelOf = (range) => (KINDS[range] ? range : 1);
const MIXUP = { kreis: ["dreieck", "quadrat"], dreieck: ["quadrat", "kreis"], quadrat: ["rechteck", "dreieck"], rechteck: ["quadrat", "dreieck"] };

/** One shape of a kind: how it looks at this level. */
function shape(kind, L, r, { plain = false } = {}) {
  const s = { kind, color: r.pick(COLORS), size: L === 1 ? 1 : r.pick([0.65, 0.8, 1]), turn: 0, look: 0 };
  if (L === 3 && !plain && r.chance(0.6)) {
    if (kind === "quadrat") s.turn = r.pick([20, 45]);
    if (kind === "dreieck") (s.look = r.pick([0, 1, 2])), (s.turn = r.pick([0, 90, 180, 270]));
    if (kind === "rechteck") (s.look = r.pick([0, 1])), (s.turn = r.pick([0, 30]));
  }
  if (L === 2 && kind === "rechteck") s.look = r.pick([0, 1]);
  return s;
}

const makers = {
  sehen(L, r) {
    const kinds = KINDS[L];
    const kind = r.pick(kinds);
    const others = r.shuffle(kinds.filter((k) => k !== kind)).slice(0, L === 1 ? 2 : 3);
    const shapes = r.shuffle([shape(kind, L, r), ...others.map((k) => shape(k, L, r))]);
    return { kind, shapes, key: `${kind}` };
  },
  machen(L, r) {
    const picture = r.pick(PICTURES_AT[L]);
    const pieces = PICTURES[picture].map((p) => p[0]);
    const tray = KINDS[L === 1 ? 2 : L].filter((k) => k !== "rechteck" || L > 1 || pieces.includes(k));
    return { picture, pieces, tray, key: picture };
  },
  forschen(L, r) {
    const kind = r.pick(KINDS[L]);
    const count = r.int(2, L === 1 ? 3 : 4);
    const total = L === 1 ? 6 : r.int(7, 8);
    const others = KINDS[L].filter((k) => k !== kind);
    const shapes = r.shuffle([
      ...Array.from({ length: count }, () => shape(kind, L, r)),
      ...Array.from({ length: total - count }, () => shape(r.pick(others), L, r)),
    ]);
    return { kind, count, shapes, key: `${kind}${count}` };
  },
  anwenden(L, r) {
    const kind = r.pick(KINDS[L]);
    const thing = r.pick(THINGS[kind]);
    return { thing, kind, choices: r.shuffle(KINDS[L === 1 ? 1 : 2].slice()), key: thing };
  },
  pruefen(L, r) {
    const kind = r.pick(KINDS[L]);
    const s = shape(kind, L, r);
    const right = r.chance(0.4);
    const said = right ? kind : r.pick(MIXUP[kind].filter((k) => KINDS[L].includes(k)));
    return { shape: s, said, right, choices: KINDS[L].slice(), key: `${kind}${said}${s.turn}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`form: unknown perspective ${level.p}`);
  const L = levelOf(level.range);
  return { p: level.p, level: L, ...make(L, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const L = levelOf(level.range);
  const problems = [];
  const legal = (k) => KINDS[L].includes(k);
  if (level.p === "sehen" && t.shapes.filter((s) => s.kind === t.kind).length !== 1) problems.push("not one shape of the kind");
  if (level.p === "forschen" && t.shapes.filter((s) => s.kind === t.kind).length !== t.count) problems.push("count");
  if ((level.p === "sehen" || level.p === "forschen") && !t.shapes.every((s) => legal(s.kind))) problems.push("a shape of another level");
  if (level.p === "machen" && !t.pieces.every((k) => t.tray.includes(k))) problems.push("a piece is not in the tray");
  if (level.p === "anwenden" && (!THINGS[t.kind].includes(t.thing) || !t.choices.includes(t.kind))) problems.push("thing");
  if (level.p === "pruefen" && ((t.said === t.shape.kind) !== t.right || !legal(t.said))) problems.push("pruefen");
  return problems;
}
