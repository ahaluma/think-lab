// The tasks of the idea "Sortieren": what belongs together? Sorting by kind, colour and size,
// the odd one out, finding the rule (preschool). The sky on the map ("Himmel": data).
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = level 1, 2 or 3:
//     1  by kind: animal or fruit, animal or vehicle (two baskets)
//     2  also by colour: red or yellow, red or green
//     3  also big or small animal, and three baskets
//
//   A rule: { attr: "k" | "c" | "s", groups: [...] }. A thing: index into ITEMS.
//
//   sehen     { rule, thing, answer }               one thing: which basket? (answer = group index)
//   machen    { rule, things, answers }             six things, one after the other into the baskets
//   forschen  { rule, things, odd }                 four things: which one does not fit? (odd = index)
//   anwenden  { rule, baskets: [[things]], thing, answer }  sorted baskets without a sign: where does
//                                                   the new thing go? The child finds the rule.
//   pruefen   { rule, baskets: [[things]], wrong }  the owl sorted. wrong = [basket, place] of the thing
//                                                   in the wrong basket, or null: all right
//   key – short text that tells tasks apart.
//
// This is the idea of the old game "Sortieren", in the frame of the new world. The harder rules
// (colour first, then kind; hidden rules) are for school children and are not part of it.

/** Things with their kind (k), colour (c) and size of an animal (s). */
export const ITEMS = [
  { i: "🐘", k: "animal", s: "big" }, { i: "🦒", k: "animal", s: "big" }, { i: "🦏", k: "animal", s: "big" },
  { i: "🐄", k: "animal", s: "big" }, { i: "🐎", k: "animal", s: "big" }, { i: "🦛", k: "animal", s: "big" },
  { i: "🐻", k: "animal", s: "big" }, { i: "🦁", k: "animal", s: "big" },
  { i: "🐜", k: "animal", s: "small" }, { i: "🐞", k: "animal", s: "small", c: "red" }, { i: "🐌", k: "animal", s: "small" },
  { i: "🦋", k: "animal", s: "small" }, { i: "🐸", k: "animal", s: "small", c: "green" }, { i: "🐭", k: "animal", s: "small" },
  { i: "🐝", k: "animal", s: "small", c: "yellow" }, { i: "🐥", k: "animal", s: "small", c: "yellow" },
  { i: "🐛", k: "animal", s: "small", c: "green" }, { i: "🦀", k: "animal", s: "small", c: "red" },
  { i: "🐼", k: "animal" }, { i: "🦊", k: "animal" }, { i: "🐰", k: "animal" }, { i: "🐢", k: "animal", c: "green" },
  { i: "🍎", k: "fruit", c: "red" }, { i: "🍓", k: "fruit", c: "red" }, { i: "🍒", k: "fruit", c: "red" },
  { i: "🍌", k: "fruit", c: "yellow" }, { i: "🍋", k: "fruit", c: "yellow" }, { i: "🍏", k: "fruit", c: "green" },
  { i: "🍐", k: "fruit", c: "green" }, { i: "🍇", k: "fruit" }, { i: "🍊", k: "fruit" }, { i: "🍉", k: "fruit" }, { i: "🍍", k: "fruit" },
  { i: "🚗", k: "vehicle", c: "red" }, { i: "🚒", k: "vehicle", c: "red" }, { i: "🚕", k: "vehicle", c: "yellow" },
  { i: "🚜", k: "vehicle" }, { i: "🚂", k: "vehicle" }, { i: "✈️", k: "vehicle" }, { i: "🚲", k: "vehicle" },
  { i: "🚌", k: "vehicle" }, { i: "🚁", k: "vehicle" }, { i: "🚙", k: "vehicle", c: "blue" },
  { i: "🌹", k: "flower", c: "red" }, { i: "🌻", k: "flower", c: "yellow" }, { i: "🌼", k: "flower", c: "yellow" },
  { i: "🎈", c: "red" }, { i: "🍅", c: "red" }, { i: "⭐", c: "yellow" }, { i: "🌽", c: "yellow" },
  { i: "🥒", c: "green" }, { i: "🥦", c: "green" }, { i: "🍀", c: "green" }, { i: "🌵", c: "green" },
];

export const RULES = {
  tierObst: { attr: "k", groups: ["animal", "fruit"] },
  tierFahrzeug: { attr: "k", groups: ["animal", "vehicle"] },
  obstBlume: { attr: "k", groups: ["fruit", "flower"] },
  rotGelb: { attr: "c", groups: ["red", "yellow"] },
  rotGruen: { attr: "c", groups: ["red", "green"] },
  grossKlein: { attr: "s", groups: ["big", "small"] },
  dreiArten: { attr: "k", groups: ["animal", "fruit", "vehicle"] },
  dreiFarben: { attr: "c", groups: ["red", "yellow", "green"] },
};
const RULES_AT = {
  1: ["tierObst", "tierFahrzeug"],
  2: ["tierObst", "tierFahrzeug", "obstBlume", "rotGelb", "rotGruen"],
  3: ["rotGelb", "rotGruen", "grossKlein", "dreiArten", "dreiFarben"],
};
/** Rules for the odd one out and for finding the rule (two groups only). */
const TWO_AT = { 1: ["tierObst", "tierFahrzeug"], 2: ["tierObst", "tierFahrzeug", "rotGelb", "rotGruen"], 3: ["rotGelb", "rotGruen", "grossKlein", "obstBlume"] };

const levelOf = (range) => (RULES_AT[range] ? range : 1);
/** The things (indexes) of one group of a rule. */
export const groupOf = (rule, g) => ITEMS.map((x, i) => (x[RULES[rule].attr] === RULES[rule].groups[g] ? i : -1)).filter((i) => i >= 0);
/** The group of a thing under a rule (-1: none). */
export const groupFor = (rule, thing) => RULES[rule].groups.indexOf(ITEMS[thing][RULES[rule].attr]);

const makers = {
  sehen(L, r) {
    const rule = r.pick(RULES_AT[L]);
    const answer = r.int(0, RULES[rule].groups.length - 1);
    const thing = r.pick(groupOf(rule, answer));
    return { rule, thing, answer, key: `${rule}${thing}` };
  },
  machen(L, r) {
    const rule = r.pick(RULES_AT[L]);
    const n = RULES[rule].groups.length;
    const per = n === 3 ? 2 : 3;
    const things = r.shuffle(RULES[rule].groups.flatMap((_, g) => r.sample(groupOf(rule, g), per)));
    return { rule, things, answers: things.map((t) => groupFor(rule, t)), key: `${rule}${things.join(".")}` };
  },
  forschen(L, r) {
    const rule = r.pick(TWO_AT[L]);
    const [g, o] = r.shuffle([0, 1]);
    const things = r.shuffle([...r.sample(groupOf(rule, g), 3), r.pick(groupOf(rule, o))]);
    const odd = things.findIndex((t) => groupFor(rule, t) === o);
    return { rule, things, odd, key: `${rule}${things[odd]}` };
  },
  anwenden(L, r) {
    const rule = r.pick(TWO_AT[L]);
    const baskets = [0, 1].map((g) => r.sample(groupOf(rule, g), 3));
    const answer = r.int(0, 1);
    const thing = r.pick(groupOf(rule, answer).filter((t) => !baskets[answer].includes(t)));
    return { rule, baskets, thing, answer, key: `${rule}${thing}` };
  },
  pruefen(L, r) {
    const rule = r.pick(TWO_AT[L]);
    const baskets = [0, 1].map((g) => r.sample(groupOf(rule, g), 3));
    let wrong = null;
    if (!r.chance(0.4)) {
      const from = r.int(0, 1);
      const to = 1 - from;
      const place = r.int(0, 2);
      // One thing of the other group sneaks into this basket.
      baskets[to].splice(place, 1, r.pick(groupOf(rule, from).filter((t) => !baskets[from].includes(t))));
      wrong = [to, place];
    }
    return { rule, baskets, wrong, key: `${rule}${baskets.flat().join(".")}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`sortieren: unknown perspective ${level.p}`);
  const L = levelOf(level.range);
  return { p: level.p, level: L, ...make(L, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  if (level.p === "sehen" && groupFor(t.rule, t.thing) !== t.answer) problems.push("answer");
  if (level.p === "machen" && t.things.some((x, i) => groupFor(t.rule, x) !== t.answers[i] || t.answers[i] < 0)) problems.push("answers");
  if (level.p === "machen" && new Set(t.things).size !== t.things.length) problems.push("the same thing twice");
  if (level.p === "forschen") {
    const gs = t.things.map((x) => groupFor(t.rule, x));
    if (gs.filter((g) => g === gs[t.odd]).length !== 1 || gs.some((g) => g < 0)) problems.push("odd");
  }
  if (level.p === "anwenden") {
    if (groupFor(t.rule, t.thing) !== t.answer || t.baskets.flat().includes(t.thing)) problems.push("answer");
    if (t.baskets.some((b, g) => b.some((x) => groupFor(t.rule, x) !== g))) problems.push("baskets");
  }
  if (level.p === "pruefen") {
    const bad = t.baskets.flatMap((b, g) => b.map((x, i) => (groupFor(t.rule, x) !== g ? [g, i] : null)).filter(Boolean));
    if (JSON.stringify(bad) !== JSON.stringify(t.wrong ? [t.wrong] : [])) problems.push("wrong");
    if (new Set(t.baskets.flat()).size !== 6) problems.push("the same thing twice");
  }
  return problems;
}
