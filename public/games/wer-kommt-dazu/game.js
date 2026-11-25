// "Wer kommt dazu?" – one more, one less, for about 4 to 6 years.
// Animals stand on a meadow. First the child counts them ("Wie viele Hasen sind auf der Wiese?").
// Then one animal hops in or runs away, and the child taps how many there are now. No plus or minus signs: just animals coming and going.
// In later levels the animals hide behind a bush first, so the child has to think "one more"
// instead of counting again. Levels go up to two animals at once and 10 in all (see LEVELS).
// All texts are in lang/<language>.js; names of the animals are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

const ID = "wer-kommt-dazu";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Jetzt sind da vier Hasen." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Denk nochmal!"

// Only animals that can walk or hop onto a meadow.
const MEADOW = ["rabbit", "duck", "ladybird", "snail", "elephant", "rhino", "unicorn", "giraffe", "lion", "dinosaur",
  "turtle", "penguin", "frog", "owl", "kangaroo", "crocodile", "ant", "fox", "panda", "butterfly", "crab"];
const ANIMALS = things(T).filter((t) => MEADOW.includes(t.id));

const STARS_PER_GAME = 5;
const MAX = 10; // never more than 10 animals on the meadow

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let stars = 0;
let animal = ANIMALS[0];
let lastAnimal = null;
let answer = 0;
let misses = 0; // wrong answers in this round
let locked = true;

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

// ---------- The meadow
// Places for up to 10 animals: 5 in a row, 2 rows, on the left. The right edge stays free:
// that is where animals come in and run away, also when the bush hides the others.

function place(el, i) {
  el.style.left = 10 + (i % 5) * 17 + "%";
  el.style.top = (i < 5 ? 34 : 70) + "%";
}

function newAnimal(i) {
  const a = document.createElement("span");
  a.className = "animal";
  a.textContent = animal.icon;
  place(a, i);
  return a;
}

function outside(el) {
  el.style.left = "112%";
}

const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

async function comeIn(k, from) {
  const field = $("field");
  const walkers = [];
  for (let j = 0; j < k; j++) {
    const a = newAnimal(from + j);
    outside(a);
    a.style.transitionDelay = j * 250 + "ms";
    a.classList.add("walk");
    field.append(a);
    walkers.push(a);
  }
  await frame();
  walkers.forEach((a, j) => place(a, from + j));
  await wait(1000 + k * 250);
  walkers.forEach((a) => a.classList.remove("walk"));
}

async function runAway(k) {
  const all = [...$("field").children];
  all.slice(-k).forEach((a, j) => {
    a.style.transitionDelay = j * 250 + "ms";
    a.classList.add("walk", "away");
    outside(a);
  });
  await wait(1000 + k * 250);
  all.slice(-k).forEach((a) => a.remove());
}

// ---------- One round

const amount = (n) => T.amount(n, animal, T.numbers[n]);
const question = () => (phase === "first" ? T.first(animal) : T.question(animal));

// A round has two steps:
//   1. "first"  – count the animals on the meadow ("Wie viele Hasen sind auf der Wiese?")
//   2. "now"    – after some come or go: "Wie viele Hasen sind jetzt da?"
let phase = "first";
let start = 0; // animals at the start
let step = 0; // how many come or go
let change = "come";

async function newRound() {
  level = play.level;
  const l = LEVELS[level];
  locked = true;
  phase = "first";
  misses = 0;
  animal = shuffle(ANIMALS.filter((t) => t !== lastAnimal))[0];
  lastAnimal = animal;

  step = randInt(...l.step);
  change = l.change === "mixed" ? (Math.random() < 0.5 ? "come" : "go") : l.change;
  start = randInt(...l.from);
  if (change === "come" && start + step > MAX) start = MAX - step;
  if (change === "go" && start - step < 1) start = step + 1; // at least one animal stays
  answer = start;

  const field = $("field");
  field.innerHTML = "";
  for (let i = 0; i < start; i++) field.append(newAnimal(i));
  $("bush").classList.remove("up");
  drawAnswers(start, []);
  show("round");
  locked = false;
  say(question());
}

// Step 2: maybe hide behind the bush, then animals come or go, then ask again.
async function change2() {
  const l = LEVELS[level];
  phase = "now";
  misses = 0;
  answer = change === "come" ? start + step : start - step;
  $("answers").innerHTML = "";

  if (l.bush) {
    $("bush").classList.add("up");
    await Promise.all([say(T.hide), wait(900)]);
  }
  const text = change === "come" ? T.come(step, amount(step)) : T.go(step, amount(step));
  await Promise.all([say(text), change === "come" ? comeIn(step, start) : runAway(step)]);

  drawAnswers(answer, [start]); // the number from before is the most common mix-up
  locked = false;
  say(question());
}

// Three choices: the right one, the given extra ones and neighbours, smallest first.
function drawAnswers(right, extra) {
  const choices = new Set([right, ...extra]);
  while (choices.size < 3) {
    const near = right + randInt(-2, 2);
    if (near >= 1 && near <= MAX) choices.add(near);
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

function choose(b, n) {
  if (locked) return;

  if (n !== answer) {
    // Only step 2 counts for the parents' report: that is the "one more, one less" part.
    if (phase === "now") play.answer(false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    misses++;
    // Behind the bush: first think again, then the bush opens so the child can count.
    const bushUp = $("bush").classList.contains("up");
    if (bushUp && misses >= 2) $("bush").classList.remove("up");
    say(oops(bushUp && misses < 2 ? T.thinkAgain : T.countNow));
    return;
  }

  locked = true;
  b.classList.add("right", "bounce");
  sound.right();

  if (phase === "first") {
    Promise.all([say(cheer(T.here(start, amount(start)))), wait(900)]).then(() => setTimeout(change2, 300));
    return;
  }

  play.answer(true);
  $("bush").classList.remove("up"); // show the animals, so the child can check
  play.solved();
  stars++;
  drawStars();

  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(T.right(answer, amount(answer)))), wait(1400)]).then(() => setTimeout(next, 300));
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
