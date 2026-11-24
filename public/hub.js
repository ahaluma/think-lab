// Builds the start page from catalog.js: one row of game tiles per category.
import { CATEGORIES, gamesIn } from "./catalog.js";
import { LANGS, lang, setLang, texts, fill, local } from "./shared/i18n.js";
import { icons } from "./shared/kit.js";

const T = await texts();
fill(T);
document.getElementById("parents").innerHTML = icons.chart;

// ---------- Language switch (only when there is more than one language)

const langs = document.getElementById("langs");
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

// ---------- Categories and game tiles

const root = document.getElementById("categories");

for (const category of CATEGORIES) {
  const games = gamesIn(category.id);
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
