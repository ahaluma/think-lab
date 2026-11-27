// The town (Stadt): the world for school children (6 to 10). Five places along one street
// (TOWN in frame/ideas.js): the station (numbers in order, the number line), the flower shop (tens and
// ones), the market (calculating, its own world in welt/markt/), the workshop (shapes and measuring)
// and the weather station (time and data). A place with something to play is awake, the others sleep. The rounds are the same as in the
// nature world (welt/spiel/), so record.js, the cards and the parents' report work as there.
//
//   /welt/stadt/              the town
//   /welt/stadt/?o=blumen     the town with this place open

import { sound, icons } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as profiles from "../../shared/profiles.js";
import * as record from "../frame/record.js";
import { mount, tell, again } from "../frame/voice.js";
import { TOWN, PERSPECTIVES } from "../frame/ideas.js";

const T = await texts(new URL("../map.js", import.meta.url).href); // welt/lang/<language>.js
const S = T.stadt;
fill(T);
document.title = `${S.title} · AnkaPlay`;
const $ = (id) => document.getElementById(id);
mount($("caption"));
$("home").innerHTML = icons.home;
$("hear").innerHTML = icons.speaker;
$("hear").addEventListener("click", again);
$("map").setAttribute("aria-label", S.mapLabel);

const STATE_MARK = { new: "", played: "🌱", understood: "🌼" };
/** Where the child's animal stands at a place that has rounds to play. */
const WALKER_AT = { bahnhof: [56, 236], blumen: [166, 236] };
const kid = profiles.current();

for (const g of document.querySelectorAll(".place")) {
  const place = TOWN.find((p) => p.id === g.dataset.o);
  g.setAttribute("aria-label", S.places[place.id]);
  g.classList.toggle("asleep", !place.awake);
  const go = () => {
    sound.tap();
    if (!place.awake) {
      $("ways").hidden = true;
      tell(S.asleep);
      return;
    }
    if (place.href) {
      location.href = place.href;
      return;
    }
    openPlace(place);
  };
  g.addEventListener("click", go);
  g.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") go();
  });
}

function openPlace(place) {
  const idea = place.ideas[0];
  const suggested = record.suggest(idea);
  $("waysTitle").textContent = S.places[place.id];
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
  $("ways").hidden = false;
  $("ways").scrollIntoView({ block: "nearest", behavior: "smooth" });
  tell(T.pickWay);
}

// ---------- The animal: at the place with rounds to play. Tap = the suggested round there.

const next = TOWN.find((p) => p.awake && p.ideas);
const walker = $("walker");
walker.textContent = kid?.animal || "🐰";
walker.setAttribute("aria-label", T.comeHere);
const [wx, wy] = WALKER_AT[next.id];
walker.setAttribute("x", wx);
walker.setAttribute("y", wy);
const start = () => {
  const idea = next.ideas[0];
  location.href = `/welt/spiel/?i=${idea}&p=${record.suggest(idea)}`;
};
walker.addEventListener("click", start);
walker.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") start();
});

// ---------- The doors: the thinking mountain, and back to the nature world

$("doorName").textContent = T.berg.door;
$("doorNote").textContent = T.berg.doorNote;
$("natureName").textContent = S.natureDoor;
$("natureNote").textContent = S.natureNote;

$("caption").textContent = S.whereTo;
const asked = TOWN.find((p) => p.awake && p.ideas && p.id === new URLSearchParams(location.search).get("o"));
if (asked) openPlace(asked);

navigator.serviceWorker?.register("/sw.js").catch(() => {});
