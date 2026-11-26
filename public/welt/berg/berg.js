// The map of the thinking mountain (Denk-Berg): a path from the foot to the top with twelve camps
// (MOUNTAIN in frame/ideas.js). Each camp carries one thinking tool for Mathe-Olympiade problems.
// An awake camp opens its five perspectives; a camp that is still asleep says so. The rounds are the
// same as in the nature world (welt/spiel/), so record.js, the cards and the parents' report work as there.
//
//   /welt/berg/          the mountain
//   /welt/berg/?o=zaun   the mountain with this camp open

import { sound, icons } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as profiles from "../../shared/profiles.js";
import * as record from "../frame/record.js";
import { mount, tell, again } from "../frame/voice.js";
import { MOUNTAIN, PERSPECTIVES, CARDS } from "../frame/ideas.js";

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
 *  grows on rock and snow; those camps will get lanterns. */
const FLOWER_SPOTS = { zaun: [[62, 420], [140, 420], [48, 434], [156, 436], [120, 432], [84, 438], [176, 424], [34, 420], [196, 436], [104, 444]] };
const FLOWER_COLORS = ["#e8488a", "#ffc83a", "#fff", "#ff5a36"];

const kid = profiles.current();
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
  g.classList.toggle("asleep", !c.awake);
  node("rect", { x: x - 22, y: y - 30, width: 44, height: 40, fill: "transparent" }, g);
  node("path", { d: `M${x - 13} ${y + 2} L${x} ${y - 20} L${x + 13} ${y + 2}Z`, fill: c.awake ? "#ff5a36" : "#d9dde6", stroke: "#1b2140", "stroke-width": 3, "stroke-linejoin": "round" }, g);
  node("path", { d: `M${x} ${y - 20} L${x - 4} ${y + 2} L${x + 4} ${y + 2}Z`, fill: "#1b2140" }, g);
  if (c.id === "zaun") {
    const fence = node("g", { stroke: "#1b2140", "stroke-width": 2 }, g);
    for (const dx of [18, 28, 38]) node("rect", { x: x + dx, y: y - 12, width: 4, height: 14, fill: "#a8703f" }, fence);
    node("rect", { x: x + 18, y: y - 9, width: 24, height: 3, fill: "#c48a4e" }, fence);
    node("rect", { x: x + 18, y: y - 3, width: 24, height: 3, fill: "#c48a4e" }, fence);
    const hen = node("text", { x: x - 36, y: y + 4, "font-size": 16 }, g);
    hen.textContent = "🐔";
  }
  if (c.awake) {
    const sign = node("g", { class: "play-sign", transform: `translate(${x} ${y - 34})` }, g);
    const inner = node("g", {}, sign);
    node("circle", { r: 12, fill: "#ffc83a", stroke: "#1b2140", "stroke-width": 3 }, inner);
    node("path", { d: "M-4 -6 L7 0 L-4 6Z", fill: "#1b2140" }, inner);
  }
  const go = () => {
    sound.tap();
    if (!c.awake) {
      $("ways").hidden = true;
      tell(`${B.camps[c.id]}. ${B.asleep}`);
      return;
    }
    openCamp(c);
  };
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
  return g;
}

for (const c of MOUNTAIN) $("camps").append(camp(c));
{
  const summit = $("summit");
  summit.setAttribute("aria-label", B.camps.gipfel);
  const go = () => {
    sound.tap();
    $("ways").hidden = true;
    tell(`${B.camps.gipfel}. ${B.asleep}`);
  };
  summit.addEventListener("click", go);
  summit.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && go());
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

// ---------- The animal waits at the highest awake camp. Tap = play there.

const awake = MOUNTAIN.filter((c) => c.awake);
const here = awake.at(-1);
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
const asked = awake.find((c) => c.id === new URLSearchParams(location.search).get("o"));
if (asked) openCamp(asked);

navigator.serviceWorker?.register("/sw.js").catch(() => {});
