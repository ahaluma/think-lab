// "Sortieren" – sorting and finding the odd one out, for about 3 to 12 years.
// Sorting: one thing at a time appears. The child taps the basket where it belongs
// (animal or fruit, red or yellow, big or small…). Each basket already holds one example.
// Odd one out: four things, three belong together. The child taps the one that does not fit.
// Levels go from animal/fruit to colours to big/small, then "Was passt nicht dazu?" (see LEVELS).
// Harder levels after that: 3 and 4 baskets, tricky things (a yellow animal when the fruit basket
// shows a banana), and a rule switch: the same things sorted by colour first, then by kind.
// For older children: two features at once (4 baskets: red animal, red fruit, yellow animal …),
// finding the rule yourself (each basket shows two examples, nobody says the rule), and hidden
// rules: "can it fly?", "is it at home in the water?" (a penguin is a bird, but it cannot fly).
// Every round comes from task() in tasks.js (shared/gen.js), the things and rules are there too; this file
// only draws the round. All texts are in lang/<language>.js. The things need no names: the game only speaks the rule.

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import * as gen from "../../shared/gen.js";
import { task as makeTask, RULES } from "./tasks.js";

const ID = "sortieren";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Alles sortiert!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau auf die Farbe!"

const STARS_PER_GAME = 5;

// Not the same round again within the next five.
const nextRound = gen.generator(makeTask, { avoid: { key: 5 } });

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let stars = 0;
let round = null; // this round, from tasks.js
let ruleKey = ""; // the rule being sorted by: a key of RULES, or "two" (colour and kind at once)
let queue = []; // sorting: the things still to sort, { i (icon), g (the right basket) }
let current = null; // the level of this round (in "mix" levels one of the others)
let misses = 0; // wrong baskets for the thing on top
let locked = false;

const ask = () => (ruleKey === "two" ? "two" : RULES[ruleKey].ask || ruleKey);
const attr = () => RULES[ruleKey]?.attr;

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

function question() {
  if (current.mode === "odd") return T.odd;
  if (current.mode === "find") return T.findRule;
  return T.ask[ask()];
}

async function newRound() {
  level = play.level;
  round = nextRound(LEVELS[level]);
  current = LEVELS.find((l) => l.id === round.level); // in "mix" levels one of the others
  ruleKey = round.rule;
  locked = true;
  const sorting = current.mode !== "odd";
  $("item").hidden = $("queue").hidden = $("baskets").hidden = !sorting;
  $("four").hidden = sorting;
  if (sorting) {
    queue = [...round.queue];
    drawBaskets(round.groups, round.seeds, current.mode === "find");
    drawItem();
  } else drawOdd();
  show("round");
  await say(question());
  locked = false;
}

// ---------- Sorting into baskets

// Rule switch: the same four things again, now by kind (round.then, from tasks.js).
async function switchRule() {
  const { rule, groups, seeds } = round.then;
  ruleKey = rule;
  queue = [...round.then.queue];
  const item = $("item");
  item.textContent = "🔄";
  item.classList.remove("pop");
  void item.offsetWidth;
  item.classList.add("pop");
  await say(cheer(T.allSorted));
  await say(T.newRule);
  drawBaskets(groups, seeds);
  drawItem();
  await say(T.ask[ask()]);
  locked = false;
}

// seeds: the examples (icons) per basket, one or two (find the rule). plain: baskets without colour.
function drawBaskets(groups, seeds, plain = false) {
  const box = $("baskets");
  box.innerHTML = "";
  box.className = `baskets n${groups.length}`;
  groups.forEach((g, i) => {
    const examples = [].concat(seeds[i]);
    const basket = document.createElement("button");
    basket.type = "button";
    basket.className = "basket" + (plain ? "" : ` ${g.split("|")[0]}`) + (examples.length > 1 ? " pair" : "");
    basket.dataset.group = g;
    basket.setAttribute("aria-label", plain ? T.basket(i + 1) : g.split("|").map((x) => T.groups[x]).join(", "));
    const inside = document.createElement("span");
    inside.className = "inside";
    for (const seed of examples) {
      const el = document.createElement("i");
      el.className = "seed";
      el.textContent = seed;
      inside.append(el);
    }
    basket.append(inside);
    basket.addEventListener("click", () => drop(basket));
    box.append(basket);
  });
}

function drawItem() {
  const item = $("item");
  item.textContent = queue[0].i;
  item.classList.remove("pop");
  void item.offsetWidth; // restart the animation
  item.classList.add("pop");
  $("queue").innerHTML = "<li></li>".repeat(queue.length - 1);
  misses = 0;
}

async function drop(basket) {
  if (locked) return;
  const item = queue[0];

  if (basket.dataset.group !== item.g) {
    play.answer(false);
    sound.wrong();
    basket.classList.remove("shake");
    void basket.offsetWidth;
    basket.classList.add("shake");
    locked = true;
    misses++;
    // Tricky things and the rule switch: say what does not count.
    const trick = current.tricky || current.mode === "switch" ? `${T.trick[attr()]} ` : "";
    // Find the rule: first a nudge, then the rule itself.
    const hint = current.mode === "find" && misses < 2 ? T.findHint : T.hint[ask()];
    await say(oops(trick + hint));
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  sound.right();
  const put = document.createElement("i");
  put.textContent = item.i;
  put.className = "pop";
  basket.querySelector(".inside").append(put);
  queue.shift();

  if (queue.length) {
    $("item").textContent = "";
    await Promise.all([say(oneOf(T.praise)), wait(600)]);
    drawItem();
    locked = false;
    return;
  }

  $("queue").innerHTML = "";
  if (round.then && ruleKey !== round.then.rule) {
    switchRule(); // same things again, now by kind
    return;
  }
  $("item").textContent = "🧺";
  win(current.mode === "find" ? `${T.allSorted} ${T.found[ask()]}` : T.allSorted);
}

// ---------- Odd one out

// Four things, three belong together (tasks.js makes sure no other thing stands out too).
function drawOdd() {
  const box = $("four");
  box.innerHTML = "";
  round.four.forEach((icon, k) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn thing";
    b.textContent = icon;
    b.addEventListener("click", () => pickOdd(b, k));
    box.append(b);
  });
}

async function pickOdd(b, k) {
  if (locked) return;

  if (k !== round.odd) {
    play.answer(false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth;
    b.classList.add("shake");
    b.disabled = true;
    locked = true;
    await say(oops(T.oddHint));
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  sound.right();
  b.classList.add("right", "bounce");
  for (const other of $("four").children) if (other !== b) other.classList.add("same");
  win(T.why[round.why]);
}

// ---------- Star, next round, end

function win(text) {
  play.solved();
  stars++;
  drawStars();
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(text)), wait(1400)]).then(() => setTimeout(next, 300));
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
