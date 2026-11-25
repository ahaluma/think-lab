// "Zahlen-Memory" – numbers and amounts, for about 4 to 6 years.
// Cards with a number (4) and cards with that many things (4 apples). The child finds the pairs.
// First all cards lie open, so the child only has to match. Later they lie face down: a real memory game.
// Every card is read out when tapped ("vier" / "vier Äpfel"). Levels go up to 6 pairs and 10 (see LEVELS).
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, shuffle, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { things } from "../../shared/things.js";

const ID = "zahlen-memory";
const T = await texts(import.meta.url);
const THINGS = things(T);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Juhu! Das passt! Drei." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Ups! Das passt nicht."

const BOARDS_PER_GAME = 3; // one star for every board with all pairs found

// Levels = the parameters of this game. After a game (3 boards) the child moves up one level.
//   pairs – how many pairs on the board
//   max   – the biggest number (numbers are 1 to max, each number once)
//   open  – true: all cards lie open; false: face down, tap to turn
const LEVELS = [
  { pairs: 3, max: 3, open: true },
  { pairs: 3, max: 5, open: true },
  { pairs: 3, max: 3, open: false },
  { pairs: 4, max: 5, open: false },
  { pairs: 4, max: 6, open: false },
  { pairs: 5, max: 7, open: false },
  { pairs: 5, max: 8, open: false },
  { pairs: 6, max: 10, open: true },
  { pairs: 6, max: 10, open: false },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let level = Math.min(progress.level(ID), LEVELS.length - 1);
let stars = 0;
let picked = null; // the first card of a try
let found = 0; // pairs found on this board
let locked = true;

// ---------- Screens

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function drawStars() {
  $("stars").innerHTML = "";
  for (let i = 0; i < BOARDS_PER_GAME; i++) {
    const li = document.createElement("li");
    li.textContent = "⭐";
    if (i < stars) li.className = "on";
    $("stars").append(li);
  }
}

// ---------- The board

// A card: { n, kind: "number" | "things", thing, el }
function makeCard(n, kind, thing) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "btn card-face " + kind;
  const front = kind === "number"
    ? `<span class="big">${num(n)}</span>`
    : `<span class="pics ${n <= 3 ? "few" : n <= 6 ? "some" : "lots"}">${`<i>${thing.icon}</i>`.repeat(n)}</span>`;
  el.innerHTML = `<span class="front">${front}</span><span class="back" aria-hidden="true">?</span>`;
  const card = { n, kind, thing, el };
  el.addEventListener("click", () => tap(card));
  return card;
}

const spoken = (card) => (card.kind === "number" ? T.numbers[card.n] : T.amount(card.n, card.thing, T.numbers[card.n]));
const turn = (card, up) => card.el.classList.toggle("down", !up);

function newBoard() {
  const l = LEVELS[level];
  locked = true;
  picked = null;
  found = 0;
  const numbers = shuffle([...Array(l.max).keys()].map((i) => i + 1)).slice(0, l.pairs);
  const pics = shuffle(THINGS).slice(0, l.pairs);
  const cards = shuffle(numbers.flatMap((n, i) => [makeCard(n, "number"), makeCard(n, "things", pics[i])]));

  const board = $("board");
  board.innerHTML = "";
  board.className = "board" + (l.pairs > 4 ? " many" : "");
  for (const c of cards) {
    if (!l.open) turn(c, false);
    board.append(c.el);
  }
  show("round");
  locked = false;
  say(T.find);
}

async function tap(card) {
  if (locked || card.el.classList.contains("found") || card === picked) return;
  const open = LEVELS[level].open;

  // Open cards: two cards of the same kind just move the choice.
  if (!picked || (open && picked.kind === card.kind)) {
    if (picked) picked.el.classList.remove("picked");
    picked = card;
    turn(card, true);
    card.el.classList.add("picked");
    sound.tap();
    say(spoken(card));
    return;
  }

  const first = picked;
  picked = null;
  turn(card, true);
  first.el.classList.remove("picked");

  if (first.n === card.n && first.kind !== card.kind) {
    progress.answer(ID, true);
    for (const c of [first, card]) c.el.classList.add("found", "bounce");
    sound.right();
    found++;
    if (found < LEVELS[level].pairs) return void say(cheer(T.match(T.numbers[card.n])));
    locked = true;
    stars++;
    drawStars();
    await Promise.all([say(cheer(T.match(T.numbers[card.n]))), wait(900)]);
    await Promise.all([say(T.boardDone), wait(800)]);
    setTimeout(stars >= BOARDS_PER_GAME ? finish : newBoard, 300);
    return;
  }

  // Not a pair. With open cards that is a mistake; face down it is part of the game.
  if (open) progress.answer(ID, false);
  sound.wrong();
  locked = true;
  for (const c of [first, card]) {
    c.el.classList.remove("shake");
    void c.el.offsetWidth; // restart the animation
    c.el.classList.add("shake");
  }
  say(open ? oops(T.noMatch) : spoken(card));
  await wait(open ? 600 : 1400); // face down: time to look at both cards
  if (!open) for (const c of [first, card]) turn(c, false);
  locked = false;
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
  newBoard();
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
  if (!screens.round.hidden) say(T.find);
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
