// The rounds of "Sortieren": one function makes one round (see shared/gen.js).
//
//   task(level, r) → one round as plain data, no texts:
//     level – the id of the level the round is from (in "mix" levels one of the others)
//     mode  – "sort", "two", "find", "switch" or "odd"
//     rule  – the key in RULES ("kind", "redYellow" …; "two" for colour and kind at once)
//     Sorting (sort, two, find, switch):
//       groups – the baskets, left to right ("red", "animal", "red|fruit" …)
//       seeds  – the examples in each basket (icons; two each when finding the rule)
//       queue  – the things to sort, in order: { i (icon), g (the right basket) }
//       switch: then – the second part, the same things sorted by kind: { rule, groups, seeds, queue }
//     Odd one out: four (icons), odd (index of the one that does not fit), why (the group of the other three)
//     key   – the round in short, for "not the same round again"
//
// The things must be known to children in Nepal and in Germany. Animals and vehicles from picture books
// are fine (a whale, a ship); fruit and other things should be what children there see and eat.

import { LEVELS, COLOR_PAIRS } from "./levels.js";

// The things to sort. k = kind, c = colour, s = size (animals only). Empty = does not count for that rule.
// Only clear cases: a tomato or a carrot is not "Obst", so they only appear in colour rounds.
export const ITEMS = [
  // Big animals
  { i: "🐘", k: "animal", s: "big" }, { i: "🦒", k: "animal", s: "big" }, { i: "🐳", k: "animal", s: "big", c: "blue" },
  { i: "🦏", k: "animal", s: "big" }, { i: "🦕", k: "animal", s: "big" }, { i: "🐊", k: "animal", s: "big", c: "green" },
  { i: "🦈", k: "animal", s: "big" }, { i: "🦁", k: "animal", s: "big" }, { i: "🐻", k: "animal", s: "big" },
  { i: "🐄", k: "animal", s: "big" }, { i: "🐎", k: "animal", s: "big" }, { i: "🦛", k: "animal", s: "big" },
  // Small animals
  { i: "🐜", k: "animal", s: "small" }, { i: "🐞", k: "animal", s: "small", c: "red" }, { i: "🐌", k: "animal", s: "small" },
  { i: "🦋", k: "animal", s: "small" }, { i: "🐸", k: "animal", s: "small", c: "green" }, { i: "🐭", k: "animal", s: "small" },
  { i: "🐝", k: "animal", s: "small", c: "yellow" }, { i: "🐥", k: "animal", s: "small", c: "yellow" },
  { i: "🐤", k: "animal", s: "small", c: "yellow" }, { i: "🐛", k: "animal", s: "small", c: "green" },
  { i: "🦀", k: "animal", s: "small", c: "red" },
  // Other animals
  { i: "🐼", k: "animal" }, { i: "🦊", k: "animal" }, { i: "🐰", k: "animal" }, { i: "🐧", k: "animal" },
  { i: "🦉", k: "animal" }, { i: "🐙", k: "animal" }, { i: "🦘", k: "animal" }, { i: "🐢", k: "animal", c: "green" },
  { i: "🐬", k: "animal", c: "blue" },
  // Fruit (what children in Nepal and Germany both know: no blueberries)
  { i: "🍎", k: "fruit", c: "red" }, { i: "🍓", k: "fruit", c: "red" }, { i: "🍒", k: "fruit", c: "red" },
  { i: "🍌", k: "fruit", c: "yellow" }, { i: "🍋", k: "fruit", c: "yellow" }, { i: "🍏", k: "fruit", c: "green" },
  { i: "🍐", k: "fruit", c: "green" }, { i: "🍇", k: "fruit" }, { i: "🍊", k: "fruit" }, { i: "🍉", k: "fruit" },
  { i: "🍍", k: "fruit" }, { i: "🥝", k: "fruit" }, { i: "🥭", k: "fruit" }, { i: "🍑", k: "fruit" },
  // Vehicles
  { i: "🚗", k: "vehicle", c: "red" }, { i: "🚒", k: "vehicle", c: "red" }, { i: "🚕", k: "vehicle", c: "yellow" },
  { i: "🚜", k: "vehicle" }, { i: "🚢", k: "vehicle" }, { i: "🚂", k: "vehicle" }, { i: "✈️", k: "vehicle" },
  { i: "🚲", k: "vehicle" }, { i: "🚌", k: "vehicle" }, { i: "🚀", k: "vehicle" }, { i: "🚁", k: "vehicle" },
  { i: "🚙", k: "vehicle", c: "blue" },
  // Flowers
  { i: "🌹", k: "flower", c: "red" }, { i: "🌻", k: "flower", c: "yellow" }, { i: "🌷", k: "flower" },
  { i: "🌸", k: "flower" }, { i: "🌺", k: "flower" }, { i: "🌼", k: "flower", c: "yellow" },
  // Other things, for colours only (no cheese: a full moon is yellow everywhere)
  { i: "🎈", c: "red" }, { i: "🍅", c: "red" }, { i: "⭐", c: "yellow" }, { i: "🌽", c: "yellow" },
  { i: "🌕", c: "yellow" }, { i: "🥒", c: "green" }, { i: "🥦", c: "green" }, { i: "🌵", c: "green" },
  { i: "🍀", c: "green" }, { i: "🧢", c: "blue" }, { i: "💧", c: "blue" },
  // More for the hidden rules
  { i: "🦅", k: "animal", s: "big" }, { i: "🐦", k: "animal", s: "small" }, { i: "🐟", k: "animal" },
  { i: "🐠", k: "animal" }, { i: "⛵", k: "vehicle" },
];

// Hidden rules. f = can it fly?, w = at home in the water or on land? Only clear cases:
// a duck, a frog or a crocodile is both in the water and on land, so it has no "w".
const TAGS = {
  f: {
    fly: ["🦋", "🐝", "🦉", "🐞", "🦅", "🐦", "✈️", "🚁", "🚀"],
    nofly: ["🐘", "🦒", "🦏", "🐄", "🐎", "🐌", "🐢", "🐼", "🦊", "🐰", "🐧", "🐳", "🐙", "🦁", "🐻", "🚗", "🚲", "🚂", "🚜", "🚢"],
  },
  w: {
    water: ["🐳", "🐬", "🐙", "🦈", "🐟", "🐠", "🚢", "⛵"],
    land: ["🐘", "🦒", "🦁", "🐎", "🐄", "🦊", "🐰", "🐼", "🐌", "🐻", "🐭", "🚗", "🚲", "🚜", "🚂", "🦋", "🐝"],
  },
};
for (const [attr, groups] of Object.entries(TAGS)) {
  for (const [g, icons] of Object.entries(groups)) for (const i of icons) ITEMS.find((x) => x.i === i)[attr] = g;
}

// The rules. attr = which property counts, groups = the two baskets (or the two kinds in "odd one out").
export const RULES = {
  kind: { attr: "k", groups: ["animal", "fruit"] },
  vehicle: { attr: "k", groups: ["animal", "vehicle"] },
  redYellow: { attr: "c", groups: ["red", "yellow"], ask: "color" },
  redGreen: { attr: "c", groups: ["red", "green"], ask: "color" },
  yellowGreen: { attr: "c", groups: ["yellow", "green"], ask: "color" },
  size: { attr: "s", groups: ["big", "small"] },
  kind3: { attr: "k", groups: ["animal", "fruit", "vehicle"] },
  kind4: { attr: "k", groups: ["animal", "fruit", "vehicle", "flower"] },
  color3: { attr: "c", groups: ["red", "yellow", "green"], ask: "color" },
  color4: { attr: "c", groups: ["red", "yellow", "green", "blue"], ask: "color" },
  fly: { attr: "f", groups: ["fly", "nofly"], hidden: true },
  water: { attr: "w", groups: ["water", "land"], hidden: true },
};

const groupOf = (rule, item) => item[RULES[rule].attr];
const icons = (list) => list.map((x) => x.i);
const queueOf = (list, g) => list.map((x) => ({ i: x.i, g: g(x) }));

// ---------- Sorting into baskets

function sort(l, r) {
  const key = r.pick(l.rules);
  const rule = RULES[key];
  const tricky = !!l.tricky;
  const group = (x) => x[rule.attr];
  const groups = r.shuffle(rule.groups); // the baskets swap places, so the child looks, not remembers
  const pools = groups.map((g) => r.shuffle(ITEMS.filter((item) => group(item) === g)));
  const other = rule.attr === "k" ? "c" : "k"; // colour when sorting by kind, kind when sorting by colour

  // One example in each basket. Tricky: examples that differ in the other property too.
  const seeds = [];
  for (const pool of pools) {
    const seed = tricky
      ? pool.find((item) => item[other] && !seeds.some((x) => x[other] === item[other])) || pool[0]
      : pool[0];
    pool.splice(pool.indexOf(seed), 1);
    seeds.push(seed);
  }

  // Tricky things look like the example of another basket (same colour, or same kind).
  const looksWrong = (item, i) => tricky && seeds.some((seed, j) => j !== i && item[other] && seed[other] === item[other]);
  if (tricky) pools.forEach((pool, i) => pool.sort((x, y) => looksWrong(y, i) - looksWrong(x, i)));

  // At least one thing for each basket, the rest random (tricky ones first).
  const first = pools.map((pool) => pool.shift());
  let rest = pools.flatMap((pool, i) => pool.map((item) => [item, looksWrong(item, i)]));
  rest = r.shuffle(rest).sort((x, y) => y[1] - x[1]).map(([item]) => item);
  const queue = r.shuffle([...first, ...rest.slice(0, l.n - groups.length)]);
  return { rule: key, groups, seeds: seeds.map((s) => [s.i]), queue: queueOf(queue, group) };
}

// Two features: 4 baskets, one for each colour and kind (red animal, red fruit, yellow animal, yellow fruit).
// The basket has the colour, its example shows the kind.
function two(l, r) {
  const colors = RULES[r.pick(COLOR_PAIRS)].groups;
  const kinds = ["animal", "fruit"];
  const group = (x) => `${x.c}|${x.k}`;
  const groups = r.shuffle(colors.flatMap((c) => kinds.map((k) => `${c}|${k}`)));
  const pools = groups.map((g) => r.shuffle(ITEMS.filter((x) => group(x) === g)));
  const seeds = pools.map((pool) => [pool.shift().i]);
  const queue = r.shuffle(pools.map((pool) => pool.shift())).slice(0, l.n);
  return { rule: "two", groups, seeds, queue: queueOf(queue, group) };
}

// Find the rule: each basket shows two examples that only share the rule (two red things of different kinds,
// two animals of different colours, two things that fly). Nobody says the rule; the baskets have no colour.
function find(l, r) {
  const key = r.pick(l.rules);
  const rule = RULES[key];
  const group = (x) => x[rule.attr];
  const groups = r.shuffle(rule.groups);
  let things; // what can be sorted this round
  let other; // the property that must NOT help
  if (rule.attr === "k" || rule.attr === "c") {
    const colors = rule.attr === "c" ? rule.groups : RULES[r.pick(COLOR_PAIRS)].groups;
    const kinds = rule.attr === "k" ? rule.groups : ["animal", "fruit"];
    things = r.shuffle(ITEMS.filter((x) => colors.includes(x.c) && kinds.includes(x.k)));
    other = rule.attr === "k" ? "c" : "k";
  } else {
    things = r.shuffle(ITEMS.filter((x) => x[rule.attr]));
    other = "k";
  }
  const seeds = groups.map((g) => {
    const own = things.filter((x) => group(x) === g);
    const a = own[0];
    return [a, own.find((x) => x[other] !== a[other]) || own[1]];
  });
  const pool = things.filter((x) => !seeds.flat().includes(x));
  const first = groups.map((g) => pool.find((x) => group(x) === g));
  const rest = pool.filter((x) => !first.includes(x));
  const queue = r.shuffle([...first, ...rest.slice(0, l.n - groups.length)]);
  return { rule: key, groups, seeds: seeds.map(icons), queue: queueOf(queue, group) };
}

// Rule switch: four things, one for each colour and kind (red animal, red fruit, yellow animal, yellow fruit).
// First sorted by colour, then "Neue Regel!" and the same four by kind.
// The examples are neutral: a red balloon, a yellow star; then a panda and grapes without a colour.
function change(l, r) {
  const key = r.pick(COLOR_PAIRS);
  const rule = RULES[key];
  const kinds = ["animal", "fruit"];
  const things = [];
  for (const c of rule.groups) for (const k of kinds) things.push(r.pick(ITEMS.filter((x) => x.c === c && x.k === k)));
  const groups = r.shuffle(rule.groups);
  const seeds = groups.map((c) => [r.pick(ITEMS.filter((x) => x.c === c && !kinds.includes(x.k))).i]);
  const thenGroups = r.shuffle(RULES.kind.groups);
  const then = {
    rule: "kind",
    groups: thenGroups,
    seeds: thenGroups.map((k) => [r.pick(ITEMS.filter((x) => x.k === k && !x.c)).i]),
    queue: queueOf(r.shuffle(things), (x) => x.k),
  };
  return { rule: key, groups, seeds, queue: queueOf(r.shuffle(things), (x) => x.c), then };
}

// ---------- Odd one out

// Three things of one group, one of the other. Tried again if another thing
// would also stand out (e.g. three animals and one fruit, but only one of them red).
function odd(l, r) {
  const key = r.pick(l.rules);
  const rule = RULES[key];
  const group = (x) => x[rule.attr];
  let four, odd, g;
  for (let tries = 0; tries < 100; tries++) {
    const [a, b] = r.shuffle(rule.groups);
    g = a;
    const same = r.shuffle(ITEMS.filter((item) => group(item) === a)).slice(0, 3);
    odd = r.pick(ITEMS.filter((item) => group(item) === b));
    four = r.shuffle([...same, odd]);
    if (clear(four, odd, rule)) break;
  }
  return { rule: key, four: icons(four), odd: four.indexOf(odd), why: g };
}

/** True if no other property makes a different thing the odd one. */
export function clear(four, odd, rule) {
  for (const attr of ["k", "c", "s", "f", "w"]) {
    if (attr === rule.attr) continue;
    for (const item of four) {
      // Hidden rules: the odd one must not stand out by its kind or colour too, or the rule stays hidden.
      if (item === odd && !rule.hidden) continue;
      const others = four.filter((x) => x !== item).map((x) => x[attr]);
      if (others[0] && others.every((v) => v === others[0]) && item[attr] !== others[0]) return false;
    }
  }
  return true;
}

const MAKERS = { sort, two, find, switch: change, odd };

export function task(level, r) {
  const id = level.mode === "mix" ? r.pick(level.levels) : level.id;
  const l = LEVELS.find((x) => x.id === id);
  const t = { level: l.id, mode: l.mode, ...MAKERS[l.mode](l, r) };
  const what = t.four ?? [...t.seeds.flat(), ...t.queue.map((q) => q.i)];
  return { ...t, key: `${t.rule} ${what.join("")}` };
}

/** Problems with a round (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const l = LEVELS.find((x) => x.id === t.level);
  if (level.mode === "mix" ? !level.levels.includes(t.level) : t.level !== level.id) problems.push("wrong level");
  const byIcon = (i) => ITEMS.find((x) => x.i === i);
  const part = (p) => {
    const all = [...p.seeds.flat(), ...p.queue.map((q) => q.i)];
    if (new Set(all).size !== all.length) problems.push("a thing twice");
    if (all.some((i) => !byIcon(i))) problems.push("unknown thing");
    if (p.queue.some((q) => !p.groups.includes(q.g))) problems.push("a thing without a basket");
    if (p.seeds.length !== p.groups.length) problems.push("a basket without an example");
    if (p.rule !== "two" && t.mode !== "switch") {
      const rule = RULES[p.rule];
      if (p.queue.some((q) => byIcon(q.i)[rule.attr] !== q.g)) problems.push("wrong basket");
      p.seeds.forEach((s, k) => s.some((i) => byIcon(i)[rule.attr] !== p.groups[k]) && problems.push("wrong example"));
    }
  };
  if (t.mode === "odd") {
    const rule = RULES[t.rule];
    const four = t.four.map(byIcon);
    const odd = four[t.odd];
    if (four.filter((x) => x[rule.attr] === t.why).length !== 3 || odd[rule.attr] === t.why || !odd[rule.attr]) problems.push("odd one wrong");
    if (!clear(four, odd, rule)) problems.push("another thing stands out too");
  } else {
    part(t);
    if (t.mode === "switch") part(t.then);
    if (t.mode !== "switch" && t.queue.length !== Math.min(l.n, t.queue.length)) problems.push("too many things");
    if (t.mode !== "switch" && t.mode !== "two" && t.queue.length !== l.n) problems.push("not enough things");
  }
  return problems;
}
