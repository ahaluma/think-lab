// Parents' page: shows the progress report saved on this device (shared/progress.js).
// Ordered like the catalog: category → skill → game.
import { CATEGORIES, GAMES } from "../catalog.js";
import { texts, fill, local, lang } from "../shared/i18n.js";
import { icons } from "../shared/kit.js";
import * as progress from "../shared/progress.js";

const T = await texts(import.meta.url);
fill(T);
document.title = `${T.title} · Think Lab`;
document.getElementById("home").innerHTML = icons.home;

const data = progress.all();

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** "2026-11-24" → a short local date like "24.11.2026". */
function showDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang);
}

// ---------- Last 14 days

const days = [];
for (let i = 13; i >= 0; i--) {
  const date = new Date();
  date.setDate(date.getDate() - i);
  const day = data.days[progress.today(date)] || { right: 0, wrong: 0, rounds: 0 };
  days.push({ date, ...day });
}
const most = Math.max(1, ...days.map((d) => d.right + d.wrong));

const bars = document.getElementById("bars");
for (const d of days) {
  const col = el("div", "bar");
  col.title = `${showDate(progress.today(d.date))}: ${d.right} / ${d.wrong}`;
  const stack = el("div", "stack");
  const wrong = el("div", "part wrong");
  wrong.style.height = (d.wrong / most) * 100 + "%";
  const right = el("div", "part right");
  right.style.height = (d.right / most) * 100 + "%";
  stack.append(wrong, right);
  col.append(stack, el("span", "day", T.weekdays[d.date.getDay()]));
  bars.append(col);
}

const t = days[days.length - 1];
document.getElementById("today").textContent = T.today(t.right, t.wrong, t.rounds);

// ---------- Category → skill → game

const root = document.getElementById("categories");

for (const category of CATEGORIES) {
  const section = el("section", "category");
  section.append(el("h2", "", local(category.name)));

  for (const skill of category.skills) {
    const games = GAMES.filter((g) => g.skill === `${category.id}/${skill.id}`);
    if (games.length === 0) continue;

    const box = el("div", "card skill");
    box.append(el("h3", "", local(skill.name)));

    for (const game of games) {
      const g = data.games[game.id];
      const row = el("div", "game");
      row.append(el("span", "game-icon", game.icon));

      const info = el("div", "game-info");
      info.append(el("strong", "", local(game.name)));

      if (!g) {
        info.append(el("span", "muted", T.notPlayed));
      } else {
        const answers = g.right + g.wrong;
        const percent = answers ? Math.round((g.right / answers) * 100) : 0;
        const meter = el("div", "meter");
        const fillBar = el("div", "meter-fill");
        fillBar.style.width = ((g.level + 1) / g.levels) * 100 + "%";
        meter.append(fillBar);
        info.append(
          el("span", "", T.level(g.level + 1, g.levels)),
          meter,
          el("span", "muted", T.stats(g.rounds, percent, g.last ? showDate(g.last) : "–")),
        );
      }
      row.append(info);
      box.append(row);
    }
    section.append(box);
  }

  if (section.childElementCount > 1) root.append(section);
}

// ---------- Reset

document.getElementById("reset").addEventListener("click", () => {
  if (confirm(T.resetConfirm)) {
    progress.reset();
    location.reload();
  }
});
