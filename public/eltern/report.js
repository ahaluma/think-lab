// Parents' page: the children on this device (shared/profiles.js) and the progress report
// of one child (shared/progress.js). Ordered like the catalog: category → skill → game.
import { CATEGORIES, GAMES } from "../catalog.js";
import { texts, fill, local, lang, LANGS, num } from "../shared/i18n.js";
import { icons } from "../shared/kit.js";
import * as progress from "../shared/progress.js";
import * as profiles from "../shared/profiles.js";

const T = await texts(import.meta.url);
fill(T);
document.title = `${T.title} · AnkaPlay`;
const $ = (id) => document.getElementById(id);
$("home").innerHTML = icons.home;

// The child whose progress is shown: ?kind=<id>, or the child playing now.
const kids = profiles.all();
const shown = profiles.get(new URLSearchParams(location.search).get("kind")) || profiles.current();
const data = progress.all(shown?.id);
const kidName = (kid) => kid.name || T.noName;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** "2026-11-24" → a short local date like "24.11.2026". */
function showDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(LANGS[lang].voice);
}

// ---------- Children

function drawKids() {
  const list = $("kidList");
  list.innerHTML = "";
  $("kidsNote").textContent = kids.length ? T.kidsNote : T.noKids;
  for (const kid of kids) {
    const li = el("li", "kid-row");
    li.append(el("span", "kid-animal", kid.animal));
    const info = el("div", "kid-info");
    info.append(el("strong", "", kidName(kid)));
    info.append(el("span", "muted", profiles.complete(kid) ? T.years(num(kid.age)) : T.addNameAge));
    li.append(info);
    const edit = el("button", "btn small", T.edit);
    edit.type = "button";
    edit.addEventListener("click", () => openForm(kid));
    const del = el("button", "btn small", T.remove);
    del.type = "button";
    del.addEventListener("click", () => {
      if (!confirm(T.removeConfirm(kidName(kid)))) return;
      profiles.remove(kid.id);
      location.replace(location.pathname);
    });
    const buttons = el("div", "kid-buttons");
    buttons.append(edit, del);
    li.append(buttons);
    list.append(li);
  }
}

// The form for a new child or for changing one.
let editing = null; // id of the child being changed, null = new child
let animal = profiles.ANIMALS[0];

function drawAnimals() {
  const box = $("kidAnimals");
  box.innerHTML = "";
  for (const a of profiles.ANIMALS) {
    const b = el("button", "animal" + (a === animal ? " on" : ""), a);
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(a === animal));
    b.addEventListener("click", () => {
      animal = a;
      drawAnimals();
    });
    box.append(b);
  }
}

const ageSelect = $("kidAge");
for (let a = profiles.MIN_AGE; a <= profiles.MAX_AGE; a++) {
  const o = el("option", "", T.years(num(a)));
  o.value = a;
  ageSelect.append(o);
}

function openForm(kid) {
  editing = kid?.id ?? null;
  $("kidName").value = kid?.name ?? "";
  ageSelect.value = kid?.age ?? 5;
  // A new child gets an animal nobody else has yet.
  animal = kid?.animal ?? (profiles.ANIMALS.find((a) => !kids.some((k) => k.animal === a)) || profiles.ANIMALS[0]);
  drawAnimals();
  $("kidForm").hidden = false;
  $("kidAdd").hidden = true;
  $("kidName").focus();
}

function closeForm() {
  $("kidForm").hidden = true;
  $("kidAdd").hidden = false;
}

$("kidAdd").addEventListener("click", () => openForm(null));
$("kidCancel").addEventListener("click", closeForm);
$("kidSave").addEventListener("click", () => {
  const name = $("kidName").value.trim();
  if (!name) {
    $("kidName").focus();
    return;
  }
  const kid = { name, age: Number(ageSelect.value), animal };
  if (editing) profiles.update(editing, kid);
  else profiles.add(kid);
  location.reload();
});

drawKids();

// Tabs: whose progress is shown below (only with two or more children).
if (kids.length > 1) {
  for (const kid of kids) {
    const a = el("a", "kid-tab" + (kid.id === shown.id ? " on" : ""), `${kid.animal} ${kidName(kid)}`);
    a.href = `?kind=${kid.id}`;
    if (kid.id === shown.id) a.setAttribute("aria-current", "page");
    $("kidTabs").append(a);
  }
}
if (shown) $("progressOf").textContent = T.progressOf(kidName(shown));
$("progressOf").hidden = !shown;

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

$("reset").addEventListener("click", () => {
  if (confirm(shown ? T.resetConfirmKid(kidName(shown)) : T.resetConfirm)) {
    progress.reset(shown?.id);
    location.reload();
  }
});
