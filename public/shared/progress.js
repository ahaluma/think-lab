// Progress report, stored only on this device. Nothing leaves the phone. Parents see it on /eltern/.
// Every child has their own (localStorage key "thinklab:progress:<child id>", see profiles.js).
// Without any child yet, progress goes to "thinklab:progress:guest".
//
//   import * as progress from "../../shared/progress.js";
//   progress.level("wie-viele", LEVELS)      → index of the current level in LEVELS (see levels.js)
//   progress.answer("wie-viele", true)       → after every answer (right or wrong)
//   progress.round("wie-viele", 2, LEVELS)   → after a finished round: new level LEVELS[2]
//   progress.all(kidId)                      → the whole report of one child (default: the child playing)
//
// Stored shape (version 1):
//   {
//     v: 1,
//     games: { "wie-viele": { levelId: "bis-5", level: 2, levels: 8, rounds: 3, right: 15, wrong: 4, last: "2026-11-24" } },
//     days:  { "2026-11-24": { right: 15, wrong: 4, rounds: 3 } }
//   }
//
//   levelId – the level's fixed id from levels.js. It decides; inserting levels later keeps the child's place.
//   level, levels – index and count when it was saved, only for the report. (Older data had only these.)
//   A child's first time in a game starts at fit.startLevel(): generous, 2 years below their age.

import { store } from "./store.js";
import * as profiles from "./profiles.js";
import { startLevel } from "./fit.js";

const key = (kidId = profiles.current()?.id) => `progress:${kidId || "guest"}`;
const KEEP_DAYS = 120;

/** Today as "YYYY-MM-DD" in local time. */
export function today(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** The whole report of one child (a fresh copy). */
export function all(kidId) {
  const p = store.get(key(kidId), null);
  return p && p.v === 1 ? p : { v: 1, games: {}, days: {} };
}

function update(change) {
  const p = all();
  change(p);
  const days = Object.keys(p.days).sort();
  for (const old of days.slice(0, Math.max(0, days.length - KEEP_DAYS))) delete p.days[old];
  store.set(key(), p);
}

function entry(p, id) {
  p.games[id] ??= { level: 0, levels: 1, rounds: 0, right: 0, wrong: 0, last: null };
  return p.games[id];
}

function day(p) {
  return (p.days[today()] ??= { right: 0, wrong: 0, rounds: 0 });
}

export function level(id, levels) {
  const g = all().games[id];
  if (g?.levelId) {
    const i = levels.findIndex((l) => l.id === g.levelId);
    if (i !== -1) return i;
  }
  // Saved before levels had ids: keep the index once, then save it with its id.
  if (g && Number.isInteger(g.level)) {
    const i = Math.min(levels.length - 1, Math.max(0, g.level));
    setLevel(id, i, levels);
    return i;
  }
  return startLevel(levels, profiles.current());
}

function place(g, index, levels) {
  g.level = index;
  g.levelId = levels[index].id;
  g.levels = levels.length;
}

export function answer(id, right) {
  update((p) => {
    const g = entry(p, id);
    const d = day(p);
    if (right) g.right++, d.right++;
    else g.wrong++, d.wrong++;
    g.last = today();
  });
}

export function round(id, newLevel, levels) {
  update((p) => {
    const g = entry(p, id);
    g.rounds++;
    place(g, newLevel, levels);
    g.last = today();
    day(p).rounds++;
  });
}

/** Set a level without playing (used to take over older saved data). */
export function setLevel(id, newLevel, levels) {
  update((p) => {
    place(entry(p, id), newLevel, levels);
  });
}

/** Deletes the progress of one child (default: the child playing). */
export function reset(kidId) {
  store.remove(key(kidId));
}
