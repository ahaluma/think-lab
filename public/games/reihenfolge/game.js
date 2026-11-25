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
// All texts are in lang/<language>.js; here are only the pictures.

import { say, oneOf, sound, celebrate, shuffle, randInt, pick, icons, homeButton } from "../../shared/kit.js";
import { texts, fill, num } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";

const ID = "reihenfolge";
const T = await texts(import.meta.url);
const cheer = (text) => `${oneOf(T.praise)} ${text}`; // "Toll! Aus dem Samen ist eine Blume geworden!"
const oops = (text) => `${oneOf(T.oops)} ${text}`; // "Fast! Was passiert ganz zuerst?"

const STARS_PER_GAME = 5;
/** Picking one of several: the right picture glows after this many wrong answers. */
const HELP_AFTER = 2;

// ---------- The pictures (the sentences are in lang/<language>.js under the same keys)

/** Little stories, in order. Each picture is one step; the sentences are T.stories[id], T.storyEnd[id]. */
const STORIES = {
  flower: ["🫘", "🌱", "🌻"],
  chick: ["🥚", "🐣", "🐥"],
  rain: ["☁️", "🌧️", "🌈"],
  apple: ["🌸", "🍏", "🍎"],
  letter: ["✏️", "✉️", "📬"],
  growup: ["👶", "🧒", "🧑", "🧓"],
  hen: ["🥚", "🐣", "🐥", "🐔"],
  tree: ["🫘", "🌱", "🪴", "🌳"],
  bread: ["🌾", "🥣", "🍞", "🥪"],
  cake: ["🥚", "🥣", "🎂", "🍰"],
  snowman: ["❄️", "⛄", "☀️", "💧"],
  sandcastle: ["🪣", "🏰", "🌊", "🏖️"],
};

/** Times of day and seasons: the picture on the answer button, and things that happen then (T.acts). */
const DAY = ["morning", "midday", "evening", "night"];
const SEASONS = ["spring", "summer", "autumn", "winter"];
const TIME_ICON = { morning: "🌅", midday: "☀️", evening: "🌇", night: "🌙", day: "☀️",
  spring: "🌷", summer: "🌞", autumn: "🍂", winter: "⛄" };
const ACTS = {
  morning: { rooster: "🐓", breakfast: "🥣", kindergarten: "🎒", sunrise: "🌅" },
  midday: { lunch: "🍝", noon: "🕛", sunhigh: "☀️" },
  evening: { dinner: "🍲", bedtime: "📖", sunset: "🌇" },
  night: { sleep: "😴", owl: "🦉", stars: "✨", moon: "🌙" },
  spring: { blossom: "🌸", bee: "🐝", green: "🌱" },
  summer: { swim: "🏊", icecream: "🍦", melon: "🍉" },
  autumn: { leaves: "🍁", kite: "🪁", chestnuts: "🌰" },
  winter: { sled: "🛷", snow: "❄️", gloves: "🧤" },
};
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
const lastPicked = {}; // per kind: the last story / thing, so the same one never comes twice in a row

/** A random item, but not the same as last time for this key. */
function fresh(key, list) {
  let item;
  do item = pick(list);
  while (list.length > 1 && item === lastPicked[key]);
  lastPicked[key] = item;
  return item;
}

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

function storyTask(l) {
  const ids = Object.keys(STORIES).filter((id) => STORIES[id].length === l.steps);
  const id = fresh("story", ids);
  return {
    mode: "order",
    cards: STORIES[id].map((icon, i) => ({ key: `${id}${i}`, icon, say: T.stories[id][i] })),
    given: 0,
    ask: T.orderStory,
    end: T.storyEnd[id],
  };
}

function dayTask() {
  return {
    mode: "order",
    cards: DAY.map((time) => {
      const [act, icon] = pick(Object.entries(ACTS[time]));
      return { key: time, icon, tint: time, say: `${T.atTime[time]}: ${T.acts[act]}` };
    }),
    given: 0,
    ask: T.orderDay,
    end: T.dayDone,
  };
}

function seasonsTask() {
  const start = fresh("seasons", [0, 1, 2, 3]);
  const order = [0, 1, 2, 3].map((i) => SEASONS[(start + i) % 4]);
  return {
    mode: "order",
    cards: order.map((s) => ({ key: s, icon: TIME_ICON[s], tint: s, say: T.seasons[s] })),
    given: 1,
    ask: T.orderSeasons(T.seasons[order[0]]),
    end: T.yearDone,
  };
}

function whenTask(l) {
  const times = l.times === "daynight" ? ["day", "night"] : l.times === "day" ? DAY : SEASONS;
  // Day or night: the things of the morning and midday are "day".
  const groups = l.times === "daynight"
    ? { day: { ...ACTS.morning, ...ACTS.midday }, night: ACTS.night }
    : Object.fromEntries(times.map((t) => [t, ACTS[t]]));
  // Never a picture that is also on an answer button (🌙 → night would be too easy).
  const all = Object.entries(groups).flatMap(([time, acts]) =>
    Object.entries(acts).filter(([, icon]) => !times.some((t) => TIME_ICON[t] === icon)).map(([act, icon]) => ({ time, act, icon })));
  const it = fresh("when" + l.times, all);
  const names = l.times === "seasons" ? T.seasons : T.times;
  const at = l.times === "seasons" ? T.inSeason : T.atTime;
  return {
    mode: "pick",
    prompt: [{ icon: it.icon }],
    choices: times.map((t) => ({ key: t, icon: TIME_ICON[t], label: names[t], tint: t })),
    answer: it.time,
    ask: T.whenAsk(T.acts[it.act]),
    think: T.whenThink,
    right: `${at[it.time]}!`,
  };
}

function aroundTask() {
  const id = fresh("around", Object.keys(STORIES));
  const steps = STORIES[id];
  const i = randInt(0, steps.length - 1);
  const back = i === steps.length - 1 ? true : i === 0 ? false : Math.random() < 0.5;
  const a = back ? i - 1 : i + 1;
  const card = (sid, k) => ({ key: `${sid}${k}`, icon: STORIES[sid][k], label: T.stories[sid][k] });
  // Wrong on purpose: the neighbour on the other side, and pictures of stories that share no picture
  // with this one (a 🌱 from another story could be right, too).
  const others = [];
  const other = back ? i + 1 : i - 1;
  if (other >= 0 && other < steps.length) others.push(card(id, other));
  const strangers = shuffle(Object.keys(STORIES).filter((s) => !STORIES[s].some((ic) => steps.includes(ic))));
  for (const s of strangers) {
    if (others.length >= 2) break;
    others.push(card(s, randInt(0, STORIES[s].length - 1)));
  }
  const prompt = [{ icon: steps[i] }];
  if (back) prompt.unshift({ gap: true });
  else prompt.push({ gap: true });
  return {
    mode: "pick",
    prompt,
    choices: shuffle([card(id, a), ...others]),
    answer: `${id}${a}`,
    ask: `${T.stories[id][i]} ${back ? T.before : T.after}`,
    think: back ? T.justBefore : T.justAfter,
    right: T.stories[id][a],
  };
}

function weekTask(l) {
  const today = fresh("week", [0, 1, 2, 3, 4, 5, 6]); // 0 = Monday
  const back = l.back && Math.random() < 0.5;
  const answer = (today + (back ? 6 : 1)) % 7;
  const other = (today + (back ? 1 : 6)) % 7; // the day on the other side
  const third = shuffle([0, 1, 2, 3, 4, 5, 6].filter((d) => ![today, answer, other].includes(d)))[0];
  const day = (d) => ({ key: `d${d}`, label: T.weekdays[d], text: T.weekdays[d], color: WEEK_COLORS[d] });
  const order = [0, 1, 2, 3, 4, 5, 6].map((k) => (k + (T.weekStart || 0)) % 7);
  return {
    mode: "pick",
    week: { today, target: answer, strip: l.strip, order },
    choices: shuffle([day(answer), day(other), day(third)]),
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
  // Mixed up, but never already in the right order.
  let mixed = shuffle(left);
  while (left.length > 1 && mixed.every((c, i) => c === left[i])) mixed = shuffle(left);
  for (const c of mixed) {
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
  current = LEVELS[play.level];
  if (current.kind === "mix") {
    const id = oneOf(current.levels);
    current = LEVELS.find((l) => l.id === id);
  }
  task = MAKERS[current.kind](current);
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
