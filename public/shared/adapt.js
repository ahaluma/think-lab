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
//
// 1. Placement: in a child's first rounds of a game, 3 tasks right the first time in a row
//    → one level up at once. So a child who started too low (fit.js starts generously) gets
//    to the right level within a few minutes.
// 2. After every round: 4 or 5 of 5 right the first time → up. 2 or fewer → down. 3 → stay.
// 3. Always: 3 wrong answers in a row → the next task is one level easier (only that one task),
//    so a child who is stuck gets a success before going on.
// The level never goes below the first or above the last level.

import * as progress from "./progress.js";

/** Rounds at the start of a game in which placement moves up quickly. */
export const PLACEMENT_ROUNDS = 2;
/** Tasks right the first time in a row that move up during placement. */
export const PLACEMENT_STREAK = 3;
/** Share of tasks right the first time for up (4 of 5) and for down (2 of 5). */
export const UP_SHARE = 0.8;
export const DOWN_SHARE = 0.4;
/** Wrong answers in a row after which the next task is one level easier. */
export const EASIER_AFTER = 3;

export function player(id, levels) {
  const last = levels.length - 1;
  const clamp = (i) => Math.min(last, Math.max(0, i));
  let base = progress.level(id, levels);
  let missed = false; // a wrong answer in this task
  let wrongInRow = 0;
  let rightInRow = 0; // tasks right the first time in a row
  let easyNext = false;
  let easyNow = false;
  let results = []; // this round: right the first time?

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
      if (rightInRow >= PLACEMENT_STREAK && progress.rounds(id) < PLACEMENT_ROUNDS && base < last) {
        base++;
        rightInRow = 0;
        progress.setLevel(id, base, levels);
      }
    },

    round() {
      const share = results.length ? results.filter(Boolean).length / results.length : 0;
      const change = share >= UP_SHARE ? 1 : share <= DOWN_SHARE ? -1 : 0;
      const before = base;
      base = clamp(base + change);
      progress.round(id, base, levels);
      results = [];
      missed = easyNow = easyNext = false;
      wrongInRow = rightInRow = 0;
      return base - before;
    },
  };
}
