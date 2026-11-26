// One round in the new world: a few tasks of one idea in one perspective, then one surprise task
// from another perspective of the same idea (the transfer step), then the thinking card.
//
//   /welt/spiel/?i=zahl&p=sehen   the idea and the perspective (see welt/frame/ideas.js);
//                                 without i: "teile", without p: the suggested perspective
//   /welt/spiel/?p=sehen&seed=7   the same tasks every time (shared/gen.js)
//
// Dares (Mutproben, ideas with dare: true): after DARE_AFTER tasks in a row right at the first try and
// without a hint, the next task comes from the next range. Solved the same way, the child stays up
// there; otherwise nothing changes. Once per idea an entry dare of the third range starts the round.
// A dare is not counted in the round (no penalty).
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
import { mount, tell, again } from "../frame/voice.js";
import { IDEAS, CARDS, ROUND_TASKS, perspective, cardOf, mapOf } from "../frame/ideas.js";

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
/** Dares: what is said before and after (welt/lang: <world>.dare). */
const DARE = (IDEAS[IDEA].world && T[IDEAS[IDEA].world]?.dare) || {};
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

const THINGS = Object.fromEntries(things(T).map((t) => [t.id, t]));
const nextTask = gen.generator(task, { avoid: { key: 2 } });
const screens = { start: $("start"), board: $("board"), done: $("done") };

let range = record.range(IDEA);
let steps = []; // [{ p, transfer, dare: range of a dare | undefined, entry }]
let at = 0;
let misses = 0;
let firstTries = 0; // tasks of the round right the first time (the surprise task is not counted)
let counted = 0; // tasks of the round in `range` (a dare and the surprise task are not counted)
let hinted = false; // the hint showed in this task
let streak = 0; // tasks in a row right the first time without a hint
let dared = false; // one dare per round
let board = null;
let busy = false;
let fresh = false; // the child plays this perspective for the first time: the boards show more

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  $("hint").hidden = name !== "board";
}

function drawSteps() {
  $("steps").innerHTML = "";
  steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.textContent = step.transfer ? "🎁" : step.dare ? "💪" : "";
    li.className = (step.transfer || step.dare ? "gift " : "") + (i < at ? "done" : i === at ? "now" : "");
    $("steps").append(li);
  });
}

const ctx = {
  T,
  num,
  word: (n) => T.numbers[n] ?? num(n),
  thing: (id) => (id === "nut" ? { icon: "🌰", ...T.nut } : THINGS[id]),
  tell,
  tap: () => sound.tap(),
  ready: () => restNudge(),
  fresh: () => fresh && !steps[at]?.transfer,

  /** A wrong answer. Resolves when the sentence (and the hint after the second miss) was said. */
  async miss(text) {
    misses++;
    sound.wrong();
    await tell(`${oneOf(T.oops)} ${text}`);
    if (misses === HINT_AFTER) await hint();
  },

  async solved(text) {
    if (busy) return;
    busy = true;
    const step = steps[at];
    const first = misses === 0;
    const clean = first && !hinted;
    record.task(IDEA, step.p, step.dare ?? range, first, step.transfer);
    let dareSaid = "";
    if (step.dare) {
      if (step.entry) record.entryDone(IDEA);
      if (clean) {
        range = step.dare;
        record.lift(IDEA, range);
        counted = 1; // from now on the round counts in the new range, the dare is its first task
        firstTries = 1;
      }
      dareSaid = DARE[clean ? (step.entry ? "entryUp" : "up") : "back"];
    } else if (!step.transfer) {
      counted++;
      if (first) firstTries++;
      streak = clean ? streak + 1 : 0;
    }
    sound.right();
    at++;
    planDare();
    drawSteps();
    await Promise.all([tell(`${oneOf(T.praise)} ${text}`), wait(900)]);
    if (dareSaid) await tell(dareSaid);
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

/** After DARE_AFTER clean tasks the next task of the round becomes a dare (one per round). */
function planDare() {
  if (!IDEAS[IDEA].dare || dared || streak < record.DARE_AFTER) return;
  const ranges = IDEAS[IDEA].ranges;
  const up = ranges[ranges.indexOf(range) + 1];
  if (up === undefined) return;
  dared = true;
  const next = steps[at];
  const dare = { p: P.id, transfer: false, dare: up };
  if (next && !next.transfer) steps[at] = dare;
  else steps.splice(at, 0, dare);
}

async function hint() {
  hinted = true;
  const text = board?.hint?.();
  if (text) await tell(text);
}

async function runStep() {
  const step = steps[at];
  misses = 0;
  hinted = false;
  drawSteps();
  $("board").innerHTML = "";
  $("board").className = `screen board board-${step.p}`;
  if (step.transfer) {
    sound.tap();
    await tell(T.surprise);
  }
  if (step.dare) {
    sound.tap();
    await tell(DARE[step.entry ? "entry" : "go"]);
  }
  const t = nextTask({ p: step.p, range: step.dare ?? range });
  board = BOARDS[step.p]($("board"), t, ctx);
  restNudge();
}

function startRound() {
  range = record.range(IDEA);
  fresh = record.state(IDEA, P.id) === "new";
  const full = IDEAS[IDEA].tasks?.[P.id] ?? ROUND_TASKS;
  const count = kidAge !== null && kidAge <= SHORT_UNTIL ? Math.min(full, SHORT_TASKS) : full;
  const others = SURPRISE.filter((id) => id !== P.id && record.state(IDEA, id) !== "new");
  steps = Array.from({ length: count }, () => ({ p: P.id, transfer: false }));
  if (others.length) steps.push({ p: nextTask.r.pick(others), transfer: true });
  const entry = IDEAS[IDEA].dare ? record.entryDare(IDEA) : null;
  if (entry !== null) steps.unshift({ p: P.id, transfer: false, dare: entry, entry: true });
  at = 0;
  firstTries = 0;
  counted = 0;
  streak = 0;
  dared = entry !== null;
  busy = false;
  nextTask.forget();
  show("board");
  runStep();
}

async function finish() {
  const moved = record.round(IDEA, P.id, range, { first: firstTries, tasks: counted, card: CARD });
  $("cardIcon").textContent = CARDS[CARD];
  $("cardName").textContent = T.cards[CARD].name;
  $("cardText").textContent = T.cards[CARD].text;
  for (const b of $("feel").children) b.classList.remove("on");
  show("done");
  sound.win();
  celebrate();
  await tell(`${T.done} ${T.cardGot(T.cards[CARD].name)} ${T.cards[CARD].text}`);
  await tell(moved > 0 ? BIGGER : GREW);
  tell(T.feelQuestion);
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
$("other").href = `${mapOf(IDEA)}?o=${IDEAS[IDEA].place}`;
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
