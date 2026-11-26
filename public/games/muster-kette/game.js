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
// Every chain comes from task() in tasks.js (shared/gen.js); this file only draws it.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";
import { numpad } from "../../shared/numpad.js";
import * as profiles from "../../shared/profiles.js";
import * as gen from "../../shared/gen.js";
import { task, numberBead } from "./tasks.js";

const ID = "muster-kette";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! So geht die Kette weiter!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau, was sich wiederholt!"
const THINGS = things(T);
const THING_IDS = THINGS.map((t) => t.id); // only things with a name in this language
const byId = Object.fromEntries(THINGS.map((t) => [t.id, t]));

// Not the same chain twice, and not the same things (or the same first number) as the last chain.
const nextChain = gen.generator(task, { avoid: { key: 6, look: 1 } });

const STARS_PER_GAME = 5;

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

// Two features: the shape follows one pattern, the colour another.
const ICONS = {
  circle: ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣"],
  square: ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"],
  heart: ["❤️", "🧡", "💛", "💚", "💙", "💜"],
};

/** A bead from tasks.js with what is shown and said: { key, icon, label } (numbers: also value). */
function view(b) {
  if (b.thing) return { key: b.key, icon: byId[b.thing].icon, label: byId[b.thing].one };
  if (b.shape) return { key: b.key, icon: ICONS[b.shape][b.color], label: T.shapeColor(T.shapes[b.shape], T.colors[b.color]) };
  return { key: b.key, icon: num(b.value), label: String(b.value), value: b.value };
}

/** The hint text: ["stepOn", 3] → T.stepOn(num(3)); ["triangles"] → T.triangles. */
function hintText([name, ...args]) {
  const text = T[name];
  return typeof text === "function" ? text(...args.map(num)) : text;
}

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
  const t = nextChain(LEVELS[level], THING_IDS);
  current = LEVELS.find((l) => l.id === t.level); // in "mix" levels one of the others
  ({ rows, cols, unit, gap, seq } = t);
  chain = t.chain.map(view);
  choices = t.choices.map(view);
  hint = hintText(t.hint);
  locked = true;
  misses = 0;
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
    pad = numpad(box, T, { digits: 4, onCheck: (n) => choose(null, view(numberBead(n))), display: beadAt(gap) });
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
