// "Zahlenzug" – the order of numbers, for about 4 to 6 years.
// A train with numbered wagons. The child finds the missing wagon, says what comes before or after
// a number, or hangs the wagons on in the right order. Every right step is read out loud,
// so the child hears the number row again and again.
// Levels go from 1–4 up to numbers near 20 (see LEVELS).
// All texts are in lang/<language>.js; number words are shared (shared/lang).

import { say, sound, celebrate, shuffle, pick, randInt, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";

const ID = "zahlenzug";
const T = await texts(import.meta.url);

const STARS_PER_GAME = 5;
const COLORS = ["#ff8a8a", "#ffc83a", "#7ed68b", "#8fd3ff", "#c9b6ff"];

// Levels = the parameters of this game. After every 5 stars the child moves up one level.
//   kind – "missing": one wagon is missing, "after" / "before": the number after / before one wagon,
//          "mixed": after or before, "order": hang the wagons on from small to big
//   from – the first number of the train (or the shown number for after / before): [lowest, highest]
//   len  – how many wagons ("missing" and "order")
const LEVELS = [
  { kind: "missing", from: [1, 1], len: 4 },
  { kind: "order", from: [1, 1], len: 4 },
  { kind: "missing", from: [1, 1], len: 5 },
  { kind: "after", from: [1, 9] },
  { kind: "order", from: [1, 5], len: 5 },
  { kind: "before", from: [2, 10] },
  { kind: "missing", from: [1, 10], len: 5 },
  { kind: "mixed", from: [2, 19] },
  { kind: "order", from: [1, 10], len: 5 },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };
const word = (n) => T.numbers[n];

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let kind = "missing";
let row = []; // the numbers of the train, small to big
let shown = 0; // "after" / "before": the number on the wagon
let answer = 0; // the number the child has to find
let next = 0; // "order": index of the wagon that comes next
let missed = false; // "order": one wrong tap counts once per round
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

// ---------- The train

function wagon(n, i) {
  const w = document.createElement("span");
  w.className = "wagon";
  w.style.background = COLORS[i % COLORS.length];
  w.textContent = num(n);
  return w;
}

function gap() {
  const w = document.createElement("span");
  w.className = "wagon gap";
  w.textContent = "?";
  return w;
}

// numbers: what is on each wagon; null = an empty place.
function drawTrain(numbers) {
  const train = $("train");
  train.className = "train";
  train.innerHTML = '<span class="loco">🚂</span>';
  numbers.forEach((n, i) => train.append(n === null ? gap() : wagon(n, i)));
}

// ---------- One round

function question() {
  if (kind === "missing") return T.missing;
  if (kind === "after") return T.after(word(shown));
  if (kind === "before") return T.before(word(shown));
  return T.order;
}

function newRound() {
  const l = LEVELS[level];
  kind = l.kind === "mixed" ? pick(["after", "before"]) : l.kind;
  const from = randInt(...l.from);
  $("answers").innerHTML = "";
  $("yard").innerHTML = "";

  if (kind === "missing") {
    row = Array.from({ length: l.len }, (_, i) => from + i);
    const hole = randInt(0, l.len - 1);
    answer = row[hole];
    drawTrain(row.map((n, i) => (i === hole ? null : n)));
    drawAnswers();
  } else if (kind === "after" || kind === "before") {
    // "before" needs a number of at least 2, so the answer is 1 or more.
    shown = kind === "before" ? Math.max(2, from) : from;
    answer = kind === "after" ? shown + 1 : shown - 1;
    drawTrain(kind === "after" ? [shown, null] : [null, shown]);
    drawAnswers();
  } else {
    row = Array.from({ length: l.len }, (_, i) => from + i);
    next = 0;
    missed = false;
    drawTrain(row.map(() => null));
    drawYard();
  }

  show("round");
  locked = false;
  say(question());
}

// Three number buttons: the right one and two near ones, smallest first.
function drawAnswers() {
  const near = shuffle([-2, -1, 1, 2].map((d) => answer + d).filter((n) => n >= 1 && n <= 20));
  const answers = $("answers");
  for (const n of [answer, ...near.slice(0, 2)].sort((a, b) => a - b)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn answer";
    b.setAttribute("aria-label", word(n));
    b.innerHTML = `<span class="num">${num(n)}</span>`;
    b.addEventListener("click", () => choose(b, n));
    answers.append(b);
  }
}

// "order": the wagons wait mixed up in the yard.
function drawYard() {
  const yard = $("yard");
  for (const i of shuffle([...row.keys()])) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn wagon";
    b.style.background = COLORS[i % COLORS.length];
    b.setAttribute("aria-label", word(row[i]));
    b.textContent = num(row[i]);
    b.addEventListener("click", () => hangOn(b, i));
    yard.append(b);
  }
}

function shake(b) {
  b.classList.remove("shake");
  void b.offsetWidth; // restart the animation
  b.classList.add("shake");
}

async function choose(b, n) {
  if (locked) return;

  if (n !== answer) {
    progress.answer(ID, false);
    sound.wrong();
    shake(b);
    b.disabled = true;
    say(question());
    return;
  }

  locked = true;
  progress.answer(ID, true);
  b.classList.add("right", "bounce");
  $("train").querySelector(".gap").replaceWith(wagon(n, kind === "missing" ? row.indexOf(n) : kind === "after" ? 1 : 0));
  sound.right();
  const text =
    kind === "missing" ? T.missingRight(word(n))
    : kind === "after" ? T.afterRight(word(shown), word(n))
    : T.beforeRight(word(shown), word(n));
  win(text);
}

async function hangOn(b, i) {
  if (locked) return;

  if (i !== next) {
    if (!missed) progress.answer(ID, false);
    missed = true;
    sound.wrong();
    shake(b);
    say(T.whichNext);
    return;
  }

  b.style.visibility = "hidden"; // keep its place, so the other wagons do not jump
  $("train").querySelectorAll(".gap")[0].replaceWith(wagon(row[i], i));
  next++;
  if (next < row.length) {
    sound.tap();
    say(word(row[i]));
    return;
  }

  locked = true;
  progress.answer(ID, true);
  sound.right();
  win(T.orderRight(row.map(word)));
}

// A star, the sentence read out, and the train drives away.
function win(text) {
  stars++;
  drawStars();
  const then = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(text), wait(1200)])
    .then(() => {
      $("train").classList.add("away");
      return wait(700);
    })
    .then(then);
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

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
