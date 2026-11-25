// How the level follows the child. The same rule for every game; the numbers are all here.
//
//   import * as adapt from "../../shared/adapt.js";
//   const play = adapt.player(ID, LEVELS);
//   play.level            → index of the level for the next task (read it when a task starts)
//   play.answer(right)    → after every answer (saves it with progress.answer)
//   play.solved()         → when a task is done (one star)
//   play.round()          → when a round is done (5 stars): moves up, down or stays; returns +1 / 0 / -1
//
// A task counts as "right the first time" when there was no wrong answer before it was solved.
// A round is "good" when 4 or 5 of 5 tasks were right the first time.
//
// 1. Placement: in a child's first rounds of a game, 3 tasks right the first time in a row
//    → one level up at once. Only up to the levels made for the child's age (fit.ageTop), so a
//    child who started too low (fit.js starts generously) gets there within a few minutes.
// 2. After every round: good → up. 2 or fewer of 5 → down. 3 → stay.
// 3. Levels made for older children (their "age" in levels.js is above the child's age) need more:
//    - GOOD_ROUNDS good rounds in a row on the level below, on at least two different days, and
//    - into a bigger number range (levels.js "range": 5 → 10 → 20): RANGE_ROUNDS rounds in the
//      range before. A child of 5 plays at least 20 rounds up to 10 before sums go above 10.
// 4. Age ceiling: at most levels made for children AHEAD years older (fit.ceiling). The parents can
//    open the harder levels on /eltern/. A child above the ceiling (older data) moves back down to it.
// 5. Always: 3 wrong answers in a row → the next task is one level easier (only that one task),
//    so a child who is stuck gets a success before going on.
// The level never goes below the first or above the ceiling. Without an age, 3 and 4 don't apply.

import * as progress from "./progress.js";
import { age, current } from "./profiles.js";
import { ageTop, ceiling } from "./fit.js";

/** Rounds at the start of a game in which placement moves up quickly. */
export const PLACEMENT_ROUNDS = 2;
/** Tasks right the first time in a row that move up during placement. */
export const PLACEMENT_STREAK = 3;
/** Share of tasks right the first time for up (4 of 5) and for down (2 of 5). */
export const UP_SHARE = 0.8;
export const DOWN_SHARE = 0.4;
/** Wrong answers in a row after which the next task is one level easier. */
export const EASIER_AFTER = 3;
/** Above the child's age: good rounds in a row (on two different days) before going up. */
export const GOOD_ROUNDS = 2;
/** Above the child's age: rounds in a number range before going into a bigger one. */
export const RANGE_ROUNDS = 20;

export function player(id, levels) {
  const kid = current();
  const childAge = age(kid);
  const top = ageTop(levels, kid);
  const ceil = ceiling(levels, kid, id);
  const clamp = (i) => Math.min(ceil, Math.max(0, i));
  let base = progress.level(id, levels);
  if (base > ceil) {
    base = ceil;
    progress.setLevel(id, base, levels);
  }
  let missed = false; // a wrong answer in this task
  let wrongInRow = 0;
  let rightInRow = 0; // tasks right the first time in a row
  let easyNext = false;
  let easyNow = false;
  let results = []; // this round: right the first time?

  /** May a good round (just finished) move the child from "from" one level up? */
  function mayGoUp(from) {
    const next = from + 1;
    if (next > ceil) return false;
    if (childAge === null || (levels[next].age ?? 0) <= childAge) return true;
    const g = progress.game(id) || {};
    const good = [...(g.good || []), progress.today()];
    if (good.length < GOOD_ROUNDS || new Set(good).size < 2) return false;
    const range = levels[from].range;
    if (range && levels[next].range > range && (g.ranges?.[range] || 0) + 1 < RANGE_ROUNDS) return false;
    return true;
  }

  return {
    get level() {
      return easyNow ? clamp(base - 1) : base;
    },

    answer(right) {
      progress.answer(id, right);
      if (right) {
        wrongInRow = 0;
        return;
      }
      missed = true;
      if (++wrongInRow >= EASIER_AFTER) {
        easyNext = true;
        wrongInRow = 0;
      }
    },

    solved() {
      const first = !missed;
      missed = false;
      results.push(first);
      progress.task(id, first);
      easyNow = easyNext;
      easyNext = false;
      rightInRow = first ? rightInRow + 1 : 0;
      if (rightInRow >= PLACEMENT_STREAK && progress.rounds(id) < PLACEMENT_ROUNDS && base < Math.min(top, ceil)) {
        base++;
        rightInRow = 0;
        progress.setLevel(id, base, levels);
      }
    },

    round() {
      const share = results.length ? results.filter(Boolean).length / results.length : 0;
      const good = share >= UP_SHARE;
      const before = base;
      if (good && mayGoUp(base)) base++;
      else if (share <= DOWN_SHARE) base = clamp(base - 1);
      progress.round(id, base, levels, { played: before, good });
      results = [];
      missed = easyNow = easyNext = false;
      wrongInRow = rightInRow = 0;
      return base - before;
    },
  };
}
