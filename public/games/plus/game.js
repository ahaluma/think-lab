// "Plus" – adding, for about 5 to 10 years. Follows "Zahlenhaus" and "Zehnerfreunde".
// The sum stands on top (3 + 2 = ?), the animals below it: 🐰🐰🐰 + 🐰🐰. The child taps the result.
// Levels: pictures up to 5, up to 10; then the first group hides behind a bush that shows its number
// (count on: "six … seven, eight"); then numbers only (the pictures help after two wrong answers);
// then above 10 with two ten-frames: first fill the ten, then the rest (8 + 5 = 8 + 2 + 3);
// then up to 100 and 1000: whole tens, without and with carrying. After two wrong answers a place-value
// chart helps (hundreds plates, tens sticks, ones cubes: 38 + 27 = 50 + 15). Gap levels ask for the
// missing number (3 + ? = 7). See levels.js. The numbers come from the shared block shared/rechnen.js.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import * as rechnen from "../../shared/rechnen.js";
import { numpad } from "../../shared/numpad.js";
import * as profiles from "../../shared/profiles.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";

const ID = "plus";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei und zwei sind zusammen fünf."
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Zähl alle zusammen!"
const THINGS = things(T);

const STARS_PER_GAME = 5;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // LEVELS[play.level] of this task
let stars = 0;
let a = 0; // first number
let b = 0; // second number
let sum = 0; // a + b
let answer = 0; // what the child taps: the sum, or b in a gap task (3 + ? = 7)
let gap = null; // null or "b"
let thing = null;
let lastThing = null;
let misses = 0;
let locked = false;
// Older children type the answer on a number pad instead of picking one of three (profiles.typeAnswers).
const typing = profiles.typeAnswers(profiles.current());
let pad = null;
/** Picking one of three: the help comes after two wrong answers. Typing: the child tries longer by
 *  themselves, the help (no answer in it) comes after five, the answer after seven, so nobody gets stuck. */
const HELP_AFTER = typing ? 5 : 2;
const SHOW_AFTER = 7;

// Number words up to 20, digits above and in the levels up to 100 and 1000 (the voice reads them).
const word = (n) => (current?.big ? num(n) : T.numbers[n] ?? num(n));

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

// ---------- The sum and the pictures

/** "3 + 2 = ?", or "3 + ? = 7" in a gap task. found: the answer shows in green. */
function drawSum(found = false) {
  $("sum").classList.toggle("long", sum >= 100);
  const box = found ? `<b class="found pop">${num(answer)}</b>` : `<b class="gap">?</b>`;
  $("sum").innerHTML = gap ? `${num(a)} + ${box} = ${num(sum)}` : `${num(a)} + ${num(b)} = ${box}`;
}

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

/** A group of animals, at most 5 in a row (so 3 and 5 are easy to see). */
function group(n, extra = "") {
  const g = el("span", "group " + extra);
  g.style.setProperty("--cols", Math.min(n, 5));
  for (let i = 0; i < n; i++) g.append(el("span", "pic", thing.icon));
  return g;
}

/** The bush hides the first group and shows how many are behind it. */
function bush() {
  const box = el("span", "bush");
  box.append(el("span", "bush-leaves", "🌳"), el("b", "bush-number", num(a)));
  return box;
}

/** Above 10: two ten-frames. The first group, then the second fills up the ten (green), then the rest. */
function frames() {
  const box = el("span", "frames");
  for (let f = 0; f < 2; f++) {
    const frame = el("span", "frame");
    for (let i = f * 10; i < f * 10 + 10; i++) {
      const place = el("span", "place");
      if (i < a) place.textContent = thing.icon;
      else if (i < sum) place.classList.add("second"), (place.textContent = thing.icon);
      else place.classList.add("empty");
      frame.append(place);
    }
    box.append(frame);
  }
  // "8 + 2 + 3": how the second number is split.
  const toTen = 10 - a;
  box.append(el("span", "split", `${num(a)} + ${num(toTen)} + ${num(b - toTen)}`));
  return box;
}

/** Up to 100 and 1000: a place-value chart. Each number as hundreds plates, tens sticks and ones cubes,
 *  then the sum of every column: 38 + 27 = 50 + 15. */
function blocks() {
  const cols = current.big.digits === 3 ? [0, 1, 2] : [1, 2];
  const box = el("span", "blocks");
  const chart = el("span", "chart cols-" + cols.length);
  for (const c of cols) chart.append(el("b", "head", T.places[c]));
  for (const [n, extra] of [[a, ""], [b, " second"]]) {
    const d = rechnen.digits(n);
    for (const c of cols) {
      const cell = el("span", "cell" + extra);
      for (let i = 0; i < d[c]; i++) cell.append(el("i", ["plate", "stick", "cube"][c]));
      chart.append(cell);
    }
  }
  box.append(chart, el("span", "split", rechnen.columnSums(a, b).map(num).join(" + ")));
  return box;
}

/** kind: "pictures", "bush", "frames", "blocks", or "" (numbers only). */
function drawPictures(kind) {
  const box = $("pictures");
  box.innerHTML = "";
  box.className = "pictures " + kind;
  if (!kind) return;
  if (kind === "frames") return void box.append(frames());
  if (kind === "blocks") return void box.append(blocks());
  box.append(kind === "bush" ? bush() : group(a), el("span", "sign", "+"), group(b, "second"));
}

/** The bush moves away: the animals behind it show. */
function openBush() {
  const hidden = $("pictures").querySelector(".bush");
  if (hidden) hidden.replaceWith(group(a, "pop"));
}

// ---------- One round

function question() {
  return gap ? T.gapQuestion(word(a), word(sum)) : T.question(word(a), word(b));
}

async function newRound() {
  current = LEVELS[play.level];
  locked = true;
  misses = 0;
  const before = `${a}+${b}`;
  for (let i = 0; i < 5 && `${a}+${b}` === before; i++) ({ a, b, sum, gap, answer } = rechnen.task(current)); // never the same task twice in a row
  thing = shuffle(THINGS.filter((t) => t !== lastThing))[0];
  lastThing = thing;
  drawSum();
  drawPictures(current.show === "numbers" ? "" : current.show);
  drawAnswers();
  show("round");
  pad?.lock(true);
  await say(question());
  locked = false;
  pad?.lock(false);
}

// Three choices: the answer and typical mistakes, smallest first. Dots only up to 10.
// Older children: a number pad instead.
function drawAnswers() {
  const answers = $("answers");
  pad?.remove();
  pad = null;
  if (typing) {
    const digits = String(Math.max(answer, 9) * 10).length; // one digit more than the answer has room
    // The typed number shows in the "?" box of the sum.
    const display = $("sum").querySelector(".gap");
    pad = numpad(answers, T, { digits: Math.min(digits, 4), onCheck: (n) => choose(null, n), display });
    return;
  }
  answers.className = "answers";
  answers.innerHTML = "";
  answers.classList.toggle("big", answer >= 100);
  for (const n of rechnen.choices({ a, b, sum, gap, answer }, current)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn answer";
    btn.setAttribute("aria-label", word(n));
    btn.innerHTML = `<span class="num">${num(n)}</span>` + (sum <= 10 ? `<span class="dots">${"<i></i>".repeat(n)}</span>` : "");
    btn.addEventListener("click", () => choose(btn, n));
    answers.append(btn);
  }
}

/** What to say after a wrong answer; on the second one the pictures help. */
function helpAfterMiss() {
  const kind = current.show;
  if (kind === "pictures") return T.countAll;
  if (kind === "bush") {
    if (misses >= HELP_AFTER) openBush();
    return T.startAt(word(a));
  }
  if (kind === "frames") return T.fillTen;
  // Numbers only
  if (misses < HELP_AFTER) return question();
  if (current.help === "blocks") {
    drawPictures("blocks");
    return rechnen.carries(a, b).some(Boolean) ? T.carryHelp : T.blocksHelp;
  }
  drawPictures(current.help === "frames" && sum > 10 ? "frames" : "pictures");
  return sum > 10 ? T.fillTen : T.picturesHelp;
}

/** btn: the answer button tapped, or null when typed on the number pad. Returns whether n was right. */
function choose(btn, n) {
  if (locked) return false;
  if (n !== answer) {
    wrong(btn);
    return false;
  }
  right(btn);
  return true;
}

async function wrong(btn) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  if (btn) {
    btn.classList.remove("shake");
    void btn.offsetWidth; // restart the animation
    btn.classList.add("shake");
    btn.disabled = true;
  } else {
    pad.lock(true);
    if (misses >= SHOW_AFTER) {
      // Typed wrong three times: show the answer and go on, so nobody gets stuck.
      drawSum(true);
      await say(`${oneOf(T.oops)} ${T.answerIs(word(answer))}`);
      play.solved();
      setTimeout(next, 600);
      return;
    }
    pad.clear();
  }
  await say(oops(helpAfterMiss()));
  locked = false;
  pad?.lock(false);
}

/** The next task, or the trophy after five stars. */
function next() {
  if (stars >= STARS_PER_GAME) finish();
  else newRound();
}

function right(btn) {
  locked = true;
  play.answer(true);
  if (btn) btn.classList.add("right", "bounce");
  drawSum(true);
  sound.right();
  play.solved();
  stars++;
  drawStars();

  let text;
  const parts = rechnen.columnSums(a, b);
  if (current.big && parts.length > 1 && !gap) {
    text = T.columns(parts.map(word), word(sum));
  } else if (sum > 10 && sum <= 20 && !gap) {
    const toTen = 10 - a;
    text = T.bridge(word(a), word(toTen), word(b - toTen), word(sum));
  } else if (current.show === "bush") {
    openBush();
    const on = [];
    for (let i = a + 1; i <= sum; i++) on.push(word(i));
    text = `${T.countOn(word(a), on)} ${T.together(word(a), word(b), word(sum))}`;
  } else {
    text = T.together(word(a), word(b), word(sum));
  }
  Promise.all([say(cheer(text)), wait(1500)]).then(() => setTimeout(next, 300));
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
