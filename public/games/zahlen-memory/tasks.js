// The boards of "Zahlen-Memory": one function makes one board (see shared/gen.js).
//
//   task(level, r, thingIds?) → { open, cards, key }
//     open  – the cards lie open (level.open) or face down
//     cards – the cards in board order: { n, kind: "number" | "things", thing }
//             For each of level.pairs different numbers (1 … level.max) one number card and one card
//             with that many things; every pair has its own thing (id from shared/things.js).
//     key   – the numbers on the board, smallest first, for "not the same board again"

import { THING_IDS } from "../../shared/things.js";

export function task(level, r, thingIds = THING_IDS) {
  const numbers = r.sample([...Array(level.max).keys()].map((i) => i + 1), level.pairs);
  const pics = r.sample(thingIds, level.pairs);
  const cards = r.shuffle(numbers.flatMap((n, i) => [{ n, kind: "number" }, { n, kind: "things", thing: pics[i] }]));
  return { open: level.open, cards, key: [...numbers].sort((a, b) => a - b).join() };
}

/** Problems with a board (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (t.open !== level.open) problems.push("wrong open");
  if (t.cards.length !== 2 * level.pairs) problems.push("wrong number of cards");
  const numbers = t.cards.filter((c) => c.kind === "number").map((c) => c.n);
  const pics = t.cards.filter((c) => c.kind === "things");
  if (new Set(numbers).size !== level.pairs || numbers.some((n) => n < 1 || n > level.max)) problems.push("bad numbers");
  if (pics.map((c) => c.n).sort().join() !== [...numbers].sort().join()) problems.push("a number has no picture card");
  if (new Set(pics.map((c) => c.thing)).size !== level.pairs) problems.push("two pairs with the same thing");
  return problems;
}
