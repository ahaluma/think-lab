// The summit of the thinking mountain: competition rounds. Five tasks at the top level from five
// camps (mostly Übertragen, one Begründen with the owl), and one of the summit's own families that
// needs two tools at once (ideas/gipfel/). Before each task the child picks the tool to start with
// from the backpack; afterwards the card "So geht es auch" shows every tool that fits.
// No clock and no points: the round ends with a line in the logbook ("Gipfel, Tag 4: …").
//
//   /welt/berg/gipfel/           a round
//   /welt/berg/gipfel/?seed=7    the same tasks every time (shared/gen.js)
//
// The summit opens on the map (berg.js) when every camp is mastered. This page itself does not check.

import { sound, celebrate, icons, oneOf } from "../../../shared/kit.js";
import { texts, fill, num } from "../../../shared/i18n.js";
import * as gen from "../../../shared/gen.js";
import * as profiles from "../../../shared/profiles.js";
import { store } from "../../../shared/store.js";
import * as record from "../../frame/record.js";
import { mount, tell, again } from "../../frame/voice.js";
import { MOUNTAIN } from "../../frame/ideas.js";
import { el, button } from "../../frame/parts.js";
import * as summit from "../../ideas/gipfel/tasks.js";
import { BOARDS as SUMMIT_BOARDS } from "../../ideas/gipfel/boards.js";

const T = await texts(new URL("../../map.js", import.meta.url).href); // welt/lang/<language>.js
const G = T.gipfel.round;
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Tasks in a round from the camps, and the top level they are played at. */
const FROM_CAMPS = 4;
const LEVEL = 4;
/** After this many wrong answers in a task the hint shows by itself. */
const HINT_AFTER = 2;

const CAMPS = MOUNTAIN.filter((c) => c.ideas?.length);
const loaded = await Promise.all(CAMPS.map((c) => Promise.all([import(`../../ideas/${c.ideas[0]}/tasks.js`), import(`../../ideas/${c.ideas[0]}/boards.js`)])));
const r = gen.kit(gen.seed() ?? Date.now() % 100000);
const camps = Object.fromEntries(CAMPS.map((c, i) => {
  const [tasks, boards] = loaded[i];
  return [c.ideas[0], { camp: c, next: gen.generator(tasks.task, { avoid: { key: 4 }, r }), BOARDS: boards.BOARDS }];
}));
camps.gipfel = { next: gen.generator((_, rr) => summit.task(rr), { avoid: { story: 2 }, r }), BOARDS: SUMMIT_BOARDS };

const kid = profiles.current();
const LOG_KEY = `gipfel:${kid?.id ?? "kid"}`;

let steps = []; // [{ idea, p }]
let at = 0;
let misses = 0;
let firstTries = 0;
let board = null;
let busy = false;

function show(name) {
  for (const id of ["start", "board", "done"]) $(id).hidden = id !== name;
  $("hint").hidden = name !== "board";
}

function drawSteps() {
  $("steps").innerHTML = "";
  steps.forEach((step, i) => {
    const li = el("li", (step.idea === "gipfel" ? "gift " : "") + (i < at ? "done" : i === at ? "now" : ""), step.idea === "gipfel" ? "⛰️" : "");
    $("steps").append(li);
  });
}

const ctx = {
  T,
  num,
  word: (n) => T.numbers[n] ?? num(n),
  tell,
  tap: () => sound.tap(),
  ready() {},
  fresh: () => false,
  async miss(text) {
    misses++;
    sound.wrong();
    await tell(`${oneOf(T.oops)} ${text}`);
    if (misses === HINT_AFTER) await hint();
  },
  async solved(text) {
    if (busy) return;
    busy = true;
    if (misses === 0) firstTries++;
    sound.right();
    at++;
    drawSteps();
    await Promise.all([tell(`${oneOf(T.praise)} ${text}`.trim()), wait(900)]);
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

/** The backpack: one tool for every camp (texts: berg.tools), each with its sign. */
const SIGN = { zaun: "🪵", haken: "✔️", huetten: "🏠", vorrat: "⏪", ameisen: "🐜", waage: "⚖️", stall: "🐔", tanz: "👫", fels: "🔺", socken: "🧦", steine: "🪨", mauer: "🧱" };

/** Four tools from the backpack: the ones that fit (the task's camp, or both camps of a summit
 *  family), and tools of other camps. Each { camp, icon, name }. */
function backpack(step, t) {
  const fits = step.idea === "gipfel" ? t.camps : [camps[step.idea].camp.id];
  const others = r.shuffle(CAMPS.map((c) => c.id).filter((id) => !fits.includes(id))).slice(0, 4 - fits.length);
  return { fits, options: r.shuffle([...fits, ...others]).map((id) => ({ camp: id, icon: SIGN[id] ?? "💡", name: T.berg.tools[id] })) };
}

function runStep() {
  const step = steps[at];
  misses = 0;
  drawSteps();
  const host = $("board");
  host.innerHTML = "";
  host.className = `screen board board-${step.p}`;
  const own = camps[step.idea];
  const t = own.next({ p: step.p, range: LEVEL });
  if (gen.seed() !== undefined) globalThis.gipfelTask = { idea: step.idea, t }; // for the round test
  board = own.BOARDS[step.p](host, t, ctx);
  // The answer waits until the child has picked a tool from the backpack.
  const answers = [...host.querySelectorAll(".numpad-box, .judge, .choices, .find-row")].filter((x) => !x.hidden);
  answers.forEach((x) => (x.hidden = true));
  const from = step.idea === "gipfel" ? G.family : G.camp(T.berg.camps[own.camp.id]);
  const { fits, options } = backpack(step, t);
  const pick = el("div", "card tool-pick");
  pick.append(el("small", "summit-from", from), el("strong", "", G.pick));
  const row = el("div", "tool-row");
  for (const o of options) {
    const b = button("btn tool-btn", o.name, "");
    b.append(el("span", "tool-icon", o.icon), el("span", "tool-name", o.name));
    b.addEventListener("click", () => {
      sound.tap();
      pick.remove();
      answers.forEach((x) => (x.hidden = false));
      tell(fits.includes(o.camp) ? G.goodPick(o.name) : G.tryPick(o.name));
    }, { once: true });
    row.append(b);
  }
  pick.append(row);
  host.append(pick);
  const ownHint = board.hint;
  board = { hint: () => (pick.isConnected ? G.pick : ownHint?.()) };
}

function startRound() {
  const from = r.sample(CAMPS.map((c) => c.ideas[0]), FROM_CAMPS);
  const owl = r.int(0, FROM_CAMPS - 1);
  steps = from.map((idea, i) => ({ idea, p: i === owl ? "pruefen" : "anwenden" }));
  steps.splice(r.int(1, FROM_CAMPS), 0, { idea: "gipfel", p: "anwenden" });
  for (const c of Object.values(camps)) c.next.forget();
  at = 0;
  firstTries = 0;
  busy = false;
  show("board");
  runStep();
}

function finish() {
  const log = store.get(LOG_KEY, []);
  const day = record.today();
  const days = new Set(log.map((e) => e.day));
  days.add(day);
  log.push({ day, n: days.size, first: firstTries, of: steps.length });
  store.set(LOG_KEY, log.slice(-30));
  const line = (e) => G.log(num(e.n), num(e.first), num(e.of));
  $("log").innerHTML = "";
  for (const e of log.slice(-5).reverse()) $("log").append(el("li", "", line(e)));
  show("done");
  sound.win();
  celebrate();
  tell(`${G.done} ${line(log.at(-1))}`);
}

// ---------- Wire up

fill(T);
document.title = `${G.title} · AnkaPlay`;
mount($("caption"));
$("home").innerHTML = icons.home;
$("home").setAttribute("aria-label", T.berg.title);
$("hear").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("logTitle").textContent = G.logTitle;
$("again").textContent = G.again;
$("back").textContent = G.back;
$("again").addEventListener("click", startRound);
$("hear").addEventListener("click", again);
$("hint").addEventListener("click", () => !busy && hint());
$("play").addEventListener("click", async () => {
  $("play").disabled = true;
  await tell(G.intro);
  startRound();
});
show("start");
$("caption").textContent = G.intro;
