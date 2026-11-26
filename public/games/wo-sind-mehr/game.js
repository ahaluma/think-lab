// "Wo sind mehr?" – comparing amounts, for about 4 to 6 years.
// Two groups of the same thing appear. The child taps the group with more.
// Higher levels bring closer amounts, then "the same" as a third answer, then "where are fewer?".
// Every task comes from task() in tasks.js (shared/gen.js); this file only draws it.
// All texts are in lang/<language>.js; names of the things are shared (shared/lang).

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import { things } from "../../shared/things.js";
import * as gen from "../../shared/gen.js";
import { task, SLOTS } from "./tasks.js";

const ID = "wo-sind-mehr";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Drei Äpfel." – a different praise each time
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Schau nochmal!"
const THINGS = things(T);
const THING_IDS = THINGS.map((t) => t.id); // only things with a name in this language
const byId = Object.fromEntries(THINGS.map((t) => [t.id, t]));

// A new thing for the last 3 tasks, and not the same two amounts as in the last 2.
const nextTask = gen.generator(task, { avoid: { thing: 3, counts: 2 } });

const STARS_PER_GAME = 5;

// Levels: see levels.js (easy to hard).

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };
const groups = [$("groupA"), $("groupB")];

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let level = play.level;
let stars = 0;
let thing = null;
let counts = [0, 0];
let askFewer = false;
let answerRight = 0; // 0 or 1 (a group) or "same"
let places = [[], []];
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

// ---------- One round

function question() {
  return askFewer ? T.questionFewer(thing) : T.questionMore(thing);
}

function amount(n) {
  return T.amount(n, thing, T.numbers[n]);
}

function fillGroup(el, n, where) {
  el.innerHTML = "";
  el.className = "group card";
  el.disabled = false;
  el.setAttribute("aria-label", amount(n));
  const places = new Set(where);
  for (let i = 0; i < SLOTS; i++) {
    const slot = document.createElement("span");
    slot.className = "slot";
    if (places.has(i)) {
      slot.textContent = thing.icon;
      slot.classList.add("pop");
      slot.style.animationDelay = i * 0.03 + "s";
    }
    el.append(slot);
  }
}

function newRound() {
  level = play.level;
  const l = LEVELS[level];
  locked = false;
  const t = nextTask(l, THING_IDS);
  thing = byId[t.thing];
  counts = t.counts;
  places = t.places;
  askFewer = t.ask === "fewer";
  answerRight = t.answer;

  groups.forEach((g, i) => fillGroup(g, counts[i], places[i]));
  const same = $("same");
  same.hidden = !l.same;
  same.disabled = false;
  same.classList.remove("right", "shake");

  show("round");
  say(question());
}

function showCounts() {
  groups.forEach((g, i) => {
    const badge = document.createElement("span");
    badge.className = "count pop";
    badge.textContent = num(counts[i]);
    g.append(badge);
  });
}

function praise(answer) {
  const [a, b] = counts;
  if (answer === "same") return T.rightSame(a, amount(a));
  const here = counts[answer];
  const there = counts[1 - answer];
  return askFewer ? T.rightFewer(here, amount(here), amount(there)) : T.rightMore(here, amount(here), amount(there));
}

function choose(answer, el) {
  if (locked) return;

  if (answer !== answerRight) {
    play.answer(false);
    sound.wrong();
    say(oops(T.lookAgain));
    el.classList.remove("shake");
    void el.offsetWidth; // restart the animation
    el.classList.add("shake");
    if (answer !== "same") el.classList.add("wrong");
    el.disabled = true;
    return;
  }

  locked = true;
  play.answer(true);
  el.classList.add("right", "bounce");
  for (const g of groups) g.disabled = true;
  $("same").disabled = true;
  showCounts();
  sound.right();
  play.solved();
  stars++;
  drawStars();

  // Next task as soon as the praise is spoken (at least 1.2 s, so the numbers can be seen).
  const next = stars >= STARS_PER_GAME ? finish : newRound;
  Promise.all([say(cheer(praise(answer))), wait(1200)]).then(() => setTimeout(next, 300));
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

groups.forEach((g, i) => g.addEventListener("click", () => choose(i, g)));
$("same").addEventListener("click", () => choose("same", $("same")));
$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
