// "Größen vergleichen" – comparing sizes, for about 3 to 7 years.
// Pencils: which is longer / shorter? Towers: which is higher / lower? Glasses: where is more / less water?
// A balance: which is heavier / lighter (the heavy side goes down)? Later: three things ("the longest"),
// putting them in order, pencils that don't start at one line and towers on hills, small but heavy things
// (a stone and a balloon), wide and narrow glasses, and two balances with three parcels.
// The child taps the right thing. Help after wrong answers: lines at the ends, everything moves to one line
// or one ground, the water is poured into the same glasses, an arrow shows the heavy side.
// See levels.js. All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, shuffle, randInt, pick, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";

const ID = "groessen";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`;
const oops = (text) => `${oneOf(T.oops)} ${text}`;

const STARS_PER_GAME = 5;
const TRACK = 14; // steps: the length of the pencil rows, the height of the tower field
const GLASS = 12; // steps: the height of a glass
const COLORS = ["#ff5a36", "#2456b8", "#ffc83a", "#12a564", "#e8488a", "#8a5cf6"];
const PARCELS = { red: "#ff5a36", blue: "#2456b8", yellow: "#ffc83a", green: "#12a564" };
const TILT = 14; // degrees the beam of a balance tips

// Animals on the balance, lightest first: kg roughly, only the order matters.
const ANIMALS = [
  ["ant", "🐜", 1], ["ladybird", "🐞", 1], ["butterfly", "🦋", 1], ["snail", "🐌", 2], ["frog", "🐸", 3],
  ["duck", "🦆", 5], ["owl", "🦉", 5], ["rabbit", "🐰", 6], ["fox", "🦊", 7], ["penguin", "🐧", 8],
  ["kangaroo", "🦘", 10], ["panda", "🐼", 12], ["lion", "🦁", 13], ["crocodile", "🐊", 14],
  ["giraffe", "🦒", 17], ["rhino", "🦏", 18], ["elephant", "🐘", 20],
].map(([id, icon, kg]) => ({ id, icon, kg }));
// Small but heavy, and big but light: the balance shows what the eyes don't.
const HEAVY = [["stone", "🪨"], ["apple", "🍎"], ["key", "🔑"], ["carrot", "🥕"]].map(([id, icon]) => ({ id, icon }));
const LIGHT = [["balloon", "🎈"], ["feather", "🪶"], ["leaf", "🍂"]].map(([id, icon]) => ({ id, icon }));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };
const field = $("field");
const picks = $("picks");

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // LEVELS[play.level] of this task
let stars = 0;
let task = null; // see newTask()
let lastKind = "";
let misses = 0;
let helped = false;
let locked = true;
let targets = []; // the buttons the child taps, one per item

const el = (tag, className, text) => {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};
const button = (className, label) => {
  const b = el("button", className);
  b.type = "button";
  if (label) b.setAttribute("aria-label", label);
  return b;
};
const pct = (part, whole) => `${(part / whole) * 100}%`;

// ---------- Screens

function show(name) {
  for (const [key, e] of Object.entries(screens)) e.hidden = key !== name;
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

// ---------- Making a task

/** n different whole numbers from lo to hi, each at least `gap` apart. */
function sizes(n, gap, lo, hi) {
  for (let tries = 0; tries < 200; tries++) {
    const list = [];
    for (let i = 0; i < n; i++) list.push(randInt(lo, hi));
    const sorted = [...list].sort((a, b) => a - b);
    if (sorted.every((s, i) => i === 0 || s - sorted[i - 1] >= gap)) return list;
  }
  return shuffle([...Array(n).keys()].map((i) => lo + i * gap));
}

const count = (n) => (Array.isArray(n) ? randInt(n[0], n[1]) : n);
const indexOf = (list, best) => list.indexOf(best(...list));

function pickKind() {
  const kinds = current.kinds;
  if (kinds.length === 1) return kinds[0];
  return shuffle(kinds.filter((k) => k !== lastKind))[0];
}

function newTask() {
  const l = current;
  const kind = pickKind();
  lastKind = kind;
  const dir = l.ask === "mix" && Math.random() < 0.45 ? "less" : "more";
  const colors = shuffle(COLORS);
  const t = { kind, dir };

  if (kind === "lang" || kind === "hoch") {
    const n = Math.min(count(l.n), 4);
    const hi = kind === "lang" ? 11 : 10;
    for (let tries = 0; tries < 30; tries++) {
      const s = sizes(n, l.gap, 3, hi);
      t.items = s.map((size, i) => ({
        size,
        off: l.offset ? randInt(0, Math.min(4, TRACK - size)) : 0,
        color: colors[i],
      }));
      t.answer = indexOf(s, dir === "more" ? Math.max : Math.min);
      // Not on one line: mostly the end that sticks out furthest is not the answer, so the child has to compare.
      if (!l.offset || Math.random() < 0.25) break;
      const ends = t.items.map((it) => it.size + it.off);
      if (indexOf(ends, dir === "more" ? Math.max : Math.min) !== t.answer) break;
    }
  } else if (kind === "wasser") {
    if (l.widths) {
      // Two glasses of different widths. The amount is width × height. Mostly the higher water is less.
      const tricky = Math.random() < 0.6;
      for (let tries = 0; tries < 200; tries++) {
        const w = shuffle(pick([[1, 2], [1, 1.6], [1.3, 2]]));
        const h = [randInt(2, 10), randInt(2, 10)];
        const v = [w[0] * h[0], w[1] * h[1]];
        if (v.some((x) => x > 16) || h[0] === h[1]) continue;
        if (Math.max(...v) < Math.min(...v) * 1.35) continue;
        if (tricky !== (indexOf(v, Math.max) !== indexOf(h, Math.max))) continue;
        t.items = h.map((water, i) => ({ water, width: w[i], amount: v[i] }));
        break;
      }
    } else {
      const n = Math.min(count(l.n), 3);
      t.items = sizes(n, l.gap, 2, 10).map((water) => ({ water, width: n > 2 ? 1.2 : 1.4, amount: water }));
    }
    const amounts = t.items.map((it) => it.amount);
    t.answer = indexOf(amounts, dir === "more" ? Math.max : Math.min);
  } else if (kind === "waage") {
    let a, b;
    do [a, b] = shuffle(ANIMALS);
    while (Math.abs(a.kg - b.kg) < 4);
    t.items = [a, b].map((x) => ({ ...x, name: T.weigh[x.id], scale: 1 }));
    t.answer = indexOf([a.kg, b.kg], dir === "more" ? Math.max : Math.min);
  } else if (kind === "trick") {
    const heavy = { ...pick(HEAVY), kg: 2, scale: 0.6 };
    const light = { ...pick(LIGHT), kg: 1, scale: 1.6 };
    t.items = shuffle([heavy, light]).map((x) => ({ ...x, name: T.weigh[x.id] }));
    t.answer = t.items.findIndex((x) => x.kg === (dir === "more" ? 2 : 1));
  } else if (kind === "kette") {
    // Three parcels, weights 3, 2, 1. One balance shows the heaviest against the middle one,
    // the other the middle one against the lightest. The child sees no balance with all three.
    const names = shuffle(Object.keys(PARCELS)).slice(0, 3);
    t.items = names.map((c, i) => ({ color: c, kg: 3 - i, name: T.parcels[c] }));
    const [h, m, s] = t.items;
    t.scales = shuffle([shuffle([h, m]), shuffle([m, s])]);
    t.items = shuffle(t.items);
    t.answer = t.items.findIndex((x) => x.kg === (dir === "more" ? 3 : 1));
  } else {
    // Ordering: pencils or towers, from small to big (or big to small).
    t.what = pick(["lang", "hoch"]);
    t.dir = l.down && Math.random() < 0.4 ? "down" : "up";
    const n = count(l.n);
    const s = sizes(n, l.gap, 3, t.what === "lang" ? 12 : 13);
    t.items = s.map((size, i) => ({ size, off: 0, color: colors[i % colors.length] }));
    t.order = [...t.items.keys()].sort((a, b) => (t.dir === "up" ? s[a] - s[b] : s[b] - s[a]));
    t.next = 0;
  }
  return t;
}

// ---------- Drawing

/** The pencils (lang) or towers (hoch). Each one is a button. */
function drawSticks(kind, items) {
  field.className = `field ${kind}`;
  field.innerHTML = "";
  targets = items.map((it, i) => {
    const b = button(kind === "lang" ? "row" : "col", num(i + 1));
    if (kind === "lang") {
      const p = el("span", "pencil");
      p.style.setProperty("--c", it.color);
      b.append(p);
    } else {
      const hill = el("span", "hill");
      const tower = el("span", "tower");
      tower.style.setProperty("--c", it.color);
      b.append(hill, tower);
    }
    b.addEventListener("click", () => tap(i));
    field.append(b);
    return b;
  });
  if (kind === "lang") field.append(el("span", "startline"));
  else field.append(el("span", "ground"));
  placeSticks(kind, items);
}

/** Size and place of every pencil / tower (also used to move them onto one line). */
function placeSticks(kind, items) {
  items.forEach((it, i) => {
    const b = targets[i];
    if (kind === "lang") {
      const p = b.querySelector(".pencil");
      p.style.left = pct(it.off, TRACK);
      p.style.width = pct(it.size, TRACK);
    } else {
      b.querySelector(".hill").style.height = pct(it.off, TRACK);
      const tower = b.querySelector(".tower");
      tower.style.bottom = pct(it.off, TRACK);
      tower.style.height = pct(it.size, TRACK);
    }
  });
  field.classList.toggle("aligned", items.every((it) => it.off === 0));
}

function drawGlasses(items) {
  field.className = `field wasser n${items.length}`;
  field.innerHTML = "";
  targets = items.map((it, i) => {
    const b = button("glass");
    b.append(el("span", "water"));
    b.addEventListener("click", () => tap(i));
    field.append(b);
    return b;
  });
  placeGlasses(items);
}

function placeGlasses(items) {
  items.forEach((it, i) => {
    targets[i].style.setProperty("--w", it.width);
    targets[i].querySelector(".water").style.height = pct(it.water, GLASS);
  });
}

/** A balance. pans: two items. Tappable pans for "waage" and "trick", small ones without buttons for "kette". */
function drawScale(pans, { tappable = true, small = false } = {}) {
  const box = el("div", "scale" + (small ? " small" : ""));
  box.append(el("span", "post"), el("span", "foot"), el("span", "beam"), el("span", "pivot"));
  const panEls = pans.map((it, i) => {
    const pan = tappable ? button("pan") : el("span", "pan");
    pan.append(el("span", "string"));
    const load = el("span", "load");
    if (it.icon) {
      load.textContent = it.icon;
      load.style.setProperty("--s", it.scale ?? 1);
    } else {
      load.append(parcel(it.color));
    }
    pan.append(load, el("span", "dish"));
    if (tappable) {
      pan.setAttribute("aria-label", it.name);
      pan.addEventListener("click", () => tap(i));
    }
    box.append(pan);
    return pan;
  });
  tiltScale(box, panEls, 0);
  return { box, panEls };
}

/** angle > 0: the right side goes down. */
function tiltScale(box, panEls, angle) {
  const rad = (angle * Math.PI) / 180;
  const half = 31; // % of the width from the middle to the end of the beam
  const ratio = 4 / 3; // width : height of the box
  box.querySelector(".beam").style.transform = `rotate(${angle}deg)`;
  panEls.forEach((pan, i) => {
    const side = i === 0 ? -1 : 1;
    pan.style.left = `${50 + side * half * Math.cos(rad)}%`;
    pan.style.top = `${30 + side * half * ratio * Math.sin(rad)}%`;
  });
}

function parcel(color) {
  const p = el("span", "parcel");
  p.style.setProperty("--c", PARCELS[color]);
  return p;
}

function drawTask() {
  const t = task;
  picks.innerHTML = "";
  picks.className = "picks";
  if (t.kind === "lang" || t.kind === "hoch") drawSticks(t.kind, t.items);
  else if (t.kind === "ordnen") drawSticks(t.what, t.items);
  else if (t.kind === "wasser") drawGlasses(t.items);
  else if (t.kind === "waage" || t.kind === "trick") {
    field.className = "field scales";
    field.innerHTML = "";
    const s = drawScale(t.items);
    field.append(s.box);
    targets = s.panEls;
    t.scaleEls = [s];
  } else {
    // kette: two small balances, the parcels to tap below.
    field.className = "field scales two";
    field.innerHTML = "";
    t.scaleEls = t.scales.map((pans) => {
      const s = drawScale(pans, { tappable: false, small: true });
      field.append(s.box);
      return s;
    });
    targets = t.items.map((it, i) => {
      const b = button("pick", it.name);
      b.append(parcel(it.color));
      b.addEventListener("click", () => tap(i));
      picks.append(b);
      return b;
    });
  }
}

/** The balances tip over, a moment after they appear. */
async function tipScales() {
  const t = task;
  if (!t.scaleEls) return;
  await wait(450);
  const pairs = t.kind === "kette" ? t.scales : [t.items];
  t.scaleEls.forEach(({ box, panEls }, i) => {
    const [a, b] = pairs[i];
    tiltScale(box, panEls, b.kg > a.kg ? TILT : -TILT);
  });
}

// ---------- One task

function question() {
  const t = task;
  if (t.kind === "waage" || t.kind === "trick") return T.askScale(t.dir);
  if (t.kind === "kette") return T.askChain(t.dir);
  if (t.kind === "ordnen") return T.askOrder(t.what, t.dir);
  return T.ask(t.kind, t.dir, t.items.length > 2);
}

async function newRound() {
  current = LEVELS[play.level];
  locked = true;
  misses = 0;
  helped = false;
  task = newTask();
  show("round");
  drawTask();
  const tipping = tipScales();
  await Promise.all([say(question()), tipping]);
  locked = false;
}

function nudge(node) {
  node.classList.remove("shake");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

/** Tapping one item: the answer (or the next one in the row, when ordering). */
async function tap(i) {
  if (locked) return;
  const t = task;
  const b = targets[i];
  if (t.kind === "ordnen") {
    if (b.classList.contains("placed")) return;
    if (i === t.order[t.next]) return void placeNext(i);
    nudge(b);
    return void miss(T.findNext(t.what, t.dir));
  }
  if (i === t.answer) return void right();
  nudge(b);
  b.disabled = true;
  miss(hintFor(t));
}

function hintFor(t) {
  if (t.kind === "lang") return T.lookEnds;
  if (t.kind === "hoch") return T.lookTops;
  if (t.kind === "wasser") return current.widths && t.items[0].width !== t.items[1]?.width ? T.lookWide : T.lookWater;
  if (t.kind === "trick") return T.lookTrick;
  if (t.kind === "kette") return T.lookChain;
  return T.lookScale;
}

/** Ordering: the right next one gets its number and steps back. */
async function placeNext(i) {
  const t = task;
  play.answer(true);
  sound.tap();
  const b = targets[i];
  b.classList.remove("hint", "shake");
  b.classList.add("placed");
  b.append(el("b", "badge pop", num(t.next + 1)));
  t.next++;
  if (t.next < t.order.length) {
    if (helped) targets[t.order[t.next]].classList.add("hint");
    return;
  }
  // All in order: they line up from small to big.
  locked = true;
  await wait(500);
  const sorted = t.order.map((k) => t.items[k]);
  drawSticks(t.what, sorted);
  targets.forEach((tb, k) => {
    tb.classList.add("placed", "right");
    tb.append(el("b", "badge", num(k + 1)));
  });
  right(T.ordered(t.what));
}

// ---------- Help

/** After a few wrong answers: show it more clearly. Returns the sentence that explains the help. */
function help() {
  const t = task;
  helped = true;
  if (t.kind === "lang" || t.kind === "hoch") {
    if (t.items.some((it) => it.off > 0)) {
      t.items.forEach((it) => (it.off = 0));
      placeSticks(t.kind, t.items);
      setTimeout(guides, 700);
      return t.kind === "lang" ? T.helpAlign : T.helpGround;
    }
    guides();
    return T.helpLines;
  }
  if (t.kind === "wasser") {
    if (t.items.some((it) => it.width !== t.items[0].width)) {
      // Pour into glasses of the same width: the amount stays, the height changes.
      t.items.forEach((it) => {
        it.water = it.amount / 1.5;
        it.width = 1.5;
      });
      placeGlasses(t.items);
      setTimeout(guides, 900);
      return T.helpPour;
    }
    guides();
    return T.helpLines;
  }
  if (t.kind === "ordnen") {
    targets[t.order[t.next]].classList.add("hint");
    return "";
  }
  // Balances: an arrow under the side that went down.
  const pairs = t.kind === "kette" ? t.scales : [t.items];
  t.scaleEls.forEach(({ panEls }, k) => {
    const [a, b] = pairs[k];
    panEls[b.kg > a.kg ? 1 : 0].classList.add("down");
  });
  if (t.kind === "kette") {
    const [h, m, s] = [...t.items].sort((x, y) => y.kg - x.kg);
    return `${T.heavierThan(h.name, m.name)} ${T.heavierThan(m.name, s.name)}`;
  }
  return "";
}

/** Dashed lines at the end of every pencil, the top of every tower, the water in every glass. */
function guides() {
  field.querySelectorAll(".guide").forEach((g) => g.remove());
  const box = field.getBoundingClientRect();
  for (const b of targets) {
    if (b.disabled) continue;
    const thing = b.querySelector(".pencil, .tower, .water");
    if (!thing) continue;
    const r = thing.getBoundingClientRect();
    const g = el("span", "guide " + (task.kind === "lang" || task.what === "lang" ? "v" : "h"));
    if (g.classList.contains("v")) g.style.left = `${r.right + 26 - box.left}px`; // + the sharpened tip
    else g.style.top = `${r.top - box.top}px`;
    field.append(g);
  }
}

// ---------- Right and wrong

/** How many wrong answers before the help: two, but with only two things one is enough. */
function helpAfter() {
  const t = task;
  const choices = t.kind === "ordnen" ? 3 : t.items.length;
  return Math.min(2, choices - 1);
}

async function miss(hint) {
  play.answer(false);
  sound.wrong();
  misses++;
  locked = true;
  let text = hint;
  if (misses >= helpAfter() && !helped) text = `${hint} ${help()}`.trim();
  await say(oops(text));
  locked = false;
}

function rightText() {
  const t = task;
  const it = t.items[t.answer];
  if (t.kind === "waage") {
    const other = t.items[1 - t.answer];
    return t.dir === "more" ? T.heavierThan(it.name, other.name) : T.lighterThan(it.name, other.name);
  }
  if (t.kind === "trick") return it.kg === 2 ? T.smallHeavy(it.name) : T.bigLight(it.name);
  if (t.kind === "kette") return t.dir === "more" ? T.heaviest(it.name) : T.lightest(it.name);
  return T.rightSays(t.kind, t.dir, t.items.length > 2);
}

async function right(text) {
  locked = true;
  play.answer(true);
  if (task.kind !== "ordnen") targets[task.answer].classList.add("right", "bounce");
  sound.right();
  play.solved();
  stars++;
  drawStars();
  await Promise.all([say(cheer(text ?? rightText())), wait(1600)]);
  setTimeout(next, 300);
}

/** The next task, or the trophy after five stars. */
function next() {
  if (stars >= STARS_PER_GAME) finish();
  else newRound();
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

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});
window.addEventListener("resize", () => field.querySelector(".guide") && guides());

drawStars();
show("start");
