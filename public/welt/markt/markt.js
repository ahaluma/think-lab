// The map of the market (Rechen-Welt): four stands around the market square.
//   Obststand ➕ plus · Brotstand ➖ minus · Eierstand ✖️ times · Packtisch ➗ divide
//   Marktplatz 🧺 in the middle: all four together, in little stories.
// A stand has four summits, the number ranges up to 10, 20, 100 and 1000. All four are open from
// the start; the stand suggests the smallest one without its flag. A summit has five stars, one per
// perspective. The market square opens when plus and minus have finished "up to 10".
//
//   /welt/markt/                 the market
//   /welt/markt/?o=plus&r=20     with this stand and summit open
//   /welt/markt/?o=platz         with the market square open

import { sound, icons, say } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as profiles from "../../shared/profiles.js";
import * as markt from "./record.js";
import { OPS, RANGES, STEPS } from "./tasks.js";
import { STAGES } from "./stories.js";
import * as record from "../frame/record.js";

const T = await texts(import.meta.url);
fill(T);
document.title = `${T.title} · AnkaPlay`;
const $ = (id) => document.getElementById(id);
const SVG = "http://www.w3.org/2000/svg";
const kid = profiles.current();
const voiceOn = kid?.readAloud !== false;
const ICON = { sehen: "👁️", machen: "✋", forschen: "🔍", anwenden: "🔑", pruefen: "✅" };

let lastText = "";
/** The map speaks (it has no numbers above 20). */
function tell(text, loud = true) {
  $("caption").textContent = text;
  lastText = loud ? text : "";
  $("hear").hidden = !loud || !voiceOn;
  if (loud && voiceOn) say(text);
}

$("home").innerHTML = icons.home;
$("hear").innerHTML = icons.speaker;
$("hear").addEventListener("click", () => lastText && say(lastText));

const node = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};
const text = (x, y, content, attrs = {}, parent) => {
  const t = node("text", { x, y, "text-anchor": "middle", ...attrs }, parent);
  t.textContent = content;
  return t;
};

/** Where each stand stands, its awning colour and what lies on its table. */
const STANDS = {
  plus: { x: 70, y: 150, color: "#ff5a36", goods: "🍎🍐🍊" },
  minus: { x: 290, y: 150, color: "#ffc83a", goods: "🥖🥨🍞" },
  mal: { x: 70, y: 260, color: "#2456b8", goods: "🥚🥚🥚" },
  geteilt: { x: 290, y: 260, color: "#12a564", goods: "🛍️🛍️" },
};

function stand(op) {
  const { x, y, color, goods } = STANDS[op];
  const g = node("g", { class: "place stand", tabindex: 0, role: "button", "aria-label": T.stands[op] });
  node("rect", { x: x - 52, y: y - 46, width: 104, height: 92, fill: "transparent" }, g);
  // posts, table, awning with stripes
  node("path", { d: `M${x - 40} ${y - 22} V${y + 26} M${x + 40} ${y - 22} V${y + 26}`, stroke: "#1b2140", "stroke-width": 3 }, g);
  node("rect", { x: x - 46, y: y + 2, width: 92, height: 16, rx: 3, fill: "#c48a4e", stroke: "#1b2140", "stroke-width": 3 }, g);
  const awning = node("g", {}, g);
  for (let i = 0; i < 4; i++) node("rect", { x: x - 46 + i * 23, y: y - 36, width: 23, height: 16, fill: i % 2 ? "#fff" : color }, awning);
  node("rect", { x: x - 46, y: y - 36, width: 92, height: 16, fill: "none", stroke: "#1b2140", "stroke-width": 3 }, g);
  text(x, y - 1, goods, { "font-size": 17 }, g);
  // the sign of the operation, and the flags of the finished summits
  node("circle", { cx: x, cy: y - 46, r: 13, fill: "#fff", stroke: "#1b2140", "stroke-width": 3 }, g);
  text(x, y - 41, { plus: "+", minus: "−", mal: "·", geteilt: ":" }[op], { "font-size": 18, "font-weight": 900 }, g);
  const flags = RANGES.filter((r) => markt.flag(op, r)).length;
  if (flags) text(x + 30, y - 44, "🚩".repeat(flags), { "font-size": 11 }, g);
  text(x, y + 38, T.stands[op], { "font-size": 13, "font-weight": 800, class: "stand-name" }, g);
  const go = () => {
    sound.tap();
    openStand(op);
  };
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
  return g;
}

/** The market square in the middle: a well and a basket. Asleep until plus and minus have "up to 10". */
function platz() {
  const x = 180, y = 205;
  const open = markt.platzOpen();
  const g = node("g", { class: `place platz${open ? "" : " asleep"}`, tabindex: 0, role: "button", "aria-label": T.platz.name });
  node("ellipse", { cx: x, cy: y + 18, rx: 46, ry: 14, fill: "#8fd3ff", stroke: "#1b2140", "stroke-width": 3 }, g);
  node("rect", { x: x - 6, y: y - 22, width: 12, height: 38, fill: "#d9dde6", stroke: "#1b2140", "stroke-width": 3 }, g);
  node("circle", { cx: x, cy: y - 26, r: 9, fill: "#8fd3ff", stroke: "#1b2140", "stroke-width": 3 }, g);
  text(x + 30, y + 2, "🧺", { "font-size": 24 }, g);
  const won = STAGES.filter((s) => markt.platzWon(s)).length;
  if (won) text(x - 30, y, `${num(won)}⭐`, { "font-size": 12, "font-weight": 800 }, g);
  text(x, y + 52, T.platz.name, { "font-size": 13, "font-weight": 800, class: "stand-name" }, g);
  if (!open) text(x - 34, y - 20, "💤", { "font-size": 16 }, g);
  const go = () => {
    sound.tap();
    openPlatz();
  };
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
  return g;
}

/** The money stand at the front: euro coins and notes. Its rounds are the world frame's (idea "geld"). */
function geldStand() {
  const x = 180, y = 318;
  const g = node("g", { class: "place stand geld", tabindex: 0, role: "button", "aria-label": T.geld.name });
  node("rect", { x: x - 60, y: y - 40, width: 120, height: 80, fill: "transparent" }, g);
  node("rect", { x: x - 50, y: y - 10, width: 100, height: 26, rx: 4, fill: "#c48a4e", stroke: "#1b2140", "stroke-width": 3 }, g);
  node("rect", { x: x - 24, y: y - 34, width: 48, height: 24, rx: 4, fill: "#d9dde6", stroke: "#1b2140", "stroke-width": 3 }, g);
  text(x, y - 16, T.geld.sign ?? "€", { "font-size": 16, "font-weight": 900 }, g);
  text(x - 30, y + 8, "🪙", { "font-size": 15 }, g);
  text(x + 30, y + 8, "💶", { "font-size": 15 }, g);
  const grown = record.grown("geld");
  if (grown) text(x + 52, y - 26, "🌼", { "font-size": 12 }, g);
  text(x, y + 34, T.geld.name, { "font-size": 13, "font-weight": 800, class: "stand-name" }, g);
  const go = () => {
    sound.tap();
    openGeld();
  };
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
  return g;
}

for (const op of OPS) $("stands").append(stand(op));
$("stands").append(platz());
$("stands").append(geldStand());

function openGeld() {
  $("panelTitle").textContent = T.geld.name;
  $("summits").innerHTML = "";
  $("summitNote").textContent = "";
  const list = $("persp");
  list.innerHTML = "";
  list.hidden = false;
  const next = record.suggest("geld");
  const MARK = { new: "", played: "🌱", understood: "🌼" };
  for (const p of markt.PERSPECTIVES) {
    const state = record.state("geld", p);
    const a = document.createElement("a");
    a.href = `/welt/spiel/?i=geld&p=${p}`;
    a.className = `${state}${p === next ? " next pulse" : ""}`;
    a.setAttribute("aria-label", T.perspectives[p]);
    a.innerHTML = `<span class="p-icon">${ICON[p]}</span><span class="p-name">${T.perspectives[p]}</span><span class="p-state">${MARK[state] ?? ""}</span>`;
    list.append(a);
  }
  $("panel").hidden = false;
  $("panel").scrollIntoView({ block: "nearest", behavior: "smooth" });
  history.replaceState(null, "", "?o=geld");
  tell(T.geld.pick);
}

// ---------- A stand: four summits, then five perspectives

function openStand(op, range = markt.suggestRange(op)) {
  $("panelTitle").textContent = T.stands[op];
  const row = $("summits");
  row.innerHTML = "";
  for (const r of RANGES) {
    const b = document.createElement("button");
    b.type = "button";
    const stars = markt.stars(op, r);
    b.className = `summit${r === range ? " on" : ""}${markt.flag(op, r) ? " flag" : ""}${r <= 20 ? " loud" : ""}`;
    b.innerHTML = `<span class="peak" aria-hidden="true">${markt.flag(op, r) ? "🚩" : "⛰️"}</span><strong>${T.summit(num(r))}</strong><small>${"⭐".repeat(stars)}${"☆".repeat(5 - stars)}</small>`;
    b.setAttribute("aria-label", `${T.summit(num(r))} · ${T.starsOf(num(stars))}`);
    b.addEventListener("click", () => {
      sound.tap();
      openStand(op, r);
    });
    row.append(b);
  }
  const step = markt.step(op, range);
  const ids = STEPS[op][range];
  const where = markt.flag(op, range)
    ? T.flagDone
    : step >= ids.length
      ? T.stepMixed
      : T.stepNow(T.steps[op][ids[step]], num(step + 1), num(ids.length + 1));
  $("summitNote").textContent = `${range <= 20 ? "🔊 " : ""}${where}`;
  const list = $("persp");
  list.innerHTML = "";
  list.hidden = false;
  const next = markt.suggest(op, range);
  for (const p of markt.PERSPECTIVES) {
    const won = markt.won(op, range, p);
    const a = document.createElement("a");
    a.href = `/welt/markt/stand/?op=${op}&r=${range}&p=${p}`;
    a.className = `${won ? "won" : ""}${p === next && !won ? " next pulse" : ""}`;
    a.setAttribute("aria-label", `${T.perspectives[p]}${won ? " · ⭐" : ""}`);
    a.innerHTML = `<span class="p-icon">${ICON[p]}</span><span class="p-name">${T.perspectives[p]}</span><span class="p-state">${won ? "⭐" : ""}</span>`;
    list.append(a);
  }
  $("panel").hidden = false;
  $("panel").scrollIntoView({ block: "nearest", behavior: "smooth" });
  history.replaceState(null, "", `?o=${op}&r=${range}`);
  tell(range <= 20 ? T.pickWay(T.stands[op], num(range)) : T.pickWayQuiet, range <= 20);
}

// ---------- The market square: five stages

function openPlatz() {
  $("panelTitle").textContent = T.platz.name;
  const row = $("summits");
  row.innerHTML = "";
  $("persp").hidden = true;
  history.replaceState(null, "", "?o=platz");
  if (!markt.platzOpen()) {
    $("summitNote").textContent = T.platz.closed;
    $("panel").hidden = false;
    tell(T.platz.closed);
    return;
  }
  const next = STAGES.find((s) => !markt.platzWon(s)) ?? 1;
  for (const s of STAGES) {
    const a = document.createElement("a");
    const won = markt.platzWon(s);
    a.className = `summit stage${won ? " flag" : ""}${s === next && !won ? " on pulse" : ""}`;
    a.href = `/welt/markt/stand/?platz=${s}`;
    a.innerHTML = `<span class="peak" aria-hidden="true">${won ? "⭐" : "🧺"}</span><strong>${T.platz.stage(num(s))}</strong><small>${T.platz.stageNote[s]}</small>`;
    row.append(a);
  }
  const ops = Object.keys(markt.allowed()).map((op) => T.stands[op]).join(", ");
  $("summitNote").textContent = T.platz.uses(ops);
  $("panel").hidden = false;
  $("panel").scrollIntoView({ block: "nearest", behavior: "smooth" });
  tell(T.platz.pick);
}

const params = new URLSearchParams(location.search);
const o = params.get("o");
if (OPS.includes(o)) openStand(o, RANGES.includes(Number(params.get("r"))) ? Number(params.get("r")) : undefined);
else if (o === "platz") openPlatz();
else if (o === "geld") openGeld();
else {
  $("caption").textContent = T.whereTo;
  lastText = T.whereTo;
}
