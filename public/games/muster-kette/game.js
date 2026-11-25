// "Muster-Kette" – continue a pattern, for about 4 to 6 years.
// A chain of animals, fruit or flowers repeats a pattern (🍎🍌🍎🍌…). One bead is empty:
// the child taps what belongs there. First at the end ("what comes next?"),
// in later levels somewhere in the middle ("what is missing?").
// Levels go from AB to ABB, ABC and AABB, then mixed, then the gap moves into the middle (see LEVELS).
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { things } from "../../shared/things.js";

const ID = "muster-kette";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! So geht die Kette weiter!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau, was sich wiederholt!"
const THINGS = things(T);

const STARS_PER_GAME = 5;
const CHOICES = 3;
const MAX_BEADS = 12;

// Levels = the parameters of this game. After every 5 stars the child moves up one level.
//   pats – the patterns, one is picked each round. Letters stand for things: "ABB" = 🍎🍌🍌🍎🍌🍌…
//   gap  – "end": what comes next?  "middle": what is missing in the chain?
//   reps – how many times the pattern is shown before the gap (end only)
const LEVELS = [
  { pats: ["AB"], gap: "end", reps: 2 },
  { pats: ["AB"], gap: "end", reps: 3 },
  { pats: ["ABB"], gap: "end", reps: 2 },
  { pats: ["ABC"], gap: "end", reps: 2 },
  { pats: ["AABB"], gap: "end", reps: 2 },
  { pats: ["AB", "ABB", "ABC", "AABB"], gap: "end", reps: 2 },
  { pats: ["AB"], gap: "middle" },
  { pats: ["ABB", "ABC"], gap: "middle" },
  { pats: ["AB", "ABB", "ABC", "AABB"], gap: "middle" },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let chain = []; // the things in the chain, the gap included
let unit = 0; // length of the pattern
let gap = 0; // index of the empty bead
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

// Builds the chain for a pattern like "ABB" with different things for A, B, C.
function makeChain(l) {
  const pat = oneOf(l.pats);
  unit = pat.length;
  const letters = [...new Set(pat)];
  const picked = shuffle(THINGS).slice(0, letters.length);
  const of = Object.fromEntries(letters.map((ch, i) => [ch, picked[i]]));

  let length;
  if (l.gap === "end") {
    // Show the pattern 2 or 3 times, sometimes plus a part of it. The next bead is the gap.
    const shown = Math.min(unit * l.reps + randInt(0, unit - 1), MAX_BEADS - 1);
    length = shown + 1;
    gap = shown;
  } else {
    // Three times the pattern. The gap is somewhere in the middle, never first or last.
    length = Math.min(unit * 3, MAX_BEADS);
    gap = randInt(1, length - 2);
  }
  chain = Array.from({ length }, (_, i) => of[pat[i % unit]]);
  return picked;
}

function drawChain() {
  const el = $("chain");
  el.innerHTML = "";
  el.classList.toggle("six", unit === 3); // AB and AABB: 4 in a row; ABB and ABC: 6 in a row
  chain.forEach((thing, i) => {
    const bead = document.createElement("span");
    bead.className = "bead";
    if (i === gap) {
      bead.classList.add("gap");
      bead.textContent = "?";
    } else {
      bead.textContent = thing.icon;
    }
    el.append(bead);
  });
}

// After two wrong answers the first pattern is marked, so the child can see what repeats.
function showUnit() {
  const beads = $("chain").children;
  const start = gap >= unit ? 0 : unit; // a part without the gap
  for (let i = start; i < start + unit; i++) beads[i].classList.add("unit");
}

// ---------- One round

function question() {
  return LEVELS[level].gap === "end" ? T.next : T.missing;
}

async function newRound() {
  const l = LEVELS[level];
  locked = true;
  misses = 0;
  const used = makeChain(l);
  drawChain();
  drawChoices(used);
  show("round");
  await say(question());
  locked = false;
}

// Three big buttons: the things of the pattern, plus other things if the pattern has fewer.
function drawChoices(used) {
  const others = shuffle(THINGS.filter((t) => !used.includes(t)));
  const list = shuffle([...used, ...others].slice(0, CHOICES));
  const box = $("choices");
  box.innerHTML = "";
  for (const thing of list) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn choice";
    b.setAttribute("aria-label", thing.one);
    b.textContent = thing.icon;
    b.addEventListener("click", () => choose(b, thing));
    box.append(b);
  }
}

async function choose(b, thing) {
  if (locked) return;
  const answer = chain[gap];

  if (thing !== answer) {
    progress.answer(ID, false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    misses++;
    if (misses >= 2) showUnit();
    locked = true;
    await say(oops(T.lookAgain));
    locked = false;
    return;
  }

  locked = true;
  progress.answer(ID, true);
  b.classList.add("right", "bounce");
  const bead = $("chain").children[gap];
  bead.classList.remove("gap");
  bead.classList.add("filled", "bounce");
  bead.textContent = answer.icon;
  sound.right();
  stars++;
  drawStars();

  const text = LEVELS[level].gap === "end" ? T.rightNext : T.rightMissing;
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(text)), wait(1200)]).then(() => setTimeout(next, 300));
}

function finish() {
  level = Math.min(level + 1, LEVELS.length - 1);
  progress.round(ID, level, LEVELS.length);
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
