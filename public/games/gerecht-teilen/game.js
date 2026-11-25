// "Gerecht teilen" – sharing fairly, for about 4 to 8 years. A first idea of dividing and halving.
// A basket full of cookies (or apples, carrots …) and two to four animal friends with a plate each.
// The child taps a plate: one thing jumps from the basket onto it (tap it on the plate: it goes back).
// ✓ checks: does everyone have the same and is the basket empty? Right: the friends jump and the
// sum shows: 6 : 2 = 3. Later levels: one or two are left over and stay in the basket (7 for 2),
// the last one is cut in half (5 for 2: two and a half each), then the child says how many each
// friend gets (one of three, or the number pad from 8), then numbers only, up to 50.
// After two wrong answers the plates show how many each friend has, or the things are dealt out
// one by one. See levels.js. All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, shuffle, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { numpad } from "../../shared/numpad.js";
import * as profiles from "../../shared/profiles.js";
import { LEVELS } from "./levels.js";

const ID = "gerecht-teilen";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Jeder bekommt drei Kekse."
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau nochmal genau!"

// What is shared. cut: can be cut in half (for the halving level). Names are in lang/<language>.js.
const TREATS = [
  { id: "cookie", icon: "🍪", cut: true },
  { id: "apple", icon: "🍎", cut: true },
  { id: "strawberry", icon: "🍓", cut: false },
  { id: "candy", icon: "🍬", cut: false },
  { id: "carrot", icon: "🥕", cut: true },
  { id: "banana", icon: "🍌", cut: true },
  { id: "donut", icon: "🍩", cut: true },
].map((t) => ({ ...t, ...T.treats[t.id] }));
// The friends who share. Only faces, so they never look like something to count.
const FRIENDS = ["🐻", "🐰", "🐼", "🦊", "🐸", "🐯", "🐨", "🐷", "🐵", "🦁", "🐶", "🐱"];

const STARS_PER_GAME = 5;
const FLY_MS = 260;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // LEVELS[play.level] of this task
let stars = 0;
let kids = 2; // how many friends share
let each = 3; // how many every friend gets (the answer)
let rest = 0; // left over in the basket (not counting the one that is cut in half)
let total = 6;
let basket = []; // [{ key, half }]
let plates = []; // one list per friend: [{ key, half }]
let faces = [];
let thing = null;
let lastThing = null;
let lastTask = "";
let misses = 0;
let pictures = true; // the things in the basket (false: only a number sign)
let counts = false; // the help: every plate shows how many are on it
let dealt = false; // number levels: the things were dealt out (help, or after the right answer)
let locked = true;
let nextKey = 0;
// Older children type the answer on a number pad instead of picking one of three (profiles.typeAnswers).
const typing = profiles.typeAnswers(profiles.current());
let pad = null;
/** Tapping or picking one of three: the help comes after two wrong answers. Typing: the child tries longer
 *  by themselves, the help comes after five, the answer after seven, so nobody gets stuck. */
const helpAfter = () => (typing && current.input === "number" ? 5 : 2);
const SHOW_AFTER = 7;

const word = (n) => T.numbers[n] ?? num(n);
const amount = (n) => T.amount(n, thing, word(n));
const tapping = () => current.input === "tap";
const value = (list) => list.reduce((sum, t) => sum + (t.half ? 0.5 : 1), 0);
const item = (half = false) => ({ key: nextKey++, half });
/** Halving level: only one whole one is left in the basket, it waits to be cut. */
const waitsForCut = () => current.half && basket.length === 1 && !basket[0].half;

// ---------- Screens

function show(name) {
  for (const [key, node] of Object.entries(screens)) node.hidden = key !== name;
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

// ---------- The sum on top: 12 : 3 = ? (tapping levels show it only at the end)

function drawEq(found = false) {
  const eq = $("eq");
  if (tapping() && (!found || rest)) {
    eq.innerHTML = "";
    return;
  }
  const result = num(each) + (current.half ? "½" : "");
  const box = found ? `<b class="found pop">${result}</b>` : `<b class="gap">?</b>`;
  eq.innerHTML = `${num(total)} ${T.divide} ${num(kids)} = ${box}`;
}

// ---------- The basket and the plates

/** One thing to share. A half shows only its left half. */
function treat(t, tag = "span") {
  const node = el(tag, "treat" + (t.half ? " half" : ""));
  node.dataset.key = t.key;
  node.append(el("span", "treat-pic", thing.icon));
  if (tag === "button") {
    node.type = "button";
    node.setAttribute("aria-label", thing.one);
  }
  return node;
}

function drawBasket() {
  const box = $("basket");
  box.innerHTML = "";
  box.className = "basket";
  box.append(el("span", "basket-pic", "🧺"));
  if (!pictures) {
    // Numbers only: a sign on the basket.
    const sign = el("div", "sign");
    sign.append(el("b", "", num(total)), el("span", "sign-pic", thing.icon));
    box.append(sign);
    return;
  }
  const grid = el("div", "basket-grid" + (total > 12 ? " many" : ""));
  for (const t of basket) {
    const cut = waitsForCut();
    const node = treat(t, cut ? "button" : "span");
    if (cut) {
      node.classList.add("cut-me");
      node.addEventListener("click", cutLast);
    }
    grid.append(node);
  }
  box.append(grid);
}

function drawPlates() {
  const box = $("friends");
  box.innerHTML = "";
  box.className = `friends k${kids}`;
  plates.forEach((list, p) => {
    const friend = el(tapping() ? "button" : "div", "friend");
    if (tapping()) {
      friend.type = "button";
      friend.setAttribute("aria-label", T.plate);
      friend.addEventListener("click", () => tapPlate(p, friend));
    }
    friend.append(el("span", "face", faces[p]));
    const plate = el("div", "plate" + (kids > 2 ? " small" : "") + (each > (kids > 2 ? 4 : 6) ? " full" : ""));
    for (const t of list) {
      const node = treat(t);
      if (tapping()) {
        node.classList.add("back");
        node.addEventListener("click", (e) => {
          e.stopPropagation();
          tapTreat(p, t);
        });
      }
      plate.append(node);
    }
    friend.append(plate);
    if (counts || (dealt && !tapping())) {
      const v = value(list);
      friend.append(el("b", "count", num(Math.floor(v)) + (v % 1 ? "½" : "")));
    }
    box.append(friend);
  });
}

function drawAll() {
  drawBasket();
  drawPlates();
  updateCheck();
}

/** Moves the things whose place changed from where they were (rects before drawing) to their new place. */
function fly(before) {
  for (const [key, from] of before) {
    const node = document.querySelector(`.treat[data-key="${key}"]`);
    if (!node) continue;
    const to = node.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (!dx && !dy) continue;
    node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: FLY_MS, easing: "ease-out" });
  }
}

const rectOf = (t) => document.querySelector(`.treat[data-key="${t.key}"]`)?.getBoundingClientRect();

/** Moves one thing and lets it fly there. */
function move(t, from, to) {
  const rect = rectOf(t);
  from.splice(from.indexOf(t), 1);
  to.push(t);
  drawAll();
  if (rect) fly([[t.key, rect]]);
}

function cheerUp() {
  document.querySelectorAll(".face").forEach((f, i) => {
    f.style.animationDelay = i * 0.08 + "s";
    f.classList.add("happy");
  });
}

// ---------- One task

function question() {
  if (tapping()) return T.tapAsk(thing, word(kids)) + (current.rest ? ` ${T.restTip}` : "");
  return T.ask(amount(total), word(kids));
}

function newTask() {
  const l = current;
  for (let i = 0; i < 8; i++) {
    kids = randInt(l.kids[0], l.kids[1]);
    const most = Math.min(l.each[1], Math.floor((l.max - (l.half ? 1 : 0)) / kids));
    each = randInt(Math.min(l.each[0], most), most);
    rest = 0;
    if (l.rest && Math.random() < 0.7 && l.max - each * kids >= 1) rest = randInt(1, Math.min(kids - 1, l.max - each * kids));
    total = each * kids + rest + (l.half ? 1 : 0); // halving: one more, it is cut in half
    if (`${kids}-${total}` !== lastTask) break; // never the same task twice in a row
  }
  lastTask = `${kids}-${total}`;
  basket = Array.from({ length: total }, () => item());
  plates = Array.from({ length: kids }, () => []);
  faces = shuffle(FRIENDS).slice(0, kids);
}

async function newRound() {
  current = LEVELS[play.level];
  locked = true;
  misses = 0;
  counts = false;
  dealt = false;
  pictures = current.show !== "numbers";
  const choice = current.half ? TREATS.filter((t) => t.cut) : TREATS;
  thing = shuffle(choice.filter((t) => t !== lastThing))[0];
  lastThing = thing;
  newTask();
  drawEq();
  drawAnswers();
  show("round");
  drawAll();
  pad?.lock(true);
  await say(question());
  locked = false;
  pad?.lock(false);
  updateCheck();
}

// ---------- Tapping: one from the basket onto a plate, or back

function nudge(node) {
  if (!node) return;
  node.classList.remove("shake");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

function tapPlate(p, friend) {
  if (locked) return;
  if (!basket.length) {
    nudge($("basket"));
    return void say(T.basketEmpty);
  }
  if (waitsForCut()) {
    nudge($("basket").querySelector(".cut-me"));
    return void say(T.cutHint);
  }
  sound.tap();
  move(basket[basket.length - 1], basket, plates[p]);
  if (waitsForCut()) say(T.cutHint);
}

function tapTreat(p, t) {
  if (locked) return;
  sound.tap();
  move(t, plates[p], basket);
}

/** Halving: the last one in the basket falls apart into two halves. */
function cutLast() {
  if (locked || !waitsForCut()) return;
  sound.right();
  basket = [item(true), item(true)];
  drawAll();
  $("basket").querySelectorAll(".treat").forEach((n) => n.classList.add("pop"));
  say(T.cut);
}

/** The ✓ button is on when something is on a plate. */
function updateCheck() {
  const check = $("answers").querySelector(".check");
  if (!check) return;
  check.disabled = locked || plates.every((list) => !list.length);
}

function checkTap(btn) {
  if (locked) return;
  const values = plates.map(value);
  const fair = values.every((v) => v === values[0]);
  if (!fair) {
    nudge(btn);
    return void miss(T.notFair);
  }
  if (waitsForCut()) {
    nudge($("basket").querySelector(".cut-me"));
    return void say(T.cutHint);
  }
  const left = value(basket);
  if (current.half ? left > 0 : left >= kids) {
    nudge(btn);
    return void miss(T.stillInBasket);
  }
  right(btn);
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
    btn.innerHTML = `<span class="num">${num(n)}</span><span class="dots">${"<i></i>".repeat(n)}</span>`;
    btn.addEventListener("click", () => choose(btn, n));
    answers.append(btn);
  }
}

/** The answer and two typical mistakes (one more, one less, the number of friends), smallest first. */
function choices() {
  const ok = (n) => n >= 1 && n <= 10 && n !== each;
  const likely = shuffle([each + 1, each - 1, kids].filter(ok));
  const more = [each + 2, each - 2, each + 3].filter(ok);
  const picked = [...new Set([...likely, ...more])].slice(0, 2);
  return [each, ...picked].sort((x, y) => x - y);
}

/** btn: the answer button tapped, or null when typed on the number pad. Returns whether n was right. */
function choose(btn, n) {
  if (locked) return false;
  if (n === each) {
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
      say(`${oneOf(T.oops)} ${T.answerIs(word(each))}`).then(() => {
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

/** Number levels: the things go onto the plates one by one, one for each friend in turn. */
async function deal() {
  if (dealt) return;
  dealt = true;
  pictures = true;
  drawAll();
  const pause = Math.max(40, Math.min(220, 2400 / total));
  let p = 0;
  while (basket.length > rest) {
    move(basket[0], basket, plates[p]);
    sound.tap();
    p = (p + 1) % kids;
    await wait(pause);
  }
  await wait(FLY_MS);
}

// ---------- Right and wrong

/** A wrong answer: soft sound, a hint; after a few the help comes. */
async function miss(hint) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  pad?.lock(true);
  updateCheck();
  let text = hint;
  const help = misses >= helpAfter() && !(tapping() ? counts : dealt);
  if (help && tapping()) {
    counts = true;
    drawAll();
    text = `${hint} ${T.helpLook}`;
  }
  if (help && !tapping()) {
    await say(oops(hint));
    await deal();
    await say(T.helpDeal);
  } else {
    await say(oops(text));
  }
  locked = false;
  pad?.lock(false);
  updateCheck();
}

async function right(btn) {
  locked = true;
  play.answer(true);
  if (btn && !btn.classList.contains("check")) btn.classList.add("right", "bounce");
  pad?.show(each);
  drawEq(true);
  sound.right();
  play.solved();
  stars++;
  drawStars();
  updateCheck();
  if (!tapping()) await deal();
  counts = true;
  drawAll();
  cheerUp();

  let text;
  if (current.show === "numbers") text = T.divideSays(word(total), word(kids), word(each));
  else if (current.half) text = T.eachGetsHalf(each, thing, word(each));
  else text = T.eachGets(each, thing, word(each)) + (rest ? ` ${T.left(rest, word(rest))}` : "");
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

drawStars();
show("start");
