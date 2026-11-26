// Builds the start page from catalog.js: one row of game tiles per category.
// With children (shared/profiles.js): first "Wer spielt?", then the games of that child.
// Each child sees the games that fit their age, or that the parents switched on (shared/fit.js).
import { CATEGORIES, gamesIn } from "./catalog.js";
import { LANGS, lang, setLang, texts, fill, local } from "./shared/i18n.js";
import { icons, say } from "./shared/kit.js";
import * as profiles from "./shared/profiles.js";
import { visible } from "./shared/fit.js";

const T = await texts();
fill(T);
const $ = (id) => document.getElementById(id);
$("parentsIcon").outerHTML = icons.parents; // an adult and a child, plus the word "Eltern"

// ---------- Language switch (only when there is more than one language)

const langs = $("langs");
if (Object.keys(LANGS).length > 1) {
  for (const [code, info] of Object.entries(LANGS)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lang-btn" + (code === lang ? " on" : "");
    b.textContent = info.flag;
    b.setAttribute("aria-label", info.name);
    b.setAttribute("aria-pressed", String(code === lang));
    b.addEventListener("click", () => setLang(code));
    langs.append(b);
  }
}

// ---------- Who is playing?

// The picker shows when asked for (/?wer, from the child button in a game), or once per visit
// when there are several children. One child: straight to the games.
const SEEN = "thinklab:picked";
function pickedThisVisit() {
  try {
    return sessionStorage.getItem(SEEN) === "1";
  } catch {
    return false;
  }
}
function rememberPicked() {
  try {
    sessionStorage.setItem(SEEN, "1");
  } catch {
    /* private mode: the picker just shows again */
  }
}

function showKid() {
  const kid = profiles.current();
  const chip = $("kid");
  chip.hidden = !kid;
  if (!kid) return;
  chip.innerHTML = "";
  const animal = document.createElement("span");
  animal.className = "who-animal";
  animal.setAttribute("aria-hidden", "true");
  animal.textContent = kid.animal;
  chip.append(animal);
  if (kid.name) {
    const name = document.createElement("span");
    name.className = "who-name";
    name.textContent = kid.name;
    chip.append(name);
  }
  chip.setAttribute("aria-label", `${kid.name || kid.animal} · ${T.switchKid}`);
}

function showPicker(on) {
  $("picker").hidden = !on;
  $("categories").hidden = on;
  $("world").hidden = on;
  $("kid").hidden = on || !profiles.current();
  document.querySelector(".hub-head").hidden = on;
  if (on) say(T.whoPlays);
}

function drawPicker() {
  const list = $("kids");
  list.innerHTML = "";
  for (const kid of profiles.all()) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tile kid pop";
    const animal = document.createElement("span");
    animal.className = "tile-icon";
    animal.setAttribute("aria-hidden", "true");
    animal.textContent = kid.animal;
    const name = document.createElement("span");
    name.className = "tile-name";
    name.textContent = kid.name || "…";
    b.append(animal, name);
    b.setAttribute("aria-label", kid.name || kid.animal);
    b.addEventListener("click", () => {
      profiles.choose(kid.id);
      rememberPicked();
      history.replaceState(null, "", "/");
      showKid();
      drawGames();
      showPicker(false);
      if (kid.name) say(kid.name);
    });
    li.append(b);
    list.append(li);
  }
}

const kids = profiles.all();
$("addKids").hidden = kids.length > 0;
showKid();
if (kids.length > 0) {
  drawPicker();
  const asked = new URLSearchParams(location.search).has("wer");
  if (asked || (kids.length > 1 && !pickedThisVisit())) showPicker(true);
}

// ---------- Categories and game tiles

function drawGames() {
  const root = $("categories");
  root.innerHTML = "";
  const kid = profiles.current();

  for (const category of CATEGORIES) {
    const games = gamesIn(category.id).filter((g) => visible(g, kid));
    if (games.length === 0) continue;

    const section = document.createElement("section");
    section.className = "category";
    const h2 = document.createElement("h2");
    h2.textContent = local(category.name);
    const list = document.createElement("ul");
    list.className = "tiles";
    list.setAttribute("aria-label", local(category.name));

    for (const game of games) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "tile pop";
      a.href = `/games/${game.id}/`;
      a.style.background = game.color;

      const icon = document.createElement("span");
      icon.className = "tile-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = game.icon;

      const name = document.createElement("span");
      name.className = "tile-name";
      name.textContent = local(game.name);

      a.append(icon, name);
      li.append(a);
      list.append(li);
    }

    section.append(h2, list);
    root.append(section);
  }
}

drawGames();
