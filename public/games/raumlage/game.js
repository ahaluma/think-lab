// "Wo ist es?" – where things are (Raumlage), for about 3 to 7 years.
// Animals sit around a table, in a row on a bench or in a shelf. Two kinds of task:
//   who – "Wer ist unter dem Tisch?": tap the animal
//   put – an animal waits at the top: "Setz mich unter den Tisch!": tap the empty place
// Words: auf, unter, neben, vor, hinter, links, rechts (from the child's view), zwischen,
// and in the shelf oben / in der Mitte / unten with links / in der Mitte / rechts. Levels: levels.js.
// A wrong tap on an animal says where that one is ("Der Fuchs ist neben dem Tisch."),
// after two wrong answers the right place glows (with left / right: the "L" of the left hand).
// All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, shuffle, pick, randInt, icons, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";

const ID = "raumlage";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const STARS_PER_GAME = 5;

// The animals of this game. Their names (who / to whom) are in lang/<language>.js under "pets".
const PETS = [
  { id: "rabbit", icon: "🐰" },
  { id: "cat", icon: "🐱" },
  { id: "dog", icon: "🐶" },
  { id: "bear", icon: "🐻" },
  { id: "fox", icon: "🦊" },
  { id: "frog", icon: "🐸" },
  { id: "duck", icon: "🦆" },
  { id: "mouse", icon: "🐭" },
  { id: "pig", icon: "🐷" },
  { id: "owl", icon: "🦉" },
  { id: "panda", icon: "🐼" },
  { id: "lion", icon: "🦁" },
]
  .filter((p) => T.pets[p.id])
  .map((p) => ({ ...p, nom: T.pets[p.id][0], dat: T.pets[p.id][1] }));

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
// Places that would cover each other: never both in one picture.
const CLASH = { auf: ["hinter"], hinter: ["auf"], unter: ["vor"], vor: ["unter"] };
const SIDES = ["links", "rechts"];

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

/** Which word is asked: mostly one of the level's new words (focus), sometimes any. */
function askPlace(l) {
  const from = l.focus && Math.random() < 0.7 ? l.focus : l.places;
  return pick(from);
}

/** Where an animal can sit for these words ("neben" = left or right). */
const spotsFor = (places) => [...new Set(places.flatMap((p) => (p === "neben" ? SIDES : [p])))];

/** Does the animal at `spot` fit the word `place`? */
const fits = (spot, place) => spot === place || (place === "neben" && SIDES.includes(spot));

/** The word for a spot in this level: "neben" when the level does not know left and right. */
const wordFor = (spot, l) => (SIDES.includes(spot) && !l.places.includes(spot) ? "neben" : spot);

function tableWho(l) {
  const el = stage("table");
  drawTable(el);
  const asked = askPlace(l);
  const target = asked === "neben" ? pick(SIDES) : asked;
  const taken = [target];
  for (const spot of shuffle(spotsFor(l.places))) {
    if (taken.length >= l.pets) break;
    if (taken.includes(spot) || taken.some((t) => CLASH[t]?.includes(spot))) continue;
    if (asked === "neben" && SIDES.includes(spot)) continue; // only one animal next to the table
    taken.push(spot);
  }
  const pets = shuffle(PETS).slice(0, taken.length);
  let targetEl = null;
  taken.forEach((spot, i) => {
    const pet = pets[i];
    const b = petButton(pet, (btn) =>
      answer(btn, spot === target, T.isAt(cap(pet.nom), T.where[wordFor(spot, l)])),
    );
    placeAt(b, spot);
    el.append(b);
    if (spot === target) targetEl = b;
  });
  waiting(null);
  return {
    question: T.who(T.where[asked]),
    target: targetEl,
    right: T.isAt(cap(pets[0].nom), T.where[asked]),
    leftRight: SIDES.includes(asked),
  };
}

function tablePut(l) {
  const el = stage("table");
  drawTable(el);
  const asked = askPlace(l);
  const pet = pick(PETS);
  let targetEl = null;
  for (const spot of spotsFor(l.places)) {
    const ok = fits(spot, asked);
    const b = slotButton(T.where[wordFor(spot, l)], (btn) => answer(btn, ok, null, () => land(btn, pet)));
    placeAt(b, spot);
    el.append(b);
    if (ok && !targetEl) targetEl = b;
  }
  waiting(pet);
  return {
    question: T.put(T.to[asked]),
    target: targetEl,
    right: T.nowAt(T.where[asked]),
    leftRight: SIDES.includes(asked),
    again: T.put(T.to[asked]),
  };
}

/** A "put" slot was right: the waiting animal jumps in. */
function land(slot, pet) {
  waiting(null);
  slot.classList.add("filled");
  slot.textContent = pet.icon;
}

function row(l) {
  const el = stage("row");
  const n = l.pets;
  const pets = shuffle(PETS).slice(0, n);
  const kind = pick(l.ask);
  let i, question, right;
  if (kind === "zwischen") {
    i = randInt(1, n - 2);
    question = T.between(pets[i - 1].dat, pets[i + 1].dat);
    right = T.isBetween(cap(pets[i].nom), pets[i - 1].dat, pets[i + 1].dat);
  } else if (kind === "links") {
    i = randInt(0, n - 2);
    question = T.leftOf(pets[i + 1].dat);
    right = T.isLeftOf(cap(pets[i].nom), pets[i + 1].dat);
  } else {
    i = randInt(1, n - 1);
    question = T.rightOf(pets[i - 1].dat);
    right = T.isRightOf(cap(pets[i].nom), pets[i - 1].dat);
  }
  const line = document.createElement("div");
  line.className = "row-pets";
  line.style.setProperty("--n", n);
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
  return { question, target: targetEl, right, leftRight: kind !== "zwischen" };
}

function shelf(l) {
  const el = stage("shelf");
  const grid = document.createElement("div");
  grid.className = "shelf";
  el.append(grid);
  const cells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const used = cells.slice(0, l.pets);
  const pets = shuffle(PETS).slice(0, l.pets + 1);
  const put = l.input === "put";
  const target = put ? cells[l.pets] : used[0];
  const newcomer = pets[l.pets];
  let targetEl = null;
  for (let c = 0; c < 9; c++) {
    const box = document.createElement("div");
    box.className = "cell";
    const k = used.indexOf(c);
    if (k >= 0) {
      const pet = pets[k];
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
  waiting(put ? newcomer : null);
  return put
    ? { question: T.put(T.cells[target]), target: targetEl, right: T.nowSits(T.cells[target]), leftRight: target % 3 !== 1 }
    : {
        question: T.whoSits(T.cells[target]),
        target: targetEl,
        right: T.sitsAt(cap(pets[0].nom), T.cells[target]),
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
  table: (l) => (l.input === "put" ? tablePut(l) : tableWho(l)),
  row,
  shelf,
};

// ---------- One task

async function newTask() {
  current = LEVELS[play.level];
  if (current.scene === "mix") {
    const id = pick(current.levels);
    current = LEVELS.find((l) => l.id === id);
  }
  locked = true;
  misses = 0;
  task = MAKERS[current.scene](current);
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
