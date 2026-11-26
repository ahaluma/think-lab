// The tasks of "Zuerst und dann" (Reihenfolge): one function makes one task (see shared/gen.js).
//
//   task(level, r) → one task as plain data, no texts:
//     level – the id of the level the task is from (in "mix" levels one of the others)
//     kind  – "story", "day", "seasons", "when", "around" or "week"
//     Ordering (story, day, seasons): mixed – the order of the pictures to tap (indexes into the
//       pictures in the right order; the given ones are not in it), never already right.
//       story: story (id in STORIES);  day: acts (one thing to do per time of day);
//       seasons: start (0 = spring: the season that is given)
//     when:   times ("daynight", "day", "seasons"), act (the picture), answer (the time it belongs to)
//     around: story, at (the picture shown), back (asking what came before), choices
//             [{ story, step }] in button order, answer (index into choices)
//     week:   today (0 = Monday), back (yesterday?), answer (the day asked), choices (days in button order)
//     item  – the story / picture / day, for "not the same one again soon"

import { LEVELS } from "./levels.js";

/** Little stories, in order. Each picture is one step; the sentences are T.stories[id], T.storyEnd[id].
 *  Every story and picture must make sense to children in Nepal and in Germany, in the Terai heat as in
 *  the mountains: no snow, no sea, no postbox, no food that only one of them knows. */
export const STORIES = {
  flower: ["🫘", "🌱", "🌻"],
  chick: ["🥚", "🐣", "🐥"],
  rain: ["☁️", "🌧️", "🌈"],
  sleep: ["🥱", "🛌", "😴"],
  drawing: ["🖍️", "🖼️", "👵"],
  growup: ["👶", "🧒", "🧑", "🧓"],
  hen: ["🥚", "🐣", "🐥", "🐔"],
  tree: ["🫘", "🌱", "🪴", "🌳"],
  bread: ["🌾", "🥣", "🔥", "🫓"],
  cake: ["🥚", "🥣", "🎂", "🍰"],
  soup: ["🥕", "🔪", "🍲", "😋"],
  school: ["⏰", "🪥", "🎒", "🏫"],
};

/** Times of day and seasons: the picture on the answer button, and things that happen then (T.acts).
 *  Seasons only with what children in Nepal and Germany both see: no snow, no sledging, no chestnuts,
 *  no falling leaves as the sign of autumn (in Nepal many trees lose their leaves in spring). */
export const DAY = ["morning", "midday", "evening", "night"];
export const SEASONS = ["spring", "summer", "autumn", "winter"];
export const TIME_ICON = { morning: "🌅", midday: "☀️", evening: "🌇", night: "🌙", day: "☀️",
  spring: "🌷", summer: "🌞", autumn: "🍂", winter: "🧣" };
export const ACTS = {
  morning: { rooster: "🐓", breakfast: "🥣", kindergarten: "🎒", sunrise: "🌅" },
  midday: { lunch: "🍛", noon: "🕛", sunhigh: "☀️" },
  evening: { dinner: "🍲", bedtime: "📖", sunset: "🌇" },
  night: { sleep: "😴", owl: "🦉", stars: "✨", moon: "🌙" },
  spring: { blossom: "🌸", bee: "🐝", green: "🌱" },
  summer: { shade: "🌳", icecream: "🍦", melon: "🍉" },
  autumn: { kite: "🪁", harvest: "🌾" },
  winter: { gloves: "🧤", fog: "🌫️", warmdrink: "☕" },
};
export const ACT_ICON = Object.assign({}, ...Object.values(ACTS));

/** The answer buttons of a "when" task. */
export const timesOf = (times) => (times === "daynight" ? ["day", "night"] : times === "day" ? DAY : SEASONS);

/** The pictures from `given` on, mixed up, but never already in the right order. */
function mix(r, n, given) {
  const left = [...Array(n).keys()].slice(given);
  let mixed = r.shuffle(left);
  while (left.length > 1 && mixed.every((c, i) => c === left[i])) mixed = r.shuffle(left);
  return mixed;
}

function story(l, r) {
  const ids = Object.keys(STORIES).filter((id) => STORIES[id].length === l.steps);
  const id = r.pick(ids);
  return { story: id, mixed: mix(r, l.steps, 0), item: id };
}

function day(l, r) {
  const acts = DAY.map((time) => r.pick(Object.keys(ACTS[time])));
  return { acts, mixed: mix(r, 4, 0), item: "day" };
}

function seasons(l, r) {
  const start = r.int(0, 3);
  return { start, mixed: mix(r, 4, 1), item: SEASONS[start] };
}

function when(l, r) {
  const times = timesOf(l.times);
  // Day or night: the things of the morning and midday are "day".
  const groups = l.times === "daynight"
    ? { day: { ...ACTS.morning, ...ACTS.midday }, night: ACTS.night }
    : Object.fromEntries(times.map((t) => [t, ACTS[t]]));
  // Never a picture that is also on an answer button (🌙 → night would be too easy).
  const all = Object.entries(groups).flatMap(([time, acts]) =>
    Object.entries(acts).filter(([, icon]) => !times.some((t) => TIME_ICON[t] === icon)).map(([act]) => ({ time, act })));
  const it = r.pick(all);
  return { times: l.times, act: it.act, answer: it.time, item: it.act };
}

function around(l, r) {
  const id = r.pick(Object.keys(STORIES));
  const steps = STORIES[id];
  const at = r.int(0, steps.length - 1);
  const back = at === steps.length - 1 ? true : at === 0 ? false : r.chance(0.5);
  const right = { story: id, step: back ? at - 1 : at + 1 };
  // Wrong on purpose: the neighbour on the other side, and pictures of stories that share no picture
  // with this one (a 🌱 from another story could be right, too).
  const others = [];
  const other = back ? at + 1 : at - 1;
  if (other >= 0 && other < steps.length) others.push({ story: id, step: other });
  const strangers = r.shuffle(Object.keys(STORIES).filter((s) => !STORIES[s].some((ic) => steps.includes(ic))));
  // Two strangers can share a picture, too (🥚 in chick, hen and cake): never two buttons that look the same.
  const icon = (c) => STORIES[c.story][c.step];
  for (const s of strangers) {
    if (others.length >= 2) break;
    const c = { story: s, step: r.int(0, STORIES[s].length - 1) };
    if (!others.some((o) => icon(o) === icon(c))) others.push(c);
  }
  const choices = r.shuffle([right, ...others]);
  return { story: id, at, back, choices, answer: choices.indexOf(right), item: `${id}${at}` };
}

function week(l, r) {
  const today = r.int(0, 6); // 0 = Monday
  const back = !!l.back && r.chance(0.5);
  const answer = (today + (back ? 6 : 1)) % 7;
  const other = (today + (back ? 1 : 6)) % 7; // the day on the other side
  const third = r.pick([0, 1, 2, 3, 4, 5, 6].filter((d) => ![today, answer, other].includes(d)));
  return { today, back, answer, choices: r.shuffle([answer, other, third]), item: `d${today}` };
}

const MAKERS = { story, day, seasons, when, around, week };

export function task(level, r) {
  const id = level.kind === "mix" ? r.pick(level.levels) : level.id;
  const l = LEVELS.find((x) => x.id === id);
  return { level: l.id, kind: l.kind, ...MAKERS[l.kind](l, r) };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const l = LEVELS.find((x) => x.id === t.level);
  if (level.kind === "mix" ? !level.levels.includes(t.level) : t.level !== level.id) problems.push("wrong level");
  if (t.mixed) {
    const n = t.kind === "story" ? STORIES[t.story].length : 4;
    const given = t.kind === "seasons" ? 1 : 0;
    if ([...t.mixed].sort().join() !== [...Array(n).keys()].slice(given).join()) problems.push("pictures missing");
    if (t.mixed.every((c, i) => c === given + i)) problems.push("already in order");
    if (t.kind === "story" && n !== l.steps) problems.push("wrong story length");
  }
  if (t.kind === "when") {
    const icon = ACT_ICON[t.act];
    if (timesOf(t.times).some((x) => TIME_ICON[x] === icon)) problems.push("picture on an answer button");
    if (!timesOf(t.times).includes(t.answer)) problems.push("answer not a button");
  }
  if (t.kind === "around") {
    const want = t.back ? t.at - 1 : t.at + 1;
    const right = t.choices.filter((c) => c.story === t.story && c.step === want);
    if (right.length !== 1 || t.choices[t.answer] !== right[0]) problems.push("not one right picture");
    const icons = t.choices.map((c) => STORIES[c.story][c.step]);
    if (new Set(icons).size !== icons.length) problems.push("two choices look the same");
    if (t.choices.length !== 3) problems.push("not three choices");
  }
  if (t.kind === "week") {
    if (t.answer !== (t.today + (t.back ? 6 : 1)) % 7) problems.push("wrong day");
    if (new Set(t.choices).size !== 3 || t.choices.includes(t.today)) problems.push("bad choices");
    if (t.back && !l.back) problems.push("yesterday on a level without it");
  }
  return problems;
}
