// Which games and levels fit a child. The numbers that decide it are all here.
//
//   import * as fit from "/shared/fit.js";
//   fit.visible(game, kid)    → show this game on the child's start page?
//   fit.startLevel(LEVELS, kid) → index of the level a child starts with (first time in a game)
//   fit.why(game, kid)        → "moved" / "young" / "old" / null: why a game is hidden
//   fit.ageTop(LEVELS, kid)   → index of the last level made for the child's age (quick placement stops here)
//   fit.ceiling(LEVELS, kid, gameId) → index of the hardest level the child may reach (age + AHEAD,
//                               or all levels when the parents opened them on /eltern/)
//
// Generous on purpose: some children are older but not as far yet. They start low and move up
// quickly (see the adaptation in progress.js), and easy games stay visible a little longer.

import { age } from "./profiles.js";

/** Start this many years below the child's age. */
export const START_BELOW = 2;

/** Games for younger children stay visible this many years past their last age. */
export const EASY_GRACE = 2;

/** Levels made for children up to this many years older can be reached. Harder ones only when
 *  the parents open them on /eltern/ (kid.harder[gameId]). */
export const AHEAD = 1;

/** "moved": the game's idea is played in the new world now (catalog.js); "young": the child is younger
 *  than the game; "old": the game is too easy now; null: it fits. */
export function why(game, kid) {
  if (game.moved) return "moved";
  const a = age(kid);
  if (a === null || !game.ages) return null;
  const [min, max] = game.ages;
  if (a < min) return "young";
  if (a > max + EASY_GRACE) return "old";
  return null;
}

/** Parents' choice first, then the age. Without a child (or without an age): every game that has not moved. */
export function visible(game, kid) {
  const choice = kid?.games?.[game.id];
  if (choice === true || choice === false) return choice;
  return why(game, kid) === null;
}

/** The highest level made for a child START_BELOW years younger. Without an age: the first level. */
export function startLevel(levels, kid) {
  const a = age(kid);
  if (a === null) return 0;
  let index = 0;
  levels.forEach((l, i) => {
    if ((l.age ?? 0) <= a - START_BELOW) index = i;
  });
  return index;
}

/** The last level made for the child's age. Younger than every level: the first. Without an age: the last. */
export function ageTop(levels, kid) {
  return lastUpTo(levels, age(kid));
}

/** The hardest level the child may reach: up to AHEAD years above the age. Without an age, or opened
 *  by the parents: the last level. */
export function ceiling(levels, kid, gameId) {
  const a = age(kid);
  if (a === null || kid?.harder?.[gameId]) return levels.length - 1;
  return lastUpTo(levels, a + AHEAD);
}

function lastUpTo(levels, a) {
  if (a === null) return levels.length - 1;
  let index = 0;
  levels.forEach((l, i) => {
    if ((l.age ?? 0) <= a) index = i;
  });
  return index;
}
