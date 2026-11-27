// What a child has done at the market, stored only on this device (one record per child).
// Nothing leaves the phone. The map, the rounds and the parents' page read from here.
//
//   import * as markt from "./record.js";
//   markt.step(op, range)            → the sub-step the child plays in this range (index into STEPS)
//   markt.won(op, range, p)          → this perspective has its star in this range ⭐
//   markt.stars(op, range)           → how many of the five
//   markt.flag(op, range)            → the summit is finished: five stars, or a higher summit was
//   markt.task(op, range, t, first, ms) → one task done (counts, the learning box)
//   markt.round(op, range, p, { first, tasks }) → a finished round; what happened: star, flag, step
//   markt.feel(op, range, "hard")    → the child said how it was
//   markt.cardScore(key)             → how much a card is due: high = show it now (the learning box)
//   markt.mistake(op, kind)          → a wrong answer of this kind (zehner, eins, …)
//   markt.bridge(op)                 → a kind of mistake that came 3 times in the last 2 rounds, or null
//   markt.platz…                     → the market square: stages won, rounds
//   markt.report(kid)                → what the parents' page shows
//
// Stored shape (localStorage "thinklab:markt:<child id>", version 1):
//   { v: 1,
//     ops: { plus: { "20": { step: 1, rounds: 4, weak: 0, stars: { sehen: "2026-11-27" }, above: false,
//                            hinted: "2026-11-27", last: "2026-11-27" } } },
//     cards: { "plus:8,5": { box: 3, seen: "2026-11-27", n: 6, wrong: 1 } },
//     mistakes: { plus: [{ kind: "zehner", round: 12 }] },  rounds: 12,
//     platz: { stars: { 1: "2026-11-27" }, rounds: 3 },
//     daily: { "2026-11-27": { right, wrong, rounds } } }
//
// The rules (the plan "Rechen-Welt"):
// - All four number ranges are open from the start. Every child is offered "up to 10" first.
// - A star: one round with 4 of 5 right the first time, on the mixed sub-step. A star stays.
// - Five stars: the summit has its flag. A finished higher summit also fills the ones below it.
// - Sub-steps: in the first two rounds of a range, 3 right in a row move up at once (placement).
//   After that a good round (4 or 5 of 5) moves one sub-step up. Two weak rounds in a row, or a weak
//   round the child called "hard", move one sub-step down. Stars and flags are never lost.
// - Too high: two weak rounds in a row in a range whose lower summit has no flag give the child a
//   hint, at most once a day per range. Nothing moves by itself.

import { store } from "../../shared/store.js";
import * as profiles from "../../shared/profiles.js";
import { OPS, RANGES, STEPS, mixed } from "./tasks.js";

export const PERSPECTIVES = ["sehen", "machen", "forschen", "anwenden", "pruefen"];
export const STAR_SHARE = 0.8;
export const WEAK_SHARE = 0.4;
export const PLACEMENT_ROUNDS = 2;
export const PLACEMENT_STREAK = 3;
/** Days until a card in box 1 … 5 is due again. */
export const DUE_DAYS = [0, 1, 3, 7, 21];
/** Fast enough for box 4 and 5 (facts only), in milliseconds. */
export const FAST_MS = { plus: 4000, minus: 4000, mal: 5000, geteilt: 5000 };
/** A kind of mistake this often in the last two rounds: the next round starts with a bridge. */
export const BRIDGE_AFTER = 3;
export const DAYS_KEPT = 60;
/** The market square opens when plus and minus have finished "up to 10". */
export const PLATZ_NEEDS = ["plus", "minus"];

const key = (kidId = profiles.current()?.id) => `markt:${kidId || "guest"}`;

export function today(date = new Date()) {
  const z = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

export function all(kidId) {
  const rec = store.get(key(kidId), null);
  return rec && rec.v === 1 ? rec : { v: 1, ops: {}, cards: {}, mistakes: {}, rounds: 0, platz: { stars: {}, rounds: 0 }, daily: {} };
}

function update(change) {
  const rec = all();
  const out = change(rec);
  store.set(key(), rec);
  return out;
}

const empty = () => ({ step: 0, rounds: 0, weak: 0, stars: {}, above: false });
function cell(rec, op, range) {
  const ops = (rec.ops[op] ??= {});
  return (ops[range] ??= empty());
}
const peek = (rec, op, range) => rec.ops[op]?.[range] ?? empty();

export const step = (op, range) => Math.min(peek(all(), op, range).step, mixed(op, range));
export const isPlacement = (op, range) => peek(all(), op, range).rounds < PLACEMENT_ROUNDS;
export const won = (op, range, p, rec = all()) => Boolean(peek(rec, op, range).stars[p]) || peek(rec, op, range).above;
export const stars = (op, range, rec = all()) => PERSPECTIVES.filter((p) => won(op, range, p, rec)).length;
export const flag = (op, range, rec = all()) => stars(op, range, rec) === PERSPECTIVES.length;
/** The range a stand suggests: the smallest without its flag (every child starts at 10). */
export const suggestRange = (op, rec = all()) => RANGES.find((r) => !flag(op, r, rec)) ?? RANGES.at(-1);
/** The perspective a summit suggests: the first without a star. */
export const suggest = (op, range) => PERSPECTIVES.find((p) => !won(op, range, p)) ?? "anwenden";
/** The biggest finished range of an operation, or 0. */
export const finished = (op, rec = all()) => [...RANGES].reverse().find((r) => flag(op, r, rec)) ?? 0;

/** Moves the sub-step up by one right away (placement: 3 right in a row in the first rounds). */
export function stepUp(op, range) {
  return update((rec) => {
    const c = cell(rec, op, range);
    if (c.step < mixed(op, range)) c.step++;
    return c.step;
  });
}

function count(rec, what) {
  const daily = (rec.daily ??= {});
  const day = (daily[today()] ??= { right: 0, wrong: 0, rounds: 0 });
  day[what]++;
  for (const date of Object.keys(daily).sort().slice(0, -DAYS_KEPT)) delete daily[date];
}

/** One task done. first: right the first time. ms: time to the first answer. */
export function task(op, range, t, first, ms = 0) {
  update((rec) => {
    count(rec, first ? "right" : "wrong");
    cell(rec, op, range).last = today();
    if (!t?.key) return;
    const c = (rec.cards[t.key] ??= { box: 1, seen: null, n: 0, wrong: 0 });
    c.n++;
    c.seen = today();
    const fact = !t.key.includes(`:${t.range}:`);
    if (first) {
      const fastEnough = !fact || c.box < 3 || ms <= FAST_MS[t.op];
      if (fastEnough) c.box = Math.min(5, c.box + 1);
    } else {
      c.wrong++;
      c.box = c.box <= 3 ? 1 : c.box - 2;
    }
  });
}

/** How much a card should come now: new cards and low boxes high, cards seen recently low. */
export function cardScore(cardKey, rec = all()) {
  const c = rec.cards[cardKey];
  if (!c) return 2.5; // new: comes, but after cards that went wrong
  const age = c.seen ? daysBetween(c.seen, today()) : 99;
  const due = age >= DUE_DAYS[c.box - 1];
  return (due ? 3 : 0) + (5 - c.box) * 0.8 - (age === 0 && c.box > 1 ? 1 : 0);
}

/** A finished round. Returns what happened, for the round to say. */
export function round(op, range, p, { first, tasks }) {
  return update((rec) => {
    const c = cell(rec, op, range);
    const share = tasks ? first / tasks : 0;
    const good = share >= STAR_SHARE - 1e-9;
    const weak = share <= WEAK_SHARE + 1e-9;
    const atTop = c.step >= mixed(op, range);
    const out = { star: false, flag: false, moved: 0, tooHigh: false };
    rec.rounds = (rec.rounds || 0) + 1;
    c.rounds++;
    count(rec, "rounds");
    if (good && atTop && !c.stars[p] && !c.above) {
      c.stars[p] = today();
      out.star = true;
      if (PERSPECTIVES.every((q) => c.stars[q])) {
        out.flag = true;
        // A finished summit fills every summit below it.
        for (const lower of RANGES.filter((r) => r < range)) {
          const l = cell(rec, op, lower);
          if (!PERSPECTIVES.every((q) => l.stars[q])) l.above = true;
        }
      }
    }
    if (good && !atTop) {
      c.step++;
      out.moved = 1;
    }
    if (weak) {
      c.weak = (c.weak || 0) + 1;
      if (c.weak >= 2) {
        if (c.step > 0) {
          c.step--;
          out.moved = -1;
        }
        const below = RANGES[RANGES.indexOf(Number(range)) - 1];
        if (below && !flag(op, below, rec) && c.hinted !== today()) {
          out.tooHigh = true;
          c.hinted = today();
        }
        c.weak = 0;
      }
    } else c.weak = 0;
    c.lastWeak = weak;
    return out;
  });
}

/** What the child said after a round. "hard" after a weak round: one sub-step down. Returns -1 or 0. */
export function feel(op, range, how) {
  return update((rec) => {
    const c = cell(rec, op, range);
    c.feel = how;
    if (how === "hard" && c.lastWeak && c.step > 0) {
      c.step--;
      c.lastWeak = false;
      c.weak = 0;
      return -1;
    }
    return 0;
  });
}

export function mistake(op, kind) {
  if (!kind) return;
  update((rec) => {
    const list = (rec.mistakes[op] ??= []);
    list.push({ kind, round: rec.rounds || 0 });
    if (list.length > 30) list.splice(0, list.length - 30);
  });
}

/** The kind of mistake that came BRIDGE_AFTER times in the last two rounds, or null. */
export function bridge(op, rec = all()) {
  const since = (rec.rounds || 0) - 2;
  const counts = {};
  for (const m of rec.mistakes[op] ?? []) if (m.round >= since) counts[m.kind] = (counts[m.kind] || 0) + 1;
  const [kind, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return n >= BRIDGE_AFTER ? kind : null;
}

// ---------- The market square

/** Which operations the stories may use, with the biggest number: only finished summits. */
export function allowed(rec = all()) {
  const out = {};
  for (const op of OPS) {
    const f = finished(op, rec);
    if (f) out[op] = f;
  }
  return out;
}
export const platzOpen = (rec = all()) => PLATZ_NEEDS.every((op) => flag(op, 10, rec));
export const platzWon = (stage, rec = all()) => Boolean(rec.platz?.stars?.[stage]);
export function platzRound(stage, { first, tasks }) {
  return update((rec) => {
    rec.platz ??= { stars: {}, rounds: 0 };
    rec.platz.rounds++;
    rec.rounds = (rec.rounds || 0) + 1;
    count(rec, "rounds");
    if (tasks && first / tasks >= STAR_SHARE - 1e-9 && !rec.platz.stars[stage]) {
      rec.platz.stars[stage] = today();
      return true;
    }
    return false;
  });
}
export function platzTask(first, kind) {
  update((rec) => count(rec, first ? "right" : "wrong"));
  if (!first && kind) mistake("platz", kind);
}

// ---------- For the parents

/** Per stand: the summits with stars, the sub-step, the shaky facts and the most common mistake. */
export function report(kid) {
  const rec = all(kid?.id);
  const stands = OPS.map((op) => {
    const ranges = RANGES.map((range) => {
      const c = peek(rec, op, range);
      return { range, stars: stars(op, range, rec), flag: flag(op, range, rec), above: c.above, step: Math.min(c.step, mixed(op, range)), steps: mixed(op, range), stepId: STEPS[op][range][c.step] ?? "mixed", rounds: c.rounds, last: c.last ?? null };
    });
    const shaky = Object.entries(rec.cards)
      .filter(([k, c]) => k.startsWith(op + ":") && k.split(":")[1]?.includes(",") && c.box <= 2 && c.n >= 2)
      .sort((a, b) => a[1].box - b[1].box || b[1].wrong - a[1].wrong)
      .slice(0, 6)
      .map(([k]) => k);
    const facts = Object.entries(rec.cards).filter(([k]) => k.startsWith(op + ":") && k.split(":")[1].includes(","));
    const known = facts.filter(([, c]) => c.box >= 4).length;
    const week = (rec.rounds || 0) - 15;
    const counts = {};
    for (const m of rec.mistakes[op] ?? []) if (m.round >= week) counts[m.kind] = (counts[m.kind] || 0) + 1;
    const common = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const played = ranges.some((r) => r.rounds);
    return { op, ranges, shaky, known, facts: facts.length, mistake: common && common[1] >= 2 ? common[0] : null, played };
  });
  const platz = { stages: Object.keys(rec.platz?.stars ?? {}).map(Number), rounds: rec.platz?.rounds ?? 0, open: platzOpen(rec) };
  return { stands, platz, daily: rec.daily || {} };
}

export function reset(kidId) {
  store.remove(key(kidId));
}
