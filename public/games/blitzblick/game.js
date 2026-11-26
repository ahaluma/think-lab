// "Blitzblick" – seeing small amounts at a glance (subitizing), for about 4 to 6 years.
// A picture flashes up for a moment and hides again. The child taps how many there were.
// There is no time to count: the eyes learn to "see" 3 or 5 at once.
// Levels go from dice patterns to scattered things to 5 + x in a frame (see LEVELS).
// Every round shows other animals, fruit or things, like in "Wie viele?".
// Every task comes from task() in tasks.js (shared/gen.js); this file only draws it.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";
import * as gen from "../../shared/gen.js";
import { task } from "./tasks.js";

const ID = "blitzblick";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei Äpfel." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau nochmal!"
const THINGS = things(T);
const THING_IDS = THINGS.map((t) => t.id); // only things with a name in this language
const byId = Object.fromEntries(THINGS.map((t) => [t.id, t]));

// A new thing for the last 3 tasks, and never the same number twice in a row.
const nextTask = gen.generator(task, { avoid: { thing: 3, count: 1 } });

const STARS_PER_GAME = 5;

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let stars = 0;
let answer = 0;
let thing = null;
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

function drawPicture(t) {
  const field = $("field");
  field.innerHTML = "";
  field.className = "field " + t.kind;
  for (const m of t.marks) field.append(m.empty ? mark("empty", m.x, m.y) : mark("thing", m.x, m.y, thing.icon));
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
  level = play.level;
  const l = LEVELS[level];
  locked = true;
  const t = nextTask(l, THING_IDS);
  answer = t.count;
  thing = byId[t.thing];

  drawPicture(t);
  $("cover").hidden = false;
  drawAnswers(t.choices);
  $("answers").classList.add("waiting");
  show("round");

  await say(T.look);
  await wait(300);
  await flash();
  $("answers").classList.remove("waiting");
  locked = false;
  say(question());
}

// Three choices, smallest first.
function drawAnswers(choices) {
  const answers = $("answers");
  answers.innerHTML = "";
  for (const n of choices) {
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
    play.answer(false);
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
  play.answer(true);
  b.classList.add("right", "bounce");
  $("cover").hidden = true; // show the picture again, so the child can check
  sound.right();
  play.solved();
  stars++;
  drawStars();

  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(T.right(amount(answer)))), wait(1200)]).then(() => setTimeout(next, 300));
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
