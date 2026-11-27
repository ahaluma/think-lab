// The tasks of camp 6 of the thinking mountain, "Ersetzen" (the scales at the market): what weighs
// the same can take the other's place. Replace, until only one kind of thing is left.
//
// The thinking tools (t.tool):
//   ersetzen  one big thing weighs as much as k small ones: swap each big one for k small ones
//   zwei      two scales: swap twice, A → B → C
//   abziehen  the same on both sides can go: take the basket away, then share
//   summe     sum and difference: take the difference away, then halve
//   drei      three things weighed in pairs: all pairs together are every thing twice
//   kette     scales with "2 A = 3 B": find a number of A that swaps without a rest
//   gewichte  weights on both sides: a weight next to the package counts minus
//   rueck     Kombi with camp 4: half the things are gone, the basket is not; go back
//
//   task({ p, range }, r) → { story, a, answer, tool, pic?, table?, key }
//   pic: { scales: [[left, right], …] }  scales in balance; a side is a list of [thing, count]
//   things are ids (kuerbis, apfel, …); their names and icons: THINGS here, words in the language file.

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

export const THINGS = { kuerbis: "🎃", apfel: "🍎", melone: "🍉", ananas: "🍍", orange: "🍊", birne: "🍐", kiste: "📦", buch: "📕", beutel: "👝", murmel: "🔵", paket: "🎁", hund: "🐕", katze: "🐈", hase: "🐇" };
/** Big things and what they swap for (light, lighter). */
const PAIRS = [["kuerbis", "apfel"], ["melone", "orange"], ["kiste", "buch"], ["beutel", "murmel"], ["ananas", "birne"]];
const TRIOS = [["kuerbis", "melone", "apfel"], ["melone", "ananas", "orange"], ["kiste", "beutel", "murmel"], ["kuerbis", "ananas", "birne"]];
export const WEIGHTS = [1, 3, 9];

/** a big ones and b small ones: how many small ones on the other side? */
function swapTask(r, level) {
  const [big, small] = r.pick(PAIRS);
  const k = level === 1 ? r.int(2, 4) : r.int(3, 8);
  const nb = level === 1 ? r.int(1, 3) : r.int(3, 9);
  const ns = r.int(1, level === 1 ? 4 : 9);
  const answer = nb * k + ns;
  return { story: "tausch", a: { big, small, k, nb, ns, swapped: nb * k }, pic: { scales: [[[[big, 1]], [[small, k]]], [[[big, nb], [small, ns]], [["?", 1]]]] }, answer, tool: "ersetzen", key: `t${big}${k}${nb}${ns}` };
}

/** two scales: 1 A = k B, 1 B = m C. n A = ? C */
function twoTask(r, level) {
  const [big, mid, small] = r.pick(TRIOS);
  const k = r.int(2, level === 2 ? 4 : 6);
  const m = r.int(2, level === 2 ? 4 : 6);
  const n = r.int(2, level === 2 ? 4 : 9);
  const answer = n * k * m;
  if (answer > 999) return twoTask(r, level);
  return { story: "zwei", a: { big, mid, small, k, m, n, nk: n * k, per: k * m }, pic: { scales: [[[[big, 1]], [[mid, k]]], [[[mid, 1]], [[small, m]]]] }, answer, tool: "zwei", key: `z${big}${k}${m}${n}` };
}

/** a basket with c same things weighs w; the basket alone weighs b. One thing? */
function basketTask(r) {
  const thing = r.pick(["melone", "kuerbis", "ananas"]);
  const c = r.int(3, 8);
  const each = r.int(2, 6);
  const b = r.int(1, 4);
  return { story: "korb", a: { thing, c, b, w: b + c * each, rest: c * each }, answer: each, tool: "abziehen", key: `k${thing}${c}${each}${b}` };
}

/** two together weigh s, one is d heavier: the heavier one? */
function sumTask(r, level) {
  const story = r.pick(["taschen", "hunde", "kisten"]);
  const light = level === 3 ? r.int(2, 15) : r.int(10, 60);
  const d = r.int(1, level === 3 ? 8 : 25);
  const heavy = light + d;
  return { story, a: { s: light + heavy, d, light, twice: 2 * heavy }, answer: heavy, tool: "summe", key: `s${story}${light}${d}` };
}

/** three things weighed in pairs: A + B, B + C, A + C. All three (level 3) or one of them (level 4). */
function threeTask(r, level) {
  const [x, y, z] = ["hund", "katze", "hase"];
  const [wx, wy, wz] = [r.int(8, 30), r.int(3, 7), r.int(1, 3)];
  const all = wx + wy + wz;
  const a = { x, y, z, xy: wx + wy, yz: wy + wz, xz: wx + wz, sum: 2 * all, all };
  if (level === 3) return { story: "drei", a, answer: all, tool: "drei", key: `d${wx}${wy}${wz}` };
  return { story: "dreieins", a: { ...a, ask: y, without: a.xz }, answer: wy, tool: "drei", key: `de${wx}${wy}${wz}` };
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** p A = q B, u B = v C. How many C for n A? */
function chainTask(r) {
  const [big, mid, small] = r.pick(TRIOS);
  const wc = r.int(2, 5);
  const wb = wc + r.int(1, 4);
  const wa = wb + r.int(1, 5);
  const g1 = gcd(wa, wb);
  const g2 = gcd(wb, wc);
  const [p, q, u, v] = [wb / g1, wa / g1, wc / g2, wb / g2];
  if (p === 1 && u === 1) return chainTask(r);
  const step = wc / gcd(wa, wc);
  const n = step * r.int(1, Math.max(1, Math.floor(40 / step)));
  const answer = (n * wa) / wc;
  if (answer > 999 || n < 2) return chainTask(r);
  return { story: "kette", a: { big, mid, small, p, q, u, v, n, step, wa, wb, wc, stepC: (step * wa) / wc, times: n / step }, pic: { scales: [[[[big, p]], [[mid, q]]], [[[mid, u]], [[small, v]]]] }, answer, tool: "kette", key: `c${wa}${wb}${wc}${n}` };
}

/** weights 1, 3, 9 (each once) on both sides of a package */
function weightTask(r) {
  const n = r.int(2, 13);
  const w = ternary(n);
  if (!w.left.length && r.chance(0.6)) return weightTask(r);
  return { story: "gewichte", a: w, pic: { weights: { left: w.left, right: w.right } }, answer: n, tool: "gewichte", key: `g${n}` };
}

/** Where the weights 1, 3, 9 go for a package of n kg on the left (balanced ternary). */
export function ternary(n) {
  const left = [];
  const right = [];
  // balanced ternary: n = Σ d · 3^i with d ∈ {−1, 0, 1}
  let x = n;
  for (const w of WEIGHTS) {
    const d = ((x % 3) + 3) % 3;
    if (d === 1) right.push(w), (x -= 1);
    else if (d === 2) left.push(w), (x += 1);
    x /= 3;
  }
  return { left, right, l: left.reduce((s, w) => s + w, 0), r: right.reduce((s, w) => s + w, 0) };
}

/** Kombi with camp 4: full, then with half the things: the empty basket? */
function halfTask(r) {
  const story = r.pick(["kiste", "picknick"]);
  const b = r.int(1, 6);
  const things = 2 * r.int(3, 15);
  const full = b + things;
  const half = b + things / 2;
  return { story, a: { full, half, gone: full - half, things }, answer: b, tool: "rueck", key: `h${story}${b}${things}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return halfTask(r);
  if (level === 1) return swapTask(r, 1);
  if (level === 2) return r.pick([() => swapTask(r, 2), () => twoTask(r, 2), () => basketTask(r)])();
  if (level === 3) return r.pick([() => twoTask(r, 3), () => sumTask(r, 3), () => threeTask(r, 3), () => basketTask(r)])();
  return r.pick([() => sumTask(r, 4), () => threeTask(r, 4), () => chainTask(r), () => weightTask(r)])();
}

/** Ausprobieren: put apples on the scale until it is level (1, 2); weights on both sides (3, 4). */
function handsOn(r, level) {
  if (level <= 2) {
    const t = swapTask(r, level);
    return { ...t, mode: "fill", key: `m${t.key}` };
  }
  const n = r.int(level === 3 ? 2 : 5, 13);
  const thing = r.pick(["paket", "kuerbis", "melone", "kiste"]);
  return { mode: "weights", story: "gewichte", a: { n, thing, ...ternary(n) }, answer: n, tool: "gewichte", key: `mg${thing}${n}` };
}

/** Regel finden: 1, 2, 3 big ones in a table, then many. */
function ruleTask(r, level) {
  if (level === 1) {
    const t = swapTask(r, 1);
    return { ...t, table: { id: "tausch", rows: [1, 2, 3].map((i) => [i, i * t.a.k]), next: [4, 4 * t.a.k] } };
  }
  if (level === 2 || (level === 3 && r.chance(0.5))) {
    const t = twoTask(r, level);
    const per = t.a.k * t.a.m;
    return { ...t, table: { id: "zwei", rows: [1, 2, 3].map((i) => [i, i * per]), next: [4, 4 * per] } };
  }
  const t = chainTask(r);
  const s = t.a.step;
  return { ...t, table: { id: "kette", rows: [1, 2, 3].map((i) => [i * s, (i * s * t.a.wa) / t.a.wc]), next: [4 * s, (4 * s * t.a.wa) / t.a.wc] } };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["rest", "all", "add", "once", "basket", "other", "half", "twice", "side", "books"];

function owlOptions(t) {
  const a = t.a;
  switch (t.story) {
    case "tausch": return [[a.nb * a.k, "rest"], [(a.nb + a.ns) * a.k, "all"], [a.nb + a.k + a.ns, "add"]];
    case "zwei": return [[a.n * a.k, "once"], [a.n * (a.k + a.m), "add"]];
    case "korb": return [[Math.round(a.w / a.c), "basket"]];
    case "taschen": case "hunde": case "kisten": return [[a.light, "other"], [a.s / 2, "half"], [a.s - a.d, "half"]];
    case "drei": return [[a.sum, "twice"]];
    case "dreieins": return [[a.all, "twice"], [a.xy - a.yz + a.xz, "twice"]];
    case "kette": return [[(a.n * a.wa) / a.wb, "once"], [a.n + (a.q - a.p) + (a.v - a.u), "add"]];
    case "gewichte": return [[a.r + a.l, "side"], [a.r, "side"]];
    case "kiste": case "picknick": return [[a.gone, "books"], [a.half - a.gone / 2, "half"]];
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
    const wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k >= 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. Every answer is weighed again. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a ?? {};
  // Weigh with real weights: give each thing a weight that makes the given scales true.
  const want = {
    tausch: () => a.nb * a.k + a.ns,
    zwei: () => a.n * a.k * a.m,
    korb: () => (a.w - a.b) / a.c,
    taschen: () => (a.s + a.d) / 2, hunde: () => (a.s + a.d) / 2, kisten: () => (a.s + a.d) / 2,
    drei: () => (a.xy + a.yz + a.xz) / 2,
    dreieins: () => (a.xy + a.yz - a.xz) / 2,
    kette: () => (a.p * a.wa === a.q * a.wb && a.u * a.wb === a.v * a.wc ? (a.n * a.q * a.v) / (a.p * a.u) : NaN),
    gewichte: () => (t.mode === "weights" ? a.n : a.r - a.l),
    kiste: () => a.full - 2 * (a.full - a.half), picknick: () => a.full - 2 * (a.full - a.half),
  }[t.story];
  if (!want) problems.push(`unknown story ${t.story}`);
  else if (want() !== t.answer) problems.push(`answer ${t.answer}, weighed ${want()}`);
  if (t.story === "gewichte" && t.mode !== "weights") {
    const used = [...a.left, ...a.right];
    if (new Set(used).size !== used.length || used.some((w) => !WEIGHTS.includes(w))) problems.push("bad weights");
  }
  if (t.mode === "weights") {
    // every weight from 1 to 13 can be weighed with 1, 3, 9 on both sides
    const ok = [-1, 0, 1].some((x) => [-1, 0, 1].some((y) => [-1, 0, 1].some((z) => x + 3 * y + 9 * z === a.n)));
    if (!ok) problems.push(`cannot weigh ${a.n}`);
  }
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) {
      const f = t.table.id === "tausch" ? x * a.k : t.table.id === "zwei" ? x * a.k * a.m : (x * a.wa) / a.wc;
      if (f !== y || !Number.isInteger(y)) problems.push("bad table");
    }
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
