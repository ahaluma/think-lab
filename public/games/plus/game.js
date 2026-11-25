// "Plus" – adding with pictures, for about 5 to 8 years. Follows "Zahlenhaus" and "Zehnerfreunde".
// The sum stands on top (3 + 2 = ?), the animals below it: 🐰🐰🐰 + 🐰🐰. The child taps the result.
// Levels: pictures up to 5, up to 10; then the first group hides behind a bush that shows its number
// (count on: "six … seven, eight"); then numbers only (the pictures help after two wrong answers);
// then above 10 with two ten-frames: first fill the ten, then the rest (8 + 5 = 8 + 2 + 3). See levels.js.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

const ID = "plus";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei und zwei sind zusammen fünf."
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Zähl alle zusammen!"
const THINGS = things(T);

const STARS_PER_GAME = 5;

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let current = null; // LEVELS[level] of this task
let stars = 0;
let a = 0; // first number
let b = 0; // second number
let answer = 0; // a + b
let thing = null;
let lastThing = null;
let misses = 0;
let locked = false;

const word = (n) => T.numbers[n];

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

// ---------- The sum and the pictures

function drawSum(found = false) {
  const result = found ? `<b class="found pop">${num(answer)}</b>` : `<b class="gap">?</b>`;
  $("sum").innerHTML = `${num(a)} + ${num(b)} = ${result}`;
}

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

/** A group of animals, at most 5 in a row (so 3 and 5 are easy to see). */
function group(n, extra = "") {
  const g = el("span", "group " + extra);
  g.style.setProperty("--cols", Math.min(n, 5));
  for (let i = 0; i < n; i++) g.append(el("span", "pic", thing.icon));
  return g;
}

/** The bush hides the first group and shows how many are behind it. */
function bush() {
  const box = el("span", "bush");
  box.append(el("span", "bush-leaves", "🌳"), el("b", "bush-number", num(a)));
  return box;
}

/** Above 10: two ten-frames. The first group, then the second fills up the ten (green), then the rest. */
function frames() {
  const box = el("span", "frames");
  for (let f = 0; f < 2; f++) {
    const frame = el("span", "frame");
    for (let i = f * 10; i < f * 10 + 10; i++) {
      const place = el("span", "place");
      if (i < a) place.textContent = thing.icon;
      else if (i < answer) place.classList.add("second"), (place.textContent = thing.icon);
      else place.classList.add("empty");
      frame.append(place);
    }
    box.append(frame);
  }
  // "8 + 2 + 3": how the second number is split.
  const toTen = 10 - a;
  box.append(el("span", "split", `${num(a)} + ${num(toTen)} + ${num(b - toTen)}`));
  return box;
}

/** kind: "pictures", "bush", "frames", or "" (numbers only). */
function drawPictures(kind) {
  const box = $("pictures");
  box.innerHTML = "";
  box.className = "pictures " + kind;
  if (!kind) return;
  if (kind === "frames") return void box.append(frames());
  box.append(kind === "bush" ? bush() : group(a), el("span", "sign", "+"), group(b, "second"));
}

/** The bush moves away: the animals behind it show. */
function openBush() {
  const hidden = $("pictures").querySelector(".bush");
  if (hidden) hidden.replaceWith(group(a, "pop"));
}

// ---------- One round

function question() {
  return T.question(word(a), word(b));
}

function pickNumbers() {
  answer = randInt(...current.sum);
  if (answer > 10) {
    // Above 10: both numbers below 10, so the ten has to be filled first (sums up to 18).
    a = randInt(Math.max(2, answer - 9), 9);
  } else if (current.show === "bush") {
    // Counting on works best from the bigger number: at least 3 behind the bush.
    a = randInt(Math.max(3, Math.ceil(answer / 2)), answer - 1);
  } else {
    a = randInt(1, answer - 1);
  }
  b = answer - a;
}

async function newRound() {
  level = play.level;
  current = LEVELS[level];
  locked = true;
  misses = 0;
  pickNumbers();
  thing = shuffle(THINGS.filter((t) => t !== lastThing))[0];
  lastThing = thing;
  drawSum();
  drawPictures(current.show === "numbers" ? "" : current.show);
  drawAnswers();
  show("round");
  await say(question());
  locked = false;
}

// Three choices: the result and two near ones, smallest first. Dots only up to 10.
function drawAnswers() {
  const choices = new Set([answer]);
  const near = [answer - 1, answer + 1, answer - 2, answer + 2];
  if (answer > 10) near.push(answer - 10); // forgot the ten
  for (const n of shuffle(near)) {
    if (choices.size >= 3) break;
    if (n >= 1 && n <= 20) choices.add(n);
  }
  const answers = $("answers");
  answers.innerHTML = "";
  for (const n of [...choices].sort((x, y) => x - y)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn answer";
    btn.setAttribute("aria-label", word(n));
    btn.innerHTML = `<span class="num">${num(n)}</span>` + (answer <= 10 ? `<span class="dots">${"<i></i>".repeat(n)}</span>` : "");
    btn.addEventListener("click", () => choose(btn, n));
    answers.append(btn);
  }
}

/** What to say after a wrong answer; on the second one the pictures help. */
function helpAfterMiss() {
  const kind = current.show;
  if (kind === "pictures") return T.countAll;
  if (kind === "bush") {
    if (misses >= 2) openBush();
    return T.startAt(word(a));
  }
  if (kind === "frames") return T.fillTen;
  // Numbers only
  if (misses < 2) return question();
  drawPictures(current.help === "frames" && answer > 10 ? "frames" : "pictures");
  return answer > 10 ? T.fillTen : T.picturesHelp;
}

async function choose(btn, n) {
  if (locked) return;

  if (n !== answer) {
    play.answer(false);
    sound.wrong();
    btn.classList.remove("shake");
    void btn.offsetWidth; // restart the animation
    btn.classList.add("shake");
    btn.disabled = true;
    misses++;
    locked = true;
    await say(oops(helpAfterMiss()));
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  btn.classList.add("right", "bounce");
  drawSum(true);
  sound.right();
  play.solved();
  stars++;
  drawStars();

  let text;
  if (answer > 10) {
    const toTen = 10 - a;
    text = T.bridge(word(a), word(toTen), word(b - toTen), word(answer));
  } else if (current.show === "bush") {
    openBush();
    const on = [];
    for (let i = a + 1; i <= answer; i++) on.push(word(i));
    text = `${T.countOn(word(a), on)} ${T.together(word(a), word(b), word(answer))}`;
  } else {
    text = T.together(word(a), word(b), word(answer));
  }
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(text)), wait(1500)]).then(() => setTimeout(next, 300));
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
