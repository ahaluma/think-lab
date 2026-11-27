// The tasks of camp 9 of the thinking mountain, "Ordentlich zählen, im Kopf drehen" (the rock with
// signs): figures with hidden triangles and squares, mirrors, cube nets, folded paper, painted cubes.
//
// The thinking tools (t.tool):
//   ordnung   count in order: by size, or by the two lines that make a shape. None twice, none missed
//   spiegel   a mirror swaps left and right: the clock in the mirror shows 12 minus the hour
//   netz      fold in your head: in a row of three squares, the first and the third are opposite
//   falten    each fold doubles: unfold in your head, one hole becomes two, four, eight
//   wuerfel   a painted cube cut up: corners, edges, faces, inside
//   haken     Kombi with camp 2: a rectangle is two lines across and two lines down, all pairs
//
//   task({ p, range }, r) → { story, a, answer, tool, pic?, table?, key }
//   pic: { fan: { m, h } } | { grid: { w, h } } | { clock: hour } | { net: { cells, nums } }

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

const C2 = (n) => (n * (n - 1)) / 2;
/** Triangles in a fan: m + 1 rays from the top, h lines across (the base is one of them). */
export const fanCount = (m, h) => h * C2(m + 1);
/** Squares of every size in a grid of w × h. */
export function squareCount(w, h) {
  let n = 0;
  for (let s = 1; s <= Math.min(w, h); s++) n += (w - s + 1) * (h - s + 1);
  return n;
}
/** Rectangles in a grid of w × h: two of the w + 1 lines down, two of the h + 1 lines across. */
export const rectCount = (w, h) => C2(w + 1) * C2(h + 1);

/** Fold a net: each cell gets the direction its face looks to on the cube. Returns 6 normals or null. */
export function fold(cells) {
  const key = ([y, x]) => `${y},${x}`;
  const at = new Map(cells.map((c, i) => [key(c), i]));
  const neg = (v) => v.map((x) => -x);
  const frames = new Array(cells.length);
  frames[0] = { n: [0, 0, -1], ex: [1, 0, 0], ey: [0, 1, 0] };
  const todo = [0];
  while (todo.length) {
    const i = todo.pop();
    const [y, x] = cells[i];
    const f = frames[i];
    const moves = [
      [[y, x + 1], { n: f.ex, ex: neg(f.n), ey: f.ey }],
      [[y, x - 1], { n: neg(f.ex), ex: f.n, ey: f.ey }],
      [[y + 1, x], { n: f.ey, ex: f.ex, ey: neg(f.n) }],
      [[y - 1, x], { n: neg(f.ey), ex: f.ex, ey: f.n }],
    ];
    for (const [c, frame] of moves) {
      const j = at.get(key(c));
      if (j !== undefined && !frames[j]) (frames[j] = frame), todo.push(j);
    }
  }
  if (frames.some((f) => !f)) return null;
  const ns = frames.map((f) => f.n.join(","));
  return new Set(ns).size === 6 ? ns : null;
}

/** A random net of a cube (6 squares that fold to a cube), as [row, column] cells. */
function randomNet(r) {
  for (;;) {
    const cells = [[r.int(0, 3), r.int(0, 3)]];
    while (cells.length < 6) {
      const [y, x] = r.pick(cells);
      const [dy, dx] = r.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]);
      const c = [y + dy, x + dx];
      if (c[0] < 0 || c[1] < 0 || c[0] > 3 || c[1] > 3 || cells.some(([a, b]) => a === c[0] && b === c[1])) continue;
      cells.push(c);
    }
    if (fold(cells)) return cells;
  }
}

function fanTask(r, level) {
  let m = level === 1 ? r.int(2, 4) : level === 2 ? r.int(3, 5) : r.int(4, 6);
  let h = level >= 3 && r.chance(0.6) ? 2 : 1;
  if (level <= 2 && r.chance(0.35)) [m, h] = [r.int(1, 2), r.int(2, 3)];
  const t0 = r.pick(["faecher", "zelt", "segel"]);
  return { story: t0, a: { m, h, rays: m + 1, small: m, one: C2(m + 1) }, pic: { fan: { m, h } }, answer: fanCount(m, h), tool: "ordnung", key: `f${m}${h}${t0}` };
}

function squareTask(r, level) {
  const w = level <= 2 ? r.int(2, 3) : r.int(3, 5);
  const h = level === 1 ? 2 : level === 2 ? w : r.int(2, w);
  const bySize = [];
  for (let s = 1; s <= Math.min(w, h); s++) bySize.push((w - s + 1) * (h - s + 1));
  const story = r.pick(["fliesen", "fenster", "schokolade"]);
  return { story, a: { w, h, bySize, small: w * h }, pic: { grid: { w, h } }, answer: squareCount(w, h), tool: "ordnung", key: `q${story}${w}${h}` };
}

function clockTask(r) {
  const shown = r.int(1, 11);
  return { story: "uhr", a: { shown }, pic: { clock: shown }, answer: 12 - shown, tool: "spiegel", key: `u${shown}` };
}

function netTask(r) {
  const cells = randomNet(r);
  const nums = r.shuffle([1, 2, 3, 4, 5, 6]);
  const ns = fold(cells);
  const i = r.int(0, 5);
  const opp = ns.findIndex((n) => n === ns[i].split(",").map((x) => -Number(x)).join(","));
  return { story: "netz", a: { x: nums[i] }, pic: { net: { cells, nums, mark: i } }, answer: nums[opp], tool: "netz", key: `n${cells.join("")}${nums.join("")}${i}` };
}

function foldTask(r) {
  const folds = r.int(1, 3);
  const holes = r.int(1, 3);
  return { story: "papier", a: { folds, holes, layers: 2 ** folds }, answer: holes * 2 ** folds, tool: "falten", key: `p${folds}${holes}` };
}

/** a cube painted outside, cut into n · n · n: how many small cubes have exactly k painted faces? */
function cubeTask(r) {
  const n = r.int(3, 9);
  const k = r.pick([0, 1, 2, 3]);
  const count = [(n - 2) ** 3, 6 * (n - 2) ** 2, 12 * (n - 2), 8][k];
  return { story: "wuerfel", a: { n, k, kKey: String(k), inner: n - 2 }, answer: count, tool: "wuerfel", key: `w${n}${k}` };
}

function rectTask(r) {
  const w = r.int(2, 5);
  const h = r.int(2, 4);
  return { story: "rechtecke", a: { w, h, down: w + 1, across: h + 1, pairsDown: C2(w + 1), pairsAcross: C2(h + 1) }, pic: { grid: { w, h } }, answer: rectCount(w, h), tool: "haken", key: `r${w}${h}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return rectTask(r);
  if (level === 1) return r.pick([() => fanTask(r, 1), () => fanTask(r, 1), () => squareTask(r, 1)])();
  if (level === 2) return r.pick([() => fanTask(r, 2), () => squareTask(r, 2), () => clockTask(r)])();
  if (level === 3) return r.pick([() => netTask(r), () => squareTask(r, 3), () => fanTask(r, 3), () => clockTask(r)])();
  return r.pick([() => cubeTask(r), () => foldTask(r), () => netTask(r), () => rectTask(r), () => squareTask(r, 4)])();
}

/** Ausprobieren: find every triangle in a fan by choosing its two sides (and the line across). */
function handsOn(r, level) {
  const m = level + r.int(1, 2);
  const t = fanTask(r, 1);
  return { ...t, mode: "fan", a: { ...t.a, m, rays: m + 1, small: m, one: C2(m + 1), h: 1 }, pic: { fan: { m, h: 1 } }, answer: fanCount(m, 1), key: `mf${m}${t.story}` };
}

/** Regel finden: small figures in a table, then a big one. */
function ruleTask(r, level) {
  if (level === 1) {
    const m = r.int(6, 12);
    return { story: "faechergross", a: { m, rays: m + 1, small: m, one: C2(m + 1) }, answer: fanCount(m, 1), tool: "ordnung", table: { id: "faecher", rows: [1, 2, 3].map((i) => [i, fanCount(i, 1)]), next: [4, fanCount(4, 1)] }, key: `tf${m}` };
  }
  if (level === 2 || (level === 3 && r.chance(0.5))) {
    const n = r.int(5, 8);
    return { story: "quadratgross", a: { n }, answer: squareCount(n, n), tool: "ordnung", table: { id: "quadrate", rows: [1, 2, 3].map((i) => [i, squareCount(i, i)]), next: [4, squareCount(4, 4)] }, key: `tq${n}` };
  }
  const n = r.int(6, 12);
  return { story: "wuerfel", a: { n, k: 2, kKey: "2", inner: n - 2 }, answer: 12 * (n - 2), tool: "wuerfel", table: { id: "kanten", rows: [2, 3, 4].map((i) => [i, 12 * (i - 2)]), next: [5, 36] }, key: `tw${n}` };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["small", "size", "mirror", "next", "fold", "corners", "lines", "double"];

function owlOptions(t) {
  const a = t.a;
  switch (t.story) {
    case "faecher": case "zelt": case "segel": return [[a.small * a.h, "small"], [fanCount(a.m, 1), "lines"], [a.small + 1, "small"]];
    case "fliesen": case "fenster": case "schokolade": return [[a.small, "small"], [a.small + 1, "size"]];
    case "uhr": return [[a.shown, "mirror"], [(a.shown + 6) % 12 || 12, "mirror"]];
    case "netz": return [];
    case "papier": return [[a.holes * 2 * a.folds, "fold"], [a.holes + a.folds, "fold"]];
    case "wuerfel": return [[[(a.n) ** 3 - 8, 6 * a.n ** 2, 12 * a.n, 4][a.k], "corners"], [[0, 6 * (a.n - 2), 12 * (a.n - 1), 6][a.k], "corners"]];
    case "rechtecke": return [[(a.w * a.h), "small"], [a.w * a.h + 1, "small"], [a.pairsDown + a.pairsAcross, "lines"]];
    default: return [];
  }
}

const makers = {
  sehen: (level, r) => storyTask(r, level, false),
  machen: (level, r) => handsOn(r, level),
  forschen: (level, r) => ruleTask(r, level),
  anwenden: (level, r) => storyTask(r, level, level >= 3),
  pruefen(level, r) {
    let t = storyTask(r, level, level >= 3);
    if (t.story === "netz") {
      // the owl names a neighbour of the face (it touches it, so it cannot be opposite)
      const { cells, nums, mark } = t.pic.net;
      const [y, x] = cells[mark];
      const near = cells.map((c, i) => [c, i]).filter(([[cy, cx]]) => Math.abs(cy - y) + Math.abs(cx - x) === 1).map(([, i]) => nums[i]);
      t = { ...t, owlNear: near };
    }
    const options = t.story === "netz" ? t.owlNear.map((n) => [n, "next"]) : owlOptions(t);
    const wrongs = options.filter(([k]) => Number.isInteger(k) && k >= 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Count every shape for real, by trying all corners (tools/check-welt.mjs). */
function triangles(m, h) {
  // rays from the apex to points 0..m on the base; lines across at heights 1..h (h = base).
  // A triangle: the apex and two rays cut by one line across, or no other kind (lines across are parallel).
  let n = 0;
  for (let i = 0; i <= m; i++) for (let j = i + 1; j <= m; j++) for (let k = 1; k <= h; k++) n++;
  return n;
}
function squaresByCorners(w, h) {
  let n = 0;
  for (let x = 0; x <= w; x++) for (let y = 0; y <= h; y++) for (let s = 1; x + s <= w && y + s <= h; s++) n++;
  return n;
}
function rectsByCorners(w, h) {
  let n = 0;
  for (let x1 = 0; x1 <= w; x1++) for (let x2 = x1 + 1; x2 <= w; x2++) for (let y1 = 0; y1 <= h; y1++) for (let y2 = y1 + 1; y2 <= h; y2++) n++;
  return n;
}
function paintedCubes(n, k) {
  let c = 0;
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const faces = [x, y, z].filter((v) => v === 0 || v === n - 1).length;
    if (faces === k) c++;
  }
  return c;
}

export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a;
  const want = {
    faecher: () => triangles(a.m, a.h), zelt: () => triangles(a.m, a.h), segel: () => triangles(a.m, a.h),
    faechergross: () => triangles(a.m, 1),
    fliesen: () => squaresByCorners(a.w, a.h), fenster: () => squaresByCorners(a.w, a.h), schokolade: () => squaresByCorners(a.w, a.h),
    quadratgross: () => squaresByCorners(a.n, a.n),
    uhr: () => (12 - a.shown) % 12 || 12,
    netz: () => {
      const { cells, nums, mark } = t.pic.net;
      const ns = fold(cells);
      if (!ns) return NaN;
      const [p, q, s] = ns[mark].split(",").map(Number);
      return nums[ns.indexOf(`${-p},${-q},${-s}`.replace(/-0/g, "0"))];
    },
    papier: () => {
      let holes = a.holes;
      for (let f = 0; f < a.folds; f++) holes *= 2;
      return holes;
    },
    wuerfel: () => paintedCubes(a.n, a.k),
    rechtecke: () => rectsByCorners(a.w, a.h),
  }[t.story];
  if (!want) problems.push(`unknown story ${t.story}`);
  else if (want() !== t.answer) problems.push(`answer ${t.answer}, counted ${want()}`);
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) {
      const f = t.table.id === "faecher" ? triangles(x, 1) : t.table.id === "quadrate" ? squaresByCorners(x, x) : paintedCubes(x, 2);
      if (f !== y) problems.push("bad table");
    }
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
