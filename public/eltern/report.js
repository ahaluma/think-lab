// Parents' page: the children on this device (shared/profiles.js) and the progress report
// of one child: first the new world (welt/frame/record.js), place by place, then the games
// (shared/progress.js), ordered like the catalog: category → skill → game.
// Each game has a switch: does this child see it on the start page? (shared/fit.js)
import { CATEGORIES, GAMES } from "../catalog.js";
import { texts, fill, local, lang, LANGS, num } from "../shared/i18n.js";
import { icons } from "../shared/kit.js";
import * as progress from "../shared/progress.js";
import * as profiles from "../shared/profiles.js";
import * as fit from "../shared/fit.js";
import * as record from "../welt/frame/record.js";
import { PERSPECTIVES } from "../welt/frame/ideas.js";

const T = await texts(import.meta.url);
const W = await texts(new URL("../welt/map.js", import.meta.url).href); // names of places, ideas, perspectives
fill(T);
document.title = `${T.title} · AnkaPlay`;
const $ = (id) => document.getElementById(id);
$("home").innerHTML = icons.home;

// The child whose progress is shown: ?kind=<id>, or the child playing now.
const kids = profiles.all();
const shown = profiles.get(new URLSearchParams(location.search).get("kind")) || profiles.current();
const data = progress.all(shown?.id);
const world = record.report(shown);
const kidName = (kid) => kid.name || T.noName;

// The levels of every game, for their labels ("Zählen bis 5").
const LEVELS = {};
await Promise.all(
  GAMES.map(async (g) => {
    LEVELS[g.id] = (await import(`../games/${g.id}/levels.js`)).LEVELS;
  }),
);

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
    info.append(el("span", "muted", profiles.complete(kid) ? T.years(num(profiles.age(kid))) : T.addNameAge));
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

// Age in years. It grows by itself: one year after it was entered, the child is one year older.
const ageSelect = $("kidAge");
for (let a = profiles.MIN_AGE; a <= profiles.MAX_AGE; a++) {
  const o = el("option", "", T.years(num(a)));
  o.value = a;
  ageSelect.append(o);
}

function openForm(kid) {
  editing = kid?.id ?? null;
  $("kidName").value = kid?.name ?? "";
  ageSelect.value = Math.min(profiles.MAX_AGE, profiles.age(kid) ?? 5);
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
  // Games and world together: an answer is an answer.
  const key = progress.today(date);
  const sum = { right: 0, wrong: 0, rounds: 0 };
  for (const day of [data.days[key], world.daily[key]]) for (const k in sum) sum[k] += day?.[k] || 0;
  days.push({ date, ...sum });
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

// ---------- The world: place → idea → five perspectives

const placeOfIdea = Object.fromEntries(world.ideas.map((i) => [i.id, i.place]));
/** "Zahlen bis 10", or for an idea without numbers its own words ("Stücke aus 3 Dingen"). */
const rangeLabel = (idea) => (T.worldRange[idea.id] || T.worldRange.numbers)(num(idea.range), num(idea.step + 1));

{
  const section = $("world");
  $("worldNote").textContent = T.worldNote;
  for (const idea of world.ideas) {
    const box = el("div", "card skill");
    box.append(el("h3", "", W.places[idea.place]), el("p", "muted idea", W.ideas[idea.id]));
    const meter = el("div", "meter");
    const fillBar = el("div", "meter-fill");
    fillBar.style.width = (idea.step / idea.steps) * 100 + "%";
    meter.append(fillBar);
    const head = el("div", "world-head");
    head.append(
      el("span", "", `${T.level(num(idea.step), num(idea.steps))} · ${rangeLabel(idea)}`),
      meter,
      el("span", "muted", idea.rounds ? T.worldStats(idea.rounds, idea.last ? showDate(idea.last) : "–") : T.notPlayed),
    );
    box.append(head);
    for (const p of idea.perspectives) {
      const row = el("div", "game way " + p.state);
      row.append(el("span", "game-icon", PERSPECTIVES.find((x) => x.id === p.id).icon));
      const info = el("div", "game-info");
      info.append(el("strong", "", W.perspectives[p.id]));
      info.append(el("span", "muted", p.of ? T.worldFirst(num(p.right), num(p.of)) : T.notPlayed));
      row.append(info, el("span", "state " + p.state, T.worldStates[p.state]));
      box.append(row);
    }
    section.append(box);
  }
}

// ---------- Category → skill → game

/** "3–6 Jahre", plus why the game is hidden or that the parents decided. */
function ageHint(game, kid) {
  const [from, to] = game.ages;
  const parts = [T.ages(num(from), num(to))];
  const choice = kid.games?.[game.id];
  const why = fit.why(game, kid);
  if (choice === true && why) parts.push(T.switchedOn);
  else if (choice === false && !why) parts.push(T.switchedOff);
  else if (why === "moved") parts.push(T.moved(W.places[placeOfIdea[game.moved]]));
  else if (why === "young") parts.push(T.tooYoung(num(from)));
  else if (why === "old") parts.push(T.tooEasy);
  return parts.join(" · ");
}

/** On/off: does this child see the game on the start page? Back to "by age" when it matches the age. */
function gameSwitch(game, kid, row) {
  const label = el("label", "switch");
  const box = el("input");
  box.type = "checkbox";
  box.setAttribute("role", "switch");
  box.checked = fit.visible(game, kid);
  box.setAttribute("aria-label", T.showGame(local(game.name), kidName(kid)));
  box.addEventListener("change", () => {
    const byAge = fit.why(game, kid) === null;
    profiles.setGame(kid.id, game.id, box.checked === byAge ? null : box.checked);
    kid.games = profiles.get(kid.id).games;
    row.classList.toggle("off", !box.checked);
    row.querySelector(".game-info > .muted").textContent = ageHint(game, kid);
  });
  label.append(box, el("span", "slider"));
  return label;
}

/** Levels above the child's age (shared/fit.js): only when the parents open them. Nothing when all fit. */
function harderToggle(game, kid) {
  const levels = LEVELS[game.id];
  const byAge = fit.ceiling(levels, { ...kid, harder: {} }, game.id);
  if (profiles.age(kid) === null || byAge >= levels.length - 1) return null;
  const label = el("label", "harder");
  const box = el("input");
  box.type = "checkbox";
  box.checked = Boolean(kid.harder?.[game.id]);
  box.addEventListener("change", () => {
    profiles.setHarder(kid.id, game.id, box.checked);
    kid.harder = profiles.get(kid.id).harder;
  });
  label.append(box, el("span", "", T.harder(num(levels[byAge + 1].age))));
  return label;
}

// ---------- Per child: reading aloud and typing answers (by age unless the parents decide)

const SETTINGS = [
  { key: "readAloud", icon: "🔊", get: profiles.readAloud, set: profiles.setReadAloud, title: T.readAloudTitle,
    on: T.readAloudOn, off: T.readAloudOff, byAge: () => T.readAloudAge(num(profiles.READ_ALOUD_UNTIL)), label: T.readAloudLabel },
  { key: "typeAnswers", icon: "⌨️", get: profiles.typeAnswers, set: profiles.setTypeAnswers, title: T.typeTitle,
    on: T.typeOn, off: T.typeOff, byAge: () => T.typeAge(num(profiles.TYPE_FROM)), label: T.typeLabel },
];

function settingHint(s, kid) {
  const parts = [s.get(kid) ? s.on(kidName(kid)) : s.off(kidName(kid))];
  if (kid[s.key] === true || kid[s.key] === false) parts.push(kid[s.key] ? T.switchedOn : T.switchedOff);
  else parts.push(s.byAge());
  return parts.join(" · ");
}

if (shown) {
  const box = $("readAloud");
  for (const s of SETTINGS) {
    const row = el("div", "game");
    row.append(el("span", "game-icon", s.icon));
    const info = el("div", "game-info");
    const hint = el("span", "muted", settingHint(s, shown));
    info.append(el("strong", "", s.title), hint);
    const label = el("label", "switch");
    const input = el("input");
    input.type = "checkbox";
    input.setAttribute("role", "switch");
    input.checked = s.get(shown);
    input.setAttribute("aria-label", s.label(kidName(shown)));
    input.addEventListener("change", () => {
      const byAge = s.get({ ...shown, [s.key]: undefined });
      s.set(shown.id, input.checked === byAge ? null : input.checked);
      shown[s.key] = profiles.get(shown.id)[s.key];
      hint.textContent = settingHint(s, shown);
    });
    label.append(input, el("span", "slider"));
    row.append(info, label);
    box.append(row);
  }
  box.hidden = false;
}

if (shown) {
  $("gamesNote").textContent = T.gamesNote(kidName(shown));
  $("gamesNote").hidden = false;
}

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
      const seen = shown && fit.visible(game, shown);
      if (!seen) row.classList.add("off");

      const info = el("div", "game-info");
      info.append(el("strong", "", local(game.name)));
      if (shown) info.append(el("span", "muted", ageHint(game, shown)));

      if (!g) {
        info.append(el("span", "muted", T.notPlayed));
      } else {
        const answers = g.right + g.wrong;
        const percent = answers ? Math.round((g.right / answers) * 100) : 0;
        const meter = el("div", "meter");
        const levels = LEVELS[game.id];
        const found = levels.findIndex((l) => l.id === g.levelId);
        const index = found !== -1 ? found : Math.min(g.level, levels.length - 1);
        const fillBar = el("div", "meter-fill");
        fillBar.style.width = ((index + 1) / levels.length) * 100 + "%";
        meter.append(fillBar);
        info.append(
          el("span", "", `${T.level(num(index + 1), num(levels.length))} · ${local(levels[index].label)}`),
          meter,
          el("span", "muted", T.stats(g.rounds, percent, g.last ? showDate(g.last) : "–")),
        );
      }
      const harder = shown && harderToggle(game, shown);
      if (harder) info.append(harder);
      row.append(info);
      if (shown) row.append(gameSwitch(game, shown, row));
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
    record.reset(shown?.id);
    location.reload();
  }
});
