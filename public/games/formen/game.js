// "Formen" – circle, triangle, square and rectangle, for about 3 to 7 years.
// Five kinds of task (level "kind", see levels.js):
//   find   – "Tipp auf den Kreis!" one of 3 or 4 big shapes. Later in other colours and sizes,
//            then turned, long or flat (a triangle on its tip is still a triangle).
//   build  – a picture made of shapes (a house: a square and a triangle). The gaps are dashed,
//            one glows: which shape fits? The picture fills up shape by shape.
//   all    – nine shapes on a board: tap all the triangles.
//   count  – a finished picture: how many circles are in it? (one of three, or the number pad from 8)
//   riddle – "Ich habe drei Ecken. Wer bin ich?"
//   mix    – one of the others for every task.
// After two wrong answers (typing: five) the corners get dots and the game says what makes the shape,
// or, when counting, only the shapes to count stay bright.
// Every task comes from task() in tasks.js (shared/gen.js), the pictures are there too; this file only
// draws it. All texts are in lang/<language>.js. The shapes are drawn as SVG here, no image files.

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import * as profiles from "../../shared/profiles.js";
import { numpad } from "../../shared/numpad.js";
import { LEVELS } from "./levels.js";
import * as gen from "../../shared/gen.js";
import { task as makeTask, SHAPES, COLORS, PICTURES, part, lone } from "./tasks.js";

const ID = "formen";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;

const STARS_PER_GAME = 5;
const INK = "#1b2140";

// Older children type the count on the number pad (profiles.typeAnswers), younger ones pick one of three.
// Picking: the help comes after two wrong answers. Typing: after five, the answer after seven.
const typing = profiles.typeAnswers(profiles.current());
const helpAfter = () => (typing && current.kind === "count" ? 5 : 2);
const SHOW_AFTER = 7;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };
const word = (n) => T.numbers[n] ?? num(n);

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // the level of this task (in "mix" levels one of the others)
let stars = 0;
let misses = 0;
let locked = true;
let want = ""; // the shape the child looks for
let question = ""; // what the 🔊 button says again
let pad = null;

// Not the same picture (or the same shape to find) twice in a row, not the same task within three.
const nextTask = gen.generator(makeTask, { avoid: { pic: 1, key: 3 } });

// ---------- Drawing one shape as SVG

/** The outline (an SVG element) and the corners of a shape in its box, before turning. */
function geometry({ shape, x, y, w, h, tri }) {
  if (shape === "circle") return { el: `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w / 2}"/>`, corners: [] };
  let pts;
  if (shape === "triangle") {
    const tip = { iso: 0.5, right: 0, lean: 0.8 }[tri] ?? 0.5;
    pts = [[x, y + h], [x + w * tip, y], [x + w, y + h]];
  } else {
    pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  }
  return { el: `<polygon points="${pts.map((p) => p.join(",")).join(" ")}"/>`, corners: pts };
}

/** One shape: <g> with outline and corner dots (shown only with the class "show-corners"). */
function shapeSvg(s, { cls = "", dot = 5, stroke = 3 } = {}) {
  const { el, corners } = geometry(s);
  const turn = s.rot ? ` transform="rotate(${s.rot} ${s.x + s.w / 2} ${s.y + s.h / 2})"` : "";
  const dots = corners.map(([cx, cy]) => `<circle class="corner" cx="${cx}" cy="${cy}" r="${dot}"/>`).join("");
  // The turn sits on an outer <g>, so CSS animations on the shape (pop, glow) don't replace it.
  return `<g${turn}><g class="shape ${cls}" fill="${s.color}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round">${el}${dots}</g></g>`;
}

const svg = (inner, cls = "") => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;

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

function button(cls, label, html, onTap) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.setAttribute("aria-label", label);
  b.innerHTML = html;
  b.addEventListener("click", () => onTap(b));
  return b;
}

function nudge(b) {
  b.classList.remove("shake");
  void b.offsetWidth; // restart the animation
  b.classList.add("shake");
}

/** Big shape buttons below the board. shapes: [{ shape, spec }]. */
function drawChoices(list, onPick) {
  const box = $("choices");
  pad?.remove();
  pad = null;
  box.className = `choices n${list.length}`;
  box.innerHTML = "";
  for (const c of list) {
    box.append(button("btn choice", T.shapes[c.shape].one, svg(shapeSvg(c.spec)), (b) => onPick(b, c.shape)));
  }
}

// ---------- The tasks

let task = null; // this task, from tasks.js
let build = null; // build: { name, parts, filled: Set, step }
let found = 0; // all: how many found
let targets = 0; // all: how many there are
let answer = 0; // count: the right number

function startFind() {
  want = task.want;
  $("board").hidden = true;
  drawChoices(task.choices, pickFind);
  question = T.find(T.shapes[want]);
}

async function pickFind(b, shape) {
  if (locked) return;
  if (shape !== want) return wrong(b, T.wrongFind(T.shapes[shape], T.shapes[want]), T.hint[want]);
  right(b, T.rightFind(T.shapes[want]));
}

function startRiddle() {
  want = task.want;
  $("board").hidden = true;
  drawChoices(task.choices, pickRiddle);
  question = T.riddle[want];
}

function pickRiddle(b, shape) {
  if (locked) return;
  if (shape !== want) return wrong(b, T.wrongRiddle(T.shapes[shape]), T.cornersHint);
  right(b, T.rightRiddle(T.shapes[want]));
}

// Build: the picture with dashed gaps; the glowing gap is the next one (task.steps: biggest first).
function startBuild() {
  build = { name: task.pic, parts: PICTURES[task.pic].map(part), filled: new Set(), step: 0 };
  drawBuild();
  question = T.build;
}

const gapOf = () => task.steps[build.step]?.gap ?? -1;

function drawBuild() {
  const board = $("board");
  board.hidden = false;
  board.className = "board card";
  const gap = gapOf();
  const inner = build.parts
    .map((p, i) =>
      build.filled.has(i)
        ? shapeSvg(p, { cls: "filled", dot: 2.4, stroke: 1.6 })
        : shapeSvg({ ...p, color: "none" }, { cls: i === gap ? "gap" : "ghost", dot: 2.4, stroke: 1.6 }),
    )
    .join("");
  board.innerHTML = svg(inner, "picture");
  if (gap < 0) return;
  drawChoices(task.steps[build.step].choices, pickBuild);
}

async function pickBuild(b, shape) {
  if (locked) return;
  want = build.parts[gapOf()].shape;
  if (shape !== want) return wrong(b, T.wrongBuild, T.hint[want]);
  play.answer(true);
  sound.right();
  b.classList.add("right");
  build.filled.add(gapOf());
  build.step++;
  misses = 0;
  $("round").classList.remove("show-corners");
  if (gapOf() >= 0) {
    locked = true;
    drawBuild();
    question = T.buildNext;
    await say(`${T.rightBuild(T.shapes[shape])} ${T.buildNext}`);
    locked = false;
    return;
  }
  drawBuild();
  $("choices").innerHTML = "";
  $("board").querySelector(".picture").classList.add("bounce");
  solvedTask(cheer(T.built(T.pictures[build.name])));
}

// All: nine shapes in a 3 × 3 grid, 2 to 4 of them are the ones to find.
function startAll() {
  want = task.want;
  targets = task.targets;
  found = 0;
  const board = $("board");
  board.hidden = false;
  board.className = "board card grid";
  board.innerHTML = "";
  for (const { shape, spec } of task.cells) {
    board.append(button("cell", T.shapes[shape].one, svg(shapeSvg(spec)), (b) => pickAll(b, shape)));
  }
  $("choices").innerHTML = "";
  $("choices").className = "choices";
  question = T.all(T.shapes[want]);
}

function pickAll(b, shape) {
  if (locked || b.classList.contains("found")) return;
  if (shape !== want) return wrong(b, T.wrongAll(T.shapes[shape], T.shapes[want]), T.hint[want]);
  b.classList.add("found", "bounce");
  found++;
  if (found < targets) {
    play.answer(true);
    sound.tap();
    return;
  }
  right(null, T.allFound(T.shapes[want]));
}

// Count: a finished picture, count one kind of shape in it.
function startCount() {
  const parts = PICTURES[task.pic].map(part);
  want = task.want;
  answer = task.answer;
  const board = $("board");
  board.hidden = false;
  board.className = "board card";
  board.innerHTML = svg(
    parts.map((p) => shapeSvg(p, { cls: p.shape === want ? "filled counted" : "filled", dot: 2.4, stroke: 1.6 })).join(""),
    "picture",
  );
  drawNumbers();
  question = T.count(T.shapes[want]);
}

function drawNumbers() {
  const box = $("choices");
  pad?.remove();
  pad = null;
  if (typing) {
    pad = numpad(box, T, { digits: 1, onCheck: (n) => pickCount(null, n) });
    return;
  }
  box.className = "answers";
  box.innerHTML = "";
  for (const n of task.numbers) {
    box.append(button("btn answer", word(n), `<span class="num">${num(n)}</span><span class="dots">${"<i></i>".repeat(n)}</span>`, (b) => pickCount(b, n)));
  }
}

function pickCount(b, n) {
  if (locked) return false;
  const what = T.amount(answer, T.shapes[want], word(answer));
  if (n === answer) {
    pad?.show(n);
    right(b, T.rightCount(what));
    return true;
  }
  if (!b && misses + 1 >= SHOW_AFTER) {
    // Typed wrong many times: show the answer and go on, so nobody gets stuck.
    play.answer(false);
    sound.wrong();
    locked = true;
    pad.show(answer);
    say(`${oneOf(T.oops)} ${T.answerIs(word(answer))}`).then(() => {
      play.solved();
      stars++;
      drawStars();
      setTimeout(next, 600);
    });
    return false;
  }
  pad?.clear();
  wrong(b, T.countAgain, T.countHint(T.shapes[want]));
  return false;
}

// ---------- Right and wrong (the same for every kind)

/** A wrong answer: soft sound, the button shakes. After two (typing: five) the help shows. */
async function wrong(b, text, help) {
  play.answer(false);
  sound.wrong();
  if (b) {
    nudge(b);
    if (!b.classList.contains("cell")) b.disabled = true;
  }
  misses++;
  const helping = misses >= helpAfter();
  if (helping) showHelp();
  locked = true;
  pad?.lock(true);
  await say(oops(helping ? `${text} ${help}` : text));
  locked = false;
  pad?.lock(false);
}

/** The help: corners get dots (on the buttons, the board and the gap); counting: only the counted ones stay bright. */
function showHelp() {
  if (current.kind === "count") $("board").classList.add("only-counted");
  else $("round").classList.add("show-corners");
}

async function right(b, text) {
  locked = true;
  play.answer(true);
  b?.classList.add("right", "bounce");
  sound.right();
  solvedTask(cheer(text));
}

function solvedTask(text) {
  locked = true;
  play.solved();
  stars++;
  drawStars();
  Promise.all([say(text), wait(1200)]).then(() => setTimeout(next, 300));
}

const next = () => (stars >= STARS_PER_GAME ? finish() : newTask());

const STARTERS = { find: startFind, build: startBuild, all: startAll, count: startCount, riddle: startRiddle };

async function newTask() {
  task = nextTask(LEVELS[play.level]);
  current = LEVELS.find((l) => l.id === task.level); // in "mix" levels one of the others
  locked = true;
  misses = 0;
  $("round").classList.remove("show-corners");
  $("round").dataset.kind = current.kind;
  STARTERS[current.kind]();
  show("round");
  pad?.lock(true);
  await say(question);
  locked = false;
  pad?.lock(false);
}

function finish() {
  play.round();
  pad?.remove();
  pad = null;
  show("done");
  sound.win();
  celebrate();
  say(T.wellDone);
}

function startGame() {
  stars = 0;
  drawStars();
  newTask();
}

// ---------- Wire up buttons

fill(T);
document.title = `${T.title} · AnkaPlay`;
homeButton($("home"));
$("speak").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("again").innerHTML = icons.again;
$("start-art").innerHTML = SHAPES.map((s, i) => svg(shapeSvg(lone(null, s, "same", COLORS[i])))).join("");

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question);
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
