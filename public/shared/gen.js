// Task generators: every task of a game comes from one small function, so each round is new.
//
// The rule for every game that has tasks (rounds) to make:
//
//   games/<id>/tasks.js   – export function task(level, r, …) → one task as plain data
//                           (numbers, ids, places; no DOM, no texts). The level is the object
//                           from levels.js, r is the random kit below (never Math.random).
//                           Optionally: export function check(task, level) → a list of problems
//                           (empty = fine). tools/check-tasks.mjs runs it on many tasks per level.
//   games/<id>/game.js    – const next = gen.generator(task, { avoid: { … } });
//                           const t = next(LEVELS[play.level]);   then draws t.
//
// tasks.js imports only this file (and data files like levels.js), so it also runs without a
// browser: node tools/check-tasks.mjs.
//
//   import * as gen from "../../shared/gen.js";
//   gen.kit(seed?)              → r: { random, int, pick, shuffle, sample, chance }, all from one
//                                 random source. With a seed the same seed gives the same tasks.
//   gen.generator(make, opts)   → next(level, …extra): a new task from make(level, r, …extra)
//                                 that is not too much like the last ones (opts.avoid).
//   gen.seed()                  → the number in ?seed=123 of the page address, or undefined.
//
// opts.avoid says which fields of a task must differ from the recent tasks, and for how many:
//   { thing: 3, count: 1 }  → not the same thing as in the last 3 tasks, not the same count as last
// A field can hold a number, a string or a list (compared as text). If no new task fits after
// opts.tries (30) attempts – a tiny level has only so many tasks – the one with the fewest
// clashes is used, so next() always returns a task.
//
// Testing: open a game with ?seed=7 (e.g. /games/zahlenzug/?seed=7) and it deals the same tasks
// every time, handy to reproduce a bug. Without a seed every game is different.

/** A random source from a seed (mulberry32): the same seed, the same numbers. No seed: Math.random. */
export function random(seed) {
  if (seed === undefined || seed === null || Number.isNaN(+seed)) return Math.random;
  let s = +seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The random helpers, all from one source. Same names as in kit.js, so tasks read the same. */
export function kit(seed) {
  const rnd = typeof seed === "function" ? seed : random(seed);
  const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return {
    random: rnd,
    int, // whole number from min to max, both included
    pick, // one item of a list
    shuffle, // a new list in random order
    sample: (list, n) => shuffle(list).slice(0, n), // n different items of a list
    chance: (p) => rnd() < p, // true with probability p (0.25 = one in four)
  };
}

/** ?seed=123 in the page address, for testing. */
export function seed() {
  if (typeof location === "undefined") return undefined;
  const s = new URLSearchParams(location.search).get("seed");
  return s === null || s === "" || Number.isNaN(+s) ? undefined : +s;
}

const same = (a, b) => (typeof a === "object" || typeof b === "object" ? JSON.stringify(a) === JSON.stringify(b) : a === b);

/** next(level, …extra) → a new task from make(level, r, …extra), unlike the recent ones (opts.avoid). */
export function generator(make, { avoid = {}, tries = 30, seed: s = seed(), r = kit(s) } = {}) {
  const fields = Object.entries(avoid);
  const keep = Math.max(0, ...fields.map(([, n]) => n));
  const recent = []; // newest first

  const clashes = (t) => {
    let n = 0;
    for (const [field, last] of fields) {
      for (let i = 0; i < Math.min(last, recent.length); i++) if (same(t[field], recent[i][field])) n++;
    }
    return n;
  };

  const next = (level, ...extra) => {
    let best = null, bestClashes = Infinity;
    for (let i = 0; i < tries && bestClashes > 0; i++) {
      const t = make(level, r, ...extra);
      const c = clashes(t);
      if (c < bestClashes) [best, bestClashes] = [t, c];
    }
    recent.unshift(best);
    recent.length = Math.min(recent.length, keep);
    return best;
  };
  next.r = r; // the same random kit, for anything else the game shuffles
  next.forget = () => (recent.length = 0); // e.g. when a new round starts and repeats don't matter
  return next;
}
