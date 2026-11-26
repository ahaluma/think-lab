// The tasks of "Gleich machen": one function makes one task (see shared/gen.js).
//
//   task(level, r, animalIds?) → { way, big, small, answer, bigSide, slots, places, animal, choices, key }
//     way     – "weg" (the bigger meadow sends animals home) or "dazu" (the smaller one gets more);
//               "mix" levels pick one
//     big     – animals on the bigger meadow, small – on the smaller one; answer = big − small
//     bigSide – 0: the upper meadow has more, 1: the lower one
//     slots   – places per meadow: 10 (5 × 2) or 20 (10 × 2, levels above 10)
//     places  – for each meadow, which places hold an animal
//     animal  – id of the animal (shared/things.js), one that can stand on a meadow
//     choices – three number buttons, smallest first: the answer and typical mistakes
//               (what is left, one more or one less); only used with input "number"
//     key     – short text that tells tasks apart, for "not the same task again"

// Only animals that can stand on a meadow (no fruit, cars or fish).
export const ON_MEADOW = ["rabbit", "fox", "panda", "lion", "elephant", "giraffe", "unicorn", "duck", "penguin", "frog",
  "turtle", "snail", "ladybird", "butterfly", "owl", "kangaroo", "dinosaur", "rhino", "ant", "crocodile"];

/** The answer and two typical mistakes (what is left, one more or one less), smallest first. */
function choices(r, answer, small, big) {
  const ok = (n) => n >= 1 && n <= 20 && n !== answer;
  const likely = r.shuffle([small, answer + 1, answer - 1].filter(ok));
  const more = [answer + 2, answer - 2, big].filter(ok);
  const picked = [...new Set([...likely, ...more])].slice(0, 2);
  return [answer, ...picked].sort((x, y) => x - y);
}

export function task(level, r, animalIds = ON_MEADOW) {
  const way = level.way === "mix" ? r.pick(["weg", "dazu"]) : level.way;
  const answer = r.int(level.diff[0], Math.min(level.diff[1], level.max - 1));
  const small = r.int(1, level.max - answer);
  const big = small + answer;
  const bigSide = r.int(0, 1);
  const slots = level.max > 10 ? 20 : 10;
  const places = [0, 1].map((m) => r.sample([...Array(slots).keys()], m === bigSide ? big : small));
  return {
    way, big, small, answer, bigSide, slots, places,
    animal: r.pick(animalIds),
    choices: choices(r, answer, small, big),
    key: `${way}${big}-${small}`,
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (level.way !== "mix" && t.way !== level.way) problems.push("wrong way");
  if (t.answer !== t.big - t.small) problems.push("answer ≠ big − small");
  if (t.answer < level.diff[0] || t.answer > level.diff[1]) problems.push("difference outside level");
  if (t.small < 1 || t.big > level.max) problems.push("amount outside 1–max");
  if (t.big > t.slots) problems.push("more animals than places");
  t.places.forEach((p, m) => {
    const n = m === t.bigSide ? t.big : t.small;
    if (p.length !== n || new Set(p).size !== n || p.some((s) => s < 0 || s >= t.slots)) problems.push("bad places");
  });
  if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
  if (!t.choices.includes(t.answer)) problems.push("answer missing in choices");
  if (t.choices.some((n) => n < 1 || n > 20)) problems.push("choice outside 1–20");
  return problems;
}
