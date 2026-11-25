// Progress report, stored only on this device. Nothing leaves the phone. Parents see it on /eltern/.
// Every child has their own (localStorage key "thinklab:progress:<child id>", see profiles.js).
// Without any child yet, progress goes to "thinklab:progress:guest".
//
//   import * as progress from "../../shared/progress.js";
//   progress.level("wie-viele")              → current level (0 = first)
//   progress.answer("wie-viele", true)       → after every answer (right or wrong)
//   progress.round("wie-viele", 2, 8)        → after a finished round: new level 2 of 8
//   progress.all(kidId)                      → the whole report of one child (default: the child playing)
//
// Stored shape (version 1):
//   {
//     v: 1,
//     games: { "wie-viele": { level: 2, levels: 8, rounds: 3, right: 15, wrong: 4, last: "2026-11-24" } },
//     days:  { "2026-11-24": { right: 15, wrong: 4, rounds: 3 } }
//   }

import { store } from "./store.js";
import * as profiles from "./profiles.js";

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

export function level(id) {
  return all().games[id]?.level ?? 0;
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
    g.level = newLevel;
    g.levels = levels;
    g.last = today();
    day(p).rounds++;
  });
}

/** Set a level without playing (used to take over older saved data). */
export function setLevel(id, newLevel, levels) {
  update((p) => {
    const g = entry(p, id);
    g.level = newLevel;
    g.levels = levels;
  });
}

/** Deletes the progress of one child (default: the child playing). */
export function reset(kidId) {
  store.remove(key(kidId));
}
