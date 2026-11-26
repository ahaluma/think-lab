// "Wo ist es?" – where things are (Raumlage), for about 3 to 7 years.
// Animals sit around a table, in a row on a bench or in a shelf. Two kinds of task:
//   who – "Wer ist unter dem Tisch?": tap the animal
//   put – an animal waits at the top: "Setz mich unter den Tisch!": tap the empty place
// Words: auf, unter, neben, vor, hinter, links, rechts (from the child's view), zwischen,
// and in the shelf oben / in der Mitte / unten with links / in der Mitte / rechts. Levels: levels.js.
// A wrong tap on an animal says where that one is ("Der Fuchs ist neben dem Tisch."),
// after two wrong answers the right place glows (with left / right: the "L" of the left hand).
// Every task comes from task() in tasks.js (shared/gen.js); this file only draws it.
// All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import * as gen from "../../shared/gen.js";
import { task as makeTask, PETS as ALL_PETS, SIDES, fits } from "./tasks.js";

const ID = "raumlage";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const STARS_PER_GAME = 5;

// The animals with a name in this language (who / to whom: lang/<language>.js "pets").
const PETS = ALL_PETS.filter((p) => T.pets[p.id]).map((p) => ({ ...p, nom: T.pets[p.id][0], dat: T.pets[p.id][1] }));
const PET_IDS = PETS.map((p) => p.id);
const byId = Object.fromEntries(PETS.map((p) => [p.id, p]));

// Not the same question about the same animal again soon, and other animals than in the last picture.
const nextTask = gen.generator(makeTask, { avoid: { key: 3, look: 1 } });

// Places around the table: x and bottom in % of the picture, size and layer.
// "hinter" sits lower, smaller and behind the table cloth, so only the head shows.
const SPOTS = {
  auf: { x: 50, b: 58, s: 1, z: 3 },
  unter: { x: 50, b: 20, s: 0.85, z: 3 },
  links: { x: 13, b: 20, s: 1, z: 3 },
  rechts: { x: 87, b: 20, s: 1, z: 3 },
  vor: { x: 50, b: 0, s: 1.25, z: 5 },
  hinter: { x: 50, b: 50, s: 0.85, z: 1 },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let stars = 0;
let current = null; // the level of this task (in "mix" one of the others)
let task = null; // { question, target (element), right (sentence), hint, isLeftRight }
let misses = 0;
let locked = false;

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

// ---------- Drawing

function petButton(pet, onTap) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pet";
  b.textContent = pet.icon;
  b.setAttribute("aria-label", cap(pet.nom));
  b.addEventListener("click", () => onTap(b));
  return b;
}

function slotButton(label, onTap) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "slot";
  b.setAttribute("aria-label", label);
  b.addEventListener("click", () => onTap(b));
  return b;
}

function placeAt(el, spot) {
  const s = SPOTS[spot];
  el.style.left = s.x + "%";
  el.style.bottom = s.b + "%";
  el.style.setProperty("--s", s.s);
  el.style.zIndex = s.z;
  el.dataset.spot = spot;
}

function stage(kind) {
  const el = $("stage");
  el.innerHTML = "";
  el.className = `stage card scene-${kind}`;
  return el;
}

function drawTable(el) {
  const table = document.createElement("div");
  table.className = "table";
  table.innerHTML = '<span class="leg l"></span><span class="leg r"></span><span class="cloth"></span><span class="top"></span>';
  el.append(table);
}

/** The waiting animal for "put" tasks (or none). */
function waiting(pet) {
  const w = $("wait");
  w.hidden = !pet;
  w.textContent = pet ? pet.icon : "";
  if (pet) {
    w.classList.remove("bounce");
    void w.offsetWidth;
    w.classList.add("bounce");
  }
}

// ---------- Tasks

/** The word for a spot in this level: "neben" when the level does not know left and right. */
const wordFor = (spot, l) => (SIDES.includes(spot) && !l.places.includes(spot) ? "neben" : spot);

function tableWho(l, t) {
  const el = stage("table");
  drawTable(el);
  let targetEl = null;
  for (const { pet: id, spot } of t.pets) {
    const pet = byId[id];
    const b = petButton(pet, (btn) =>
      answer(btn, spot === t.target, T.isAt(cap(pet.nom), T.where[wordFor(spot, l)])),
    );
    placeAt(b, spot);
    el.append(b);
    if (spot === t.target) targetEl = b;
  }
  waiting(null);
  return {
    question: T.who(T.where[t.asked]),
    target: targetEl,
    right: T.isAt(cap(byId[t.pets[0].pet].nom), T.where[t.asked]),
    leftRight: SIDES.includes(t.asked),
  };
}

function tablePut(l, t) {
  const el = stage("table");
  drawTable(el);
  const pet = byId[t.pet];
  let targetEl = null;
  for (const spot of t.spots) {
    const ok = fits(spot, t.asked);
    const b = slotButton(T.where[wordFor(spot, l)], (btn) => answer(btn, ok, null, () => land(btn, pet)));
    placeAt(b, spot);
    el.append(b);
    if (spot === t.target) targetEl = b;
  }
  waiting(pet);
  return {
    question: T.put(T.to[t.asked]),
    target: targetEl,
    right: T.nowAt(T.where[t.asked]),
    leftRight: SIDES.includes(t.asked),
  };
}

/** A "put" slot was right: the waiting animal jumps in. */
function land(slot, pet) {
  waiting(null);
  slot.classList.add("filled");
  slot.textContent = pet.icon;
}

function row(l, t) {
  const el = stage("row");
  const pets = t.pets.map((id) => byId[id]);
  const i = t.target;
  let question, right;
  if (t.ask === "zwischen") {
    question = T.between(pets[i - 1].dat, pets[i + 1].dat);
    right = T.isBetween(cap(pets[i].nom), pets[i - 1].dat, pets[i + 1].dat);
  } else if (t.ask === "links") {
    question = T.leftOf(pets[i + 1].dat);
    right = T.isLeftOf(cap(pets[i].nom), pets[i + 1].dat);
  } else {
    question = T.rightOf(pets[i - 1].dat);
    right = T.isRightOf(cap(pets[i].nom), pets[i - 1].dat);
  }
  const line = document.createElement("div");
  line.className = "row-pets";
  line.style.setProperty("--n", pets.length);
  let targetEl = null;
  pets.forEach((pet, k) => {
    const b = petButton(pet, (btn) => answer(btn, k === i, null));
    line.append(b);
    if (k === i) targetEl = b;
  });
  const bench = document.createElement("div");
  bench.className = "bench";
  el.append(line, bench);
  waiting(null);
  return { question, target: targetEl, right, leftRight: t.ask !== "zwischen" };
}

function shelf(l, t) {
  const el = stage("shelf");
  const grid = document.createElement("div");
  grid.className = "shelf";
  el.append(grid);
  const put = t.input === "put";
  const target = t.target;
  const newcomer = put ? byId[t.newcomer] : null;
  let targetEl = null;
  for (let c = 0; c < 9; c++) {
    const box = document.createElement("div");
    box.className = "cell";
    const sits = t.pets.find((p) => p.cell === c);
    if (sits) {
      const pet = byId[sits.pet];
      const b = petButton(pet, (btn) =>
        put ? wrongTap(btn) : answer(btn, c === target, T.sitsAt(cap(pet.nom), T.cells[c])),
      );
      box.append(b);
      if (c === target) targetEl = b;
    } else if (put) {
      const b = slotButton(T.cells[c], (btn) => answer(btn, c === target, null, () => land(btn, newcomer)));
      box.append(b);
      if (c === target) targetEl = b;
    }
    grid.append(box);
  }
  waiting(newcomer);
  return put
    ? { question: T.put(T.cells[target]), target: targetEl, right: T.nowSits(T.cells[target]), leftRight: target % 3 !== 1 }
    : {
        question: T.whoSits(T.cells[target]),
        target: targetEl,
        right: T.sitsAt(cap(byId[t.pets[0].pet].nom), T.cells[target]),
        leftRight: target % 3 !== 1,
      };
}

/** In a "put" shelf, tapping an animal that already sits there: that place is taken. */
async function wrongTap(b) {
  if (locked) return;
  sound.tap();
  b.classList.remove("shake");
  void b.offsetWidth;
  b.classList.add("shake");
  locked = true;
  await say(T.taken);
  locked = false;
}

const MAKERS = {
  table: (l, t) => (l.input === "put" ? tablePut(l, t) : tableWho(l, t)),
  row,
  shelf,
};

// ---------- One task

async function newTask() {
  const t = nextTask(LEVELS[play.level], PET_IDS);
  current = LEVELS.find((l) => l.id === t.level); // in "mix" levels one of the others
  locked = true;
  misses = 0;
  task = MAKERS[current.scene](current, t);
  show("round");
  await say(task.question);
  locked = false;
}

/** A tap on an animal or a place. `said`: what to say when it was wrong (where that animal is). */
async function answer(b, right, said, onRight) {
  if (locked || b.disabled) return;

  if (!right) {
    play.answer(false);
    sound.wrong();
    b.classList.remove("shake");
    void b.offsetWidth;
    b.classList.add("shake");
    misses++;
    locked = true;
    if (misses >= 2) {
      task.target.classList.add("hint");
      await say(oops(task.leftRight ? T.leftHand : T.lookHere));
    } else {
      await say(oops(said ? `${said} ${task.question}` : task.question));
    }
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  task.target.classList.remove("hint");
  if (onRight) onRight();
  b.classList.add("right", "bounce");
  sound.right();
  play.solved();
  stars++;
  drawStars();

  const next = stars >= STARS_PER_GAME ? finish : newTask;
  Promise.all([say(cheer(task.right)), wait(1200)]).then(() => setTimeout(next, 300));
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
  if (!screens.round.hidden && task) say(task.question);
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
