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
//   record.won("zaun", "sehen")           → the thinking mountain: this perspective has its star ⭐
//   record.mastered("zaun")               → the thinking mountain: all five stars, the next camps open
//   record.all()                          → the whole record (a fresh copy)
//   record.report(kid)                    → what the parents' page shows: per idea the range, the rounds
//                                           and the state of each perspective; and the counts per day
//
// Stored shape (localStorage "thinklab:welt:<child id>", version 1):
//   { v: 1, rounds: 3, ranges: { teile: 5 }, cards: { vergleichen: 2 },
//     cells: { "teile/sehen/5": { n: 10, first: 8, recent: [1,1,0,1,1], days: ["2026-11-26"], last: "2026-11-26",
//                                 share: 0.8, feel: "ok" } } }
//
//   cell   – one idea in one perspective in one number range.
//   daily  – { "2026-11-26": { right, wrong, rounds } }: tasks right the first time / not, finished rounds.
//   recent – the last 10 tasks: 1 = right the first time. days – the last days it was played (up to 5).
//   share  – right the first time in the last round (0 … 1). feel – what the child said: easy / ok / hard.
//   stars  – the thinking mountain: { zaun: { sehen: "2026-11-27" } } the day a perspective won its star.
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
/** Children below this age start in the smallest range (up to 5). */
export const SMALL_UNTIL = 6;
/** Children from this age start in the third range (up to 20), so they are not under-challenged. */
export const BIG_FROM = 7;

/** The counts per day (rec.daily) are kept this many days. The parents' report shows the last 14. */
export const DAYS_KEPT = 60;

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

/** The range a child starts an idea in, by age: below SMALL_UNTIL the first, from BIG_FROM the third,
 *  in between the second. Without an age (no child chosen) the first. An idea with startAt (the
 *  thinking mountain) starts there for every child. */
function startRange(idea, kid = profiles.current()) {
  const ranges = IDEAS[idea].ranges;
  const age = profiles.age(kid);
  const at = IDEAS[idea].startAt ?? (age === null || age < SMALL_UNTIL ? 0 : age >= BIG_FROM ? 2 : 1);
  return ranges[Math.min(at, ranges.length - 1)];
}

/**
 * The range to play now. Usually the saved one. A child whose age starts higher than the saved range
 * (the range did not exist yet, or the child had a birthday) moves up to the start range of the age,
 * unless the child itself said "hard" and went down (rec.lowered).
 */
export function range(idea, kid = profiles.current()) {
  const rec = all(kid?.id);
  const ranges = IDEAS[idea].ranges;
  const saved = rec.ranges[idea];
  const start = startRange(idea, kid);
  if (!ranges.includes(saved)) return start;
  return saved < start && !rec.lowered?.[idea] ? start : saved;
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

/** The thinking mountain: a perspective is won (a star ⭐) with one round where this share of the tasks
 *  was right the first time: 4 of 5. Backpack tasks of the round count, the surprise task does not.
 *  Any level, no days to wait. A star stays. */
export const STAR_SHARE = 0.8;

/** Won: this perspective of a camp has its star (rec.stars). A perspective already understood under the
 *  earlier rule (8 of the last 10, on two days) keeps it as a star too. */
export function won(idea, p, kidId) {
  const rec = all(kidId);
  if (rec.stars?.[idea]?.[p]) return true;
  return Object.entries(rec.cells).some(([k, c]) => k.startsWith(`${idea}/${p}/`) && understood(c));
}

/** Mastered: a camp of the mountain with all five stars. Then the camps that need it open. */
export function mastered(idea, kidId) {
  return PERSPECTIVES.every(({ id }) => won(idea, id, kidId));
}

/** The perspectives of an idea the child has played in the range it plays now. */
export function played(idea) {
  return PERSPECTIVES.filter(({ id }) => state(idea, id) !== "new").map(({ id }) => id);
}

/** How many tasks of an idea the child has solved, in every perspective and range. */
export function solved(idea) {
  return Object.entries(all().cells).filter(([k]) => k.startsWith(idea + "/")).reduce((n, [, c]) => n + (c.n || 0) + (c.tn || 0), 0);
}

/** The last day the child played this idea ("2026-11-26"), or "" if never. */
export function lastDay(idea) {
  return Object.entries(all().cells).filter(([k, c]) => k.startsWith(idea + "/") && c.last).map(([, c]) => c.last).sort().at(-1) || "";
}

/** Counts one task or round for today (rec.daily), for the parents' report. Old days are dropped. */
function count(rec, what) {
  const daily = (rec.daily ??= {});
  const day = (daily[today()] ??= { right: 0, wrong: 0, rounds: 0 });
  day[what]++;
  for (const date of Object.keys(daily).sort().slice(0, -DAYS_KEPT)) delete daily[date];
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
    count(rec, firstTry ? "right" : "wrong");
  });
}

/** A finished round. Returns +1 when the next number range opens, otherwise 0. */
export function round(idea, p, r, { first, tasks, card = null, whole = null }) {
  let moved = 0;
  update((rec) => {
    // The mountain: a round with 4 of 5 right the first time wins the star (whole: the round's tasks
    // with the backpack ones, without the surprise task)
    if (IDEAS[idea].world === "berg" && whole?.tasks && whole.first / whole.tasks >= STAR_SHARE - 1e-9) ((rec.stars ??= {})[idea] ??= {})[p] = today();
    rec.rounds++;
    count(rec, "rounds");
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
    if (moved && rec.lowered) delete rec.lowered[idea];
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
      (rec.lowered ??= {})[idea] = true;
    }
  });
  return moved;
}

/**
 * The perspective to play next: one the child has not played in this range (in the order of
 * PERSPECTIVES), then one that is not understood yet, longest ago first, then simply the one longest ago.
 */
export function suggest(idea) {
  // On the mountain: the first perspective without its star
  if (IDEAS[idea].world === "berg") {
    const open = PERSPECTIVES.find(({ id }) => !won(idea, id));
    if (open) return open.id;
  }
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

/**
 * The progress of one child (or the guest) for the parents' page (eltern/report.js):
 *   { ideas: [{ id, place, range, step, steps, rounds, last, perspectives: [{ id, state, right, of }] }], daily }
 *   step/steps – the range is the step-th of steps (1-based). last – the last day played ("2026-11-26") or null.
 *   right/of   – of the last `of` tasks in this range (up to 10), `right` were right the first time.
 */
export function report(kid) {
  const rec = all(kid?.id);
  const by = rec.by || {};
  const ideas = Object.entries(IDEAS).map(([id, idea]) => {
    const r = range(id, kid);
    const perspectives = PERSPECTIVES.map((p) => {
      const c = rec.cells[cellKey(id, p.id, r)];
      const played = Boolean(c && c.n);
      return {
        id: p.id,
        state: !played ? "new" : understood(c) ? "understood" : "played",
        right: played ? c.recent.reduce((a, b) => a + b, 0) : 0,
        of: played ? c.recent.length : 0,
      };
    });
    const days = Object.entries(rec.cells).filter(([k, c]) => k.startsWith(id + "/") && c.last).map(([, c]) => c.last);
    const rounds = id in by || id !== "teile" ? by[id] || 0 : Math.max(0, rec.rounds - Object.values(by).reduce((a, b) => a + b, 0));
    return { id, place: idea.place, range: r, step: idea.ranges.indexOf(r) + 1, steps: idea.ranges.length, rounds, last: days.sort().at(-1) || null, perspectives };
  });
  return { ideas, daily: rec.daily || {} };
}

export function reset(kidId) {
  store.remove(key(kidId));
}
