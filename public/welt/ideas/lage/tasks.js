// The tasks of the idea "Lage": where is it? On, under, next to, in front of, behind, left, right,
// between. Animals around a table and on a bench. Hill and lake on the map (preschool).
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = level 1, 2 or 3:
//     1  auf, unter, neben                    2 animals
//     2  also vor, hinter                     3 animals
//     3  links and rechts instead of neben    3 animals, the bench with 5
//
//   Spots around the table: auf, unter, links, rechts, vor, hinter. The word "neben" means links or rechts.
//
//   sehen     { asked, pets: [{ pet, spot }] }      "Who is under the table?" pets[0] is the right one
//   machen    { asked, pet, spots }                 an animal waits: put it there (tap a place; not vor, hinter)
//   forschen  { pets: [{ pet, spot }], answer, choices }   "Where is the rabbit (pets[0])?" pick the word
//   anwenden  { ask, pets, target, of }             the bench: ask "zwischen" | "links" | "rechts";
//                                                   pets left to right; target = index of the right one
//   pruefen   { pets: [{ pet, spot }], said, answer, right, choices }  the owl: "pets[0] is `said`"
//   key – short text that tells tasks apart.
//
// This is the idea of the old game "Wo ist es?", in the frame of the new world.

export const PETS = ["rabbit", "cat", "dog", "bear", "fox", "frog", "duck", "mouse", "pig", "panda", "lion"];
export const ICONS = { rabbit: "🐰", cat: "🐱", dog: "🐶", bear: "🐻", fox: "🦊", frog: "🐸", duck: "🦆", mouse: "🐭", pig: "🐷", panda: "🐼", lion: "🦁", owl: "🦉" };

/** The words of each level. */
export const WORDS = {
  1: ["auf", "unter", "neben"],
  2: ["auf", "unter", "neben", "vor", "hinter"],
  3: ["auf", "unter", "vor", "hinter", "links", "rechts"],
};
const PETS_AT = { 1: 2, 2: 3, 3: 3 };
const BENCH = { 1: 3, 2: 4, 3: 5 };
export const SIDES = ["links", "rechts"];
// Spots that would cover each other: never both in one picture.
const CLASH = { auf: ["hinter"], hinter: ["auf"], unter: ["vor"], vor: ["unter"] };
// The word an owl mixes up with a word.
const MIXUP = { auf: "unter", unter: "auf", vor: "hinter", hinter: "vor", links: "rechts", rechts: "links", neben: "auf" };

const levelOf = (range) => (WORDS[range] ? range : 1);
/** Where an animal can sit for these words. */
export const spotsFor = (words) => [...new Set(words.flatMap((w) => (w === "neben" ? SIDES : [w])))];
/** Does the spot fit the word? */
export const fits = (spot, word) => spot === word || (word === "neben" && SIDES.includes(spot));
/** The word for a spot at this level: before level 3, left and right are both "neben". */
export const wordOf = (spot, L) => (L < 3 && SIDES.includes(spot) ? "neben" : spot);

/** Animals around the table: the first sits at `first`, the others at other spots that fit no word of
 *  the first one and do not cover each other. Only one animal next to the table before level 3. */
function around(L, r, first) {
  const taken = [first];
  for (const spot of r.shuffle(spotsFor(WORDS[L]))) {
    if (taken.length >= PETS_AT[L]) break;
    if (taken.includes(spot) || taken.some((t) => CLASH[t]?.includes(spot))) continue;
    if (wordOf(spot, L) === wordOf(first, L)) continue;
    if (L < 3 && SIDES.includes(spot) && taken.some((t) => SIDES.includes(t))) continue;
    taken.push(spot);
  }
  const pets = r.sample(PETS, taken.length);
  return taken.map((spot, i) => ({ pet: pets[i], spot }));
}

const spotFor = (word, r) => (word === "neben" ? r.pick(SIDES) : word);

/** Three words to choose from (two at level 1 is too easy: all three there). */
function choicesFor(L, answer, r, also) {
  const others = r.shuffle(WORDS[L].filter((w) => w !== answer && w !== also));
  return r.shuffle([answer, ...(also && also !== answer ? [also] : []), ...others].slice(0, 3));
}

const makers = {
  sehen(L, r) {
    const asked = r.pick(WORDS[L]);
    const pets = around(L, r, spotFor(asked, r));
    return { asked, pets, key: `${asked} ${pets[0].pet}` };
  },
  machen(L, r) {
    // In front of and behind would cover the places on and under the table: not to put here.
    const words = WORDS[L].filter((w) => w !== "vor" && w !== "hinter");
    const asked = r.pick(words);
    return { asked, pet: r.pick(PETS), spots: spotsFor(words), key: `${asked}` };
  },
  forschen(L, r) {
    const answer = r.pick(WORDS[L]);
    const pets = around(L, r, spotFor(answer, r));
    return { pets, answer, choices: choicesFor(L, answer, r, MIXUP[answer]), key: `${answer} ${pets[0].pet}` };
  },
  anwenden(L, r) {
    const n = BENCH[L];
    const pets = r.sample(PETS, n);
    const ask = L < 3 ? "zwischen" : r.pick(["zwischen", "links", "rechts"]);
    const target = ask === "zwischen" ? r.int(1, n - 2) : ask === "links" ? r.int(0, n - 2) : r.int(1, n - 1);
    // of: the animal(s) the question names
    const of = ask === "zwischen" ? [target - 1, target + 1] : ask === "links" ? [target + 1] : [target - 1];
    return { ask, pets, target, of, key: `${ask} ${pets[target]}` };
  },
  pruefen(L, r) {
    const answer = r.pick(WORDS[L]);
    const pets = around(L, r, spotFor(answer, r));
    const right = r.chance(0.4);
    let said = answer;
    if (!right) {
      const mix = MIXUP[answer];
      said = WORDS[L].includes(mix) ? mix : r.pick(WORDS[L].filter((w) => w !== answer));
    }
    return { pets, answer, said, right, choices: choicesFor(L, answer, r, right ? null : said), key: `${answer} ${said} ${pets[0].pet}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`lage: unknown perspective ${level.p}`);
  const L = levelOf(level.range);
  return { p: level.p, level: L, ...make(L, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const L = levelOf(level.range);
  const problems = [];
  const table = (pets, word) => {
    const spots = pets.map((p) => p.spot);
    if (new Set(spots).size !== spots.length) problems.push("two animals on one spot");
    if (new Set(pets.map((p) => p.pet)).size !== pets.length) problems.push("the same animal twice");
    if (spots.some((s) => spots.some((o) => CLASH[s]?.includes(o)))) problems.push("animals cover each other");
    if (spots.filter((s) => fits(s, word) || wordOf(s, L) === word).length !== 1) problems.push("not one animal for the word");
    if (!fits(pets[0].spot, word) && wordOf(pets[0].spot, L) !== word) problems.push("the first animal is not there");
    if (spots.some((s) => !spotsFor(WORDS[L]).includes(s))) problems.push("a spot of another level");
  };
  if (level.p === "sehen") table(t.pets, t.asked);
  if (level.p === "machen" && !t.spots.some((s) => fits(s, t.asked))) problems.push("no place fits");
  if (level.p === "forschen" || level.p === "pruefen") {
    table(t.pets, t.answer);
    if (!t.choices.includes(t.answer) || new Set(t.choices).size !== t.choices.length) problems.push("choices");
    if (t.choices.some((w) => !WORDS[L].includes(w))) problems.push("a word of another level");
  }
  if (level.p === "pruefen" && (t.said === t.answer) !== t.right) problems.push("right does not match");
  if (level.p === "anwenden") {
    const n = t.pets.length;
    const ok = t.ask === "zwischen" ? t.target > 0 && t.target < n - 1 : t.ask === "links" ? t.target < n - 1 : t.target > 0;
    if (!ok || new Set(t.pets).size !== n) problems.push("bench");
  }
  return problems;
}
