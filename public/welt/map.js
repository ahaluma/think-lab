// The map of the new world: six places in one landscape. A place with something to play is awake,
// the others sleep. The child's animal stands at the place where the next activity is; a tap on it
// starts that activity. A tap on a place opens its five perspectives.
//
//   /welt/          the map
//   /welt/?o=teile  the map with this place open (a place id from frame/ideas.js)

import { sound, icons } from "../shared/kit.js";
import { texts, fill } from "../shared/i18n.js";
import * as profiles from "../shared/profiles.js";
import * as record from "./frame/record.js";
import { mount, tell, again } from "./frame/voice.js";
import { PLACES, PERSPECTIVES, CARDS } from "./frame/ideas.js";
import { GAMES } from "../catalog.js";
import { local } from "../shared/i18n.js";

const T = await texts(import.meta.url);
fill(T);
document.title = T.title;
const $ = (id) => document.getElementById(id);
mount($("caption"));
$("home").innerHTML = icons.home;
$("hear").innerHTML = icons.speaker;
$("hear").addEventListener("click", again);

const SVG = "http://www.w3.org/2000/svg";
const STATE_MARK = { new: "", played: "🌱", understood: "🌼" };
// Where flowers grow at each place, one for every finished round of its idea (up to 12).
const FLOWER_SPOTS = {
  teile: [[30, 414], [128, 416], [18, 396], [142, 396], [44, 372], [112, 366], [146, 376], [10, 416], [100, 420], [60, 420], [132, 356], [26, 356]],
  muster: [[244, 290], [344, 292], [252, 274], [338, 270], [304, 296], [240, 256], [348, 250], [276, 296], [326, 296], [236, 236], [350, 230], [258, 292]],
  gruppen: [[24, 262], [100, 250], [36, 282], [90, 290], [18, 244], [142, 252], [150, 292], [70, 292], [112, 298], [30, 298], [148, 232], [12, 226]],
  zahl: [[246, 346], [282, 356], [312, 344], [338, 334], [258, 326], [300, 326], [336, 356], [228, 360], [270, 340], [322, 330], [296, 346], [244, 334]],
};
const FLOWER_COLORS = ["#e8488a", "#ffc83a", "#fff", "#ff5a36"];
// Where the yellow play sign of an awake place stands: "here you can play".
const SIGN_AT = { teile: [40, 338], zahlen: [326, 366], regeln: [338, 200], gruppen: [120, 196] };
// Where the child's animal stands at each place.
const WALKER_AT = { teile: [120, 372], zahlen: [222, 338], regeln: [222, 262], gruppen: [118, 250] };

const kid = profiles.current();
const awake = PLACES.filter((p) => p.awake);
const placeOf = (id) => awake.find((p) => p.id === id);
const ideaOf = (place) => place.ideas[0]; // one idea per place so far

// ---------- Places

/** A round yellow sign with a play triangle. It pulses, so an awake place is seen at once. */
function playSign(x, y) {
  const g = document.createElementNS(SVG, "g");
  g.setAttribute("class", "play-sign");
  g.setAttribute("transform", `translate(${x} ${y})`);
  const inner = document.createElementNS(SVG, "g");
  const disc = document.createElementNS(SVG, "circle");
  disc.setAttribute("r", 15);
  disc.setAttribute("fill", "#ffc83a");
  disc.setAttribute("stroke", "#1b2140");
  disc.setAttribute("stroke-width", 3);
  const arrow = document.createElementNS(SVG, "path");
  arrow.setAttribute("d", "M-5 -8 L9 0 L-5 8Z");
  arrow.setAttribute("fill", "#1b2140");
  inner.append(disc, arrow);
  g.append(inner);
  return g;
}

for (const g of document.querySelectorAll(".place")) {
  const place = PLACES.find((p) => p.id === g.dataset.o);
  g.setAttribute("aria-label", T.places[place.id]);
  g.classList.toggle("asleep", !place.awake);
  const go = () => {
    sound.tap();
    if (!place.awake) {
      $("ways").hidden = true;
      tell(T.asleep);
      return;
    }
    openPlace(place);
  };
  if (place.awake && SIGN_AT[place.id]) g.append(playSign(...SIGN_AT[place.id]));
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") go();
  });
}

// ---------- Flowers: what has grown at each place

for (const g of document.querySelectorAll(".grown")) {
  const spots = FLOWER_SPOTS[g.dataset.i] || [];
  spots.slice(0, Math.min(record.grown(g.dataset.i), spots.length)).forEach(([x, y], i) => {
    const c = document.createElementNS(SVG, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", 6);
    c.setAttribute("fill", FLOWER_COLORS[i % FLOWER_COLORS.length]);
    c.setAttribute("stroke", "#1b2140");
    c.setAttribute("stroke-width", 2);
    g.append(c);
  });
}

// ---------- The perspectives of an open place

function openPlace(place) {
  const idea = ideaOf(place);
  const suggested = record.suggest(idea);
  $("waysTitle").textContent = T.places[place.id];
  const list = $("persp");
  list.innerHTML = "";
  for (const p of PERSPECTIVES) {
    const state = record.state(idea, p.id);
    const a = document.createElement("a");
    a.href = `/welt/spiel/?i=${idea}&p=${p.id}`;
    a.className = `${state}${p.id === suggested ? " next pulse" : ""}`;
    a.setAttribute("aria-label", `${T.perspectives[p.id]} · ${T.states[state]}`);
    const icon = document.createElement("span");
    icon.className = "p-icon";
    icon.textContent = p.icon;
    const name = document.createElement("span");
    name.className = "p-name";
    name.textContent = T.perspectives[p.id];
    const mark = document.createElement("span");
    mark.className = "p-state";
    mark.textContent = STATE_MARK[state];
    a.append(icon, name, mark);
    const li = document.createElement("li");
    li.append(a);
    list.append(li);
  }
  // Games that live at this place as they are, to play together (the memory game at the meadow).
  const extra = $("games");
  extra.innerHTML = "";
  for (const id of place.games || []) {
    const game = GAMES.find((g) => g.id === id);
    if (!game) continue;
    const a = document.createElement("a");
    a.href = `/games/${game.id}/?welt`;
    a.className = "place-game";
    const icon = document.createElement("span");
    icon.className = "p-icon";
    icon.textContent = game.icon;
    const name = document.createElement("span");
    name.className = "g-name";
    name.textContent = local(game.name);
    const two = document.createElement("span");
    two.className = "g-two";
    two.textContent = "👧🧑";
    two.setAttribute("aria-label", T.together2);
    a.append(icon, name, two);
    const li = document.createElement("li");
    li.append(a);
    extra.append(li);
  }
  extra.hidden = !extra.childElementCount;
  $("ways").hidden = false;
  $("ways").scrollIntoView({ block: "nearest", behavior: "smooth" });
  tell(T.pickWay);
}

// ---------- The animal: it stands at the place where the child has played least. Tap = play there.

const next = [...awake].sort((a, b) => record.grown(ideaOf(a)) - record.grown(ideaOf(b)))[0];
const walker = $("walker");
walker.textContent = kid?.animal || "🐰";
walker.setAttribute("aria-label", T.comeHere);
const [wx, wy] = WALKER_AT[next.id] || WALKER_AT.teile;
walker.setAttribute("x", wx);
walker.setAttribute("y", wy);
const start = () => {
  const idea = ideaOf(next);
  location.href = `/welt/spiel/?i=${idea}&p=${record.suggest(idea)}`;
};
walker.addEventListener("click", start);
walker.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") start();
});

// ---------- Thinking cards the child has collected

const got = record.all().cards;
for (const [id, icon] of Object.entries(CARDS)) {
  const li = document.createElement("li");
  li.textContent = icon;
  li.title = T.cards[id].name;
  li.setAttribute("aria-label", T.cards[id].name);
  if (got[id]) li.className = "got";
  $("cards").append(li);
}

$("caption").textContent = T.whereTo;
const asked = placeOf(new URLSearchParams(location.search).get("o"));
if (asked) openPlace(asked);

// Works without a connection after the first visit (sw.js). Nothing is sent anywhere.
navigator.serviceWorker?.register("/sw.js").catch(() => {});
