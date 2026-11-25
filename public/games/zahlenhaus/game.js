// "Zahlenhaus" – splitting numbers (part and whole), for about 4 to 6 years.
// Animals stand in front of a house. The house shows 0. First the child counts the animals;
// the number appears on the meadow sign. Then some go into the house: the meadow sign shows how many
// are still outside and the house shows "?". How many are in the house? After the right answer
// the house shows its number and the total appears in a block next to the house (3 and 2 make 5). The child learns that 5 is 3 and 2, 4 and 1 …
// Levels go from 3 animals up to 10 (see LEVELS).
// All texts are in lang/<language>.js; names of the animals are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { things } from "../../shared/things.js";

const ID = "zahlenhaus";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Das sind fünf Hasen." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau ins Haus!"

// Only animals that can walk into a house.
const WALKERS = ["rabbit", "duck", "ladybird", "snail", "elephant", "rhino", "unicorn", "giraffe", "lion", "dinosaur",
  "turtle", "penguin", "frog", "owl", "kangaroo", "crocodile", "ant", "fox", "panda", "butterfly", "crab"];
const ANIMALS = things(T).filter((t) => WALKERS.includes(t.id));

const STARS_PER_GAME = 5;

// Levels = the parameters of this game. After every 5 stars the child moves up one level.
//   total – how many animals there are in all: [fewest, most]. 1 to total - 1 of them go into the house.
const LEVELS = [
  { total: [3, 3] },
  { total: [4, 4] },
  { total: [3, 4] },
  { total: [5, 5] },
  { total: [3, 5] },
  { total: [6, 6] },
  { total: [6, 7] },
  { total: [7, 8] },
  { total: [8, 10] },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let animal = ANIMALS[0];
let lastAnimal = null;

// A round has two steps:
//   1. "first" – count all animals ("Wie viele Hasen sind da?")
//   2. "house" – some went into the house: "Wie viele Hasen sind im Haus?"
let phase = "first";
let total = 0;
let inside = 0; // animals in the house
let answer = 0;
let misses = 0; // wrong answers in this step
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

// ---------- The yard and the house
// In front of the house: up to 10 places, 5 in a row, 2 rows. Inside the house: small animals in rows of 5.

function animalAt(x, y, className = "animal") {
  const a = document.createElement("span");
  a.className = className;
  a.textContent = animal.icon;
  a.style.left = x + "%";
  a.style.top = y + "%";
  return a;
}

function drawYard() {
  const field = $("field");
  field.innerHTML = "";
  for (let i = 0; i < total; i++) field.append(animalAt(10 + (i % 5) * 20, i < 5 ? 76 : 91));
  $("inside").innerHTML = "";
  for (let i = 0; i < inside; i++) $("inside").append(animalAt(12 + (i % 5) * 19, i < 5 ? 32 : 72, "small"));
}

const openHouse = (open) => $("wall").classList.toggle("open", open);

// Some animals walk to the door at the same time and disappear: hard to count, easy to think.
async function walkIn() {
  const going = shuffle([...$("field").children]).slice(0, inside);
  for (const a of going) {
    a.classList.add("walk");
    a.style.left = "50%";
    a.style.top = "48%";
  }
  await wait(1100);
  for (const a of going) a.style.visibility = "hidden";
}

// ---------- One round

const amount = (n) => T.amount(n, animal, T.numbers[n]);
const question = () => (phase === "first" ? T.first(animal) : T.question(animal));

function newRound() {
  locked = true;
  phase = "first";
  misses = 0;
  animal = shuffle(ANIMALS.filter((t) => t !== lastAnimal))[0];
  lastAnimal = animal;

  total = randInt(...LEVELS[level].total);
  inside = randInt(1, total - 1);
  answer = total;

  $("sign").textContent = num(0); // nobody in the house yet
  $("outside").textContent = "";
  $("total").textContent = "";
  openHouse(false);
  drawYard();
  drawAnswers(answer, []);
  show("round");
  locked = false;
  say(question());
}

// Step 2: some go into the house, then ask how many are inside.
async function intoHouse() {
  phase = "house";
  misses = 0;
  answer = inside;
  $("answers").innerHTML = "";
  await Promise.all([say(T.goIn), walkIn()]);
  $("outside").textContent = num(total - inside); // still on the meadow
  $("sign").textContent = "?";
  // Common mix-ups: the number outside and the number of all.
  drawAnswers(answer, shuffle([total - inside, total]).filter((n) => n !== answer));
  locked = false;
  say(question());
}

// Three choices: the right one, the given mix-ups and neighbours, smallest first.
function drawAnswers(right, extra) {
  const choices = new Set([right]);
  for (const n of extra) if (choices.size < 3) choices.add(n);
  while (choices.size < 3) {
    const near = right + randInt(-2, 2);
    if (near >= 1 && near <= 10) choices.add(near);
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
    // Only step 2 counts for the parents' report: that is the splitting part.
    if (phase === "house") progress.answer(ID, false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    misses++;
    if (phase === "first") return void say(oops(T.countAgain));
    // In the house: first think again, then the house opens so the child can count.
    if (misses >= 2) openHouse(true);
    say(oops(misses < 2 ? T.thinkAgain(amount(total)) : T.countNow));
    return;
  }

  locked = true;
  b.classList.add("right", "bounce");
  sound.right();

  if (phase === "first") {
    $("outside").textContent = num(total); // all of them are on the meadow
    Promise.all([say(cheer(T.firstRight(amount(total)))), wait(900)]).then(() => setTimeout(intoHouse, 300));
    return;
  }

  progress.answer(ID, true);
  openHouse(true); // show who is inside, so the child can check
  $("sign").textContent = num(inside);
  setTimeout(() => ($("total").textContent = num(total)), 900); // in the house and outside together
  stars++;
  drawStars();

  const words = [inside, total - inside, total].map((x) => T.numbers[x]);
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(T.right(...words))), wait(1600)]).then(() => setTimeout(next, 300));
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
