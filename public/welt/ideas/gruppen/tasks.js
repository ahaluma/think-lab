// The tasks of the idea "Gruppen": things can be put into groups of the same size. Sharing fairly
// means: everyone gets the same. The fruit tree and the nests on the map.
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id, range = 5, 10 or 20.
//   groups × each = total. The range says how many things there are in all: up to 6, 10 or 20.
//
//   sehen     { groups, each }                       nests with the same number of eggs; a hen sits on
//                                                    one nest: how many eggs are under her? (answer: each)
//   machen    { groups, each, total, pair }          share `total` things among `groups` animals
//   forschen  { groups, total, each, rest, fair, pair }  think first: does everyone get the same?
//                                                    rest = what is left over (0 = fair)
//   anwenden  { total, each, groups }                `total` cherries, every bird gets `each`:
//                                                    for how many birds is it enough? (answer: groups)
//   pruefen   { groups, each, pair, from, to }       the owl shared. from/to = -1: fair. Otherwise the
//                                                    animal `from` has one too many, `to` one too few
//   pair – index into PAIRS: who eats what.  key – short text that tells tasks apart.
//
// This is the idea of the old game "Gerecht teilen", in the frame of the new world.

export const MOST = { 5: 6, 10: 10, 20: 20 }; // the most things in all, per range
export const FEWEST = { 5: 0, 10: 4, 20: 8 }; // … and the fewest, so a bigger range is not full of tiny tasks
export const MAX_GROUPS = 5;
export const MAX_EACH = 5; // the answer buttons go from 1 to 5
const TO_LAY_OUT = 15; // "make": the child moves every thing by hand, so not more than this
/** Who eats what. True to the world: rabbits eat carrots, squirrels nuts, mice cheese. */
export const PAIRS = [
  { eater: "🐰", food: "🥕" },
  { eater: "🐿️", food: "🌰" },
  { eater: "🐭", food: "🧀" },
];

/** All fair ways to share in a range: [groups, each]. Bigger ranges leave out the tiny ones. */
export function ways(range, { minEach = 1, most = MOST[range] } = {}) {
  const floor = FEWEST[range] ?? 0;
  const list = [];
  for (let groups = 2; groups <= MAX_GROUPS; groups++) {
    for (let each = minEach; each <= MAX_EACH; each++) {
      const total = groups * each;
      if (total <= most && total >= floor) list.push([groups, each]);
    }
  }
  return list;
}

const makers = {
  sehen(range, r) {
    const [groups, each] = r.pick(ways(range));
    return { groups, each, key: `${groups}x${each}` };
  },
  machen(range, r) {
    const [groups, each] = r.pick(ways(range, { minEach: 2, most: Math.min(MOST[range], TO_LAY_OUT) }));
    return { groups, each, total: groups * each, pair: r.int(0, PAIRS.length - 1), key: `${groups}x${each}` };
  },
  forschen(range, r) {
    const [groups, each] = r.pick(ways(range));
    // Half of the tasks do not come out even: something is left over.
    const rest = r.chance(0.5) ? r.int(1, groups - 1) : 0;
    const total = groups * each + rest;
    return { groups, total, each, rest, fair: rest === 0, pair: r.int(0, PAIRS.length - 1), key: `${total}:${groups}` };
  },
  anwenden(range, r) {
    const [groups, each] = r.pick(ways(range, { minEach: 2 }));
    return { total: groups * each, each, groups, key: `${groups}x${each}` };
  },
  pruefen(range, r) {
    const [groups, each] = r.pick(ways(range, { minEach: 2 }));
    const fair = r.chance(0.4);
    const [from, to] = fair ? [-1, -1] : r.shuffle(Array.from({ length: groups }, (_, i) => i)).slice(0, 2);
    return { groups, each, pair: r.int(0, PAIRS.length - 1), from, to, key: `${groups}x${each}:${from}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  return { p: level.p, range: level.range, ...make(level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const most = MOST[level.range];
  if (t.groups < 2 || t.groups > MAX_GROUPS) problems.push(`${t.groups} groups`);
  if (t.each < 1 || t.each > MAX_EACH) problems.push(`${t.each} in a group`);
  const total = t.groups * t.each + (t.rest || 0);
  if (total > most + (t.p === "forschen" ? MAX_GROUPS - 1 : 0)) problems.push(`${total} things are too many for this range`);
  if ("pair" in t && !PAIRS[t.pair]) problems.push("no such pair");
  if (t.p === "machen" && (t.total !== t.groups * t.each || t.total > TO_LAY_OUT || t.each < 2)) problems.push("bad sharing task");
  if (t.p === "forschen") {
    if (t.total !== total || t.rest < 0 || t.rest >= t.groups) problems.push("bad rest");
    if (t.fair !== (t.total % t.groups === 0)) problems.push("fair does not match");
  }
  if (t.p === "anwenden" && (t.total !== t.groups * t.each || t.each < 2)) problems.push("bad story");
  if (t.p === "pruefen") {
    const fair = t.from < 0;
    if (!fair && (t.from === t.to || t.from >= t.groups || t.to >= t.groups || t.to < 0)) problems.push("bad unfair pair");
    if (t.each < 2) problems.push("nothing to take away");
  }
  return problems;
}
