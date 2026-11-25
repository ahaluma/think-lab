// "Zehnerfreunde" – how many are missing to 10? For about 4 to 8 years. Follows "Zahlenhaus".
// A ten-frame (2 x 5 places) with animals. The child taps how many places are still empty:
// 7 and 3 are "friends", together they make 10. At the end friends fill the empty places.
// Levels: first a single row of 5, then 10 with the top row full, then any amount, then the animals
// mixed up on the frame, then the frame only shown briefly, then only numbers: 7 + ? = 10 (see levels.js).
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

const ID = "zehnerfreunde";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Sieben und drei sind zusammen zehn."
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Zähl die leeren Plätze!"
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
let have = 0; // animals in the frame
let answer = 0; // empty places: total - have
let places = []; // which places hold an animal
let thing = null;
let lastThing = null;
let friend = null; // the thing that fills the empty places at the end
let first = true; // numbers: the gap comes second (7 + ? = 10) or first (? + 3 = 10)
let misses = 0;
let showing = false;
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

// ---------- The frame and the sum

function drawFrame() {
  const frame = $("frame");
  frame.innerHTML = "";
  frame.className = "frame" + (current.total === 5 ? " one-row" : "");
  for (let i = 0; i < current.total; i++) {
    const place = document.createElement("span");
    place.className = "place" + (places.includes(i) ? "" : " empty");
    if (places.includes(i)) place.textContent = thing.icon;
    frame.append(place);
  }
}

// "7 + ? = 10" (or "? + 3 = 10"). The gap shows the answer once it is found.
function drawSum(found = false) {
  const gap = `<b class="${found ? "found pop" : "gap"}">${found ? num(answer) : "?"}</b>`;
  const parts = first ? [num(have), gap] : [gap, num(have)];
  $("sum").innerHTML = `${parts[0]} + ${parts[1]} = ${num(current.total)}`;
}

function setView(numbersOnly) {
  $("frame").hidden = numbersOnly;
  $("sum").hidden = current.show !== "numbers";
  $("board").classList.toggle("numbers-only", numbersOnly);
}

async function flash() {
  if (current.show !== "flash" || showing) return;
  showing = true;
  $("cover").hidden = true;
  await wait(current.ms);
  if (!screens.round.hidden && locked !== "won") $("cover").hidden = false;
  showing = false;
}

// ---------- One round

const word = (n) => T.numbers[n];

function question() {
  return current.show === "numbers" ? T.questionNumbers(word(current.total)) : T.question(thing, word(current.total));
}

async function newRound() {
  level = play.level;
  current = LEVELS[level];
  locked = true;
  misses = 0;
  have = randInt(...current.have);
  answer = current.total - have;
  [thing, friend] = shuffle(THINGS.filter((t) => t !== lastThing));
  lastThing = thing;
  first = !(current.swap && Math.random() < 0.5);
  // In order (first row first), or on random places.
  places = current.show === "scatter" ? shuffle([...Array(current.total).keys()]).slice(0, have) : [...Array(have).keys()];

  drawFrame();
  drawSum();
  setView(current.show === "numbers");
  $("cover").hidden = true;
  drawAnswers();
  show("round");

  if (current.show === "flash") {
    $("answers").classList.add("waiting");
    await say(T.look);
    await flash();
    $("answers").classList.remove("waiting");
  }
  locked = false;
  say(question());
}

// Three choices: the answer, the number of animals (a common mix-up) and a neighbour, smallest first.
function drawAnswers() {
  const choices = new Set([answer]);
  if (have !== answer && have <= current.total) choices.add(have);
  for (const n of shuffle([answer - 1, answer + 1, answer + 2, answer - 2])) {
    if (choices.size >= 3) break;
    if (n >= 0 && n <= current.total) choices.add(n);
  }
  const answers = $("answers");
  answers.innerHTML = "";
  for (const n of [...choices].sort((a, b) => a - b)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn answer";
    b.setAttribute("aria-label", word(n));
    b.innerHTML = `<span class="num">${num(n)}</span><span class="dots">${"<i></i>".repeat(n)}</span>`;
    b.addEventListener("click", () => choose(b, n));
    answers.append(b);
  }
}

async function choose(b, n) {
  if (locked || showing) return;

  if (n !== answer) {
    play.answer(false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    misses++;
    locked = true;
    if (current.show === "numbers") {
      // Numbers only: after two wrong answers the frame helps.
      if (misses >= 2) setView(false), $("sum").hidden = false;
      await say(oops(misses >= 2 ? T.frameHelps : question()));
    } else if (current.show === "flash") {
      await say(oops(T.lookAgain));
      await flash(); // show the frame once more
    } else {
      await say(oops(T.countEmpty));
    }
    locked = false;
    return;
  }

  locked = "won";
  play.answer(true);
  b.classList.add("right", "bounce");
  $("cover").hidden = true;
  if (current.show === "numbers") setView(false), $("sum").hidden = false;
  drawSum(true);
  // Friends move into the empty places, one after another.
  sound.right();
  const empty = [...$("frame").children].filter((p) => p.classList.contains("empty"));
  empty.forEach((p, i) =>
    setTimeout(() => {
      p.classList.remove("empty");
      p.classList.add("friend", "pop");
      p.textContent = friend.icon;
    }, i * 120),
  );
  play.solved();
  stars++;
  drawStars();

  const next = stars >= STARS_PER_GAME ? finish : newRound;
  const text = T.together(word(have), word(answer), word(current.total));
  Promise.all([say(cheer(text)), wait(1400 + empty.length * 120)]).then(() => setTimeout(next, 300));
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

$("board").addEventListener("click", () => {
  if (!locked) flash();
});
$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
