// "Gleich machen" – making two amounts equal, for about 4 to 8 years. A first step towards minus.
// Two meadows with animals, one has more. "How many must go home so both have the same?"
// The child taps animals on the fuller meadow: they hop into their house (tap the house: one comes back).
// ✓ checks. Right: both groups are happy and the sum shows: 7 − 3 = 4.
// After two wrong answers the animals line up in pairs (a line between partners) and the ones without
// a partner glow. Later levels: give the number instead of tapping (one of three, or the number pad
// from 8), then numbers only, then the other way round: how many must come out of the house (4 + 3 = 7).
// See levels.js. All texts are in lang/<language>.js; names of the animals are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, randInt, pick, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { numpad } from "../../shared/numpad.js";
import * as profiles from "../../shared/profiles.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

const ID = "gleich-machen";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei Hasen gehen nach Hause."
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau nochmal genau!"

// Only animals that can stand on a meadow (no fruit, cars or fish).
const ON_MEADOW = ["rabbit", "fox", "panda", "lion", "elephant", "giraffe", "unicorn", "duck", "penguin", "frog",
  "turtle", "snail", "ladybird", "butterfly", "owl", "kangaroo", "dinosaur", "rhino", "ant", "crocodile"];
const ANIMALS = things(T).filter((t) => ON_MEADOW.includes(t.id));

const STARS_PER_GAME = 5;
const HOP_MS = 280;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };
const meadowEls = [$("m0"), $("m1")];

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // LEVELS[play.level] of this task
let stars = 0;
let way = "weg"; // "weg": the bigger meadow sends animals home; "dazu": the smaller one gets more
let big = 0;
let small = 0;
let answer = 0; // big − small
let bigSide = 0; // 0: the upper meadow has more, 1: the lower one
let slots = 10; // places per meadow: 10 (5 × 2) or 20 (10 × 2)
let meadows = []; // [{ animals: [{ slot, home, extra }] }, …]
let thing = null;
let lastThing = null;
let lastTask = "";
let misses = 0;
let pictures = true; // animals on the meadows (false: only a number sign)
let pairs = false; // the help: animals in a row, partners joined by a line
let locked = true;
// Older children type the answer on a number pad instead of picking one of three (profiles.typeAnswers).
const typing = profiles.typeAnswers(profiles.current());
let pad = null;
/** Tapping or picking one of three: the pairs help after two wrong answers. Typing: the child tries longer
 *  by themselves, the help comes after five, the answer after seven, so nobody gets stuck. */
const helpAfter = () => (typing && current.input === "number" ? 5 : 2);
const SHOW_AFTER = 7;

const word = (n) => T.numbers[n] ?? num(n);
const amount = (n) => T.amount(n, thing, word(n));
const tapping = () => current.input === "tap";
const smallSide = () => 1 - bigSide;
const here = (m) => meadows[m].animals.filter((a) => !a.home);

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

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---------- The equation on top: 7 − ? = 4 (away) or 4 + ? = 7 (more)

/** found: the answer shows in green. Tapping levels show it only at the end. */
function drawEq(found = false) {
  const eq = $("eq");
  if (tapping() && !found) {
    eq.innerHTML = "";
    return;
  }
  const box = found ? `<b class="found pop">${num(answer)}</b>` : `<b class="gap">?</b>`;
  eq.innerHTML = way === "weg" ? `${num(big)} − ${box} = ${num(small)}` : `${num(small)} + ${box} = ${num(big)}`;
}

// ---------- The meadows

/** Where animal number i (in order) stands when they line up in pairs. The upper meadow fills from its
 *  bottom row, the lower one from its top row, so partners stand right above each other. */
function pairPlace(m, i, rows) {
  const row = m === 0 ? rows - 1 - Math.floor(i / 10) : Math.floor(i / 10);
  return row * 10 + (i % 10);
}

function drawMeadow(m) {
  const box = meadowEls[m];
  box.innerHTML = "";
  box.className = "meadow" + (pictures ? "" : " numbers");
  const count = here(m).length;

  if (!pictures) {
    // Numbers only: a sign on the meadow.
    const sign = el("div", "sign");
    sign.append(el("b", "", num(count)), el("span", "sign-pic", thing.icon));
    box.append(sign);
    return;
  }

  const cols = pairs || slots > 10 ? 10 : 5;
  const rows = slots / cols;
  const grid = el("div", `grid c${cols}`);
  grid.style.setProperty("--rows", rows);
  const cells = Array(slots).fill(null);
  if (pairs) {
    const inOrder = here(m).sort((a, b) => a.slot - b.slot);
    inOrder.forEach((a, i) => (cells[pairPlace(m, i, rows)] = a));
    // The ones without a partner glow.
    const partners = Math.min(here(0).length, here(1).length);
    inOrder.forEach((a, i) => (a.alone = i >= partners));
    inOrder.forEach((a, i) => (a.order = i));
  } else {
    for (const a of here(m)) cells[a.slot] = a;
  }

  cells.forEach((a, place) => {
    if (!a) return void grid.append(el("span", "cell"));
    const cell = el(tapping() ? "button" : "span", "cell pic", thing.icon);
    if (a.extra) cell.classList.add("extra");
    if (a.fresh) cell.classList.add("pop"), (a.fresh = false);
    if (pairs && a.alone) cell.classList.add("alone");
    if (pairs) cell.dataset.order = a.order;
    if (tapping()) {
      cell.type = "button";
      cell.setAttribute("aria-label", thing.one);
      cell.addEventListener("click", () => tapAnimal(m, a, cell));
    }
    grid.append(cell);
  });
  box.append(grid);

  // The house: animals sent home wait here (the number on the roof), and new ones come out of it.
  const home = el(tapping() ? "button" : "span", "house");
  home.append(el("span", "house-pic", "🏠"));
  const gone = meadows[m].animals.filter((a) => a.home).length;
  if (gone) home.append(el("b", "house-count", num(gone)));
  if (tapping()) {
    home.type = "button";
    home.setAttribute("aria-label", T.house);
    home.addEventListener("click", () => tapHouse(m, home));
  }
  box.append(home);
}

function drawMeadows() {
  drawMeadow(0);
  drawMeadow(1);
  drawLines();
  updateCheck();
}

/** The pairs help: a line from each animal to its partner on the other meadow. */
function drawLines() {
  const svg = $("lines");
  svg.innerHTML = "";
  if (!pairs || !pictures) return;
  const box = $("board").getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  const partners = Math.min(here(0).length, here(1).length, 10); // the first ten pairs stand right above each other
  for (let i = 0; i < partners; i++) {
    const top = meadowEls[0].querySelector(`[data-order="${i}"]`)?.getBoundingClientRect();
    const bottom = meadowEls[1].querySelector(`[data-order="${i}"]`)?.getBoundingClientRect();
    if (!top || !bottom) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", top.left + top.width / 2 - box.left);
    line.setAttribute("y1", top.bottom - box.top - 2);
    line.setAttribute("x2", bottom.left + bottom.width / 2 - box.left);
    line.setAttribute("y2", bottom.top - box.top + 2);
    svg.append(line);
  }
}

/** Both groups are happy: they jump. */
function cheerUp() {
  for (const m of meadowEls) {
    m.querySelectorAll(".pic").forEach((p, i) => {
      p.classList.remove("pop");
      p.style.animationDelay = (i % 10) * 0.04 + "s";
      p.classList.add("happy");
    });
  }
}

// ---------- One task

function question() {
  if (current.show === "numbers") return way === "weg" ? T.numbersAway(word(big), word(small)) : T.numbersMore(word(small), word(big));
  if (tapping()) return way === "weg" ? T.tapAway(thing) : T.tapMore(thing);
  return way === "weg" ? T.askAway(thing) : T.askMore(thing);
}

function newTask() {
  const l = current;
  way = l.way === "mix" ? pick(["weg", "dazu"]) : l.way;
  for (let i = 0; i < 6; i++) {
    answer = randInt(l.diff[0], Math.min(l.diff[1], l.max - 1));
    small = randInt(1, l.max - answer);
    big = small + answer;
    if (`${way}${big}-${small}` !== lastTask) break; // never the same task twice in a row
  }
  lastTask = `${way}${big}-${small}`;
  bigSide = randInt(0, 1);
  slots = l.max > 10 ? 20 : 10;
  meadows = [0, 1].map((m) => {
    const n = m === bigSide ? big : small;
    const places = shuffle([...Array(slots).keys()]).slice(0, n);
    return { animals: places.map((slot) => ({ slot, home: false, extra: false, fresh: true })) };
  });
}

async function newRound() {
  current = LEVELS[play.level];
  locked = true;
  misses = 0;
  pairs = false;
  pictures = current.show !== "numbers";
  thing = shuffle(ANIMALS.filter((t) => t !== lastThing))[0];
  lastThing = thing;
  newTask();
  drawEq();
  drawAnswers();
  show("round");
  drawMeadows();
  pad?.lock(true);
  await say(question());
  locked = false;
  pad?.lock(false);
  updateCheck();
}

// ---------- Tapping: send animals home, or bring them out of the house

function hop(cell) {
  cell.classList.remove("pop", "shake");
  cell.classList.add("hop");
}

function nudge(node) {
  node.classList.remove("shake");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

async function tapAnimal(m, a, cell) {
  if (locked) return;
  if (way === "weg") {
    if (m !== bigSide) return void wrongSide(cell);
    sound.tap();
    a.home = true;
  } else {
    // Only animals that came out of the house go back in.
    if (!a.extra) {
      nudge(cell);
      return void say(T.staysHere);
    }
    sound.tap();
    meadows[m].animals.splice(meadows[m].animals.indexOf(a), 1);
  }
  hop(cell);
  locked = true;
  await wait(HOP_MS);
  locked = false;
  drawMeadows();
}

function tapHouse(m, house) {
  if (locked) return;
  const animals = meadows[m].animals;
  if (way === "weg") {
    // The last one sent home comes back.
    const back = animals.filter((a) => a.home).pop();
    if (!back) return nudge(house);
    sound.tap();
    back.home = false;
    back.fresh = true;
  } else {
    if (m === bigSide) return void wrongSide(house);
    const used = new Set(animals.map((a) => a.slot));
    const free = shuffle([...Array(slots).keys()].filter((s) => !used.has(s)));
    if (!free.length) return nudge(house);
    sound.tap();
    animals.push({ slot: free[0], home: false, extra: true, fresh: true });
  }
  drawMeadows();
}

/** Sending home from the smaller meadow, or bringing more to the bigger one. */
async function wrongSide(node) {
  nudge(node);
  await miss(way === "weg" ? T.wrongSideAway : T.wrongSideMore);
}

/** The ✓ button is on when something has changed. */
function updateCheck() {
  const check = $("answers").querySelector(".check");
  if (!check) return;
  const changed = meadows.some((m) => m.animals.some((a) => a.home || a.extra));
  check.disabled = locked || !changed;
}

function checkTap(btn) {
  if (locked) return;
  const [a, b] = [here(0).length, here(1).length];
  if (a === b) return void right(btn);
  nudge(btn);
  const now = here(way === "weg" ? bigSide : smallSide()).length;
  let hint;
  if (way === "weg") hint = now > small ? T.stillMore : T.tooManyAway;
  else hint = now < big ? T.stillFewer : T.tooManyMore;
  miss(hint);
}

// ---------- Numbers: one of three, or the number pad

function drawAnswers() {
  const answers = $("answers");
  pad?.remove();
  pad = null;
  answers.className = "answers";
  answers.innerHTML = "";
  if (tapping()) {
    answers.className = "answers one";
    const btn = el("button", "btn ok check");
    btn.type = "button";
    btn.innerHTML = icons.check;
    btn.setAttribute("aria-label", T.check);
    btn.addEventListener("click", () => checkTap(btn));
    answers.append(btn);
    return;
  }
  if (typing) {
    pad = numpad(answers, T, { digits: 2, onCheck: (n) => choose(null, n), display: $("eq").querySelector(".gap") });
    return;
  }
  for (const n of choices()) {
    const btn = el("button", "btn answer");
    btn.type = "button";
    btn.setAttribute("aria-label", word(n));
    btn.innerHTML = `<span class="num">${num(n)}</span>` + (big <= 10 ? `<span class="dots">${"<i></i>".repeat(n)}</span>` : "");
    btn.addEventListener("click", () => choose(btn, n));
    answers.append(btn);
  }
}

/** The answer and two typical mistakes (what is left, one more or one less), smallest first. */
function choices() {
  const ok = (n) => n >= 1 && n <= 20 && n !== answer;
  const likely = shuffle([small, answer + 1, answer - 1].filter(ok));
  const more = [answer + 2, answer - 2, big].filter(ok);
  const picked = [...new Set([...likely, ...more])].slice(0, 2);
  return [answer, ...picked].sort((x, y) => x - y);
}

/** btn: the answer button tapped, or null when typed on the number pad. Returns whether n was right. */
function choose(btn, n) {
  if (locked) return false;
  if (n === answer) {
    right(btn);
    return true;
  }
  if (btn) {
    nudge(btn);
    btn.disabled = true;
  } else {
    pad.lock(true);
    if (misses + 1 >= SHOW_AFTER) {
      // Typed wrong many times: show the answer and go on, so nobody gets stuck.
      play.answer(false);
      misses++;
      locked = true;
      drawEq(true);
      say(`${oneOf(T.oops)} ${T.answerIs(word(answer))}`).then(() => {
        play.solved();
        setTimeout(next, 600);
      });
      return false;
    }
    pad.clear();
  }
  miss(T.thinkAgain);
  return false;
}

// ---------- Right and wrong

/** A wrong answer: soft sound, a hint; after a few the animals line up in pairs. */
async function miss(hint) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  pad?.lock(true);
  updateCheck();
  let text = hint;
  if (misses >= helpAfter() && !pairs) {
    pairs = true;
    pictures = true;
    drawMeadows();
    text = `${hint} ${tapping() ? (way === "weg" ? T.pairsAway : T.pairsMore) : T.pairsCount}`;
  }
  await say(oops(text));
  locked = false;
  pad?.lock(false);
  updateCheck();
}

/** Number levels with pictures: the animals without a partner go home, or new ones come out. */
async function showMove() {
  if (!pictures || tapping()) return;
  if (way === "weg") {
    const go = here(bigSide).sort((a, b) => b.slot - a.slot).slice(0, answer);
    const cells = [...meadowEls[bigSide].querySelectorAll(".pic")];
    for (const cell of cells.filter((c) => (pairs ? c.classList.contains("alone") : false))) hop(cell);
    if (!pairs) cells.slice(-answer).forEach(hop);
    await wait(HOP_MS);
    if (pairs) here(bigSide).filter((a) => a.alone).forEach((a) => (a.home = true));
    else go.forEach((a) => (a.home = true));
  } else {
    const animals = meadows[smallSide()].animals;
    const used = new Set(animals.map((a) => a.slot));
    const free = [...Array(slots).keys()].filter((s) => !used.has(s));
    for (let i = 0; i < answer; i++) animals.push({ slot: free[i], home: false, extra: true, fresh: true });
  }
  drawMeadows();
}

async function right(btn) {
  locked = true;
  play.answer(true);
  if (btn && !btn.classList.contains("check")) btn.classList.add("right", "bounce");
  pad?.show(answer);
  drawEq(true);
  sound.right();
  play.solved();
  stars++;
  drawStars();
  updateCheck();
  await showMove();
  cheerUp();

  let text;
  if (current.show === "numbers") {
    text = way === "weg" ? T.minusSays(word(big), word(answer), word(small)) : T.plusSays(word(small), word(answer), word(big));
  } else {
    const after = way === "weg" ? small : big;
    text = `${way === "weg" ? T.wentHome(answer, amount(answer)) : T.cameOut(answer, amount(answer))} ${T.nowBoth(word(after))}`;
  }
  await Promise.all([say(cheer(text)), wait(1600)]);
  setTimeout(next, 300);
}

/** The next task, or the trophy after five stars. */
function next() {
  if (stars >= STARS_PER_GAME) finish();
  else newRound();
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
window.addEventListener("resize", () => !screens.round.hidden && drawLines());

drawStars();
show("start");
