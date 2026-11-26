// "Zahlen-Memory" – numbers and amounts, for about 4 to 6 years.
// Cards with a number (4) and cards with that many things (4 apples). The child finds the pairs.
// First all cards lie open, so the child only has to match. Later they lie face down: a real memory game.
// Every card is read out when tapped ("vier" / "vier Äpfel"). Levels go up to 6 pairs and 20 (see LEVELS).
// The game is also a place to play in the new world: the meadow on the map links here with ?welt.
// Every board comes from task() in tasks.js (shared/gen.js); this file only draws it.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";
import * as gen from "../../shared/gen.js";
import { task } from "./tasks.js";

const ID = "zahlen-memory";
const T = await texts(import.meta.url);
const THINGS = things(T);
const THING_IDS = THINGS.map((t) => t.id); // only things with a name in this language
const byId = Object.fromEntries(THINGS.map((t) => [t.id, t]));

// Not the same numbers as on the last board (where the level has more than one set of numbers).
const nextBoard = gen.generator(task, { avoid: { key: 1 } });
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Juhu! Das passt! Drei." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Ups! Das passt nicht."

const BOARDS_PER_GAME = 3; // one star for every board with all pairs found

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
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
    : `<span class="pics ${n <= 3 ? "few" : n <= 6 ? "some" : n <= 10 ? "lots" : "heaps"}">${`<i>${thing.icon}</i>`.repeat(n)}</span>`;
  el.innerHTML = `<span class="front">${front}</span><span class="back" aria-hidden="true">?</span>`;
  const card = { n, kind, thing, el };
  el.addEventListener("click", () => tap(card));
  return card;
}

const spoken = (card) => (card.kind === "number" ? T.numbers[card.n] : T.amount(card.n, card.thing, T.numbers[card.n]));
const turn = (card, up) => card.el.classList.toggle("down", !up);

function newBoard() {
  level = play.level;
  const l = LEVELS[level];
  locked = true;
  picked = null;
  found = 0;
  const cards = nextBoard(l, THING_IDS).cards.map((c) => makeCard(c.n, c.kind, byId[c.thing]));

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
    play.answer(true);
    for (const c of [first, card]) c.el.classList.add("found", "bounce");
    sound.right();
    found++;
    if (found < LEVELS[level].pairs) return void say(cheer(T.match(T.numbers[card.n])));
    locked = true;
    play.solved();
    stars++;
    drawStars();
    await Promise.all([say(cheer(T.match(T.numbers[card.n]))), wait(900)]);
    await Promise.all([say(T.boardDone), wait(800)]);
    setTimeout(stars >= BOARDS_PER_GAME ? finish : newBoard, 300);
    return;
  }

  // Not a pair. With open cards that is a mistake; face down it is part of the game.
  if (open) play.answer(false);
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
  play.round();
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
homeButton($("home"));
// Opened from the new world (/games/zahlen-memory/?welt): the way back leads to the meadow on the map.
if (new URLSearchParams(location.search).has("welt")) {
  $("home").href = "/welt/?o=zahlen";
  $("home").classList.remove("who");
  $("home").innerHTML = icons.home;
  $("home").setAttribute("aria-label", T.toWorld);
}
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
