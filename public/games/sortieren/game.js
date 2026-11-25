// "Sortieren" – sorting and finding the odd one out, for about 4 to 6 years.
// Sorting: one thing at a time appears. The child taps the basket where it belongs
// (animal or fruit, red or yellow, big or small…). Each basket already holds one example.
// Odd one out: four things, three belong together. The child taps the one that does not fit.
// Levels go from animal/fruit to colours to big/small, then "Was passt nicht dazu?" (see LEVELS).
// Harder levels after that: 3 and 4 baskets, tricky things (a yellow animal when the fruit basket
// shows a banana), and a rule switch: the same things sorted by colour first, then by kind.
// All texts are in lang/<language>.js. The things here need no names: the game only speaks the rule.

import { say, oneOf, sound, celebrate, shuffle, icons, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { LEVELS, COLOR_PAIRS } from "./levels.js";

const ID = "sortieren";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Alles sortiert!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau auf die Farbe!"

const STARS_PER_GAME = 5;

// The things to sort. k = kind, c = colour, s = size (animals only). Empty = does not count for that rule.
// Only clear cases: a tomato or a carrot is not "Obst", so they only appear in colour rounds.
const ITEMS = [
  // Big animals
  { i: "🐘", k: "animal", s: "big" }, { i: "🦒", k: "animal", s: "big" }, { i: "🐳", k: "animal", s: "big", c: "blue" },
  { i: "🦏", k: "animal", s: "big" }, { i: "🦕", k: "animal", s: "big" }, { i: "🐊", k: "animal", s: "big", c: "green" },
  { i: "🦈", k: "animal", s: "big" }, { i: "🦁", k: "animal", s: "big" }, { i: "🐻", k: "animal", s: "big" },
  { i: "🐄", k: "animal", s: "big" }, { i: "🐎", k: "animal", s: "big" }, { i: "🦛", k: "animal", s: "big" },
  // Small animals
  { i: "🐜", k: "animal", s: "small" }, { i: "🐞", k: "animal", s: "small", c: "red" }, { i: "🐌", k: "animal", s: "small" },
  { i: "🦋", k: "animal", s: "small" }, { i: "🐸", k: "animal", s: "small", c: "green" }, { i: "🐭", k: "animal", s: "small" },
  { i: "🐝", k: "animal", s: "small", c: "yellow" }, { i: "🐥", k: "animal", s: "small", c: "yellow" },
  { i: "🐤", k: "animal", s: "small", c: "yellow" }, { i: "🐛", k: "animal", s: "small", c: "green" },
  { i: "🦀", k: "animal", s: "small", c: "red" },
  // Other animals
  { i: "🐼", k: "animal" }, { i: "🦊", k: "animal" }, { i: "🐰", k: "animal" }, { i: "🐧", k: "animal" },
  { i: "🦉", k: "animal" }, { i: "🐙", k: "animal" }, { i: "🦘", k: "animal" }, { i: "🐢", k: "animal", c: "green" },
  { i: "🐬", k: "animal", c: "blue" },
  // Fruit
  { i: "🍎", k: "fruit", c: "red" }, { i: "🍓", k: "fruit", c: "red" }, { i: "🍒", k: "fruit", c: "red" },
  { i: "🍌", k: "fruit", c: "yellow" }, { i: "🍋", k: "fruit", c: "yellow" }, { i: "🍏", k: "fruit", c: "green" },
  { i: "🍐", k: "fruit", c: "green" }, { i: "🍇", k: "fruit" }, { i: "🍊", k: "fruit" }, { i: "🍉", k: "fruit" },
  { i: "🍍", k: "fruit" }, { i: "🥝", k: "fruit" }, { i: "🫐", k: "fruit", c: "blue" },
  // Vehicles
  { i: "🚗", k: "vehicle", c: "red" }, { i: "🚒", k: "vehicle", c: "red" }, { i: "🚕", k: "vehicle", c: "yellow" },
  { i: "🚜", k: "vehicle" }, { i: "🚢", k: "vehicle" }, { i: "🚂", k: "vehicle" }, { i: "✈️", k: "vehicle" },
  { i: "🚲", k: "vehicle" }, { i: "🚌", k: "vehicle" }, { i: "🚀", k: "vehicle" }, { i: "🚁", k: "vehicle" },
  { i: "🚙", k: "vehicle", c: "blue" },
  // Flowers
  { i: "🌹", k: "flower", c: "red" }, { i: "🌻", k: "flower", c: "yellow" }, { i: "🌷", k: "flower" },
  { i: "🌸", k: "flower" }, { i: "🌺", k: "flower" }, { i: "🌼", k: "flower", c: "yellow" },
  // Other things, for colours only
  { i: "🎈", c: "red" }, { i: "🍅", c: "red" }, { i: "⭐", c: "yellow" }, { i: "🌽", c: "yellow" },
  { i: "🧀", c: "yellow" }, { i: "🥒", c: "green" }, { i: "🥦", c: "green" }, { i: "🌵", c: "green" },
  { i: "🍀", c: "green" }, { i: "🧢", c: "blue" }, { i: "💧", c: "blue" },
];

// The rules. attr = which property counts, groups = the two baskets (or the two kinds in "odd one out").
const RULES = {
  kind: { attr: "k", groups: ["animal", "fruit"] },
  vehicle: { attr: "k", groups: ["animal", "vehicle"] },
  redYellow: { attr: "c", groups: ["red", "yellow"], ask: "color" },
  redGreen: { attr: "c", groups: ["red", "green"], ask: "color" },
  yellowGreen: { attr: "c", groups: ["yellow", "green"], ask: "color" },
  size: { attr: "s", groups: ["big", "small"] },
  kind3: { attr: "k", groups: ["animal", "fruit", "vehicle"] },
  kind4: { attr: "k", groups: ["animal", "fruit", "vehicle", "flower"] },
  color3: { attr: "c", groups: ["red", "yellow", "green"], ask: "color" },
  color4: { attr: "c", groups: ["red", "yellow", "green", "blue"], ask: "color" },
};

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let level = progress.level(ID, LEVELS);
let stars = 0;
let rule = null; // the rule of this round, from RULES
let queue = []; // sorting: the things still to sort
let odd = null; // odd one out: the thing that does not fit
let current = null; // the level of this round (in "mix" levels one of the others)
let switchTo = null; // rule switch: the things to sort again by kind
let locked = false;

const group = (item) => item[rule.attr]; // e.g. "red" for 🍎 in a colour round
const ask = () => rule.ask || Object.keys(RULES).find((key) => RULES[key] === rule);

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
  return current.mode === "odd" ? T.odd : T.ask[ask()];
}

async function newRound() {
  current = LEVELS[level];
  if (current.mode === "mix") {
    const id = oneOf(current.levels);
    current = LEVELS.find((l) => l.id === id);
  }
  locked = true;
  const sorting = current.mode !== "odd";
  $("item").hidden = $("queue").hidden = $("baskets").hidden = !sorting;
  $("four").hidden = sorting;
  if (current.mode === "switch") makeSwitch();
  else if (sorting) {
    rule = RULES[oneOf(current.rules)];
    makeSort(current.n, current.tricky);
  } else {
    rule = RULES[oneOf(current.rules)];
    makeOdd();
  }
  show("round");
  await say(question());
  locked = false;
}

// ---------- Sorting into baskets

// The other property: colour when sorting by kind, kind when sorting by colour.
const otherAttr = () => (rule.attr === "k" ? "c" : "k");

function makeSort(n, tricky) {
  const groups = shuffle(rule.groups); // the baskets swap places, so the child looks, not remembers
  const pools = groups.map((g) => shuffle(ITEMS.filter((item) => group(item) === g)));
  const other = otherAttr();

  // One example in each basket. Tricky: examples that differ in the other property too.
  const seeds = [];
  for (const pool of pools) {
    const seed = tricky
      ? pool.find((item) => item[other] && !seeds.some((x) => x[other] === item[other])) || pool[0]
      : pool[0];
    pool.splice(pool.indexOf(seed), 1);
    seeds.push(seed);
  }

  // Tricky things look like the example of another basket (same colour, or same kind).
  const looksWrong = (item, i) => tricky && seeds.some((seed, j) => j !== i && item[other] && seed[other] === item[other]);
  if (tricky) pools.forEach((pool, i) => pool.sort((x, y) => looksWrong(y, i) - looksWrong(x, i)));

  // At least one thing for each basket, the rest random (tricky ones first).
  const first = pools.map((pool) => pool.shift());
  let rest = pools.flatMap((pool, i) => pool.map((item) => [item, looksWrong(item, i)]));
  rest = shuffle(rest).sort((x, y) => y[1] - x[1]).map(([item]) => item);
  queue = shuffle([...first, ...rest.slice(0, n - groups.length)]);

  drawBaskets(groups, seeds);
  drawItem();
}

// Rule switch: four things, one for each colour and kind (red animal, red fruit, yellow animal, yellow fruit).
// First sorted by colour, then "Neue Regel!" and the same four by kind.
// The examples are neutral: a red balloon, a yellow star; then a panda and grapes without a colour.
function makeSwitch() {
  rule = RULES[oneOf(COLOR_PAIRS)];
  const kinds = ["animal", "fruit"];
  const things = [];
  for (const c of rule.groups) for (const k of kinds) things.push(oneOf(ITEMS.filter((x) => x.c === c && x.k === k)));
  const groups = shuffle(rule.groups);
  const seeds = groups.map((c) => oneOf(ITEMS.filter((x) => x.c === c && !kinds.includes(x.k))));
  switchTo = things;
  queue = shuffle(things);
  drawBaskets(groups, seeds);
  drawItem();
}

async function switchRule() {
  rule = RULES.kind;
  const groups = shuffle(rule.groups);
  const seeds = groups.map((k) => oneOf(ITEMS.filter((x) => x.k === k && !x.c)));
  queue = shuffle(switchTo);
  switchTo = null;
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

function drawBaskets(groups, seeds) {
  const box = $("baskets");
  box.innerHTML = "";
  box.className = `baskets n${groups.length}`;
  groups.forEach((g, i) => {
    const seed = seeds[i];
    const basket = document.createElement("button");
    basket.type = "button";
    basket.className = `basket ${g}`;
    basket.dataset.group = g;
    basket.setAttribute("aria-label", T.groups[g]);
    basket.innerHTML = `<span class="inside"><i class="seed">${seed.i}</i></span>`;
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
}

async function drop(basket) {
  if (locked) return;
  const item = queue[0];

  if (basket.dataset.group !== group(item)) {
    progress.answer(ID, false);
    sound.wrong();
    basket.classList.remove("shake");
    void basket.offsetWidth;
    basket.classList.add("shake");
    locked = true;
    // Tricky things and the rule switch: say what does not count.
    const trick = current.tricky || current.mode === "switch" ? `${T.trick[rule.attr]} ` : "";
    await say(oops(trick + T.hint[ask()]));
    locked = false;
    return;
  }

  locked = true;
  progress.answer(ID, true);
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
  if (switchTo) {
    switchRule(); // same things again, now by kind
    return;
  }
  $("item").textContent = "🧺";
  win(T.allSorted);
}

// ---------- Odd one out

// Three things of one group, one of the other. Tried again if another thing
// would also stand out (e.g. three animals and one fruit, but only one of them red).
function makeOdd() {
  let four;
  for (let tries = 0; tries < 100; tries++) {
    const [g, h] = shuffle(rule.groups);
    const same = shuffle(ITEMS.filter((item) => group(item) === g)).slice(0, 3);
    odd = oneOf(ITEMS.filter((item) => group(item) === h));
    four = shuffle([...same, odd]);
    if (clear(four)) break;
  }

  const box = $("four");
  box.innerHTML = "";
  for (const item of four) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn thing";
    b.textContent = item.i;
    b.addEventListener("click", () => pickOdd(b, item));
    box.append(b);
  }
}

// True if no other property makes a different thing the odd one.
function clear(four) {
  for (const attr of ["k", "c", "s"]) {
    if (attr === rule.attr) continue;
    for (const item of four) {
      if (item === odd) continue;
      const others = four.filter((x) => x !== item).map((x) => x[attr]);
      if (others[0] && others.every((v) => v === others[0]) && item[attr] !== others[0]) return false;
    }
  }
  return true;
}

async function pickOdd(b, item) {
  if (locked) return;

  if (item !== odd) {
    progress.answer(ID, false);
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
  progress.answer(ID, true);
  sound.right();
  b.classList.add("right", "bounce");
  for (const other of $("four").children) if (other !== b) other.classList.add("same");
  const g = rule.groups.find((x) => x !== group(odd));
  win(T.why[g]);
}

// ---------- Star, next round, end

function win(text) {
  stars++;
  drawStars();
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(text)), wait(1400)]).then(() => setTimeout(next, 300));
}

function finish() {
  level = Math.min(level + 1, LEVELS.length - 1);
  progress.round(ID, level, LEVELS);
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
