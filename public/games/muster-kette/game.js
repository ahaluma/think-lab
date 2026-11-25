// "Muster-Kette" – continue a pattern, for about 3 to 12 years.
// A chain of animals, fruit or flowers repeats a pattern (🍎🍌🍎🍌…). One bead is empty:
// the child taps what belongs there. First at the end ("what comes next?"),
// in later levels somewhere in the middle ("what is missing?").
// Levels go from AB to ABB, ABC and AABB, then mixed, then the gap moves into the middle (see levels.js).
// For older children four more kinds of chain (level "kind"):
//   grow    – a pattern that grows: 🍎🍌 / 🍎🍎🍌 / 🍎🍎🍎🍌 / … one row per step
//   numbers – number sequences: 2, 4, 6, 8, ?  (also backwards, steps up to 25, up to 100)
//   two     – two features at once: the shape follows one pattern, the colour another (🔴🟦🟡🔴🟦🟡 …)
//   mix     – one of the other levels each round
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

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
let hint = ""; // what to say after the second wrong answer
let misses = 0;
let locked = false;

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

// 3, 5, 7, 9, ?  Steps up or down, numbers from 0 to `max`.
function numberChain(l) {
  const length = 6;
  const step = oneOf(l.steps.filter((x) => x * (length - 1) <= l.max));
  const down = l.down && Math.random() < 0.5;
  const span = step * (length - 1);
  const low = randInt(0, Math.max(0, l.max - span));
  const values = Array.from({ length }, (_, i) => (down ? low + span - i * step : low + i * step));
  const bead = (n) => ({ key: "n" + n, icon: num(n), label: String(n) });
  chain = values.map(bead);
  placeGap(l, length);
  cols = length;
  rows = cut(length, cols);
  unit = 0;
  const n = values[gap];
  const near = shuffle([n + step, n - step, n + 1, n - 1, n + 10, n - 10]).filter((x) => x >= 0 && x !== n);
  choices = pickChoices(chain[gap], near.map(bead));
  hint = down ? T.stepBack(num(step)) : T.stepOn(num(step));
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

const MAKERS = { pattern: patternChain, grow: growChain, numbers: numberChain, two: twoChain };

function drawChain() {
  const el = $("chain");
  el.innerHTML = "";
  el.className = `chain card kind-${current.kind || "pattern"}` + (cols > 4 ? " wide" : "");
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
  } else if (current.kind === "numbers") {
    const i = gap >= 2 ? 0 : gap + 1;
    beadAt(i).classList.add("unit");
    beadAt(i + 1).classList.add("unit");
  }
}

// ---------- One round

function question() {
  if (current.kind === "numbers") return current.gap === "end" ? T.nextNumber : T.missingNumber;
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
  MAKERS[current.kind || "pattern"](current);
  drawChain();
  drawChoices();
  show("round");
  await say(question());
  locked = false;
}

// Three big buttons.
function drawChoices() {
  const box = $("choices");
  box.innerHTML = "";
  box.classList.toggle("nums", current.kind === "numbers");
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

async function choose(b, picked) {
  if (locked) return;
  const answer = chain[gap];

  if (picked.key !== answer.key) {
    play.answer(false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    misses++;
    if (misses >= 2) showUnit();
    locked = true;
    const first = current.kind === "numbers" ? T.lookNumbers : current.kind ? hint : T.lookAgain;
    await say(oops(misses >= 2 ? hint : first));
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  b.classList.add("right", "bounce");
  const bead = beadAt(gap);
  bead.classList.remove("gap");
  bead.classList.add("filled", "bounce");
  bead.textContent = answer.icon;
  sound.right();
  play.solved();
  stars++;
  drawStars();

  const text = current.gap === "end" ? T.rightNext : T.rightMissing;
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(text)), wait(1200)]).then(() => setTimeout(next, 300));
}

function finish() {
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
