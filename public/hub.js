// Builds the start page from the list in games.js.
import { GAMES } from "./games.js";

const list = document.getElementById("tiles");

for (const game of GAMES) {
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
  name.textContent = game.name;

  a.append(icon, name);
  li.append(a);
  list.append(li);
}
