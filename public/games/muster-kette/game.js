// "Muster-Kette" – continue a pattern, for about 3 to 12 years.
// A chain of animals, fruit or flowers repeats a pattern (🍎🍌🍎🍌…). One bead is empty:
// the child taps what belongs there. First at the end ("what comes next?"),
// in later levels somewhere in the middle ("what is missing?").
// Levels go from AB to ABB, ABC and AABB, then mixed, then the gap moves into the middle (see levels.js).
// For older children more kinds of chain (level "kind"):
//   grow    – a pattern that grows: 🍎🍌 / 🍎🍎🍌 / 🍎🍎🍎🍌 / … one row per step
//   numbers – number sequences: 2, 4, 6, 8, ?  (also backwards, steps up to 20, up to 100)
//   two     – two features at once: the shape follows one pattern, the colour another (🔴🟦🟡🔴🟦🟡 …)
//   times   – times and divided-by sequences: 3, 6, 12, 24, ?  or  729, 243, 81, 27, ?  (up to 1000)
//   steps   – the step grows each time: 2, 3, 5, 8, 12, ?  (+1, +2, +3, +4 …)
//   famous  – well-known sequences: square numbers, triangular numbers, Fibonacci, primes
//   mix     – one of the other levels each round
// Number chains: from 8 years (profiles.typeAnswers) the child types the number on the number pad
// (shared/numpad.js) instead of picking one of three. Then the hint comes after 5 wrong tries, the
// answer after 7, so nobody gets stuck.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";
import { numpad } from "../../shared/numpad.js";
import * as profiles from "../../shared/profiles.js";

const ID = "muster-kette";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! So geht die Kette weiter!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau, was sich wiederholt!"
const THINGS = things(T);

const STARS_PER_GAME = 5;
const CHOICES = 3;
const MAX_BEADS = 12;

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let stars = 0;
let current = null; // the level of this round (in "mix" levels one of the others)
let chain = []; // the beads { key, icon, label }, the gap included
let rows = []; // the chain cut into rows of bead indexes
let cols = 4; // beads per row
let unit = 0; // length of the part that repeats (0: no repeating part, e.g. numbers)
let gap = 0; // index of the empty bead
let choices = []; // beads to choose from
let hint = ""; // what to say with the hint (after the second wrong answer, typing: the fifth)
let seq = ""; // famous chains: which sequence ("square", "fibonacci" …)
let misses = 0;
let locked = false;
// Older children type number answers on a number pad instead of picking one of three (profiles.typeAnswers).
const typing = profiles.typeAnswers(profiles.current());
let pad = null;
/** Picking one of three: the hint comes after two wrong answers. Typing: the child tries longer by
 *  themselves, the hint (no answer in it) comes after five, the answer after seven. */
const SHOW_AFTER = 7;
const NUMBER_KINDS = ["numbers", "times", "steps", "famous"];
const isNumbers = () => NUMBER_KINDS.includes(current.kind);
const typed = () => typing && isNumbers();
const helpAfter = () => (typed() ? 5 : 2);

// ---------- Screens

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function drawStars() {
  $("stars").innerHTML = "";
  for (let i = 0; i < STARS_PER_GAME; i++) {
    const li = document.createElement("li");
    li.textContent = "⭐";
    if (i < stars) li.className = "on";
    $("stars").append(li);
  }
}

// ---------- The chain
// A row always holds whole patterns, so the same things stand under each other.

const thing = (t) => ({ key: t.id, icon: t.icon, label: t.one });

/** Rows of `n` beads: [[0,1,2,3],[4,5,6,7],…]. */
function cut(length, n) {
  const out = [];
  for (let i = 0; i < length; i += n) out.push(Array.from({ length: Math.min(n, length - i) }, (_, k) => i + k));
  return out;
}

/** End gap: the pattern `reps` times, sometimes plus a part of it. Middle gap: never first or last. */
function placeGap(l, length) {
  gap = l.gap === "end" ? length - 1 : randInt(1, length - 2);
}

/** Three choices: the answer plus others, in random order. */
function pickChoices(answer, others) {
  const seen = new Set([answer.key]);
  const list = [answer];
  for (const o of others) {
    if (list.length >= CHOICES) break;
    if (!seen.has(o.key)) seen.add(o.key), list.push(o);
  }
  return shuffle(list);
}

// AB, ABB, ABC, AABB with different things for A, B, C.
function patternChain(l) {
  const pat = oneOf(l.pats);
  unit = pat.length;
  const letters = [...new Set(pat)];
  const picked = shuffle(THINGS).slice(0, letters.length);
  const of = Object.fromEntries(letters.map((ch, i) => [ch, thing(picked[i])]));
  const length =
    l.gap === "end" ? Math.min(unit * l.reps + randInt(0, unit - 1), MAX_BEADS - 1) + 1 : Math.min(unit * 3, MAX_BEADS);
  chain = Array.from({ length }, (_, i) => of[pat[i % unit]]);
  placeGap(l, length);
  cols = unit === 3 ? 6 : 4;
  rows = cut(length, cols);
  const others = shuffle(THINGS.filter((t) => !picked.includes(t))).map(thing);
  choices = pickChoices(chain[gap], [...shuffle(Object.values(of)), ...others]);
  hint = T.lookAgain;
}

// A grows by one each step: A B / A A B / A A A B … One row per step.
function growChain(l) {
  const [a, b, c] = shuffle(THINGS).slice(0, 3).map(thing);
  const steps = l.gap === "end" ? 3 : 4;
  chain = [];
  rows = [];
  for (let k = 1; k <= steps; k++) {
    const row = [];
    for (let i = 0; i < k; i++) row.push(chain.push(a) - 1);
    row.push(chain.push(b) - 1);
    rows.push(row);
  }
  if (l.gap === "end") {
    // The next step has begun: some A's, then the gap (an A, or the B that closes it).
    const shown = randInt(1, steps + 2);
    const row = [];
    for (let i = 0; i < shown; i++) row.push(chain.push(i < steps + 1 ? a : b) - 1);
    rows.push(row);
    gap = chain.length - 1;
  } else {
    gap = rows[randInt(1, rows.length - 1)].at(-1 - randInt(0, 1)); // in a later step, near its end
  }
  cols = steps + 2;
  unit = 0;
  choices = pickChoices(chain[gap], shuffle([a, b, c]));
  hint = T.lookGrow;
}

// ---------- Number chains. All of them: six numbers, one of them is the gap.

const numberBead = (n) => ({ key: "n" + n, icon: num(n), label: String(n), value: n });

/** Puts the numbers in the chain. near: wrong answers that look right (choices without typing);
 *  helpFor(gap): what to say after the hint, from the numbers of this chain. */
function numberChain(l, values, near, helpFor) {
  chain = values.map(numberBead);
  placeGap(l, values.length);
  cols = values.length;
  rows = cut(values.length, cols);
  unit = 0;
  const n = values[gap];
  const wrong = [...near(n), n + 1, n - 1, n + 2, n - 2, n + 10, n - 10].filter(
    (x) => Number.isInteger(x) && x >= 0 && x <= 1000 && !values.includes(x),
  );
  choices = pickChoices(chain[gap], [...new Set(wrong)].slice(0, 6).map(numberBead));
  hint = helpFor(gap);
}

// 3, 5, 7, 9, ?  Steps up or down, numbers from 0 to `max`.
function stepChain(l) {
  const length = 6;
  const step = oneOf(l.steps.filter((x) => x * (length - 1) <= l.max));
  const down = l.down && Math.random() < 0.5;
  const span = step * (length - 1);
  const low = randInt(0, Math.max(0, l.max - span));
  const values = Array.from({ length }, (_, i) => (down ? low + span - i * step : low + i * step));
  numberChain(l, values, (n) => shuffle([n + step, n - step, n + 10, n - 10]).filter((x) => x >= 0), () =>
    down ? T.stepBack(num(step)) : T.stepOn(num(step)),
  );
}

// 3, 6, 12, 24, 48, ?  or backwards 729, 243, 81, 27, 9, ?  Times f, or divided by f (the same chain,
// read backwards, so every number is a whole number). Six numbers, five when the factor is big.
function timesChain(l) {
  const fits = (f, length) => f ** (length - 1) <= l.max;
  const f = oneOf(l.factors.filter((x) => fits(x, 5)));
  const length = fits(f, 6) ? 6 : 5;
  const start = randInt(1, Math.min(12, Math.floor(l.max / f ** (length - 1))));
  let values = Array.from({ length }, (_, i) => start * f ** i);
  const down = l.down === "only" || (l.down && Math.random() < 0.5);
  if (down) values.reverse();
  // Typical mistakes: one step of the wrong size, adding instead of multiplying.
  const near = (n) => shuffle([n + f, n - f, (n / f) * (f + 1), (n / f) * (f - 1), n * f, n / f]);
  numberChain(
    l,
    values,
    near,
    () => (down ? T.timesBack(num(f)) : T.timesOn(num(f))),
  );
}

// 2, 3, 5, 8, 12, ?  The step grows by `grow` each time (+1, +2, +3, +4 …).
function growStepsChain(l) {
  const by = oneOf(l.grow);
  const first = randInt(1, 6);
  let value = randInt(1, 30);
  const values = [value];
  for (let i = 0; i < 5; i++) values.push((value += first + i * by));
  numberChain(
    l,
    values,
    (n) => {
      const i = values.indexOf(n);
      const lastStep = i > 0 ? n - values[i - 1] : values[1] - n;
      return shuffle([n - by, n + by, n + lastStep, n - lastStep]);
    },
    () => T.stepsGrow(num(first), num(first + by), num(by)),
  );
}

// Well-known sequences, a window of six numbers somewhere in them (up to `max`):
const SEQUENCES = {
  square: (max) => series((k) => k * k, max), // 1, 4, 9, 16, 25 …
  triangle: (max) => series((k) => (k * (k + 1)) / 2, max), // 1, 3, 6, 10, 15 … (one more each time)
  fibonacci: (max) => fibonacci(1, 1, max), // 1, 1, 2, 3, 5, 8, 13 …
  "fibonacci-own": (max) => {
    const a = randInt(1, 9);
    return fibonacci(a, a + randInt(1, 8), max); // other start numbers: 4, 7, 11, 18, 29 …
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
function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

function famousChain(l) {
  const kind = (seq = oneOf(l.seqs));
  const all = SEQUENCES[kind](l.max);
  const from = kind === "fibonacci-own" ? 0 : randInt(0, all.length - 6);
  const values = all.slice(from, from + 6);
  const near = {
    // Squares: the neighbours of k·k, and 2·k instead of k·k
    square: (n) => shuffle([n + 1, n - 1, Math.sqrt(n) * 2, n + Math.sqrt(n)]),
    // Triangular numbers: one step too many or too few
    triangle: (n) => {
      const i = values.indexOf(n);
      const step = i > 0 ? n - values[i - 1] : values[1] - n;
      return shuffle([n + 1, n - 1, n + step, n - step + 1]);
    },
    // Fibonacci: adding only the last step, or one number too many
    fibonacci: (n) => {
      const i = values.indexOf(n);
      return shuffle([i >= 2 ? values[i - 1] * 2 : n + 1, i >= 1 ? n + values[i - 1] : n * 2, n + 2]);
    },
    // Primes: the odd numbers in between are not prime
    prime: (n) => shuffle([n + 2, n - 2, n + 4, n - 4].filter((x) => x > 1 && !isPrime(x))),
  };
  near["fibonacci-own"] = near.fibonacci;
  numberChain(l, values, near[kind], (g) => {
    if (kind === "square") {
      const i = g > 0 ? g - 1 : 1; // a square next to the gap that the child can see
      const k = Math.round(Math.sqrt(values[i]));
      return T.squares(num(k), num(values[i]));
    }
    if (kind === "triangle") return T.triangles;
    if (kind === "prime") return T.primes;
    // Fibonacci: two numbers and their sum, all three visible (or, near the start, the rule only)
    const i = [0, 1, 2, 3].find((k) => ![k, k + 1, k + 2].includes(g));
    return T.fibonacci(num(values[i]), num(values[i + 1]), num(values[i + 2]));
  });
}

// Two features: the shape follows one pattern, the colour another (AB × AABB, AB × ABC …).
const SHAPES = ["circle", "square", "heart"];
const ICONS = {
  circle: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"],
  square: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"],
  heart: ["❤️", "🧡", "💛", "💚", "💙", "💜"],
};
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function twoChain(l) {
  const [shapePat, colorPat] = shuffle(oneOf(l.pairs).split("+"));
  const shapes = shuffle(SHAPES);
  const colors = shuffle([0, 1, 2, 3, 4, 5]);
  const letter = (pat, i) => pat.charCodeAt(i % pat.length) - 65; // "A" → 0
  const bead = (shape, color) => ({
    key: shape + color,
    icon: ICONS[shape][color],
    label: T.shapeColor(T.shapes[shape], T.colors[color]),
  });
  unit = (shapePat.length * colorPat.length) / gcd(shapePat.length, colorPat.length);
  const length = 12;
  chain = Array.from({ length }, (_, i) => bead(shapes[letter(shapePat, i)], colors[letter(colorPat, i)]));
  placeGap(l, length);
  cols = unit === 4 ? 4 : 6;
  rows = cut(length, cols);
  // Wrong on purpose: the right shape in another colour, the right colour in another shape.
  const shape = shapes[letter(shapePat, gap)];
  const color = colors[letter(colorPat, gap)];
  const usedColors = [...new Set(chain.map((b) => b.key.replace(/\D/g, "")))].map(Number);
  const otherColor = shuffle(usedColors.filter((c) => c !== color))[0] ?? colors[5];
  const otherShape = shuffle(shapes.filter((s) => s !== shape))[0];
  choices = pickChoices(chain[gap], [bead(shape, otherColor), bead(otherShape, color), bead(otherShape, otherColor)]);
  hint = T.lookTwo;
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

function drawChain() {
  const el = $("chain");
  el.innerHTML = "";
  const kind = isNumbers() ? "numbers" : current.kind || "pattern";
  const long = isNumbers() && chain.some((b) => b.value >= 100);
  el.className = `chain card kind-${kind}` + (cols > 4 ? " wide" : "") + (long ? " long" : "");
  el.style.setProperty("--cols", cols);
  for (const r of rows) {
    const row = document.createElement("div");
    row.className = "chain-row";
    for (const i of r) {
      const bead = document.createElement("span");
      bead.className = "bead";
      if (i === gap) {
        bead.classList.add("gap");
        bead.textContent = "?";
      } else {
        bead.textContent = chain[i].icon;
      }
      row.append(bead);
    }
    el.append(row);
  }
}

const beadAt = (i) => $("chain").querySelectorAll(".bead")[i];

// After two wrong answers: the part that repeats is marked (with numbers: two neighbours),
// so the child can see the rule.
function showUnit() {
  if (unit && chain.length >= unit * 2) {
    const start = gap >= unit ? 0 : unit; // a part without the gap
    for (let i = start; i < start + unit; i++) beadAt(i).classList.add("unit");
  } else if (isNumbers()) {
    // Fibonacci: the two numbers before the gap (they add up to it); else two neighbours
    const fibo = seq.startsWith("fibonacci") && gap >= 2;
    const i = fibo ? gap - 2 : gap >= 2 ? 0 : gap + 1;
    beadAt(i).classList.add("unit");
    beadAt(i + 1).classList.add("unit");
  }
}

// ---------- One round

function question() {
  if (isNumbers()) return current.gap === "end" ? T.nextNumber : T.missingNumber;
  return current.gap === "end" ? T.next : T.missing;
}

async function newRound() {
  level = play.level;
  current = LEVELS[level];
  if (current.kind === "mix") {
    const id = oneOf(current.levels);
    current = LEVELS.find((l) => l.id === id);
  }
  locked = true;
  misses = 0;
  seq = "";
  MAKERS[current.kind || "pattern"](current);
  drawChain();
  drawChoices();
  show("round");
  pad?.lock(true);
  await say(question());
  locked = false;
  pad?.lock(false);
}

// Three big buttons. Number chains for older children: the number pad, the typed number shows in the gap.
function drawChoices() {
  const box = $("choices");
  pad?.remove();
  pad = null;
  box.className = "choices";
  if (typed()) {
    pad = numpad(box, T, { digits: 4, onCheck: (n) => choose(null, numberBead(n)), display: beadAt(gap) });
    return;
  }
  box.innerHTML = "";
  box.classList.toggle("nums", isNumbers());
  for (const c of choices) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn choice";
    b.setAttribute("aria-label", c.label);
    b.textContent = c.icon;
    b.addEventListener("click", () => choose(b, c));
    box.append(b);
  }
}

/** b: the button tapped, or null when typed on the number pad. Returns whether it was right. */
function choose(b, picked) {
  if (locked) return false;
  if (picked.key !== chain[gap].key) {
    wrong(b);
    return false;
  }
  right(b);
  return true;
}

async function wrong(b) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  if (b) {
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
  } else {
    pad.lock(true);
    if (misses >= SHOW_AFTER) {
      // Typed wrong seven times: show the answer and go on, so nobody gets stuck.
      fillGap();
      await say(`${oneOf(T.oops)} ${T.answerIs(chain[gap].icon)}`);
      play.solved();
      setTimeout(next, 600);
      return;
    }
    pad.clear();
  }
  const help = misses >= helpAfter();
  if (help) showUnit();
  const first = isNumbers() ? T.lookNumbers : current.kind ? hint : T.lookAgain;
  await say(oops(help ? hint : first));
  locked = false;
  pad?.lock(false);
}

/** The right bead in the gap, in green. */
function fillGap() {
  const bead = beadAt(gap);
  bead.className = "bead filled bounce";
  bead.textContent = chain[gap].icon;
}

function right(b) {
  locked = true;
  pad?.lock(true);
  play.answer(true);
  if (b) b.classList.add("right", "bounce");
  fillGap();
  sound.right();
  play.solved();
  stars++;
  drawStars();

  const text = current.gap === "end" ? T.rightNext : T.rightMissing;
  Promise.all([say(cheer(text)), wait(1200)]).then(() => setTimeout(next, 300));
}

/** The next chain, or the trophy after five stars. */
function next() {
  if (stars >= STARS_PER_GAME) finish();
  else newRound();
}

function finish() {
  pad?.remove();
  pad = null;
  play.round();
  show("done");
  sound.win();
  celebrate();
  say(T.wellDone);
}

function startGame() {
  stars = 0;
  drawStars();
  newRound();
}

// ---------- Wire up buttons

fill(T);
document.title = `${T.title} · AnkaPlay`;
homeButton($("home"));
$("speak").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("again").innerHTML = icons.again;

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
