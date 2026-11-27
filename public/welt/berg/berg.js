// The map of the thinking mountain (Denk-Berg): a path from the foot to the top with twelve camps
// (MOUNTAIN in frame/ideas.js). Each camp carries one thinking tool for Mathe-Olympiade problems.
// A camp opens when the camps it needs are mastered (record.mastered). Only open camps are drawn:
// above the highest one the mountain is in fog, so a child does not know how many camps there are
// until the top. A camp that appears for the first time is a surprise, with a keepsake picture to
// save (berg/keepsake.js). A mastered camp gets a lantern. The summit shows when every camp is mastered. The rounds are the
// same as in the nature world (welt/spiel/), so record.js, the cards and the parents' report work as there.
//
//   /welt/berg/          the mountain
//   /welt/berg/?o=zaun   the mountain with this camp open

import { sound, icons, celebrate } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as profiles from "../../shared/profiles.js";
import * as record from "../frame/record.js";
import { mount, tell, again } from "../frame/voice.js";
import { MOUNTAIN, PERSPECTIVES, CARDS } from "../frame/ideas.js";
import { store } from "../../shared/store.js";
import { keepsake } from "./keepsake.js";

const T = await texts(new URL("../map.js", import.meta.url).href); // welt/lang/<language>.js
const B = T.berg;
/** On the mountain the perspectives have their own names (the steps of a mathematician). */
const NAMES = B.perspectives ?? T.perspectives;
fill(T);
document.title = `${B.title} · AnkaPlay`;
const $ = (id) => document.getElementById(id);
mount($("caption"));
$("home").innerHTML = icons.home;
$("home").setAttribute("aria-label", B.toWorld);
$("hear").innerHTML = icons.speaker;
$("hear").addEventListener("click", again);
$("map").setAttribute("aria-label", B.mapLabel);

const SVG = "http://www.w3.org/2000/svg";
const STATE_MARK = { new: "", played: "🌱", understood: "🌼" };
/** Where each camp stands on the path (the corners of the path in index.html). */
const AT = {
  zaun: [100, 404], haken: [228, 386], huetten: [270, 348],
  vorrat: [150, 326], ameisen: [112, 296], waage: [220, 282],
  stall: [246, 242], tanz: [152, 226], fels: [132, 196],
  socken: [206, 172], steine: [214, 138], mauer: [166, 116],
};
/** Flowers at the foot, one for every finished round of the first camp (up to 10). Higher up nothing
 *  grows on rock and snow; there a mastered camp gets a lantern (every mastered camp does). */
const FLOWER_SPOTS = { zaun: [[62, 420], [140, 420], [48, 434], [156, 436], [120, 432], [84, 438], [176, 424], [34, 420], [196, 436], [104, 444]] };
const FLOWER_COLORS = ["#e8488a", "#ffc83a", "#fff", "#ff5a36"];

const kid = profiles.current();
const byId = Object.fromEntries(MOUNTAIN.map((c) => [c.id, c]));
/** Built: the camp has its idea. Mastered: three perspectives understood (record.mastered). */
const built = (c) => Boolean(c.ideas?.length);
const isMastered = (c) => built(c) && c.ideas.every((idea) => record.mastered(idea));
/** The camps still missing before this one opens (empty: open). */
const missing = (c) => (c.needs ?? []).map((id) => byId[id]).filter((n) => !isMastered(n));
const isOpen = (c) => built(c) && !missing(c).length;
/** The camps a child can see: the open ones. All the others are hidden in the fog. */
const visible = MOUNTAIN.filter(isOpen);
const top = visible.at(-1);
const summitOpen = MOUNTAIN.every(isMastered);
const node = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};

/** A tent: the camp. The first camp also has its little fence and a hen. */
function camp(c) {
  const [x, y] = AT[c.id];
  const g = node("g", { class: "place camp", tabindex: 0, role: "button", "aria-label": B.camps[c.id] });
  const open = isOpen(c);
  g.classList.toggle("asleep", !open);
  node("rect", { x: x - 22, y: y - 30, width: 44, height: 40, fill: "transparent" }, g);
  node("path", { d: `M${x - 13} ${y + 2} L${x} ${y - 20} L${x + 13} ${y + 2}Z`, fill: open ? "#ff5a36" : "#d9dde6", stroke: "#1b2140", "stroke-width": 3, "stroke-linejoin": "round" }, g);
  node("path", { d: `M${x} ${y - 20} L${x - 4} ${y + 2} L${x + 4} ${y + 2}Z`, fill: "#1b2140" }, g);
  if (c.id === "zaun") {
    const fence = node("g", { stroke: "#1b2140", "stroke-width": 2 }, g);
    for (const dx of [18, 28, 38]) node("rect", { x: x + dx, y: y - 12, width: 4, height: 14, fill: "#a8703f" }, fence);
    node("rect", { x: x + 18, y: y - 9, width: 24, height: 3, fill: "#c48a4e" }, fence);
    node("rect", { x: x + 18, y: y - 3, width: 24, height: 3, fill: "#c48a4e" }, fence);
    const hen = node("text", { x: x - 36, y: y + 4, "font-size": 16 }, g);
    hen.textContent = "🐔";
  }
  if (isMastered(c)) {
    const light = node("text", { x: x + 16, y: y - 15, "font-size": 15, class: "lantern" }, g);
    light.textContent = "🏮";
  }
  if (open) {
    const sign = node("g", { class: "play-sign", transform: `translate(${x} ${y - 34})` }, g);
    const inner = node("g", {}, sign);
    node("circle", { r: 12, fill: "#ffc83a", stroke: "#1b2140", "stroke-width": 3 }, inner);
    node("path", { d: "M-4 -6 L7 0 L-4 6Z", fill: "#1b2140" }, inner);
  }
  const go = () => {
    sound.tap();
    openCamp(c);
  };
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
  return g;
}

for (const c of visible) $("camps").append(camp(c));

// ---------- The fog: everything above the highest open camp. Tap it: how to see further.
{
  const fogY = summitOpen ? -40 : AT[top.id][1] - 34;
  const fog = node("g", { class: "fog", tabindex: 0, role: "button", "aria-label": B.fogLabel });
  const sky = node("g", { "clip-path": "url(#hill)" }, fog);
  node("rect", { x: 0, y: 0, width: 360, height: Math.max(0, fogY), fill: "#eef2f6" }, sky);
  for (let x = -10; x <= 370; x += 34) node("ellipse", { cx: x, cy: fogY, rx: 26, ry: 13, fill: "#eef2f6", stroke: "#c9d2dc", "stroke-width": 2 }, fog);
  for (let x = 30; x <= 330; x += 60) node("ellipse", { cx: x, cy: fogY - 40, rx: 30, ry: 12, fill: "#f6f8fb", opacity: 0.9 }, sky);
  $("camps").before(fog);
  if (summitOpen) fog.style.display = "none";
  const go = () => {
    sound.tap();
    $("ways").hidden = true;
    // Every camp in sight mastered and still fog: the next camp is still being built.
    tell(visible.every(isMastered) ? B.fogBuilding : B.fog);
  };
  fog.addEventListener("click", go);
  fog.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
  // The summit (competition rounds, berg/gipfel/) shows only when every camp is mastered.
  const summit = $("summit");
  if (!summitOpen) summit.style.display = "none";
  summit.setAttribute("aria-label", B.camps.gipfel);
  const atTop = () => {
    sound.tap();
    location.href = "/welt/berg/gipfel/";
  };
  summit.addEventListener("click", atTop);
  summit.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && atTop());
}

// ---------- Flowers: what has grown at the foot

for (const [idea, spots] of Object.entries(FLOWER_SPOTS)) {
  const g = node("g", { class: "grown" }, $("mountain"));
  $("walker").before(g);
  spots.slice(0, record.grown(idea)).forEach(([x, y], i) => {
    node("circle", { cx: x, cy: y, r: 5, fill: FLOWER_COLORS[i % FLOWER_COLORS.length], stroke: "#1b2140", "stroke-width": 2 }, g);
  });
}

// ---------- The five perspectives of an open camp

function openCamp(c) {
  const idea = c.ideas[0];
  const suggested = record.suggest(idea);
  $("waysTitle").textContent = B.camps[c.id];
  const list = $("persp");
  list.innerHTML = "";
  for (const p of PERSPECTIVES) {
    const state = record.state(idea, p.id);
    const a = document.createElement("a");
    a.href = `/welt/spiel/?i=${idea}&p=${p.id}`;
    a.className = `${state}${p.id === suggested ? " next pulse" : ""}`;
    a.setAttribute("aria-label", `${NAMES[p.id]} · ${T.states[state]}`);
    const icon = document.createElement("span");
    icon.className = "p-icon";
    icon.textContent = p.icon;
    const name = document.createElement("span");
    name.className = "p-name";
    name.textContent = NAMES[p.id];
    const mark = document.createElement("span");
    mark.className = "p-state";
    mark.textContent = STATE_MARK[state];
    a.append(icon, name, mark);
    const li = document.createElement("li");
    li.append(a);
    list.append(li);
  }
  $("ways").hidden = false;
  $("ways").scrollIntoView({ block: "nearest", behavior: "smooth" });
  tell(B.pickWay);
}

// ---------- The animal waits at the highest open camp. Tap = play there.

const here = top;
const walker = $("walker");
walker.textContent = kid?.animal || "🐰";
walker.setAttribute("aria-label", T.comeHere);
walker.setAttribute("x", AT[here.id][0] + 46);
walker.setAttribute("y", AT[here.id][1] + 8);
const start = () => {
  const idea = here.ideas[0];
  location.href = `/welt/spiel/?i=${idea}&p=${record.suggest(idea)}`;
};
walker.addEventListener("click", start);
walker.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && start());

// ---------- Thinking cards: the tools in the backpack

const got = record.all().cards;
for (const [id, icon] of Object.entries(CARDS)) {
  const li = document.createElement("li");
  li.textContent = icon;
  li.title = T.cards[id].name;
  li.setAttribute("aria-label", T.cards[id].name);
  if (got[id]) li.className = "got";
  $("cards").append(li);
}

$("caption").textContent = B.whereTo;
const asked = visible.find((c) => c.id === new URLSearchParams(location.search).get("o"));
if (asked) openCamp(asked);

// ---------- A new camp: the surprise, and a keepsake to save (once per camp and child)

const SEEN = `berg:seen:${kid?.id || "guest"}`;
const seen = store.get(SEEN, ["zaun"]);
const fresh = visible.filter((c) => !seen.includes(c.id));
if (fresh.length) {
  store.set(SEEN, [...seen, ...fresh.map((c) => c.id)]);
  const c = fresh.at(-1);
  setTimeout(() => reveal(c), 600);
}

async function reveal(c) {
  const K = B.keep;
  const box = $("reached");
  const rank = visible.indexOf(c) + 1;
  const tools = visible.filter(isMastered).map((m) => B.tools[m.id]);
  const solved = MOUNTAIN.flatMap((m) => m.ideas ?? []).reduce((k, idea) => k + record.solved(idea), 0);
  const picture = keepsake({
    title: B.title,
    headline: K.headline(kid?.name || "", num(rank)),
    camp: B.camps[c.id].replace(/^[^:]*:\s*/, ""),
    lines: [...(tools.length ? [K.tools(tools)] : []), K.solved(num(solved))],
    date: new Date().toLocaleDateString(K.locale, { day: "numeric", month: "long", year: "numeric" }),
    brand: "AnkaPlay",
    animal: kid?.animal || "🐰",
    camps: visible.slice(0, rank).map((v) => AT[v.id]),
  });
  $("reachedTitle").textContent = K.title;
  $("reachedText").textContent = K.text(B.camps[c.id]);
  const img = $("reachedImg");
  img.src = picture.toDataURL("image/png");
  img.alt = K.alt;
  $("reachedSave").textContent = K.save;
  $("reachedSave").onclick = () => {
    sound.tap();
    const a = document.createElement("a");
    a.href = img.src;
    a.download = `denk-berg-${rank}.png`;
    a.click();
    tell(K.saved);
  };
  $("reachedClose").textContent = K.close;
  $("reachedClose").onclick = () => {
    sound.tap();
    box.hidden = true;
  };
  box.hidden = false;
  sound.win();
  celebrate();
  await tell(`${K.title} ${K.text(B.camps[c.id])} ${K.offer}`);
}

navigator.serviceWorker?.register("/sw.js").catch(() => {});
