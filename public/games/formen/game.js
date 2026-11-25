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
// All texts are in lang/<language>.js. The shapes are drawn as SVG here, no image files.

import { say, oneOf, sound, celebrate, shuffle, pick, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import * as profiles from "../../shared/profiles.js";
import { numpad } from "../../shared/numpad.js";
import { LEVELS } from "./levels.js";

const ID = "formen";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;

const STARS_PER_GAME = 5;
const SHAPES = ["circle", "triangle", "square", "rectangle"];
const COLORS = ["#ff5a36", "#ffc83a", "#12a564", "#2456b8", "#e8488a", "#8a5cd6", "#ff9f1c", "#20b2c9"];
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

// ---------- Pictures made of shapes (viewBox 0 0 100 100)
// A part: [shape, x, y, w, h, colour, turn (degrees, around its middle), triangle form].
// Triangles point up; "right": the tip is above the left corner. Circles: w = h. Parts are drawn in this order.

const PICTURES = {
  house: [["square", 25, 46, 50, 50, "#ffc83a"], ["triangle", 17, 12, 66, 34, "#ff5a36"], ["rectangle", 43, 68, 14, 28, "#9a5b2e"]],
  iceCream: [["triangle", 33, 44, 34, 52, "#e0a458", 180], ["circle", 29, 8, 42, 42, "#e8488a"]],
  snowman: [["circle", 30, 58, 40, 40, "#cfe8ff"], ["circle", 35, 30, 30, 30, "#cfe8ff"], ["circle", 40, 8, 22, 22, "#cfe8ff"]],
  tree: [["rectangle", 43, 64, 14, 32, "#9a5b2e"], ["triangle", 18, 6, 64, 60, "#12a564"]],
  lollipop: [["rectangle", 47, 54, 6, 42, "#9aa3c7"], ["circle", 25, 6, 50, 50, "#e8488a"]],
  boat: [["triangle", 30, 16, 40, 50, "#2456b8", 0, "right"], ["rectangle", 12, 68, 76, 18, "#ff5a36"], ["circle", 76, 6, 16, 16, "#ffc83a"]],
  fish: [["triangle", 62, 32, 30, 36, "#ff9f1c", -90], ["circle", 12, 22, 56, 56, "#ff9f1c"], ["circle", 24, 38, 10, 10, INK]],
  car: [["square", 32, 26, 28, 28, "#8fd3ff"], ["rectangle", 8, 48, 84, 24, "#ff5a36"], ["circle", 16, 62, 24, 24, INK], ["circle", 60, 62, 24, 24, INK]],
  rocket: [["triangle", 16, 58, 20, 32, "#ff5a36"], ["triangle", 64, 58, 20, 32, "#ff5a36"], ["rectangle", 34, 30, 32, 52, "#c9b6ff"],
    ["triangle", 34, 4, 32, 26, "#ff5a36"], ["circle", 41, 40, 18, 18, "#2456b8"]],
  robot: [["rectangle", 30, 78, 14, 20, "#9aa3c7"], ["rectangle", 56, 78, 14, 20, "#9aa3c7"], ["rectangle", 22, 44, 56, 34, "#20b2c9"],
    ["square", 32, 6, 36, 36, "#20b2c9"], ["circle", 38, 16, 10, 10, INK], ["circle", 52, 16, 10, 10, INK]],
  train: [["rectangle", 4, 44, 40, 28, "#2456b8"], ["rectangle", 50, 44, 46, 28, "#ff5a36"], ["square", 68, 18, 26, 26, "#ff5a36"],
    ["rectangle", 54, 26, 8, 18, INK], ["circle", 8, 64, 16, 16, INK], ["circle", 26, 64, 16, 16, INK],
    ["circle", 56, 64, 16, 16, INK], ["circle", 76, 64, 16, 16, INK]],
  flower: [["rectangle", 47, 50, 6, 46, "#12a564"], ["triangle", 53, 62, 22, 18, "#12a564", 90], ["triangle", 25, 70, 22, 18, "#12a564", -90],
    ["circle", 38, 2, 24, 24, "#e8488a"], ["circle", 22, 16, 24, 24, "#e8488a"], ["circle", 54, 16, 24, 24, "#e8488a"],
    ["circle", 28, 32, 24, 24, "#e8488a"], ["circle", 48, 32, 24, 24, "#e8488a"], ["circle", 40, 19, 20, 20, "#ffc83a"]],
};
const SETS = {
  small: ["house", "iceCream", "snowman", "tree", "lollipop", "boat", "fish"],
  big: ["car", "rocket", "robot", "house", "fish", "boat"],
  count: ["car", "rocket", "robot", "train", "flower", "snowman", "house", "fish", "boat"],
};
const part = ([shape, x, y, w, h, color, rot = 0, tri = "iso"]) => ({ shape, x, y, w, h, color, rot, tri });

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

/** A shape alone in a 100 × 100 box, for buttons. look: "same", "size" or "turn" (see levels.js). */
function lone(shape, look, color) {
  let w, h, rot = 0, tri = "iso";
  if (shape === "circle") w = h = 70;
  else if (shape === "triangle") [w, h] = [76, 66];
  else if (shape === "square") w = h = 62;
  else [w, h] = [84, 46];
  if (look === "turn") {
    if (shape === "triangle") {
      tri = pick(["iso", "right", "lean"]);
      [w, h] = pick([[76, 66], [80, 50], [56, 76]]);
      rot = pick([0, 30, 90, 180, -60, 140]);
    } else if (shape === "square") {
      rot = pick([0, 15, 30, 45]);
      w = h = rot ? 56 : 62;
    } else if (shape === "rectangle") {
      [w, h] = pick([[84, 40], [86, 30], [76, 42]]);
      rot = pick([0, 90, 25, -30, 60]);
      if (rot % 90) [w, h] = [w * 0.92, h * 0.92];
    }
  }
  if (look !== "same") {
    const k = shape === "circle" || look === "size" ? randInt(65, 100) / 100 : randInt(85, 100) / 100;
    w *= k;
    h *= k;
  }
  return { shape, x: 50 - w / 2, y: 50 - h / 2, w, h, color, rot, tri };
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

let build = null; // build: { name, parts, filled: Set, gap }
let found = 0; // all: how many found
let targets = 0; // all: how many there are
let answer = 0; // count: the right number

function startFind() {
  const shapes = shuffle(current.shapes).slice(0, current.choices);
  want = pick(shapes);
  const one = pick(COLORS);
  const colors = shuffle(COLORS);
  $("board").hidden = true;
  drawChoices(
    shapes.map((shape, i) => ({ shape, spec: lone(shape, current.look, current.look === "same" ? one : colors[i]) })),
    pickFind,
  );
  question = T.find(T.shapes[want]);
}

async function pickFind(b, shape) {
  if (locked) return;
  if (shape !== want) return wrong(b, T.wrongFind(T.shapes[shape], T.shapes[want]), T.hint[want]);
  right(b, T.rightFind(T.shapes[want]));
}

function startRiddle() {
  want = pick(SHAPES);
  const colors = shuffle(COLORS);
  $("board").hidden = true;
  drawChoices(shuffle(SHAPES).map((shape, i) => ({ shape, spec: lone(shape, "turn", colors[i]) })), pickRiddle);
  question = T.riddle[want];
}

function pickRiddle(b, shape) {
  if (locked) return;
  if (shape !== want) return wrong(b, T.wrongRiddle(T.shapes[shape]), T.cornersHint);
  right(b, T.rightRiddle(T.shapes[want]));
}

// Build: the picture with dashed gaps; the glowing gap is the next one.
function startBuild() {
  const name = pick(SETS[current.pics].filter((p) => p !== build?.name));
  build = { name, parts: PICTURES[name].map(part), filled: new Set(), gap: 0 };
  build.gap = nextGap();
  drawBuild();
  question = T.build;
}

function nextGap() {
  const open = build.parts.map((_, i) => i).filter((i) => !build.filled.has(i));
  // Big ones first, so the picture is recognisable early; the little ones (eyes, windows) at the end.
  open.sort((a, b) => build.parts[b].w * build.parts[b].h - build.parts[a].w * build.parts[a].h);
  return open[0] ?? -1;
}

function drawBuild() {
  const board = $("board");
  board.hidden = false;
  board.className = "board card";
  const inner = build.parts
    .map((p, i) =>
      build.filled.has(i)
        ? shapeSvg(p, { cls: "filled", dot: 2.4, stroke: 1.6 })
        : shapeSvg({ ...p, color: "none" }, { cls: i === build.gap ? "gap" : "ghost", dot: 2.4, stroke: 1.6 }),
    )
    .join("");
  board.innerHTML = svg(inner, "picture");
  const shape = build.gap >= 0 ? build.parts[build.gap].shape : null;
  if (!shape) return;
  const others = shuffle(SHAPES.filter((s) => s !== shape)).slice(0, current.choices - 1);
  const color = pick(COLORS);
  drawChoices(shuffle([shape, ...others]).map((s) => ({ shape: s, spec: lone(s, "same", color) })), pickBuild);
}

async function pickBuild(b, shape) {
  if (locked) return;
  want = build.parts[build.gap].shape;
  if (shape !== want) return wrong(b, T.wrongBuild, T.hint[want]);
  play.answer(true);
  sound.right();
  b.classList.add("right");
  build.filled.add(build.gap);
  build.gap = nextGap();
  misses = 0;
  $("round").classList.remove("show-corners");
  if (build.gap >= 0) {
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
  want = pick(SHAPES);
  targets = randInt(2, 4);
  found = 0;
  const others = SHAPES.filter((s) => s !== want);
  const list = shuffle([...Array(targets).fill(want), ...others, ...Array.from({ length: 6 - targets }, () => pick(others))]);
  const board = $("board");
  board.hidden = false;
  board.className = "board card grid";
  board.innerHTML = "";
  const colors = shuffle(COLORS);
  list.forEach((shape, i) => {
    board.append(button("cell", T.shapes[shape].one, svg(shapeSvg(lone(shape, "turn", colors[i % colors.length]))), (b) => pickAll(b, shape)));
  });
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

// Count: a finished picture. Which shape to count: one that is in it, preferably more than once.
function startCount() {
  const name = pick(SETS.count.filter((p) => p !== build?.name));
  const parts = PICTURES[name].map(part);
  build = { name, parts, filled: new Set(parts.map((_, i) => i)), gap: -1 };
  const counts = Object.fromEntries(SHAPES.map((s) => [s, parts.filter((p) => p.shape === s).length]));
  const present = SHAPES.filter((s) => counts[s] > 0);
  const several = present.filter((s) => counts[s] > 1);
  want = pick(several.length && Math.random() < 0.8 ? several : present);
  answer = counts[want];
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
  const near = shuffle([answer + 1, answer - 1, answer + 2, answer - 2].filter((n) => n >= 1 && n <= 9));
  for (const n of [answer, ...near.slice(0, 2)].sort((a, b) => a - b)) {
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
  current = LEVELS[play.level];
  if (current.kind === "mix") {
    const id = oneOf(current.levels);
    current = LEVELS.find((l) => l.id === id);
  }
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
$("start-art").innerHTML = SHAPES.map((s, i) => svg(shapeSvg(lone(s, "same", COLORS[i])))).join("");

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question);
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
