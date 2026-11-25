// "Blitzblick" – seeing small amounts at a glance (subitizing), for about 4 to 6 years.
// A picture flashes up for a moment and hides again. The child taps how many there were.
// There is no time to count: the eyes learn to "see" 3 or 5 at once.
// Levels go from dice patterns to scattered things to 5 + x in a frame (see LEVELS).
// Every round shows other animals, fruit or things, like in "Wie viele?".
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { things } from "../../shared/things.js";

const ID = "blitzblick";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei Äpfel." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau nochmal!"
const THINGS = things(T);

const STARS_PER_GAME = 5;

// Levels = the parameters of this game. After every 5 stars the child moves up one level.
//   kind – "dice": placed like the dots on a dice, "scatter": random places, "frame": 5 + x in a 2 x 5 frame
//   Every round shows a different animal or thing (apples, flowers, pandas…).
//   min, max – the amounts
//   ms – how long the picture is shown (milliseconds)
const LEVELS = [
  { kind: "dice", min: 1, max: 3, ms: 2000 },
  { kind: "dice", min: 1, max: 4, ms: 1500 },
  { kind: "dice", min: 2, max: 5, ms: 1200 },
  { kind: "dice", min: 2, max: 6, ms: 1000 },
  { kind: "scatter", min: 1, max: 4, ms: 1500 },
  { kind: "scatter", min: 2, max: 5, ms: 1200 },
  { kind: "scatter", min: 3, max: 6, ms: 1000 },
  { kind: "frame", min: 5, max: 8, ms: 1500 },
  { kind: "frame", min: 5, max: 10, ms: 1200 },
];

// Dice patterns on a 3 x 3 grid: [column, row], 0..2.
const DICE = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let answer = 0;
let thing = null;
let lastThing = null;
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

// ---------- The picture

function mark(className, x, y, text) {
  const m = document.createElement("span");
  m.className = "mark " + className;
  m.style.left = x + "%";
  m.style.top = y + "%";
  if (text) m.textContent = text;
  return m;
}

function drawPicture(kind, n) {
  const field = $("field");
  field.innerHTML = "";
  field.className = "field " + kind;

  if (kind === "dice") {
    const flip = Math.random() < 0.5; // mirror sometimes, so 2, 3 and 6 are not always the same way round
    for (const [c, r] of DICE[n]) field.append(mark("thing", 30 + (flip ? 2 - c : c) * 20, 22 + r * 28, thing.icon));
  } else if (kind === "scatter") {
    // Random places on a 4 x 3 grid, a little shaken so it does not look like a grid.
    const cells = shuffle([...Array(12).keys()]).slice(0, n);
    for (const i of cells) {
      const x = 14 + (i % 4) * 24 + randInt(-4, 4);
      const y = 20 + Math.floor(i / 4) * 30 + randInt(-4, 4);
      field.append(mark("thing", x, y, thing.icon));
    }
  } else {
    // 2 x 5 frame: first row full (5), second row the rest. Empty places are dashed.
    for (let i = 0; i < 10; i++) {
      const x = 14 + (i % 5) * 18;
      const y = i < 5 ? 34 : 66;
      field.append(i < n ? mark("thing", x, y, thing.icon) : mark("empty", x, y));
    }
  }
}

async function flash() {
  if (showing) return;
  showing = true;
  $("cover").hidden = true;
  await wait(LEVELS[level].ms);
  $("cover").hidden = false;
  showing = false;
}

// ---------- One round

function question() {
  return T.question(thing);
}

function amount(n) {
  return T.amount(n, thing, T.numbers[n]);
}

async function newRound() {
  const l = LEVELS[level];
  locked = true;
  answer = randInt(l.min, l.max);
  thing = shuffle(THINGS.filter((t) => t !== lastThing))[0];
  lastThing = thing;

  drawPicture(l.kind, answer);
  $("cover").hidden = false;
  drawAnswers(l);
  $("answers").classList.add("waiting");
  show("round");

  await say(T.look);
  await wait(300);
  await flash();
  $("answers").classList.remove("waiting");
  locked = false;
  say(question());
}

// Three choices: the right one and two neighbours, smallest first.
function drawAnswers(l) {
  const low = Math.max(1, l.min - 1);
  const high = l.max + 1;
  const choices = new Set([answer]);
  while (choices.size < 3) {
    const near = answer + randInt(-2, 2);
    choices.add(near >= low && near <= high ? near : randInt(low, high));
  }
  const answers = $("answers");
  answers.innerHTML = "";
  for (const n of [...choices].sort((a, b) => a - b)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn answer";
    b.setAttribute("aria-label", T.numbers[n]);
    b.innerHTML = `<span class="num">${num(n)}</span><span class="dots">${"<i></i>".repeat(n)}</span>`;
    b.addEventListener("click", () => choose(b, n));
    answers.append(b);
  }
}

async function choose(b, n) {
  if (locked || showing) return;

  if (n !== answer) {
    progress.answer(ID, false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    locked = true;
    await say(oops(T.lookAgain));
    await flash(); // show the picture once more
    locked = false;
    return;
  }

  locked = true;
  progress.answer(ID, true);
  b.classList.add("right", "bounce");
  $("cover").hidden = true; // show the picture again, so the child can check
  sound.right();
  stars++;
  drawStars();

  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(T.right(amount(answer)))), wait(1200)]).then(() => setTimeout(next, 300));
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

$("flash").addEventListener("click", () => {
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
