// The tasks of "Zahlenhaus": one function makes one task (see shared/gen.js).
//
//   task(level, r, animalIds?) → { animal, total, inside, hidden, going, choices, key }
//     animal  – id of the animal (shared/things.js), one that can walk into a house
//     total   – animals in all (level.total)
//     inside  – how many go into the house (1 … total − 1)
//     hidden  – the house stays closed (level.hidden)
//     going   – which animals of the yard walk in (their places, 0 … total − 1)
//     choices – three buttons for each question, smallest first:
//               { first, inside, outside } (open house) or { first, hidden } (closed house)
//     key     – the split, e.g. "5:2", for "not the same task again"

export const MAX = 10;

// Only animals that can walk into a house.
export const WALKERS = ["rabbit", "duck", "ladybird", "snail", "elephant", "rhino", "unicorn", "giraffe", "lion", "dinosaur",
  "turtle", "penguin", "frog", "owl", "kangaroo", "crocodile", "ant", "fox", "panda", "butterfly", "crab"];

/** Three choices: the right one, the usual mix-ups (in random order) and neighbours, smallest first. */
function choices(r, right, mixUps) {
  const out = new Set([right]);
  for (const n of r.shuffle(mixUps)) if (out.size < 3 && n !== right) out.add(n);
  while (out.size < 3) {
    const near = right + r.int(-2, 2);
    if (near >= 1 && near <= MAX) out.add(near);
  }
  return [...out].sort((a, b) => a - b);
}

export function task(level, r, animalIds = WALKERS) {
  const total = r.int(...level.total);
  const inside = r.int(1, total - 1);
  const outside = total - inside;
  const first = choices(r, total, []);
  // Common mix-ups: the number outside (or inside) and the number of all.
  const c = level.hidden
    ? { first, hidden: choices(r, inside, [outside, total]) }
    : { first, inside: choices(r, inside, [outside, total]), outside: choices(r, outside, [inside, total]) };
  return {
    animal: r.pick(animalIds),
    total,
    inside,
    hidden: level.hidden,
    going: r.sample([...Array(total).keys()], inside),
    choices: c,
    key: `${total}:${inside}`,
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (t.total < level.total[0] || t.total > level.total[1]) problems.push("total outside level");
  if (t.inside < 1 || t.inside > t.total - 1) problems.push("nobody inside or nobody outside");
  if (t.hidden !== level.hidden) problems.push("wrong house");
  if (t.going.length !== t.inside || new Set(t.going).size !== t.inside || t.going.some((i) => i < 0 || i >= t.total)) problems.push("bad going");
  const rights = t.hidden ? { first: t.total, hidden: t.inside } : { first: t.total, inside: t.inside, outside: t.total - t.inside };
  if (Object.keys(t.choices).sort().join() !== Object.keys(rights).sort().join()) problems.push("wrong questions");
  for (const [q, right] of Object.entries(rights)) {
    const c = t.choices[q] || [];
    if (c.length !== 3 || new Set(c).size !== 3) problems.push(`${q}: not three different choices`);
    if (!c.includes(right)) problems.push(`${q}: answer missing`);
    if (c.some((n) => n < 1 || n > MAX)) problems.push(`${q}: choice outside 1–10`);
  }
  return problems;
}
