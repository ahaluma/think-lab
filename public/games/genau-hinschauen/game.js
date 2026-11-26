// "Genau hinschauen" – looking closely, for about 3 to 8 years. Concentration practice in two kinds of task
// that take turns in a round (find, copy, find, copy, find):
//
//   Find the differences: two pictures, one above the other, are almost the same. The child taps what is
//   different (on either picture): a thing is missing, another thing, looks the other way, is smaller.
//   Found ones get a green ring on both pictures. After two wrong taps the next difference glows.
//
//   Copy the shapes: a model with coloured shapes on top, an empty board below. Tap a shape, then a place
//   (tap again: it goes away), then ✓. After a wrong ✓ a hint (too few, too many, look at the places);
//   after two the places that are still different glow; after five the solution shows.
//   Later levels: the model is covered after a few seconds (tap the cloth to look again),
//   and the board is a lake: lay the model as it looks mirrored in the water.
//
// See levels.js. Every task comes from task() in tasks.js (shared/gen.js); this file only draws it.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";
import * as gen from "../../shared/gen.js";
import { task as makeTask } from "./tasks.js";

const ID = "genau-hinschauen";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;

const THINGS = things(T);
const THING_IDS = THINGS.map((t) => t.id); // only things with a name in this language
const byId = Object.fromEntries(THINGS.map((t) => [t.id, t]));

// Not the same picture or model again within the next three of its kind.
const nextTask = gen.generator(makeTask, { avoid: { key: 3 } });

const COLORS = { red: "#ff5a36", blue: "#2456b8", yellow: "#ffc83a", green: "#12a564" };
const SHAPES = {
  circle: '<circle cx="50" cy="50" r="40"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="8"/>',
  triangle: '<path d="M50 9 93 88H7z"/>',
  star: '<path d="M50 6l12.6 27.7 30.2 3.4-22.5 20.4 6.3 29.7L50 72 23.4 87.2l6.3-29.7L7.2 37.1l30.2-3.4z"/>',
  heart: '<path d="M50 88S8 62 8 34a20 20 0 0 1 42-10 20 20 0 0 1 42 10c0 28-42 54-42 54z"/>',
  diamond: '<path d="M50 5l45 45-45 45L5 50z"/>',
};

const STARS_PER_GAME = 5;
const HELP_AFTER = 2; // wrong answers in a task before the help (glow) comes
const SHOW_AFTER = 5; // wrong ✓ in a copy task before the solution shows
const PEEK_MS = 2500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // LEVELS[play.level] of this task
let stars = 0;
let kind = "diff"; // "diff" or "copy"
let misses = 0;
let help = false;
let locked = true;
let token = 0; // changes with every task, so timers of an old task do nothing

// Find the differences
let pics = []; // [cells of the upper picture, cells of the lower one]; a cell: null or { thing, flip, small, dx, dy }
let diffs = new Map(); // place → { kind, a, b, found }

// Copy the shapes
let model = []; // cells: null or { shape, color }
let target = []; // what the child must lay: the model, or the model mirrored
let board = []; // what the child laid
let palette = [];
let chosen = null; // the shape in the hand
let covered = false;
let peeking = false;

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const same = (a, b) => (a === null && b === null) || (a && b && a.shape === b.shape && a.color === b.color);
const word = (n) => T.numbers[n] ?? String(n);

// ---------- Screens

function show(name) {
  for (const [key, e] of Object.entries(screens)) e.hidden = key !== name;
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

/** Make the pictures as big as the screen allows: the height under the top bar (and the text for
 *  older children), minus the shapes and ✓ below. Minimum 200 px, then the page scrolls a little. */
function fit() {
  const boxes = $("boards");
  const top = boxes.getBoundingClientRect().top + window.scrollY;
  const tools = kind === "copy" ? 64 + 12 + 10 : 0;
  const bottom = 16 + 8; // the app's padding and a little air
  boxes.style.setProperty("--avail", `${Math.max(200, window.innerHeight - top - tools - bottom)}px`);
}

function nudge(node) {
  node.classList.remove("shake");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

// ---------- Find the differences: the pictures from tasks.js, with the things (names, icons) of this language

function makeDiff(t) {
  const withThing = (c) => c && { ...c, thing: byId[c.thing] };
  pics = t.pics.map((cells) => cells.map(withThing));
  diffs = new Map(t.diffs.map(([p, d]) => [p, { ...d, a: byId[d.a], b: d.b && byId[d.b] }]));
}

// ---------- Find the differences: drawing and tapping

function drawDiff() {
  const boxes = $("boards");
  boxes.className = "boards diff";
  boxes.innerHTML = "";
  const size = current.diff.size;
  pics.forEach((cells) => {
    const card = el("div", "pic scene");
    const grid = el("div", "grid");
    grid.style.setProperty("--n", size);
    cells.forEach((c, p) => {
      const btn = el("button", "cell");
      btn.type = "button";
      btn.dataset.place = p;
      btn.setAttribute("aria-label", c ? c.thing.one : "·");
      if (c) {
        const item = el("span", "item", c.thing.icon);
        item.style.transform = `translate(${c.dx}%, ${c.dy}%) scale(${c.small ? 0.55 : 1}) scaleX(${c.flip ? -1 : 1})`;
        btn.append(item);
      }
      btn.addEventListener("click", () => tapDiff(p, btn));
      grid.append(btn);
    });
    card.append(grid);
    boxes.append(card);
  });
  $("tools").innerHTML = "";
  markDiffs();
}

/** Green rings on found differences, a glow on the next one when the help is on. */
function markDiffs() {
  const glow = help ? [...diffs.entries()].find(([, d]) => !d.found)?.[0] : undefined;
  for (const btn of $("boards").querySelectorAll(".cell")) {
    const d = diffs.get(Number(btn.dataset.place));
    btn.classList.toggle("found", Boolean(d?.found));
    btn.classList.toggle("glow", Number(btn.dataset.place) === glow);
  }
}

function diffQuestion() {
  const n = current.diff.n;
  return n === 1 ? T.findOne : T.findMany(word(n));
}

function whatDiffers(d) {
  if (d.kind === "gone") return T.gone(d.a);
  if (d.kind === "swap") return T.swap(d.a, d.b);
  if (d.kind === "flip") return T.flip(d.a);
  return T.small(d.a);
}

async function tapDiff(p, btn) {
  if (locked) return;
  const d = diffs.get(p);
  if (d?.found) return;
  if (!d) {
    nudge(btn);
    await miss(T.sameHere, T.lookHere, () => markDiffs());
    return;
  }
  d.found = true;
  play.answer(true);
  sound.right();
  markDiffs();
  for (const ring of $("boards").querySelectorAll(`[data-place="${p}"]`)) ring.classList.add("pop");
  const left = [...diffs.values()].filter((x) => !x.found).length;
  if (left) {
    say(`${whatDiffers(d)} ${T.left(left, word(left))}`);
    return;
  }
  locked = true;
  await solved(`${whatDiffers(d)} ${T.allFound}`);
}

// ---------- Copy the shapes: the model from tasks.js

function makeCopy(t) {
  model = t.model;
  target = t.target;
  board = Array(model.length).fill(null);
  palette = t.palette;
  chosen = palette[0];
  covered = false;
  peeking = false;
}

const shapeSvg = (piece) =>
  `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${COLORS[piece.color]}" stroke="#1b2140" stroke-width="5" stroke-linejoin="round">${SHAPES[piece.shape]}</g></svg>`;

// ---------- Copy the shapes: drawing and tapping

function drawCopy() {
  const cfg = current.copy;
  const boxes = $("boards");
  boxes.className = "boards copy" + (cfg.mirror ? " mirror" : "");
  boxes.innerHTML = "";

  const top = el("div", "pic model");
  top.setAttribute("aria-label", T.model);
  top.append(grid(model, cfg.size, false));
  const curtain = el("button", "curtain");
  curtain.type = "button";
  curtain.id = "curtain";
  curtain.setAttribute("aria-label", T.peek);
  curtain.append(el("span", "curtain-pic", "👀"));
  curtain.addEventListener("click", peek);
  top.append(curtain);
  boxes.append(top);

  const mine = el("div", "pic mine");
  mine.setAttribute("aria-label", T.board);
  mine.append(grid(board, cfg.size, true));
  boxes.append(mine);

  const tools = $("tools");
  tools.innerHTML = "";
  const pal = el("div", "palette");
  for (const piece of palette) {
    const btn = el("button", "btn piece");
    btn.type = "button";
    btn.innerHTML = shapeSvg(piece);
    btn.setAttribute("aria-label", T.piece(piece.shape, piece.color));
    btn.addEventListener("click", () => {
      if (locked) return;
      sound.tap();
      chosen = piece;
      drawPalette();
    });
    pal.append(btn);
  }
  tools.append(pal);
  const check = el("button", "btn ok check");
  check.type = "button";
  check.id = "check";
  check.innerHTML = icons.check;
  check.setAttribute("aria-label", T.check);
  check.addEventListener("click", () => checkCopy(check));
  tools.append(check);
  drawPalette();
  drawCurtain();
  updateCheck();
}

function grid(cells, size, mine) {
  const g = el("div", "grid");
  g.style.setProperty("--n", size);
  cells.forEach((piece, p) => {
    const cell = el(mine ? "button" : "span", "cell slot");
    cell.dataset.place = p;
    if (piece) cell.innerHTML = shapeSvg(piece);
    if (mine) {
      cell.type = "button";
      cell.setAttribute("aria-label", piece ? T.piece(piece.shape, piece.color) : "·");
      cell.addEventListener("click", () => tapPlace(p));
    }
    g.append(cell);
  });
  return g;
}

function drawPalette() {
  $("tools").querySelectorAll(".piece").forEach((btn, i) => btn.classList.toggle("chosen", palette[i] === chosen));
}

function drawBoard() {
  const cells = $("boards").querySelectorAll(".mine .cell");
  cells.forEach((cell, p) => {
    const piece = board[p];
    cell.innerHTML = piece ? shapeSvg(piece) : "";
    cell.setAttribute("aria-label", piece ? T.piece(piece.shape, piece.color) : "·");
    cell.classList.toggle("glow", help && !same(board[p], target[p]));
  });
  updateCheck();
}

function drawCurtain() {
  const curtain = $("curtain");
  if (curtain) curtain.hidden = !covered || peeking || help;
}

function updateCheck() {
  const check = $("check");
  if (check) check.disabled = locked || !board.some(Boolean);
}

function tapPlace(p) {
  if (locked) return;
  sound.tap();
  board[p] = same(board[p], chosen) ? null : chosen;
  drawBoard();
  const cell = $("boards").querySelectorAll(".mine .cell")[p];
  if (board[p]) cell.classList.add("pop");
}

async function peek() {
  if (locked || !covered) return;
  sound.tap();
  peeking = true;
  drawCurtain();
  const mine = token;
  await wait(PEEK_MS);
  if (mine !== token) return;
  peeking = false;
  drawCurtain();
}

function copyQuestion() {
  const cfg = current.copy;
  if (cfg.look && !covered) return cfg.mirror ? `${T.copyLook} ${T.copyMirror}` : T.copyLook;
  if (cfg.look) return T.covered;
  return cfg.mirror ? T.copyMirror : T.copy;
}

async function checkCopy(btn) {
  if (locked) return;
  if (board.every((c, p) => same(c, target[p]))) {
    locked = true;
    play.answer(true);
    updateCheck();
    help = true; // the model shows again
    drawCurtain();
    $("boards").querySelector(".mine").classList.add("right");
    await solved(T.same);
    return;
  }
  nudge(btn);
  const laid = board.filter(Boolean).length;
  const want = target.filter(Boolean).length;
  let hint = T.places;
  if (laid < want) hint = T.fewer;
  else if (laid > want) hint = T.more;
  else if (current.copy.mirror && board.every((c, p) => same(c, model[p]))) hint = T.mirrorHint;

  if (misses + 1 >= SHOW_AFTER) {
    // Many tries: show the solution and go on, so nobody gets stuck.
    play.answer(false);
    sound.wrong();
    misses++;
    locked = true;
    help = true;
    board = [...target];
    drawBoard();
    drawCurtain();
    await say(oops(T.solution));
    await wait(1200);
    play.solved();
    stars++;
    drawStars();
    next();
    return;
  }
  await miss(hint, T.marked, () => {
    drawBoard();
    drawCurtain();
  });
}

// ---------- Right and wrong, shared by both kinds of task

/** A wrong answer: soft sound and a hint. From the second one in a task the help shows (helpText). */
async function miss(hint, helpText, showHelp) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  updateCheck();
  let text = hint;
  if (misses >= HELP_AFTER && !help) {
    help = true;
    showHelp();
    text = `${hint} ${helpText}`;
  }
  const spoken = say(oops(text));
  await Promise.race([spoken, wait(900)]); // the child may go on while the hint is still read
  locked = false;
  updateCheck();
}

async function solved(text) {
  play.solved();
  stars++;
  drawStars();
  if (kind === "copy") sound.right();
  await Promise.all([say(cheer(text)), wait(1400)]);
  setTimeout(next, 300);
}

// ---------- One task

function question() {
  return kind === "diff" ? diffQuestion() : copyQuestion();
}

async function newTask() {
  current = LEVELS[play.level];
  token++;
  const mine = token;
  locked = true;
  misses = 0;
  help = false;
  kind = stars % 2 === 0 ? "diff" : "copy";
  const t = nextTask(current, kind, THING_IDS);
  if (kind === "diff") {
    makeDiff(t);
    drawDiff();
  } else {
    makeCopy(t);
    drawCopy();
  }
  show("round");
  fit();
  if (kind === "copy" && current.copy.look) {
    // Look first, then the cloth comes down.
    await Promise.all([say(question()), wait(current.copy.look)]);
    if (mine !== token) return;
    covered = true;
    drawCurtain();
    locked = false;
    updateCheck();
    await say(question());
    return;
  }
  await say(question());
  if (mine !== token) return;
  locked = false;
  updateCheck();
}

/** The next task, or the trophy after five stars. */
function next() {
  if (stars >= STARS_PER_GAME) finish();
  else newTask();
}

function finish() {
  token++;
  play.round();
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

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

window.addEventListener("resize", () => !screens.round.hidden && fit());
// Older children read the text under the top bar: when it gets longer or shorter, the pictures follow.
const caption = document.querySelector(".caption");
if (caption && window.ResizeObserver) new ResizeObserver(() => !screens.round.hidden && fit()).observe(caption);

drawStars();
show("start");
