// "Wie viele?" – a counting game for about 4 to 6 years.
// The child sees some things, can tap each one to count out loud, then taps the right number.
// It starts with 1 to 3 things and goes up to 10; the level follows the child (shared/adapt.js), see levels.js.
// All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, shuffle, randInt, store, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

const ID = "wie-viele";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei Äpfel." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau nochmal!"

const STARS_PER_GAME = 5;
const SLOTS = 12; // 4 x 3 places in the tray

// Levels: see levels.js (easy to hard).

const THINGS = things(T);

// Older versions saved only the highest number ("wie-viele:max"). Take it over once.
const oldMax = store.get("wie-viele:max", null);
if (oldMax !== null) {
  const old = LEVELS.findIndex((l) => l.max >= oldMax);
  progress.setLevel(ID, old === -1 ? LEVELS.length - 1 : old, LEVELS);
  store.remove("wie-viele:max");
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let max = LEVELS[level].max;
let stars = 0;
let answer = 0;
let thing = null;
let lastThing = null;
let tapped = 0;
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
  return T.question(thing);
}

function amount(n) {
  return T.amount(n, thing, T.numbers[n]);
}

function newRound() {
  level = play.level;
  max = LEVELS[level].max;
  locked = false;
  tapped = 0;
  answer = randInt(1, max);
  thing = shuffle(THINGS.filter((t) => t !== lastThing))[0];
  lastThing = thing;

  // Put the things in random places of the tray.
  const places = new Set(shuffle([...Array(SLOTS).keys()]).slice(0, answer));
  const tray = $("tray");
  tray.innerHTML = "";
  for (let i = 0; i < SLOTS; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (places.has(i)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thing pop";
      b.style.animationDelay = i * 0.04 + "s";
      b.textContent = thing.icon;
      b.setAttribute("aria-label", thing.one);
      b.addEventListener("click", () => countThing(b));
      slot.append(b);
    }
    tray.append(slot);
  }

  // Three choices: the right one and two others, smallest first.
  const choices = new Set([answer]);
  const top = Math.max(max, 3);
  while (choices.size < 3) {
    const near = answer + randInt(-2, 2);
    const n = near >= 1 && near <= top ? near : randInt(1, top);
    choices.add(n);
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

  show("round");
  say(question());
}

// Tapping a thing counts it out loud: "eins", "zwei", ...
function countThing(b) {
  if (locked || b.classList.contains("counted")) return;
  tapped++;
  b.classList.add("counted");
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = num(tapped);
  b.append(badge);
  sound.tap();
  say(T.numbers[tapped]);
}

function choose(b, n) {
  if (locked) return;

  if (n !== answer) {
    play.answer(false);
    sound.wrong();
    say(oops(T.countAgain));
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    return;
  }

  locked = true;
  play.answer(true);
  b.classList.add("right", "bounce");
  sound.right();
  play.solved();
  stars++;
  drawStars();
  // Next task as soon as the praise is spoken (at least 0.8 s, so the green answer is seen).
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(T.right(amount(answer)))), wait(800)]).then(() => setTimeout(next, 250));
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
