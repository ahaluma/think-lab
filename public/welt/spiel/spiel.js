// One round in the new world: a few tasks of one idea in one perspective, then one surprise task
// from another perspective of the same idea (the transfer step), then the thinking card.
// On the thinking mountain some of the tasks come from the backpack: from a camp below that the
// child has already played, so the old tools are used again, mixed in at random (see PACK).
//
//   /welt/spiel/?i=zahl&p=sehen   the idea and the perspective (see welt/frame/ideas.js);
//                                 without i: "teile", without p: the suggested perspective
//   /welt/spiel/?p=sehen&seed=7   the same tasks every time (shared/gen.js)
//
// This file is the frame every idea shares: steps, voice and caption, hint button, counting what was
// right the first time, saving (frame/record.js). The idea itself is in welt/ideas/<idea>/:
// tasks.js makes each task as plain data, boards.js draws it and takes the answer.

import { oneOf, sound, celebrate, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import { things } from "../../shared/things.js";
import * as gen from "../../shared/gen.js";
import * as profiles from "../../shared/profiles.js";
import * as record from "../frame/record.js";
import { mount, tell, ask, again } from "../frame/voice.js";
import { questionBox } from "../frame/question.js";
import { IDEAS, CARDS, ROUND_TASKS, MOUNTAIN, PLACES, perspective, cardOf, mapOf, campOf } from "../frame/ideas.js";
import { store } from "../../shared/store.js";

const params = new URLSearchParams(location.search);
const IDEA = params.get("i") in IDEAS ? params.get("i") : "teile";
const { task } = await import(`../ideas/${IDEA}/tasks.js`);
const { BOARDS } = await import(`../ideas/${IDEA}/boards.js`);
const T = await texts(new URL("../map.js", import.meta.url).href); // welt/lang/<language>.js
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** The texts of the idea: "teile" has them at the top of the language file, later ideas under their id. */
const INTRO = (T[IDEA] ?? T).intro;
/** "Soon it gets harder / easier": an idea without numbers says it in its own words. */
const BIGGER = T[IDEA]?.bigger ?? T.bigger;
const SMALLER = T[IDEA]?.smaller ?? T.smaller;
/** "A new flower grows": the mountain says it in its own words. */
const GREW = T[IDEA]?.grew ?? T.grew;
/** The nature world (3 to 6 years): no "how was it?" after a round, and the new flower is shown. */
const NATURE = !IDEAS[IDEA].world;
/** A place on the map of the nature world has room for this many flowers (FLOWER_SPOTS in map.js). */
const BED = 12;
const FLOWERS = ["🌸", "🌼", "🌷", "🌺"];
const P = perspective(params.get("p")) || perspective(record.suggest(IDEA));

const CARD = cardOf(IDEA, P.id);

/** After this many wrong answers in a task the hint shows by itself. */
const HINT_AFTER = 2;
/** The surprise task comes from one of these perspectives (short ones), never the one just played,
 *  and only from one the child has played before: a surprise must not be a new kind of game. */
const SURPRISE = ["sehen", "anwenden", "pruefen"];
/** Children up to this age play shorter rounds. */
const SHORT_UNTIL = 6;
const SHORT_TASKS = 3;
/** After this long without a tap, the things to tap wiggle: "here you can do something". */
const NUDGE_AFTER = 7000;
const kidAge = profiles.age(profiles.current());
/** The backpack (thinking mountain): how many of a round's tasks come from camps below, by the height
 *  of this camp. They are tasks of a perspective the child has played there, at the level it reached
 *  there, from the camp played longest ago (so old tools come back after days, not minutes). */
const PACK = { 1: 1, 2: 1, 3: 2, 4: 2 };
const PACK_FROM = ["sehen", "anwenden", "pruefen"];
const CAMP = campOf(IDEA);

const THINGS = Object.fromEntries(things(T).map((t) => [t.id, t]));
const nextTask = gen.generator(task, { avoid: { key: 2 } });
/** Tasks and boards of every idea in this round: this one, and the camps the backpack brings. */
const ideas = { [IDEA]: { next: nextTask, BOARDS } };
async function load(idea) {
  if (!ideas[idea]) {
    const [tasks, boards] = await Promise.all([import(`../ideas/${idea}/tasks.js`), import(`../ideas/${idea}/boards.js`)]);
    ideas[idea] = { next: gen.generator(tasks.task, { avoid: { key: 2 }, r: nextTask.r }), BOARDS: boards.BOARDS };
  }
  return ideas[idea];
}
const screens = { start: $("start"), board: $("board"), done: $("done") };
/** The whole question stays in sight; no taps while it is read (frame/question.js). */
const question = questionBox($("question"), $("board"));

let range = record.range(IDEA);
let steps = []; // [{ p, transfer, pack, idea, range }] – idea and range only for a backpack task
let at = 0;
let misses = 0;
let firstTries = 0; // tasks of the round right the first time (the surprise task is not counted)
let firstAll = 0; // the same with the backpack tasks: the star on the mountain counts them
let board = null;
let busy = false;
let fresh = false; // the child plays this perspective for the first time: the boards show more

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  if (name !== "board") question.hide();
  $("hint").hidden = name !== "board";
}

function drawSteps() {
  $("steps").innerHTML = "";
  steps.forEach((step, i) => {
    const li = document.createElement("li");
    const icon = step.transfer ? "🎁" : step.pack ? "🎒" : "";
    li.textContent = icon;
    li.className = (icon ? "gift " : "") + (i < at ? "done" : i === at ? "now" : "");
    $("steps").append(li);
  });
}

const ctx = {
  T,
  num,
  word: (n) => T.numbers[n] ?? num(n),
  thing: (id) => (id === "nut" ? { icon: "🌰", ...T.nut } : THINGS[id]),
  /** What the board says before the child taps is the question (frame/question.js), later the caption. */
  tell: (text, shown = text) => (question.asking ? ask(question, text, shown) : tell(text, shown)),
  tap: () => sound.tap(),
  ready: () => restNudge(),
  fresh: () => fresh && !steps[at]?.transfer && !steps[at]?.pack,

  /** A wrong answer. Resolves when the sentence (and the hint after the second miss) was said. */
  async miss(text) {
    question.stop();
    misses++;
    sound.wrong();
    await tell(`${oneOf(T.oops)} ${text}`);
    if (misses === HINT_AFTER) await hint();
  },

  async solved(text) {
    if (busy) return;
    busy = true;
    question.stop();
    const step = steps[at];
    const first = misses === 0;
    record.task(step.idea ?? IDEA, step.p, step.range ?? range, first, step.transfer);
    if (first && !step.transfer && !step.pack) firstTries++;
    if (first && !step.transfer) firstAll++;
    sound.right();
    at++;
    drawSteps();
    await Promise.all([tell(`${oneOf(T.praise)} ${text}`), wait(900)]);
    await wait(300);
    busy = false;
    if (at < steps.length) runStep();
    else finish();
  },
};

// ---------- The nudge: a waiting child sees where to tap

let nudgeTimer = 0;
function restNudge() {
  clearTimeout(nudgeTimer);
  $("board").classList.remove("nudge");
  nudgeTimer = setTimeout(() => {
    if (!busy && !screens.board.hidden) $("board").classList.add("nudge");
  }, NUDGE_AFTER);
}
$("board").addEventListener("pointerdown", restNudge);

async function hint() {
  question.stop();
  const text = board?.hint?.();
  if (text) await tell(text);
}

async function runStep() {
  const step = steps[at];
  misses = 0;
  drawSteps();
  $("board").innerHTML = "";
  $("board").className = `screen board board-${step.p}`;
  question.reset();
  if (step.transfer) {
    sound.tap();
    await tell(T.surprise);
  }
  if (step.pack) {
    sound.tap();
    await tell(T.berg.pack(T.berg.camps[campOf(step.idea).id]));
  }
  const own = ideas[step.idea ?? IDEA];
  const t = own.next({ p: step.p, range: step.range ?? range });
  board = own.BOARDS[step.p]($("board"), t, ctx);
  restNudge();
}

/** The backpack tasks of a round: [{ idea, p, range }], from the camps below this one that the child
 *  has played in a short perspective. The camp played longest ago comes first; two tasks come from two
 *  camps where there are two. */
function packed() {
  if (!CAMP) return [];
  const below = MOUNTAIN.slice(0, MOUNTAIN.indexOf(CAMP)).flatMap((c) => c.ideas ?? []);
  const r = nextTask.r;
  const pool = r
    .shuffle(below)
    .map((idea) => ({ idea, ps: record.played(idea).filter((p) => PACK_FROM.includes(p)), last: record.lastDay(idea) }))
    .filter((c) => c.ps.length)
    .sort((a, b) => a.last.localeCompare(b.last));
  // A little chance: one of the two longest ago, not always the very oldest.
  if (pool.length > 1 && r.chance(0.3)) [pool[0], pool[1]] = [pool[1], pool[0]];
  return Array.from({ length: pool.length ? PACK[CAMP.height] ?? 0 : 0 }, (_, i) => {
    const c = pool[i % pool.length];
    return { idea: c.idea, p: r.pick(c.ps), range: record.range(c.idea) };
  });
}

async function startRound() {
  range = record.range(IDEA);
  fresh = record.state(IDEA, P.id) === "new";
  const full = IDEAS[IDEA].tasks?.[P.id] ?? ROUND_TASKS;
  const count = kidAge !== null && kidAge <= SHORT_UNTIL ? Math.min(full, SHORT_TASKS) : full;
  const others = SURPRISE.filter((id) => id !== P.id && record.state(IDEA, id) !== "new");
  steps = Array.from({ length: count }, () => ({ p: P.id, transfer: false }));
  // Backpack tasks take the place of tasks of this camp, never the first one.
  const pack = packed().slice(0, count - 1);
  const spots = nextTask.r.shuffle(steps.map((_, i) => i).slice(1)).slice(0, pack.length);
  pack.forEach((s, i) => (steps[spots[i]] = { ...s, transfer: false, pack: true }));
  await Promise.all(pack.map((s) => load(s.idea)));
  if (others.length) steps.push({ p: nextTask.r.pick(others), transfer: true });
  at = 0;
  firstTries = 0;
  firstAll = 0;
  busy = false;
  for (const { next } of Object.values(ideas)) next.forget();
  show("board");
  runStep();
}

/** The flower bed of this place on the done screen: every flower grown here, the new one comes up.
 *  The map shows the same flowers at the place, the new one blooms there once (map.js, store "newFlower").
 *  Returns false when the bed is full: then nothing new grows on the map either, and nothing is said. */
function flowerBed() {
  const place = PLACES.find((p) => p.ideas?.includes(IDEA));
  const grown = (place?.ideas ?? [IDEA]).reduce((n, idea) => n + record.grown(idea), 0);
  const bed = $("bed");
  bed.hidden = !place || grown > BED;
  if (bed.hidden) return false;
  $("bedName").textContent = T.places[place.id];
  const row = $("bedFlowers");
  row.innerHTML = "";
  for (let i = 0; i < grown; i++) {
    const f = document.createElement("span");
    f.textContent = FLOWERS[i % FLOWERS.length];
    if (i === grown - 1) f.className = "new";
    row.append(f);
  }
  store.set("newFlower", place.id);
  return true;
}

async function finish() {
  const tasks = steps.filter((s) => !s.transfer && !s.pack).length;
  const berg = IDEAS[IDEA].world === "berg";
  const hadStar = berg && record.won(IDEA, P.id);
  const whole = { first: firstAll, tasks: steps.filter((s) => !s.transfer).length };
  const moved = record.round(IDEA, P.id, range, { first: firstTries, tasks, card: CARD, whole });
  // The mountain: the star of this perspective (4 of 5 right the first time), or how close it was
  const star = !berg || hadStar ? "" : record.won(IDEA, P.id) ? (record.mastered(IDEA) ? T.berg.allStars : T.berg.star) : T.berg.noStar(num(whole.first), num(whole.tasks));
  $("cardIcon").textContent = CARDS[CARD];
  $("cardName").textContent = T.cards[CARD].name;
  $("cardText").textContent = T.cards[CARD].text;
  for (const b of $("feel").children) b.classList.remove("on");
  // Small children are not asked how it was: two weak rounds take the numbers down by themselves.
  $("feel").hidden = NATURE;
  if (NATURE && moved <= 0) record.settle(IDEA, P.id, range);
  $("bed").hidden = true;
  const flower = NATURE && flowerBed();
  show("done");
  sound.win();
  celebrate();
  await tell(`${T.done} ${T.cardGot(T.cards[CARD].name)} ${T.cards[CARD].text}`);
  if (flower) await tell(T.grew);
  if (star) await tell(star);
  // The town has no flowers: it only says when the numbers get bigger. The mountain has its logbook.
  if (moved > 0) await tell(BIGGER);
  else if (IDEAS[IDEA].world === "berg") await tell(GREW);
  if (!NATURE) tell(T.feelQuestion);
}

// ---------- Wire up

fill(T);
/** The thinking mountain names the perspectives in its own words (welt/lang: berg.perspectives). */
const NAMES = (IDEAS[IDEA].world && T[IDEAS[IDEA].world]?.perspectives) || T.perspectives;
document.title = `${NAMES[P.id]} · ${T.title}`;
mount($("caption"));
document.body.dataset.world = IDEAS[IDEA].world ?? ""; // the mountain has its own board layout
$("home").innerHTML = icons.home;
$("hear").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("startArt").textContent = P.icon;
$("again").textContent = T.again;
$("other").textContent = T.other;
$("other").href = `${mapOf(IDEA)}?o=${IDEAS[IDEA].place}${IDEAS[IDEA].world ? "" : `&i=${IDEA}`}`;
$("home").href = mapOf(IDEA);
$("feel").setAttribute("aria-label", T.feelQuestion);
for (const b of $("feel").children) {
  b.querySelector("small").textContent = T.feel[b.dataset.feel];
  b.addEventListener("click", () => {
    for (const other of $("feel").children) other.classList.toggle("on", other === b);
    sound.tap();
    if (record.feel(IDEA, P.id, range, b.dataset.feel) < 0) tell(SMALLER);
  });
}

$("play").addEventListener("click", async () => {
  $("play").disabled = true;
  await tell(INTRO[P.id]);
  startRound();
});
$("again").addEventListener("click", startRound);
$("hear").addEventListener("click", again);
$("hint").addEventListener("click", () => {
  if (!busy) hint();
});

show("start");
$("caption").textContent = INTRO[P.id];
