// The tasks of camp 12 of the thinking mountain, "Eingrenzen" (the number wall): every brick is the
// sum of the two below it. Fill gaps, find the hidden number by narrowing it down, count all walls.
//
// The thinking tools (t.tool):
//   mauer     up the wall: add the two below. The top of a wall of 3 is left + 2 · middle + right
//   luecke    a gap at the bottom: the middle counts twice; take the rest away, then halve
//   eingrenzen  clue by clue: which numbers are still possible? Until one is left
//   magisch   a magic square: every row, column and diagonal has the same sum (3 · the middle)
//   zaehlen   all walls with a top: middle brick 1, 2, 3 … and for each, how many left and right
//   rueck     Kombi with camps 4 and 6: from the top down, take away what is known
//
//   task({ p, range }, r) → { story, a, answer, tool, pic?, table?, key }
//   pic: { wall: [[top], …, [bottom row]] } (null = empty brick) | { magic: 3 × 3 (null = empty, "?" = asked) }

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

/** The whole wall from its bottom row: rows from the top down. */
export function build(bottom) {
  const rows = [bottom];
  while (rows[0].length > 1) rows.unshift(rows[0].slice(1).map((x, i) => x + rows[0][i]));
  return rows;
}

/** a wall of 3 or 4: the bottom is given, what is on top? */
function topTask(r, level) {
  const len = level === 1 ? 3 : 4;
  const bottom = Array.from({ length: len }, () => r.int(1, level === 1 ? 12 : 25));
  const rows = build(bottom);
  const story = r.pick(["mauer", "turm"]);
  return { story, a: { bottom, top: rows[0][0], len, middle: rows.at(-2) }, pic: { wall: rows.map((row, i) => (i === rows.length - 1 ? row : row.map(() => null)).map((x, j) => (i === 0 ? "?" : x))) }, answer: rows[0][0], tool: "mauer", key: `t${bottom.join(",")}` };
}

/** a wall of 3 with the middle bottom brick missing: the top and the corners are known */
function gapTask(r, level) {
  const [x, b, z] = [r.int(1, 20), r.int(1, level === 2 ? 20 : 40), r.int(1, 20)];
  const rows = build([x, b, z]);
  const T = rows[0][0];
  return { story: "luecke", a: { x, z, T, rest: T - x - z, b }, pic: { wall: [[T], [null, null], [x, "?", z]] }, answer: b, tool: "luecke", key: `g${x}${b}${z}` };
}

/** Kombi with camps 4 and 6: from the top down. Top, the left middle brick and the right bottom brick. */
function downTask(r) {
  const [x, b, z] = [r.int(1, 20), r.int(1, 20), r.int(1, 20)];
  const rows = build([x, b, z]);
  const [T] = rows[0];
  const [L, R] = rows[1];
  return { story: "runter", a: { T, L, R, z, b }, pic: { wall: [[T], [L, null], ["?", null, z]] }, answer: x, tool: "rueck", key: `d${x}${b}${z}` };
}

/** Clues that narrow down a number. */
const CLUES = {
  between: (lo, hi) => (n) => n > lo && n < hi,
  div: (d) => (n) => n % d === 0,
  sum: (s) => (n) => String(n).split("").reduce((x, y) => x + Number(y), 0) === s,
  even: () => (n) => n % 2 === 0,
  odd: () => (n) => n % 2 === 1,
  bigger: () => (n) => Math.floor(n / 10) % 10 > n % 10, // tens > ones
  smaller: () => (n) => Math.floor(n / 10) % 10 < n % 10,
  rest: (d, k) => (n) => n % d === k,
};
const digitSum = (n) => String(n).split("").reduce((x, y) => x + Number(y), 0);

/** a number to find from clues (house numbers, a lock code, grandpa's age): clues until one is left */
function riddleTask(r, level) {
  const story = r.pick(["hausnummer", "schloss", "opa"]);
  const [lo, hi] = { hausnummer: [10, 99], schloss: [100, 999], opa: [50, 99] }[story];
  for (;;) {
    const x = r.int(lo + 1, hi - 1);
    const pool = [];
    const span = r.int(15, 40);
    const a0 = Math.max(lo, x - r.int(1, span - 1));
    pool.push(["between", a0, Math.min(hi + 1, a0 + span + 1)]);
    for (const d of r.shuffle([3, 4, 6, 7, 9, 11]).slice(0, 2)) pool.push(x % d === 0 ? ["div", d] : ["rest", d, x % d]);
    pool.push(["sum", digitSum(x)]);
    pool.push([x % 2 ? "odd" : "even"]);
    const t = Math.floor(x / 10) % 10;
    if (t !== x % 10) pool.push([t > x % 10 ? "bigger" : "smaller"]);
    const clues = [];
    let left = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    for (const c of [pool[0], ...r.shuffle(pool.slice(1))]) {
      const keep = left.filter(CLUES[c[0]](...c.slice(1)));
      if (keep.length < left.length) clues.push(c), (left = keep);
      if (left.length === 1) break;
    }
    if (left.length === 1 && clues.length >= (level === 3 ? 2 : 3) && clues.length <= 4) {
      return { story, a: { clues, x }, answer: x, tool: "eingrenzen", key: `r${story}${x}${clues.flat().join("")}` };
    }
  }
}

/** a magic square: some cells are known, one is asked */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function magicTask(r) {
  const c = r.int(5, 20);
  let x = r.int(1, 4);
  let y = r.int(1, 4);
  if (x === y || x + y === 0 || x === 2 * y || y === 2 * x) [x, y] = [1, 3];
  const sq = [c - y, c + x + y, c - x, c - x + y, c, c + x - y, c + x, c - x - y, c + y];
  if (sq.some((v) => v < 1)) return magicTask(r);
  // show the middle and one full line through it; ask a cell on another line that has two known cells
  const known = new Set([4]);
  const line = r.pick(LINES.filter((l) => l.includes(4)));
  line.forEach((i) => known.add(i));
  const extra = r.pick([0, 1, 2, 3, 5, 6, 7, 8].filter((i) => !known.has(i)));
  known.add(extra);
  const options = [];
  for (let i = 0; i < 9; i++) if (!known.has(i)) for (const l of LINES) if (l.includes(i) && l.filter((j) => j !== i).every((j) => known.has(j))) options.push(i);
  if (!options.length) return magicTask(r);
  const ask = r.pick(options);
  const grid = sq.map((v, i) => (i === ask ? "?" : known.has(i) ? v : null));
  return { story: "magisch", a: { c, sum: 3 * c }, pic: { magic: grid }, answer: sq[ask], tool: "magisch", key: `m${sq.join(",")}${ask}` };
}

/** a two-digit number AB with digits A > B: AB + BA and A − B are known */
function cryptoTask(r) {
  const A = r.int(2, 9);
  const B = r.int(1, A - 1);
  return { story: "krypto", a: { s: 11 * (A + B), d: A - B, sumAB: A + B, A, B }, answer: 10 * A + B, tool: "eingrenzen", key: `k${A}${B}` };
}

/** How many walls of 3 have the top T (all bricks at least 1)? */
export function wallCount(T) {
  let n = 0;
  for (let a = 1; a < T; a++) for (let b = 1; a + 2 * b < T; b++) if (T - a - 2 * b >= 1) n++;
  return n;
}
function countTask(r) {
  const T = r.int(8, 22);
  return { story: "wieviele", a: { T, most: Math.floor((T - 2) / 2) }, answer: wallCount(T), tool: "zaehlen", key: `w${T}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return downTask(r);
  if (level === 1) return topTask(r, 1);
  if (level === 2) return r.pick([() => gapTask(r, 2), () => topTask(r, 2)])();
  if (level === 3) return r.pick([() => riddleTask(r, 3), () => magicTask(r), () => gapTask(r, 3)])();
  return r.pick([() => cryptoTask(r), () => countTask(r), () => riddleTask(r, 4), () => magicTask(r)])();
}

/** Ausprobieren: build the wall brick by brick, from the bottom up. */
function handsOn(r, level) {
  const len = level <= 2 ? 3 : 4;
  const bottom = Array.from({ length: len }, () => r.int(1, level === 1 ? 9 : 20));
  const rows = build(bottom);
  return { mode: "build", story: "mauer", a: { bottom, top: rows[0][0], len, middle: rows.at(-2) }, rows, answer: rows[0][0], tool: "mauer", key: `mb${bottom.join(",")}` };
}

/** Regel finden: the middle brick goes up by 1, the top by 2; or: how many walls for the top 4, 5, 6. */
function ruleTask(r, level) {
  if (level <= 2) {
    const t = gapTask(r, level);
    const base = t.a.x + t.a.z;
    return { ...t, table: { id: "mitte", rows: [1, 2, 3].map((i) => [i, base + 2 * i]), next: [4, base + 8] } };
  }
  const t = countTask(r);
  return { ...t, table: { id: "wieviele", rows: [4, 5, 6].map((i) => [i, wallCount(i)]), next: [7, wallCount(7)] } };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["middle", "half", "line", "clue", "swap", "forgot", "down"];

function owlOptions(t) {
  const a = t.a;
  switch (t.story) {
    case "mauer": case "turm": return a.len === 3 ? [[a.bottom.reduce((x, y) => x + y, 0), "middle"]] : [[a.bottom.reduce((x, y) => x + y, 0), "middle"], [a.middle.reduce((x, y) => x + y, 0), "middle"]];
    case "luecke": return [[a.rest, "half"], [a.T - a.x, "half"]];
    case "runter": return [[a.L - a.z, "down"], [a.T - a.L, "down"]];
    case "magisch": return [[t.answer + 1, "line"], [t.answer - 1, "line"], [a.c, "line"]];
    case "krypto": return [[10 * a.B + a.A, "swap"]];
    case "wieviele": return [[t.answer - 1, "forgot"], [a.most, "forgot"]];
    case "hausnummer": case "schloss": case "opa": {
      const [lo, hi] = { hausnummer: [10, 99], schloss: [100, 999], opa: [50, 99] }[t.story];
      const near = [];
      for (let n = lo; n <= hi; n++) if (n !== a.x && a.clues.filter((c) => CLUES[c[0]](...c.slice(1))(n)).length === a.clues.length - 1) near.push(n);
      return near.slice(0, 3).map((n) => [n, "clue"]);
    }
    default: return [];
  }
}

const makers = {
  sehen: (level, r) => storyTask(r, level, false),
  machen: (level, r) => handsOn(r, level),
  forschen: (level, r) => ruleTask(r, level),
  anwenden: (level, r) => storyTask(r, level, level >= 3),
  pruefen(level, r) {
    const t = storyTask(r, level, level >= 3);
    const wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k > 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine). Gaps and riddles are solved by trying every number. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a;
  const only = (list) => (list.length === 1 ? list[0] : NaN);
  const upTo = (n) => Array.from({ length: n + 1 }, (_, i) => i);
  const want = {
    mauer: () => build(a.bottom)[0][0],
    turm: () => build(a.bottom)[0][0],
    luecke: () => only(upTo(999).filter((b) => b >= 1 && build([a.x, b, a.z])[0][0] === a.T)),
    runter: () => only(upTo(60).filter((x) => upTo(60).some((b) => b >= 1 && x >= 1 && build([x, b, a.z])[0][0] === a.T && build([x, b, a.z])[1][0] === a.L))),
    magisch: () => {
      const g = t.pic.magic;
      const i = g.indexOf("?");
      return only(upTo(99).filter((v) => {
        const s = g.map((x, j) => (j === i ? v : x));
        // every line with all three known must have the same sum
        const sums = LINES.filter((l) => l.every((j) => s[j] !== null)).map((l) => l.reduce((x, j) => x + s[j], 0));
        return sums.length && sums.every((x) => x === sums[0]) && sums.some((_, k) => LINES.filter((l) => l.every((j) => s[j] !== null))[k].includes(i));
      }));
    },
    krypto: () => only(upTo(99).filter((n) => n >= 10 && n % 10 > 0 && Math.floor(n / 10) + (n % 10) === a.sumAB && n + 10 * (n % 10) + Math.floor(n / 10) === a.s && Math.floor(n / 10) - (n % 10) === a.d)),
    wieviele: () => {
      let n = 0;
      for (let x = 1; x <= a.T; x++) for (let b = 1; b <= a.T; b++) for (let z = 1; z <= a.T; z++) if (build([x, b, z])[0][0] === a.T) n++;
      return n;
    },
  };
  for (const s of ["hausnummer", "schloss", "opa"]) {
    want[s] = () => {
      const [lo, hi] = { hausnummer: [10, 99], schloss: [100, 999], opa: [50, 99] }[s];
      return only(upTo(hi).filter((n) => n >= lo && a.clues.every((c) => CLUES[c[0]](...c.slice(1))(n))));
    };
  }
  const w = want[t.story];
  if (!w) problems.push(`unknown story ${t.story}`);
  else if (w() !== t.answer) problems.push(`answer ${t.answer}, found ${w()}`);
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) {
      const f = t.table.id === "mitte" ? build([a.x, x, a.z])[0][0] : wallCount(x);
      if (f !== y) problems.push("bad table");
    }
  }
  if (t.mode === "build" && JSON.stringify(t.rows) !== JSON.stringify(build(a.bottom))) problems.push("bad wall");
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
