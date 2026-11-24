// "Wo sind mehr?" – comparing amounts, for about 4 to 6 years.
// Two groups of the same thing appear. The child taps the group with more.
// Higher levels bring closer amounts, then "the same" as a third answer, then "where are fewer?".
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, sound, celebrate, shuffle, randInt, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { things } from "../../shared/things.js";

const ID = "wo-sind-mehr";
const T = await texts(import.meta.url);
const THINGS = things(T);

const STARS_PER_GAME = 5;
const SLOTS = 10; // 5 x 2 places per group

// Levels = the parameters of this game. After every 5 stars the child moves up one level.
//   max     – the most things in one group
//   minDiff – the smallest difference between the groups (big = easy to see)
//   same    – the "same" button is shown, and sometimes both groups are equal
//   fewer   – sometimes the question is "where are fewer?"
const LEVELS = [
  { max: 5, minDiff: 3, same: false, fewer: false },
  { max: 6, minDiff: 2, same: false, fewer: false },
  { max: 8, minDiff: 2, same: false, fewer: false },
  { max: 8, minDiff: 1, same: false, fewer: false },
  { max: 6, minDiff: 1, same: true, fewer: false },
  { max: 10, minDiff: 1, same: true, fewer: false },
  { max: 8, minDiff: 1, same: true, fewer: true },
  { max: 10, minDiff: 1, same: true, fewer: true },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };
const groups = [$("groupA"), $("groupB")];

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let thing = null;
let lastThing = null;
let counts = [0, 0];
let askFewer = false;
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

// ---------- One round

function question() {
  return askFewer ? T.questionFewer(thing) : T.questionMore(thing);
}

function amount(n) {
  return T.amount(n, thing, T.numbers[n]);
}

/** Two amounts for this level. */
function pickCounts(l) {
  if (l.same && Math.random() < 0.25) {
    const n = randInt(1, l.max);
    return [n, n];
  }
  for (;;) {
    const a = randInt(1, l.max);
    const b = randInt(1, l.max);
    if (Math.abs(a - b) >= l.minDiff) return [a, b];
  }
}

function fillGroup(el, n) {
  el.innerHTML = "";
  el.className = "group card";
  el.disabled = false;
  el.setAttribute("aria-label", amount(n));
  const places = new Set(shuffle([...Array(SLOTS).keys()]).slice(0, n));
  for (let i = 0; i < SLOTS; i++) {
    const slot = document.createElement("span");
    slot.className = "slot";
    if (places.has(i)) {
      slot.textContent = thing.icon;
      slot.classList.add("pop");
      slot.style.animationDelay = i * 0.03 + "s";
    }
    el.append(slot);
  }
}

function newRound() {
  const l = LEVELS[level];
  locked = false;
  thing = shuffle(THINGS.filter((t) => t !== lastThing))[0];
  lastThing = thing;
  counts = pickCounts(l);
  askFewer = l.fewer && Math.random() < 0.5;

  groups.forEach((g, i) => fillGroup(g, counts[i]));
  const same = $("same");
  same.hidden = !l.same;
  same.disabled = false;
  same.classList.remove("right", "shake");

  show("round");
  say(question());
}

/** Which answer is right: 0 or 1 (a group), or "same". */
function rightAnswer() {
  const [a, b] = counts;
  if (a === b) return "same";
  const more = a > b ? 0 : 1;
  return askFewer ? 1 - more : more;
}

function showCounts() {
  groups.forEach((g, i) => {
    const badge = document.createElement("span");
    badge.className = "count pop";
    badge.textContent = num(counts[i]);
    g.append(badge);
  });
}

function praise(answer) {
  const [a, b] = counts;
  if (answer === "same") return T.rightSame(a, amount(a));
  const here = counts[answer];
  const there = counts[1 - answer];
  return askFewer ? T.rightFewer(here, amount(here), amount(there)) : T.rightMore(here, amount(here), amount(there));
}

function choose(answer, el) {
  if (locked) return;

  if (answer !== rightAnswer()) {
    progress.answer(ID, false);
    sound.wrong();
    say(T.lookAgain);
    el.classList.remove("shake");
    void el.offsetWidth; // restart the animation
    el.classList.add("shake");
    if (answer !== "same") el.classList.add("wrong");
    el.disabled = true;
    return;
  }

  locked = true;
  progress.answer(ID, true);
  el.classList.add("right", "bounce");
  for (const g of groups) g.disabled = true;
  $("same").disabled = true;
  showCounts();
  sound.right();
  stars++;
  drawStars();

  // Next task as soon as the praise is spoken (at least 1.2 s, so the numbers can be seen).
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(praise(answer)), wait(1200)]).then(() => setTimeout(next, 300));
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
$("home").innerHTML = icons.home;
$("speak").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("again").innerHTML = icons.again;

groups.forEach((g, i) => g.addEventListener("click", () => choose(i, g)));
$("same").addEventListener("click", () => choose("same", $("same")));
$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
