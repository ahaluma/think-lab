// The chains of "Muster-Kette": one function makes one chain (see shared/gen.js).
//
//   task(level, r, thingIds?) → one chain as plain data, no texts:
//     level   – the id of the level the chain is from (in "mix" levels one of the others)
//     chain   – the beads, the gap included. A bead is { key } plus
//               { thing } (id from shared/things.js), { value } (a number) or { shape, color } (two features)
//     rows    – the chain cut into rows of bead indexes; cols – beads per row
//     unit    – length of the part that repeats (0: no repeating part, e.g. numbers)
//     gap     – index of the empty bead (answer: the same, for tools/check-tasks.mjs)
//     choices – three beads to choose from, the right one among them
//     hint    – [name of the text in lang/<language>.js, ...numbers for it], said after two wrong answers
//     seq     – famous chains: which sequence ("square", "fibonacci" …), else ""
//     key     – the whole chain, for "not the same chain again"
//     look    – what the chain is made of (the things, colours or the first number), for "not the same look again"

import { THING_IDS } from "../../shared/things.js";
import { LEVELS } from "./levels.js";

const CHOICES = 3;
const MAX_BEADS = 12;

const thingBead = (id) => ({ key: id, thing: id });
export const numberBead = (n) => ({ key: "n" + n, value: n });
const twoBead = (shape, color) => ({ key: shape + color, shape, color });

/** Rows of `n` beads: [[0,1,2,3],[4,5,6,7],…]. */
function cut(length, n) {
  const out = [];
  for (let i = 0; i < length; i += n) out.push(Array.from({ length: Math.min(n, length - i) }, (_, k) => i + k));
  return out;
}

/** End gap: the last bead. Middle gap: never first or last. */
const placeGap = (l, length, r) => (l.gap === "end" ? length - 1 : r.int(1, length - 2));

/** Three choices: the answer plus others, in random order. */
function pickChoices(answer, others, r) {
  const seen = new Set([answer.key]);
  const list = [answer];
  for (const o of others) {
    if (list.length >= CHOICES) break;
    if (!seen.has(o.key)) seen.add(o.key), list.push(o);
  }
  return r.shuffle(list);
}

// AB, ABB, ABC, AABB with different things for A, B, C. A row always holds whole patterns,
// so the same things stand under each other.
function patternChain(l, r, thingIds) {
  const pat = r.pick(l.pats);
  const unit = pat.length;
  const letters = [...new Set(pat)];
  const picked = r.sample(thingIds, letters.length);
  const of = Object.fromEntries(letters.map((ch, i) => [ch, thingBead(picked[i])]));
  const length =
    l.gap === "end" ? Math.min(unit * l.reps + r.int(0, unit - 1), MAX_BEADS - 1) + 1 : Math.min(unit * 3, MAX_BEADS);
  const chain = Array.from({ length }, (_, i) => of[pat[i % unit]]);
  const gap = placeGap(l, length, r);
  const cols = unit === 3 ? 6 : 4;
  const others = r.shuffle(thingIds.filter((t) => !picked.includes(t))).map(thingBead);
  const choices = pickChoices(chain[gap], [...r.shuffle(Object.values(of)), ...others], r);
  return { chain, rows: cut(length, cols), cols, unit, gap, choices, hint: ["lookAgain"] };
}

// A grows by one each step: A B / A A B / A A A B … One row per step.
function growChain(l, r, thingIds) {
  const [a, b, c] = r.sample(thingIds, 3).map(thingBead);
  const steps = l.gap === "end" ? 3 : 4;
  const chain = [];
  const rows = [];
  for (let k = 1; k <= steps; k++) {
    const row = [];
    for (let i = 0; i < k; i++) row.push(chain.push(a) - 1);
    row.push(chain.push(b) - 1);
    rows.push(row);
  }
  let gap;
  if (l.gap === "end") {
    // The next step has begun: some A's, then the gap (an A, or the B that closes it).
    const shown = r.int(1, steps + 2);
    const row = [];
    for (let i = 0; i < shown; i++) row.push(chain.push(i < steps + 1 ? a : b) - 1);
    rows.push(row);
    gap = chain.length - 1;
  } else {
    // In a later step, near its end, but never the very last bead (that would be a gap at the end).
    const k = r.int(1, rows.length - 1);
    gap = rows[k].at(-1 - r.int(k === rows.length - 1 ? 1 : 0, 1));
  }
  const choices = pickChoices(chain[gap], r.shuffle([a, b, c]), r);
  return { chain, rows, cols: steps + 2, unit: 0, gap, choices, hint: ["lookGrow"] };
}

// ---------- Number chains. All of them: six numbers (times: five when the factor is big), one is the gap.

/** The chain from the numbers. near(n): wrong answers that look right; hintFor(gap): the hint. */
function numberChain(l, r, values, near, hintFor) {
  const chain = values.map(numberBead);
  const gap = placeGap(l, values.length, r);
  const n = values[gap];
  // Near 0 few of these are left (0, 2, 4 … 10: only 1), so then simply the next numbers up.
  const more = Array.from({ length: 20 }, (_, k) => n + 3 + k);
  const wrong = [...near(n, values), n + 1, n - 1, n + 2, n - 2, n + 10, n - 10, ...more].filter(
    (x) => Number.isInteger(x) && x >= 0 && x <= 1000 && !values.includes(x),
  );
  const choices = pickChoices(chain[gap], [...new Set(wrong)].slice(0, 6).map(numberBead), r);
  const cols = values.length;
  return { chain, rows: cut(values.length, cols), cols, unit: 0, gap, choices, hint: hintFor(gap, values) };
}

// 3, 5, 7, 9, ?  Steps up or down, numbers from 0 to `max`.
function stepChain(l, r) {
  const length = 6;
  const step = r.pick(l.steps.filter((x) => x * (length - 1) <= l.max));
  const down = !!l.down && r.chance(0.5);
  const span = step * (length - 1);
  const low = r.int(0, Math.max(0, l.max - span));
  const values = Array.from({ length }, (_, i) => (down ? low + span - i * step : low + i * step));
  return numberChain(l, r, values, (n) => r.shuffle([n + step, n - step, n + 10, n - 10]).filter((x) => x >= 0), () =>
    [down ? "stepBack" : "stepOn", step],
  );
}

// 3, 6, 12, 24, 48, ?  or backwards 729, 243, 81, 27, 9, ?  Times f, or divided by f (the same chain,
// read backwards, so every number is a whole number).
function timesChain(l, r) {
  const fits = (f, length) => f ** (length - 1) <= l.max;
  const f = r.pick(l.factors.filter((x) => fits(x, 5)));
  const length = fits(f, 6) ? 6 : 5;
  const start = r.int(1, Math.min(12, Math.floor(l.max / f ** (length - 1))));
  const values = Array.from({ length }, (_, i) => start * f ** i);
  const down = l.down === "only" || (!!l.down && r.chance(0.5));
  if (down) values.reverse();
  // Typical mistakes: one step of the wrong size, adding instead of multiplying.
  const near = (n) => r.shuffle([n + f, n - f, (n / f) * (f + 1), (n / f) * (f - 1), n * f, n / f]);
  return numberChain(l, r, values, near, () => [down ? "timesBack" : "timesOn", f]);
}

// 2, 3, 5, 8, 12, ?  The step grows by `grow` each time (+1, +2, +3, +4 …).
function growStepsChain(l, r) {
  const by = r.pick(l.grow);
  const first = r.int(1, 6);
  let value = r.int(1, 30);
  const values = [value];
  for (let i = 0; i < 5; i++) values.push((value += first + i * by));
  const near = (n) => {
    const i = values.indexOf(n);
    const lastStep = i > 0 ? n - values[i - 1] : values[1] - n;
    return r.shuffle([n - by, n + by, n + lastStep, n - lastStep]);
  };
  return numberChain(l, r, values, near, () => ["stepsGrow", first, first + by, by]);
}

// Well-known sequences, a window of six numbers somewhere in them (up to `max`):
const SEQUENCES = {
  square: (max) => series((k) => k * k, max), // 1, 4, 9, 16, 25 …
  triangle: (max) => series((k) => (k * (k + 1)) / 2, max), // 1, 3, 6, 10, 15 … (one more each time)
  fibonacci: (max) => fibonacci(1, 1, max), // 1, 1, 2, 3, 5, 8, 13 …
  "fibonacci-own": (max, r) => {
    const a = r.int(1, 9);
    return fibonacci(a, a + r.int(1, 8), max); // other start numbers: 4, 7, 11, 18, 29 …
  },
  prime: (max) => series((k) => k, max).filter(isPrime), // 2, 3, 5, 7, 11, 13 …
};
function series(f, max) {
  const out = [];
  for (let k = 1; f(k) <= max; k++) out.push(f(k));
  return out;
}
function fibonacci(a, b, max) {
  const out = [a, b];
  while (out.at(-1) + out.at(-2) <= max) out.push(out.at(-1) + out.at(-2));
  return out;
}
export function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

function famousChain(l, r) {
  const seq = r.pick(l.seqs);
  const all = SEQUENCES[seq](l.max, r);
  const from = seq === "fibonacci-own" ? 0 : r.int(0, all.length - 6);
  const values = all.slice(from, from + 6);
  const near = {
    // Squares: the neighbours of k·k, and 2·k instead of k·k
    square: (n) => r.shuffle([n + 1, n - 1, Math.sqrt(n) * 2, n + Math.sqrt(n)]),
    // Triangular numbers: one step too many or too few
    triangle: (n) => {
      const i = values.indexOf(n);
      const step = i > 0 ? n - values[i - 1] : values[1] - n;
      return r.shuffle([n + 1, n - 1, n + step, n - step + 1]);
    },
    // Fibonacci: adding only the last step, or one number too many
    fibonacci: (n) => {
      const i = values.indexOf(n);
      return r.shuffle([i >= 2 ? values[i - 1] * 2 : n + 1, i >= 1 ? n + values[i - 1] : n * 2, n + 2]);
    },
    // Primes: the odd numbers in between are not prime
    prime: (n) => r.shuffle([n + 2, n - 2, n + 4, n - 4].filter((x) => x > 1 && !isPrime(x))),
  };
  near["fibonacci-own"] = near.fibonacci;
  const t = numberChain(l, r, values, near[seq], (g) => {
    if (seq === "square") {
      const i = g > 0 ? g - 1 : 1; // a square next to the gap that the child can see
      return ["squares", Math.round(Math.sqrt(values[i])), values[i]];
    }
    if (seq === "triangle") return ["triangles"];
    if (seq === "prime") return ["primes"];
    // Fibonacci: two numbers and their sum, all three visible
    const i = [0, 1, 2, 3].find((k) => ![k, k + 1, k + 2].includes(g));
    return ["fibonacci", values[i], values[i + 1], values[i + 2]];
  });
  return { ...t, seq };
}

// Two features: the shape follows one pattern, the colour another (AB × AABB, AB × ABC …).
export const SHAPES = ["circle", "square", "heart"];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function twoChain(l, r) {
  const [shapePat, colorPat] = r.shuffle(r.pick(l.pairs).split("+"));
  const shapes = r.shuffle(SHAPES);
  const colors = r.shuffle([0, 1, 2, 3, 4, 5]);
  const letter = (pat, i) => pat.charCodeAt(i % pat.length) - 65; // "A" → 0
  const unit = (shapePat.length * colorPat.length) / gcd(shapePat.length, colorPat.length);
  const length = 12;
  const chain = Array.from({ length }, (_, i) => twoBead(shapes[letter(shapePat, i)], colors[letter(colorPat, i)]));
  const gap = placeGap(l, length, r);
  const cols = unit === 4 ? 4 : 6;
  // Wrong on purpose: the right shape in another colour, the right colour in another shape.
  const shape = shapes[letter(shapePat, gap)];
  const color = colors[letter(colorPat, gap)];
  const usedColors = [...new Set(chain.map((b) => b.color))];
  const otherColor = r.shuffle(usedColors.filter((c) => c !== color))[0] ?? colors[5];
  const otherShape = r.shuffle(shapes.filter((s) => s !== shape))[0];
  const choices = pickChoices(
    chain[gap],
    [twoBead(shape, otherColor), twoBead(otherShape, color), twoBead(otherShape, otherColor)],
    r,
  );
  return { chain, rows: cut(length, cols), cols, unit, gap, choices, hint: ["lookTwo"] };
}

const MAKERS = {
  pattern: patternChain,
  grow: growChain,
  numbers: stepChain,
  two: twoChain,
  times: timesChain,
  steps: growStepsChain,
  famous: famousChain,
};

export function task(level, r, thingIds = THING_IDS) {
  const id = level.kind === "mix" ? r.pick(level.levels) : level.id;
  const l = LEVELS.find((x) => x.id === id);
  const t = { seq: "", ...MAKERS[l.kind || "pattern"](l, r, thingIds) };
  const look = t.chain[0].value !== undefined
    ? t.chain[0].value
    : [...new Set(t.chain.map((b) => b.thing ?? b.color))].sort().join();
  return { level: l.id, ...t, answer: t.gap, key: t.chain.map((b) => b.key).join(), look };
}

/** Problems with a chain (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const l = LEVELS.find((x) => x.id === t.level);
  if (level.kind === "mix" ? !level.levels.includes(t.level) : t.level !== level.id) problems.push("wrong level");
  if (t.gap < 0 || t.gap >= t.chain.length) problems.push("gap outside the chain");
  if (l.gap === "end" && t.gap !== t.chain.length - 1) problems.push("gap not at the end");
  if (l.gap === "middle" && (t.gap === 0 || t.gap === t.chain.length - 1)) problems.push("gap not in the middle");
  if (t.choices.length !== CHOICES) problems.push("not three choices");
  if (new Set(t.choices.map((c) => c.key)).size !== t.choices.length) problems.push("two choices the same");
  if (t.choices.filter((c) => c.key === t.chain[t.gap].key).length !== 1) problems.push("right answer not among the choices");
  if (t.rows.flat().join() !== t.chain.map((_, i) => i).join()) problems.push("rows do not hold the chain");
  if (t.chain.length > MAX_BEADS + 6) problems.push("chain too long");
  const nums = t.chain.filter((b) => b.value !== undefined).map((b) => b.value);
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > (l.max ?? 1000))) problems.push("number out of range");
  if (t.choices.some((c) => c.value !== undefined && (!Number.isInteger(c.value) || c.value < 0))) problems.push("bad number choice");
  return problems;
}
