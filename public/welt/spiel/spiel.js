// One round in the new world: a few tasks of one idea in one perspective, then one surprise task
// from another perspective of the same idea (the transfer step), then the thinking card.
//
//   /welt/spiel/?p=sehen        the perspective (see welt/frame/ideas.js); without p: the suggested one
//   /welt/spiel/?p=sehen&seed=7 the same tasks every time (shared/gen.js)
//
// This file is the frame every idea shares: steps, voice and caption, hint button, counting what was
// right the first time, saving (frame/record.js). The idea itself is in welt/ideas/<idea>/:
// tasks.js makes each task as plain data, boards.js draws it and takes the answer.

import { oneOf, sound, celebrate, icons } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import { things } from "../../shared/things.js";
import * as gen from "../../shared/gen.js";
import * as record from "../frame/record.js";
import { mount, tell, again } from "../frame/voice.js";
import { IDEAS, PERSPECTIVES, CARDS, ROUND_TASKS, perspective } from "../frame/ideas.js";
import { task } from "../ideas/teile/tasks.js";
import { BOARDS } from "../ideas/teile/boards.js";

const IDEA = "teile";
const T = await texts(new URL("../map.js", import.meta.url).href); // welt/lang/<language>.js
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const params = new URLSearchParams(location.search);
const P = perspective(params.get("p")) || perspective(record.suggest(IDEA));

/** After this many wrong answers in a task the hint shows by itself. */
const HINT_AFTER = 2;
/** The surprise task comes from one of these perspectives (short ones), never the one just played. */
const SURPRISE = ["sehen", "anwenden", "pruefen"];

const THINGS = Object.fromEntries(things(T).map((t) => [t.id, t]));
const nextTask = gen.generator(task, { avoid: { key: 2 } });
const screens = { start: $("start"), board: $("board"), done: $("done") };

let range = record.range(IDEA);
let steps = []; // [{ p, transfer }]
let at = 0;
let misses = 0;
let firstTries = 0; // tasks of the round right the first time (the surprise task is not counted)
let board = null;
let busy = false;

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  $("hint").hidden = name !== "board";
}

function drawSteps() {
  $("steps").innerHTML = "";
  steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.textContent = step.transfer ? "🎁" : "";
    li.className = (step.transfer ? "gift " : "") + (i < at ? "done" : i === at ? "now" : "");
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
    record.task(IDEA, step.p, range, first, step.transfer);
    if (first && !step.transfer) firstTries++;
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

async function hint() {
  const text = board?.hint?.();
  if (text) await tell(text);
}

async function runStep() {
  const step = steps[at];
  misses = 0;
  drawSteps();
  $("board").innerHTML = "";
  $("board").className = `screen board board-${step.p}`;
  if (step.transfer) {
    sound.tap();
    await tell(T.surprise);
  }
  const t = nextTask({ p: step.p, range });
  board = BOARDS[step.p]($("board"), t, ctx);
}

function startRound() {
  range = record.range(IDEA);
  const count = IDEAS[IDEA].tasks?.[P.id] ?? ROUND_TASKS;
  const others = SURPRISE.filter((id) => id !== P.id);
  steps = [
    ...Array.from({ length: count }, () => ({ p: P.id, transfer: false })),
    { p: nextTask.r.pick(others), transfer: true },
  ];
  at = 0;
  firstTries = 0;
  busy = false;
  nextTask.forget();
  show("board");
  runStep();
}

async function finish() {
  const tasks = steps.filter((s) => !s.transfer).length;
  const moved = record.round(IDEA, P.id, range, { first: firstTries, tasks, card: P.card });
  $("cardIcon").textContent = CARDS[P.card];
  $("cardName").textContent = T.cards[P.card].name;
  $("cardText").textContent = T.cards[P.card].text;
  for (const b of $("feel").children) b.classList.remove("on");
  show("done");
  sound.win();
  celebrate();
  await tell(`${T.done} ${T.cardGot(T.cards[P.card].name)} ${T.cards[P.card].text}`);
  await tell(moved > 0 ? T.bigger : T.grew);
  tell(T.feelQuestion);
}

// ---------- Wire up

fill(T);
document.title = `${T.perspectives[P.id]} · ${T.title}`;
mount($("caption"));
$("home").innerHTML = icons.home;
$("hear").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("startArt").textContent = P.icon;
$("again").textContent = T.again;
$("other").textContent = T.other;
$("feel").setAttribute("aria-label", T.feelQuestion);
for (const b of $("feel").children) {
  b.querySelector("small").textContent = T.feel[b.dataset.feel];
  b.addEventListener("click", () => {
    for (const other of $("feel").children) other.classList.toggle("on", other === b);
    sound.tap();
    if (record.feel(IDEA, P.id, range, b.dataset.feel) < 0) tell(T.smaller);
  });
}

$("play").addEventListener("click", async () => {
  $("play").disabled = true;
  await tell(T.intro[P.id]);
  startRound();
});
$("again").addEventListener("click", startRound);
$("hear").addEventListener("click", again);
$("hint").addEventListener("click", () => {
  if (!busy) hint();
});

show("start");
$("caption").textContent = T.intro[P.id];
