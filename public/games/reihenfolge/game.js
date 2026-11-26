// "Zuerst und dann" – order and time, for about 3 to 7 years.
// What happens first, what comes next? Five kinds of task (level "kind", see levels.js):
//   story   – a little picture story (🫘 🌱 🌻) lies mixed up: tap the pictures in the right order.
//             Each picture moves up into the next free place and is read out.
//   day     – the same with morning, midday, evening and night (a different thing to do each time).
//   seasons – the same with spring, summer, autumn and winter. The first season is given.
//   when    – one picture (🛷): when is that? Day or night; morning, midday, evening or night; or the season.
//   around  – one picture of a story: what came just before? what comes just after? (one of three)
//   week    – "Today is Tuesday. Which day is tomorrow?" (later also yesterday, without the week strip)
// Hints (the same rule as the other pick-one games): after two wrong answers the right picture glows.
// Every task comes from task() in tasks.js (shared/gen.js), the pictures are there too; this file only
// draws the task. All texts are in lang/<language>.js.

import { say, oneOf, sound, celebrate, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";
import * as gen from "../../shared/gen.js";
import { task as makeTask, STORIES, DAY, SEASONS, TIME_ICON, ACTS, ACT_ICON, timesOf } from "./tasks.js";

const ID = "reihenfolge";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Aus dem Samen ist eine Blume geworden!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Was passiert ganz zuerst?"

const STARS_PER_GAME = 5;
/** Picking one of several: the right picture glows after this many wrong answers. */
const HELP_AFTER = 2;

// Not the same story, picture or day again within the next two tasks.
const nextTask = gen.generator(makeTask, { avoid: { item: 2 } });

/** Colours of the days of the week (Monday first), so a child can find a day again without reading. */
const WEEK_COLORS = ["#ff8a80", "#ffb74d", "#ffe066", "#8fdc8a", "#7cc8ff", "#b39ddb", "#f8a5d1"];

// ---------- State

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

const play = adapt.player(ID, LEVELS); // the level follows the child (shared/adapt.js)
let current = null; // the level of this task (in "mix" one of the others)
let stars = 0;
let task = null; // what the child sees and must do, made by one of the MAKERS below
let step = 0; // ordering: the next place to fill
let misses = 0; // wrong answers for this step (ordering) or this task (picking)
let locked = false;

// ---------- Screens

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function drawStars() {
  $("stars").innerHTML = "";
  for (let i = 0; i < STARS_PER_GAME; i++) {
    const li = document.createElement("li");
    li.textContent = "⭐";
    if (i < stars) li.className = "on";
    $("stars").append(li);
  }
}

// ---------- Making a task
// Ordering tasks: { mode: "order", cards: [{ key, icon, say, tint }] in the right order, given: how many
//   are already in place, ask, end }.
// Picking tasks: { mode: "pick", prompt (what is shown), choices: [{ key, icon, label, tint }], answer (key),
//   ask, think (said after the first wrong answer), right (said when right) }.

// The order of the pictures to tap comes from tasks.js (t.mixed: indexes, never already right).

function storyTask(l, t) {
  const id = t.story;
  return {
    mode: "order",
    cards: STORIES[id].map((icon, i) => ({ key: `${id}${i}`, icon, say: T.stories[id][i] })),
    given: 0,
    mixed: t.mixed,
    ask: T.orderStory,
    end: T.storyEnd[id],
  };
}

function dayTask(l, t) {
  return {
    mode: "order",
    cards: DAY.map((time, i) => {
      const act = t.acts[i];
      return { key: time, icon: ACTS[time][act], tint: time, say: `${T.atTime[time]}: ${T.acts[act]}` };
    }),
    given: 0,
    mixed: t.mixed,
    ask: T.orderDay,
    end: T.dayDone,
  };
}

function seasonsTask(l, t) {
  const order = [0, 1, 2, 3].map((i) => SEASONS[(t.start + i) % 4]);
  return {
    mode: "order",
    cards: order.map((s) => ({ key: s, icon: TIME_ICON[s], tint: s, say: T.seasons[s] })),
    given: 1,
    mixed: t.mixed,
    ask: T.orderSeasons(T.seasons[order[0]]),
    end: T.yearDone,
  };
}

function whenTask(l, t) {
  const names = l.times === "seasons" ? T.seasons : T.times;
  const at = l.times === "seasons" ? T.inSeason : T.atTime;
  return {
    mode: "pick",
    prompt: [{ icon: ACT_ICON[t.act] }],
    choices: timesOf(l.times).map((x) => ({ key: x, icon: TIME_ICON[x], label: names[x], tint: x })),
    answer: t.answer,
    ask: T.whenAsk(T.acts[t.act]),
    think: T.whenThink,
    right: `${at[t.answer]}!`,
  };
}

function aroundTask(l, t) {
  const card = ({ story, step }) => ({ key: `${story}${step}`, icon: STORIES[story][step], label: T.stories[story][step] });
  const choices = t.choices.map(card);
  const prompt = [{ icon: STORIES[t.story][t.at] }];
  if (t.back) prompt.unshift({ gap: true });
  else prompt.push({ gap: true });
  return {
    mode: "pick",
    prompt,
    choices,
    answer: choices[t.answer].key,
    ask: `${T.stories[t.story][t.at]} ${t.back ? T.before : T.after}`,
    think: t.back ? T.justBefore : T.justAfter,
    right: choices[t.answer].label,
  };
}

function weekTask(l, t) {
  const { today, back, answer } = t;
  const day = (d) => ({ key: `d${d}`, label: T.weekdays[d], text: T.weekdays[d], color: WEEK_COLORS[d] });
  const order = [0, 1, 2, 3, 4, 5, 6].map((k) => (k + (T.weekStart || 0)) % 7);
  return {
    mode: "pick",
    week: { today, target: answer, strip: l.strip, order },
    choices: t.choices.map(day),
    answer: `d${answer}`,
    ask: back ? T.yesterdayQ(T.weekdays[today]) : T.tomorrowQ(T.weekdays[today]),
    think: T.weekSay(order.map((d) => T.weekdays[d]).join(", ")),
    right: back ? T.yesterdayWas(T.weekdays[answer]) : T.tomorrowIs(T.weekdays[answer]),
  };
}

const MAKERS = { story: storyTask, day: dayTask, seasons: seasonsTask, when: whenTask, around: aroundTask, week: weekTask };

// ---------- Drawing

function picture(c, tag = "span") {
  const el = document.createElement(tag);
  el.className = "pic" + (c.tint ? ` t-${c.tint}` : "");
  el.textContent = c.icon;
  return el;
}

function drawOrder() {
  const slots = $("slots");
  slots.innerHTML = "";
  slots.style.setProperty("--n", task.cards.length);
  task.cards.forEach((c, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = num(i + 1);
    slot.append(badge);
    if (i < task.given) {
      slot.classList.add("filled", "given");
      slot.append(picture(c));
    }
    slots.append(slot);
  });

  const pool = $("pool");
  pool.innerHTML = "";
  const left = task.cards.slice(task.given);
  pool.style.setProperty("--n", left.length);
  pool.classList.toggle("two-rows", left.length === 4);
  for (const c of task.mixed.map((i) => task.cards[i])) {
    const b = picture(c, "button");
    b.type = "button";
    b.classList.add("btn", "card-btn");
    b.setAttribute("aria-label", c.say);
    b.addEventListener("click", () => tapCard(b, c));
    pool.append(b);
  }
}

function drawPick() {
  const prompt = $("prompt");
  prompt.innerHTML = "";
  prompt.hidden = Boolean(task.week);
  if (!task.week) {
    for (const p of task.prompt) {
      if (p.gap) {
        const gap = document.createElement("span");
        gap.className = "pic gap";
        gap.textContent = "?";
        prompt.append(gap);
      } else prompt.append(picture(p));
    }
    prompt.classList.toggle("pair", task.prompt.length > 1);
  }

  const week = $("week");
  week.innerHTML = "";
  week.hidden = !task.week;
  if (task.week) drawWeek(week, task.week);

  const box = $("choices");
  box.innerHTML = "";
  box.style.setProperty("--n", task.choices.length);
  box.classList.toggle("words", Boolean(task.week));
  box.classList.toggle("two-rows", task.choices.length === 4);
  for (const c of task.choices) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn choice" + (c.tint ? ` t-${c.tint}` : "");
    b.setAttribute("aria-label", c.label);
    if (c.icon) {
      const icon = document.createElement("span");
      icon.className = "choice-icon";
      icon.textContent = c.icon;
      b.append(icon);
    }
    if (c.color) b.style.setProperty("--day", c.color);
    if (c.text || (c.label && c.tint)) {
      const label = document.createElement("span");
      label.className = "choice-label";
      label.textContent = c.text || c.label;
      b.append(label);
    }
    b.addEventListener("click", () => tapChoice(b, c));
    box.append(b);
  }
}

/** The week: seven coloured days in a row, today marked, the asked day a "?". Without the strip: only today. */
function drawWeek(el, w) {
  const days = w.strip ? w.order : [w.today];
  el.classList.toggle("strip", w.strip);
  for (const d of days) {
    const chip = document.createElement("div");
    chip.className = "day";
    chip.style.setProperty("--day", WEEK_COLORS[d]);
    if (d === w.today) chip.classList.add("today");
    if (d === w.target) {
      chip.classList.add("gap");
      chip.textContent = "?";
    } else {
      chip.textContent = w.strip ? T.weekShort[d] : T.weekdays[d];
    }
    if (d === w.today) {
      const tag = document.createElement("span");
      tag.className = "today-tag";
      tag.textContent = T.today;
      chip.append(tag);
    }
    chip.dataset.day = d;
    el.append(chip);
  }
}

// ---------- One task

async function newTask() {
  const t = nextTask(LEVELS[play.level]);
  current = LEVELS.find((l) => l.id === t.level); // in "mix" levels one of the others
  task = MAKERS[current.kind](current, t);
  step = task.given || 0;
  misses = 0;
  locked = true;
  const order = task.mode === "order";
  $("order").hidden = !order;
  $("pickbox").hidden = order;
  if (order) drawOrder();
  else drawPick();
  show("round");
  await say(task.ask);
  locked = false;
}

function shake(b) {
  b.classList.remove("shake");
  void b.offsetWidth; // restart the animation
  b.classList.add("shake");
}

/** Glow on the right one: the shared hint after two wrong answers. */
function glow(el) {
  el?.classList.add("hint");
}

async function tapCard(b, c) {
  if (locked) return;
  const want = task.cards[step];
  if (c !== want) {
    play.answer(false);
    sound.wrong();
    shake(b);
    misses++;
    locked = true;
    if (misses >= HELP_AFTER) glow([...$("pool").children].find((x) => x.getAttribute("aria-label") === want.say));
    const hint = misses >= HELP_AFTER ? T.lookGlow : step === 0 ? T.whatFirst : T.whatNext;
    await say(oops(hint));
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  sound.tap();
  b.classList.remove("hint");
  b.classList.add("used");
  b.disabled = true;
  const slot = $("slots").children[step];
  slot.classList.add("filled");
  const pic = picture(c);
  pic.classList.add("pop");
  slot.append(pic);
  step++;
  misses = 0;

  if (step < task.cards.length) {
    await say(c.say);
    locked = false;
    return;
  }
  await say(c.say);
  for (const s of $("slots").children) s.classList.add("bounce");
  await solved(task.end);
}

async function tapChoice(b, c) {
  if (locked) return;
  if (c.key !== task.answer) {
    play.answer(false);
    sound.wrong();
    shake(b);
    b.disabled = true;
    misses++;
    locked = true;
    if (misses >= HELP_AFTER) glow([...$("choices").children].find((x) => x.getAttribute("aria-label") === answerLabel()));
    await say(oops(misses >= HELP_AFTER ? T.lookGlow : task.think));
    locked = false;
    return;
  }

  locked = true;
  play.answer(true);
  b.classList.remove("hint");
  b.classList.add("right", "bounce");
  // Fill the "?" with the answer.
  const gap = document.querySelector("#prompt .gap");
  if (gap) {
    gap.classList.remove("gap");
    gap.classList.add("filled", "pop");
    gap.textContent = c.icon;
  }
  const day = document.querySelector("#week .day.gap");
  if (day) {
    day.classList.remove("gap");
    day.classList.add("filled", "pop");
    day.textContent = task.week.strip ? T.weekShort[task.week.target] : T.weekdays[task.week.target];
  }
  await solved(task.right);
}

const answerLabel = () => task.choices.find((c) => c.key === task.answer).label;

async function solved(text) {
  sound.right();
  play.solved();
  stars++;
  drawStars();
  await Promise.all([say(cheer(text)), wait(1200)]);
  await wait(300);
  if (stars >= STARS_PER_GAME) finish();
  else newTask();
}

function finish() {
  play.round();
  show("done");
  sound.win();
  celebrate();
  say(T.wellDone);
}

function startGame() {
  stars = 0;
  drawStars();
  newTask();
}

// ---------- Wire up buttons

fill(T);
document.title = `${T.title} · AnkaPlay`;
homeButton($("home"));
$("speak").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("again").innerHTML = icons.again;

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden && task) say(task.ask);
  else if (!screens.done.hidden) say(T.playAgainQuestion);
  else say(T.intro);
});

drawStars();
show("start");
