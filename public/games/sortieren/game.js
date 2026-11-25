// "Sortieren" – sorting and finding the odd one out, for about 4 to 6 years.
// Sorting: one thing at a time appears. The child taps the basket where it belongs
// (animal or fruit, red or yellow, big or small…). Each basket already holds one example.
// Odd one out: four things, three belong together. The child taps the one that does not fit.
// Levels go from animal/fruit to colours to big/small, then "Was passt nicht dazu?" (see LEVELS).
// All texts are in lang/<language>.js. The things here need no names: the game only speaks the rule.

import { say, oneOf, sound, celebrate, shuffle, icons } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";

const ID = "sortieren";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Alles sortiert!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau auf die Farbe!"

const STARS_PER_GAME = 5;

// The things to sort. k = kind, c = colour, s = size (animals only). Empty = does not count for that rule.
// Only clear cases: a tomato or a carrot is not "Obst", so they only appear in colour rounds.
const ITEMS = [
  // Big animals
  { i: "🐘", k: "animal", s: "big" }, { i: "🦒", k: "animal", s: "big" }, { i: "🐳", k: "animal", s: "big" },
  { i: "🦏", k: "animal", s: "big" }, { i: "🦕", k: "animal", s: "big" }, { i: "🐊", k: "animal", s: "big", c: "green" },
  { i: "🦈", k: "animal", s: "big" }, { i: "🦁", k: "animal", s: "big" }, { i: "🐻", k: "animal", s: "big" },
  { i: "🐄", k: "animal", s: "big" }, { i: "🐎", k: "animal", s: "big" }, { i: "🦛", k: "animal", s: "big" },
  // Small animals
  { i: "🐜", k: "animal", s: "small" }, { i: "🐞", k: "animal", s: "small", c: "red" }, { i: "🐌", k: "animal", s: "small" },
  { i: "🦋", k: "animal", s: "small" }, { i: "🐸", k: "animal", s: "small", c: "green" }, { i: "🐭", k: "animal", s: "small" },
  { i: "🐝", k: "animal", s: "small" }, { i: "🐥", k: "animal", s: "small", c: "yellow" }, { i: "🐛", k: "animal", s: "small", c: "green" },
  { i: "🦀", k: "animal", s: "small", c: "red" },
  // Other animals
  { i: "🐼", k: "animal" }, { i: "🦊", k: "animal" }, { i: "🐰", k: "animal" }, { i: "🐧", k: "animal" },
  { i: "🦉", k: "animal" }, { i: "🐙", k: "animal" }, { i: "🦘", k: "animal" }, { i: "🐢", k: "animal", c: "green" },
  // Fruit
  { i: "🍎", k: "fruit", c: "red" }, { i: "🍓", k: "fruit", c: "red" }, { i: "🍒", k: "fruit", c: "red" },
  { i: "🍌", k: "fruit", c: "yellow" }, { i: "🍋", k: "fruit", c: "yellow" }, { i: "🍏", k: "fruit", c: "green" },
  { i: "🍐", k: "fruit", c: "green" }, { i: "🍇", k: "fruit" }, { i: "🍊", k: "fruit" }, { i: "🍉", k: "fruit" },
  { i: "🍍", k: "fruit" }, { i: "🥝", k: "fruit" },
  // Vehicles
  { i: "🚗", k: "vehicle", c: "red" }, { i: "🚒", k: "vehicle", c: "red" }, { i: "🚕", k: "vehicle", c: "yellow" },
  { i: "🚜", k: "vehicle" }, { i: "🚢", k: "vehicle" }, { i: "🚂", k: "vehicle" }, { i: "✈️", k: "vehicle" },
  { i: "🚲", k: "vehicle" }, { i: "🚌", k: "vehicle" }, { i: "🚀", k: "vehicle" }, { i: "🚁", k: "vehicle" },
  // Other things, for colours only
  { i: "🎈", c: "red" }, { i: "🌹", c: "red" }, { i: "🍅", c: "red" }, { i: "⭐", c: "yellow" },
  { i: "🌻", c: "yellow" }, { i: "🌽", c: "yellow" }, { i: "🧀", c: "yellow" }, { i: "🥒", c: "green" },
  { i: "🥦", c: "green" }, { i: "🌵", c: "green" }, { i: "🍀", c: "green" },
];

// The rules. attr = which property counts, groups = the two baskets (or the two kinds in "odd one out").
const RULES = {
  kind: { attr: "k", groups: ["animal", "fruit"] },
  vehicle: { attr: "k", groups: ["animal", "vehicle"] },
  redYellow: { attr: "c", groups: ["red", "yellow"], ask: "color" },
  redGreen: { attr: "c", groups: ["red", "green"], ask: "color" },
  yellowGreen: { attr: "c", groups: ["yellow", "green"], ask: "color" },
  size: { attr: "s", groups: ["big", "small"] },
};

// Levels = the parameters of this game. After every 5 stars the child moves up one level.
//   mode  – "sort": things into two baskets, "odd": which one does not belong?
//   rules – one is picked each round (see RULES)
//   n     – how many things to sort for one star
const LEVELS = [
  { mode: "sort", rules: ["kind"], n: 3 },
  { mode: "sort", rules: ["vehicle"], n: 3 },
  { mode: "sort", rules: ["redYellow"], n: 3 },
  { mode: "sort", rules: ["redGreen", "yellowGreen"], n: 3 },
  { mode: "sort", rules: ["size"], n: 3 },
  { mode: "sort", rules: ["kind", "vehicle", "redYellow", "redGreen", "yellowGreen", "size"], n: 4 },
  { mode: "odd", rules: ["kind", "vehicle"] },
  { mode: "odd", rules: ["redYellow", "redGreen", "yellowGreen"] },
  { mode: "odd", rules: ["kind", "vehicle", "redYellow", "redGreen", "yellowGreen", "size"] },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let rule = null; // the rule of this round, from RULES
let queue = []; // sorting: the things still to sort
let odd = null; // odd one out: the thing that does not fit
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
  return LEVELS[level].mode === "sort" ? T.ask[ask()] : T.odd;
}

async function newRound() {
  const l = LEVELS[level];
  locked = true;
  rule = RULES[oneOf(l.rules)];
  const sorting = l.mode === "sort";
  $("item").hidden = $("queue").hidden = $("baskets").hidden = !sorting;
  $("four").hidden = sorting;
  if (sorting) makeSort(l.n);
  else makeOdd();
  show("round");
  await say(question());
  locked = false;
}

// ---------- Sorting into two baskets

function makeSort(n) {
  const [a, b] = shuffle(rule.groups); // the baskets swap sides, so the child looks, not remembers
  const of = (g) => shuffle(ITEMS.filter((item) => group(item) === g));
  const as = of(a);
  const bs = of(b);
  const seeds = [as.shift(), bs.shift()]; // one example in each basket
  // At least one thing for each basket, the rest random.
  const rest = shuffle([...as.slice(1), ...bs.slice(1)]).slice(0, n - 2);
  queue = shuffle([as[0], bs[0], ...rest]);

  const box = $("baskets");
  box.innerHTML = "";
  for (const [g, seed] of [[a, seeds[0]], [b, seeds[1]]]) {
    const basket = document.createElement("button");
    basket.type = "button";
    basket.className = `basket ${g}`;
    basket.dataset.group = g;
    basket.setAttribute("aria-label", T.groups[g]);
    basket.innerHTML = `<span class="inside"><i class="seed">${seed.i}</i></span>`;
    basket.addEventListener("click", () => drop(basket));
    box.append(basket);
  }
  drawItem();
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
    await say(oops(T.hint[ask()]));
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

  $("item").textContent = "🧺";
  $("queue").innerHTML = "";
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
