// What a child has played in the new world, stored only on this device (one record per child).
// Nothing leaves the phone. The map, the suggestion and the number range all read from here.
//
//   import * as record from "../frame/record.js";
//   record.range("teile")                 → the number range the child plays this idea in (5, 10 …)
//   record.task("teile", "sehen", 5, true) → one task done: right the first time?
//   record.round("teile", "sehen", 5, { first: 4, tasks: 5, card }) → a finished round
//   record.feel("teile", "sehen", 5, "ok") → what the child said about it
//   record.state("teile", "sehen")        → "new" | "played" | "understood" (in the current range)
//   record.suggest("teile")               → the perspective to play next
//   record.all()                          → the whole record (a fresh copy)
//
// Stored shape (localStorage "thinklab:welt:<child id>", version 1):
//   { v: 1, rounds: 3, ranges: { teile: 5 }, cards: { vergleichen: 2 },
//     cells: { "teile/sehen/5": { n: 10, first: 8, recent: [1,1,0,1,1], days: ["2026-11-26"], last: "2026-11-26",
//                                 share: 0.8, feel: "ok" } } }
//
//   cell   – one idea in one perspective in one number range.
//   recent – the last 10 tasks: 1 = right the first time. days – the last days it was played (up to 5).
//   share  – right the first time in the last round (0 … 1). feel – what the child said: easy / ok / hard.
//
// Understood: 8 of the last 10 tasks right the first time, played on two different days.
// Bigger numbers: when three perspectives of the range had a good last round (share ≥ GOOD).
// Smaller numbers again: the child said "hard" and the round was weak (share ≤ WEAK).

import { store } from "../../shared/store.js";
import * as profiles from "../../shared/profiles.js";
import { IDEAS, PERSPECTIVES } from "./ideas.js";

export const GOOD = 0.8;
export const WEAK = 0.4;
export const RECENT = 10;
export const UNDERSTOOD = 8;
/** Perspectives with a good last round before the next number range opens. */
export const OPEN_AFTER = 3;
/** Children below this age start in the smallest range. */
export const SMALL_UNTIL = 6;

const key = (kidId = profiles.current()?.id) => `welt:${kidId || "guest"}`;
const cellKey = (idea, p, range) => `${idea}/${p}/${range}`;

export function today(date = new Date()) {
  const z = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

export function all(kidId) {
  const rec = store.get(key(kidId), null);
  return rec && rec.v === 1 ? rec : { v: 1, rounds: 0, ranges: {}, cards: {}, cells: {} };
}

function update(change) {
  const rec = all();
  change(rec);
  store.set(key(), rec);
  return rec;
}

/** The range a child starts an idea in: the smallest below SMALL_UNTIL years, otherwise the second. */
function startRange(idea) {
  const ranges = IDEAS[idea].ranges;
  const age = profiles.age(profiles.current());
  return age !== null && age >= SMALL_UNTIL ? ranges[Math.min(1, ranges.length - 1)] : ranges[0];
}

export function range(idea) {
  const saved = all().ranges[idea];
  return IDEAS[idea].ranges.includes(saved) ? saved : startRange(idea);
}

export function cell(idea, p, r = range(idea)) {
  return all().cells[cellKey(idea, p, r)] || null;
}

export const understood = (c) =>
  Boolean(c && c.recent.length >= RECENT && c.recent.reduce((a, b) => a + b, 0) >= UNDERSTOOD && new Set(c.days).size >= 2);

export function state(idea, p) {
  const c = cell(idea, p);
  return !c || !c.n ? "new" : understood(c) ? "understood" : "played";
}

/** One task done. transfer: the surprise task at the end of a round in another perspective; it is
 *  counted apart (tn, tfirst) and does not make that perspective "played". */
export function task(idea, p, r, firstTry, transfer = false) {
  update((rec) => {
    const c = (rec.cells[cellKey(idea, p, r)] ??= { n: 0, first: 0, recent: [], days: [], last: null });
    if (transfer) {
      c.tn = (c.tn || 0) + 1;
      if (firstTry) c.tfirst = (c.tfirst || 0) + 1;
      return;
    }
    c.n++;
    if (firstTry) c.first++;
    c.recent = [...c.recent, firstTry ? 1 : 0].slice(-RECENT);
    c.last = today();
    if (!c.days.includes(c.last)) c.days = [...c.days, c.last].slice(-5);
  });
}

/** A finished round. Returns +1 when the next number range opens, otherwise 0. */
export function round(idea, p, r, { first, tasks, card = null }) {
  let moved = 0;
  update((rec) => {
    rec.rounds++;
    rec.by ??= {};
    rec.by[idea] = (rec.by[idea] || 0) + 1;
    if (card) rec.cards[card] = (rec.cards[card] || 0) + 1;
    const c = (rec.cells[cellKey(idea, p, r)] ??= { n: 0, first: 0, recent: [], days: [], last: today() });
    c.share = tasks ? first / tasks : 0;
    const ranges = IDEAS[idea].ranges;
    const at = ranges.indexOf(r);
    const good = PERSPECTIVES.filter(({ id }) => (rec.cells[cellKey(idea, id, r)]?.share ?? 0) >= GOOD).length;
    if (good >= OPEN_AFTER && at < ranges.length - 1) moved = 1;
    rec.ranges[idea] = ranges[at + moved];
  });
  return moved;
}

/** What the child said after the round: "easy" | "ok" | "hard". Returns −1 when the child said
 *  "hard" after a weak round and the numbers get smaller again, otherwise 0. */
export function feel(idea, p, r, said) {
  let moved = 0;
  update((rec) => {
    const c = rec.cells[cellKey(idea, p, r)];
    if (!c) return;
    c.feel = said;
    const ranges = IDEAS[idea].ranges;
    const at = ranges.indexOf(rec.ranges[idea] ?? r);
    if (said === "hard" && (c.share ?? 1) <= WEAK && at > 0 && ranges[at] === r) {
      moved = -1;
      rec.ranges[idea] = ranges[at - 1];
    }
  });
  return moved;
}

/**
 * The perspective to play next: one the child has not played in this range (in the order of
 * PERSPECTIVES), then one that is not understood yet, longest ago first, then simply the one longest ago.
 */
export function suggest(idea) {
  const r = range(idea);
  const cells = PERSPECTIVES.map(({ id }) => ({ id, c: cell(idea, id, r) }));
  const fresh = cells.find(({ c }) => !c || !c.n);
  if (fresh) return fresh.id;
  const byAge = [...cells].sort((a, b) => (a.c.last || "").localeCompare(b.c.last || "") || a.c.n - b.c.n);
  return (byAge.find(({ c }) => !understood(c)) || byAge[0]).id;
}

/** How much has grown for an idea: finished rounds (the map draws flowers for them at its place).
 *  Rounds from before rounds were counted per idea (rec.by) belong to "teile", the only idea then. */
export function grown(idea) {
  const rec = all();
  const by = rec.by || {};
  if (idea in by || idea !== "teile") return by[idea] || 0;
  return Math.max(0, rec.rounds - Object.values(by).reduce((a, b) => a + b, 0));
}

export function reset(kidId) {
  store.remove(key(kidId));
}
