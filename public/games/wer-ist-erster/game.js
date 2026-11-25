// "Wer ist Erster?" – ordinal numbers, for about 4 to 7 years: the first, the third, the last in a row.
// The animals queue for ice cream. The ice-cream cart is at the front (left), so the animal next to it is
// the first. "Tippe auf das dritte Tier!" – the child taps it. Later levels: "Das wievielte Tier ist der
// Löwe?" (one of three answers, the number pad from 8), "Wer steht direkt vor dem Löwen?", and counting
// from the back. After two wrong answers the places (1, 2, 3 …) appear under the animals.
// See levels.js. All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, shuffle, randInt, pick, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { numpad } from "../../shared/numpad.js";
import * as profiles from "../../shared/profiles.js";
import { things } from "../../shared/things.js";
import { LEVELS } from "./levels.js";

const ID = "wer-ist-erster";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;

// Animals with a name for this game (lang/<language>.js "names"), each looks different.
const ANIMALS = things(T).filter((t) => T.names[t.id]).map((t) => ({ ...t, ...T.names[t.id] }));

const STARS_PER_GAME = 5;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // LEVELS[play.level] of this task
let stars = 0;
let queue = []; // the animals, front first
let kind = "tap"; // see levels.js
let target = 0; // index (front = 0) of the animal to find
let ref = 0; // "beside": the animal the question is about
let dir = "front"; // "beside": "front" or "behind"
let askLast = false; // "ends" / "tap": the question is "the last animal"
let lastTask = "";
let misses = 0;
let help = false; // the places show under the animals
let locked = true;
// Older children type the place on a number pad instead of picking one of three (profiles.typeAnswers).
const typing = profiles.typeAnswers(profiles.current());
let pad = null;
/** The places help after two wrong answers. Typing: the child tries longer by themselves, the help comes
 *  after five, the answer after seven, so nobody gets stuck (the same rule as the other number games). */
const helpAfter = () => (typing && kind === "which" ? 5 : 2);
const SHOW_AFTER = 7;

const n = () => queue.length;
const place = (i) => T.places[i] ?? num(i); // "dritte"
const fromBack = (i) => n() - i; // index → place counted from the back

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

// ---------- The queue

/** The number under animal i: its place from the front, or from the back on "back" tasks. */
const badge = (i) => num(kind === "back" ? fromBack(i) : i + 1);

function drawQueue() {
  const row = $("queue");
  row.innerHTML = "";
  row.style.setProperty("--n", n());
  queue.forEach((animal, i) => {
    const spot = el("div", "spot");
    const btn = el(kind === "which" ? "span" : "button", "animal pop", animal.icon);
    btn.style.animationDelay = i * 0.06 + "s";
    if (kind === "which" && i === target) btn.classList.add("asked");
    if (kind === "beside" && i === ref) btn.classList.add("asked");
    if (kind !== "which") {
      btn.type = "button";
      btn.setAttribute("aria-label", animal.nom);
      btn.addEventListener("click", () => tapAnimal(i, btn));
    }
    spot.append(btn, el("b", "place", badge(i)));
    row.append(spot);
  });
  row.classList.toggle("help", help);
  row.classList.toggle("back", kind === "back");
}

function animalEl(i) {
  return $("queue").children[i]?.querySelector(".animal");
}

function nudge(node) {
  node.classList.remove("shake", "pop");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

/** Everybody is happy: a little hop down the line. */
function cheerUp() {
  [...$("queue").querySelectorAll(".animal")].forEach((a, i) => {
    a.classList.remove("pop", "shake");
    a.style.animationDelay = i * 0.07 + "s";
    a.classList.add("happy");
  });
}

// ---------- One task

function question() {
  const who = queue[kind === "beside" ? ref : target];
  if (kind === "which") return T.which(who);
  if (kind === "beside") return dir === "front" ? T.front(who) : T.behind(who);
  if (kind === "back") return T.tapBack(place(fromBack(target)));
  return askLast ? T.tapLast : T.tapPlace(place(target + 1));
}

function newTask() {
  const l = current;
  for (let tries = 0; tries < 8; tries++) {
    kind = pick(l.kinds);
    const size = randInt(l.n[0], l.n[1]);
    queue = shuffle(ANIMALS).slice(0, size);
    askLast = false;
    if (kind === "ends") {
      askLast = Math.random() < 0.5;
      target = askLast ? size - 1 : 0;
    } else if (kind === "tap") {
      // Sometimes "the last one", so the child learns that the last has a place too.
      askLast = Math.random() < 0.2;
      target = askLast ? size - 1 : randInt(1, Math.min(l.upTo, size)) - 1;
    } else if (kind === "which") {
      target = randInt(0, size - 1);
    } else if (kind === "beside") {
      dir = pick(["front", "behind"]);
      ref = dir === "front" ? randInt(1, size - 1) : randInt(0, size - 2);
      target = dir === "front" ? ref - 1 : ref + 1;
    } else {
      // From the back: the second, third … (the first from the back is simply the last).
      target = size - randInt(2, size - 1);
    }
    const key = `${kind}${askLast}${dir}${size}-${target}`;
    if (key !== lastTask) {
      lastTask = key;
      return;
    }
  }
}

async function newRound() {
  current = LEVELS[play.level];
  locked = true;
  misses = 0;
  help = false;
  newTask();
  drawQueue();
  drawAnswers();
  show("round");
  pad?.lock(true);
  await say(question());
  locked = false;
  pad?.lock(false);
}

// ---------- Tapping an animal

function tapAnimal(i, btn) {
  if (locked) return;
  sound.tap();
  if (i === target) return void right(btn);
  nudge(btn);
  miss(whatIsIt(i));
}

/** A wrong tap: say what the child tapped, so the next try is easier. */
function whatIsIt(i) {
  if (kind === "beside") return i === ref ? T.thatIsSelf(queue[ref]) : T.thinkAgain;
  if (kind === "back") return fromBack(i) === 1 ? T.thatIsLast : T.thatIsBack(place(fromBack(i)));
  if (i === n() - 1) return T.thatIsLast;
  return T.thatIs(place(i + 1));
}

// ---------- "What place?": one of three, or the number pad

function drawAnswers() {
  const answers = $("answers");
  pad?.remove();
  pad = null;
  answers.className = "answers";
  answers.innerHTML = "";
  if (kind !== "which") {
    answers.className = "answers none";
    return;
  }
  if (typing) {
    pad = numpad(answers, T, { digits: 1, onCheck: (k) => choose(null, k) });
    return;
  }
  for (const k of choices()) {
    const btn = el("button", "btn answer");
    btn.type = "button";
    btn.setAttribute("aria-label", place(k));
    btn.innerHTML = `<span class="num">${T.short(num(k), k)}</span><span class="dots">${"<i></i>".repeat(k)}</span>`;
    btn.addEventListener("click", () => choose(btn, k));
    answers.append(btn);
  }
}

/** The right place and two neighbours (the usual mistake: one off, or counted from the back). */
function choices() {
  const answer = target + 1;
  const ok = (k) => k >= 1 && k <= n() && k !== answer;
  const likely = shuffle([answer - 1, answer + 1, fromBack(target)].filter(ok));
  const more = [answer - 2, answer + 2, 1, n()].filter(ok);
  return [answer, ...[...new Set([...likely, ...more])].slice(0, 2)].sort((a, b) => a - b);
}

/** btn: the answer button tapped, or null when typed on the number pad. Returns whether k was right. */
function choose(btn, k) {
  if (locked) return false;
  if (k === target + 1) {
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
      help = true;
      drawQueue();
      pad.show(target + 1);
      say(`${oneOf(T.oops)} ${T.isPlace(queue[target], place(target + 1))}`).then(() => {
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

function hintText() {
  if (kind === "beside") return dir === "front" ? T.frontHint(queue[ref]) : T.behindHint(queue[ref]);
  if (kind === "back") return T.countBack;
  if (askLast) return T.lastHint;
  return T.countFront;
}

/** A wrong answer: soft sound and what it was; after a few the places appear under the animals. */
async function miss(text) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  pad?.lock(true);
  if (misses >= helpAfter() && !help) {
    help = true;
    $("queue").classList.add("help");
    text = `${text} ${hintText()}`;
  }
  await say(oops(text));
  locked = false;
  pad?.lock(false);
}

function rightText() {
  const who = queue[target];
  if (kind === "beside") return dir === "front" ? T.isFront(who, queue[ref]) : T.isBehind(who, queue[ref]);
  if (kind === "back") return T.isBack(who, place(fromBack(target)));
  if (askLast) return T.isLast(who);
  return T.isPlace(who, place(target + 1));
}

async function right(btn) {
  locked = true;
  play.answer(true);
  pad?.show(target + 1);
  if (btn?.classList.contains("answer")) btn.classList.add("right", "bounce");
  const found = animalEl(target);
  found.classList.remove("shake", "pop");
  found.classList.add("found", "bounce");
  found.parentElement.classList.add("shown"); // its place shows underneath
  sound.right();
  play.solved();
  stars++;
  drawStars();
  await Promise.all([say(cheer(rightText())), wait(1400)]);
  cheerUp();
  await wait(700);
  next();
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
$("cart").setAttribute("aria-label", T.cart);

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
