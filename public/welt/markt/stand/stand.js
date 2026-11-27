// One round at the market: five tasks at one stand, in one number range and one perspective,
// or five stories on the market square.
//
//   /welt/markt/stand/?op=plus&r=20&p=sehen   stand, number range (summit), perspective
//   /welt/markt/stand/?platz=2                the market square, stage 2
//   …&seed=7                                  the same tasks every time (shared/gen.js)
//
// The voice: a task whose numbers (with the answer) are all at most 20 is read aloud and the feedback
// is spoken. Above 20 there are no words, only text; the short sounds for right and wrong stay.
// Parents can switch the voice off per child (/eltern/: read aloud).
//
// A round: 3 tasks of the sub-step the child is on, 1 from the summit below (the backpack), and 1 more:
// in "use" the same numbers the other way round (8 + 5, then 13 − 5). After a kind of mistake came
// three times, the next round starts with three tasks of that kind, with the picture (a bridge).
// Help in a task: 1st miss what the child chose, 2nd the picture, 3rd the way in steps.

import { oneOf, sound, celebrate, icons, say } from "../../../shared/kit.js";
import { texts, fill, num } from "../../../shared/i18n.js";
import * as gen from "../../../shared/gen.js";
import * as profiles from "../../../shared/profiles.js";
import * as markt from "../record.js";
import { task, inverse, STEPS, RANGES, OPS, mixed, audible } from "../tasks.js";
import { story, STAGES } from "../stories.js";
import { BOARDS, platzBoard, dropPad } from "../boards.js";

const T = await texts(new URL("../markt.js", import.meta.url).href); // welt/markt/lang/<language>.js
const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const params = new URLSearchParams(location.search);

const PLATZ = STAGES.includes(Number(params.get("platz"))) ? Number(params.get("platz")) : 0;
const OP = OPS.includes(params.get("op")) ? params.get("op") : "plus";
const RANGE = RANGES.includes(Number(params.get("r"))) ? Number(params.get("r")) : markt.suggestRange(OP);
const P = markt.PERSPECTIVES.includes(params.get("p")) ? params.get("p") : markt.suggest(OP, RANGE);
const ICON = { sehen: "👁️", machen: "✋", forschen: "🔍", anwenden: "🔑", pruefen: "✅" };
const ROUND = 5;
const kid = profiles.current();
/** The voice is on up to 20 for every age; only the parents can switch it off. */
const voiceOn = kid?.readAloud !== false;
const r = gen.kit(gen.seed());
/** The market square speaks when all its numbers stay up to 20 (only "up to 10" or "up to 20" finished). */
const PLATZ_LOUD = Math.max(0, ...Object.values(markt.allowed())) <= 20;
if (PLATZ && !markt.platzOpen()) location.replace("/welt/markt/?o=platz");

// ---------- Voice and caption

let last = { text: "", aud: false };
function tell(text, aud, shown = text) {
  $("caption").textContent = shown;
  last = { text, aud };
  $("hear").hidden = !aud || !voiceOn;
  const pause = wait(Math.min(2500, 600 + text.length * 25));
  return aud && voiceOn ? Promise.all([say(text), pause]) : pause;
}

// ---------- The round

let slots = []; // what each task is: "cur", "bridge", "review", "inverse", "story"
let at = 0;
let misses = 0;
let firstTries = 0;
let wrongInRow = 0;
let rightInRow = 0;
let easyNext = false;
let busy = false;
let board = null;
let current = null; // the task (or story) on the board
let prev = null;
let shownAt = 0; // when the task was ready: the time to the first answer
let recentKeys = [];
let bridgeKind = null;

const screens = { start: $("start"), board: $("board"), done: $("done") };
function show(name) {
  for (const [k, e] of Object.entries(screens)) e.hidden = k !== name;
  $("hint").hidden = name !== "board";
}

function drawSteps() {
  $("steps").innerHTML = "";
  slots.forEach((s, i) => {
    const li = document.createElement("li");
    const icon = s === "review" ? "🎒" : s === "inverse" ? "🔁" : "";
    li.textContent = icon;
    li.className = (icon ? "gift " : "") + (i < at ? "done" : i === at ? "now" : "");
    $("steps").append(li);
  });
}

/** A task of this stand: the card that is most due wins among a few (the learning box). */
function pick(range, step) {
  let best = null, score = -Infinity;
  for (let i = 0; i < 8; i++) {
    const t = task(OP, range, step, r);
    const s = markt.cardScore(t.key) + r.random() * 0.6 - (recentKeys.includes(t.key) ? 6 : 0);
    if (s > score) [best, score] = [t, s];
  }
  recentKeys = [best.key, ...recentKeys].slice(0, 4);
  return best;
}

/** The sub-step that trains a kind of mistake (bridge), or null. */
function bridgeStep(kind) {
  const ids = STEPS[OP][RANGE];
  const want = { zehner: ["uebergang", "zeE", "carry"], kleinergroesser: ["zeze", "carry", "uebergang"], nachbar: ["reihen", "alle"], rest: ["rest"] }[kind] ?? [];
  const i = ids.findIndex((id) => want.includes(id));
  return i === -1 ? null : i;
}

function nextTask(slot) {
  const step = markt.step(OP, RANGE);
  if (slot === "bridge") return pick(RANGE, bridgeStep(bridgeKind) ?? step);
  if (slot === "review") {
    const below = RANGES[RANGES.indexOf(RANGE) - 1];
    return pick(below, mixed(OP, below));
  }
  if (slot === "inverse" && prev && prev.gap === "c" && !prev.rest) {
    const u = inverse(prev);
    if (u.max <= RANGE) return u;
  }
  return pick(RANGE, easyNext ? Math.max(0, step - 1) : step);
}

const ctx = {
  T,
  num,
  r,
  tell,
  tap: () => sound.tap(),
  locked: () => busy,
  started: () => (shownAt = Date.now()),
  get choices() {
    if (PLATZ) return current.max <= 20 && !profiles.typeAnswers(kid);
    return current.range <= 20 && markt.step(OP, RANGE) === 0 && !profiles.typeAnswers(kid);
  },
  ops: Object.keys(markt.allowed()),

  async miss(given, kind, text = "") {
    if (busy) return;
    busy = true;
    misses++;
    wrongInRow++;
    sound.wrong();
    if (kind) markt.mistake(PLATZ ? "platz" : OP, kind);
    const chose = given === null || given === undefined ? "" : T.chose(num(given));
    await tell([oneOf(T.oops), chose, text].filter(Boolean).join(" "), PLATZ ? current.max <= 20 : audible(current));
    busy = false;
    if (misses === 2) board?.help();
    if (misses === 3) board?.way();
    if (wrongInRow >= 3) {
      easyNext = true;
      wrongInRow = 0;
    }
  },

  async solved(text) {
    if (busy) return;
    busy = true;
    const first = misses === 0;
    if (PLATZ) markt.platzTask(first);
    else markt.task(OP, current.range, current, first, Date.now() - shownAt);
    if (first) {
      firstTries++;
      rightInRow++;
      wrongInRow = 0;
    } else rightInRow = 0;
    if (!first) easyNext = false;
    // Placement: in the first rounds of a range, 3 right in a row move one sub-step up at once.
    if (!PLATZ && first && slots[at] === "cur" && markt.isPlacement(OP, RANGE) && rightInRow >= markt.PLACEMENT_STREAK && markt.step(OP, RANGE) < mixed(OP, RANGE)) {
      markt.stepUp(OP, RANGE);
      rightInRow = 0;
    }
    sound.right();
    at++;
    drawSteps();
    await Promise.all([tell(`${oneOf(T.praise)} ${text}`, PLATZ ? current.max <= 20 : audible(current)), wait(900)]);
    await wait(300);
    busy = false;
    if (at < slots.length) runStep();
    else finish();
  },
};

async function hint() {
  if (!board || busy) return;
  if (misses < 2) board.help();
  else board.way();
}

function runStep() {
  dropPad();
  misses = 0;
  drawSteps();
  const box = $("board");
  box.innerHTML = "";
  box.className = `screen board markt-board board-${PLATZ ? "platz" : P}`;
  if (PLATZ) {
    current = story(PLATZ, markt.allowed(), r);
    board = platzBoard(box, current, ctx);
  } else {
    prev = current;
    current = nextTask(slots[at]);
    board = BOARDS[P](box, current, ctx);
    const picture = current.stepId === "bilder" || slots[at] === "bridge" || markt.all().ops[OP]?.[RANGE]?.lastWeak;
    if (picture && P !== "sehen" && P !== "machen") board.help();
  }
}

function startRound() {
  if (PLATZ) slots = Array(ROUND).fill("story");
  else {
    bridgeKind = markt.bridge(OP);
    const bridge = bridgeKind && bridgeStep(bridgeKind) !== null;
    slots = Array(ROUND).fill("cur");
    if (bridge) slots.fill("bridge", 0, 3);
    if (RANGE > 10) slots[3] = "review";
    if (P === "anwenden") slots[4] = "inverse";
  }
  at = 0;
  firstTries = 0;
  wrongInRow = rightInRow = 0;
  easyNext = false;
  busy = false;
  current = prev = null;
  show("board");
  if (bridgeKind && slots[0] === "bridge") tell(T.bridge(T.kinds[bridgeKind]), RANGE <= 20).then(runStep);
  else runStep();
}

function starRow(n) {
  return "⭐".repeat(n) + "☆".repeat(markt.PERSPECTIVES.length - n);
}

async function finish() {
  dropPad();
  show("done");
  sound.win();
  celebrate();
  for (const b of $("feel").children) b.classList.remove("on");
  const aud = PLATZ ? PLATZ_LOUD : RANGE <= 20;
  if (PLATZ) {
    const won = markt.platzRound(PLATZ, { first: firstTries, tasks: ROUND });
    $("cardIcon").textContent = won ? "🏅" : "🧺";
    $("cardName").textContent = T.platz.stage(num(PLATZ));
    $("cardStars").textContent = STAGES.map((s) => (markt.platzWon(s) ? "⭐" : "☆")).join("");
    const text = won ? T.platz.won : markt.platzWon(PLATZ) ? T.platz.again : T.noStar(num(firstTries), num(ROUND));
    $("cardText").textContent = text;
    await tell(`${T.done} ${text}`, aud);
    tell(T.feelQuestion, aud);
    return;
  }
  const wasMixed = markt.step(OP, RANGE) >= mixed(OP, RANGE);
  const out = markt.round(OP, RANGE, P, { first: firstTries, tasks: ROUND });
  const stars = markt.stars(OP, RANGE);
  const step = markt.step(OP, RANGE);
  $("cardIcon").textContent = out.flag ? "🚩" : out.star ? "⭐" : ICON[P];
  $("cardName").textContent = `${T.stands[OP]} · ${T.summit(num(RANGE))}`;
  $("cardStars").textContent = starRow(stars);
  const lines = [];
  if (out.flag) lines.push(T.flagWon(num(RANGE)));
  else if (out.star) lines.push(T.starWon(T.perspectives[P]));
  else if (wasMixed && !markt.won(OP, RANGE, P)) lines.push(T.noStar(num(firstTries), num(ROUND)));
  else if (!wasMixed && out.moved <= 0) lines.push(T.notYetMixed);
  if (out.moved > 0) lines.push(step >= mixed(OP, RANGE) ? T.nowMixed : T.stepUp(T.steps[OP][STEPS[OP][RANGE][step]]));
  if (out.moved < 0) lines.push(T.stepDown);
  if (out.tooHigh) lines.push(T.tooHigh(num(RANGES[RANGES.indexOf(RANGE) - 1])));
  const text = lines.join(" ");
  $("cardText").textContent = text;
  await tell(`${T.done} ${text}`, aud);
  tell(T.feelQuestion, aud);
}

// ---------- Wire up

fill(T);
$("home").innerHTML = icons.home;
$("hear").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("again").textContent = T.again;
$("other").textContent = T.other;
const back = PLATZ ? "/welt/markt/?o=platz" : `/welt/markt/?o=${OP}&r=${RANGE}`;
$("home").href = back;
$("other").href = back;
$("feel").setAttribute("aria-label", T.feelQuestion);
for (const b of $("feel").children) {
  b.querySelector("small").textContent = T.feel[b.dataset.feel];
  b.addEventListener("click", () => {
    for (const other of $("feel").children) other.classList.toggle("on", other === b);
    sound.tap();
    if (!PLATZ && markt.feel(OP, RANGE, b.dataset.feel) < 0) tell(T.stepDown, RANGE <= 20);
  });
}
$("hear").addEventListener("click", () => last.text && say(last.text));
$("hint").addEventListener("click", hint);
$("again").addEventListener("click", startRound);

const intro = PLATZ ? T.platz.intro[PLATZ] : T.intro[P];
const where = PLATZ ? `${T.platz.name} · ${T.platz.stage(num(PLATZ))}` : `${T.stands[OP]} · ${T.summit(num(RANGE))} · ${T.perspectives[P]}`;
document.title = `${where} · AnkaPlay`;
$("where").textContent = where;
$("startArt").textContent = PLATZ ? "🧺" : ICON[P];
$("play").addEventListener("click", async () => {
  $("play").disabled = true;
  // Without the voice the intro is already on screen: no waiting.
  if (loud && voiceOn) await tell(intro, true);
  startRound();
});
show("start");
$("caption").textContent = intro;
const loud = PLATZ ? PLATZ_LOUD : RANGE <= 20;
$("hear").hidden = !loud || !voiceOn;
last = { text: intro, aud: loud };
