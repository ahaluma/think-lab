// The tasks of the idea "Zaun", camp 1 of the thinking mountain (welt/berg/), for children of
// 9 to 12 (Mathe-Olympiade training, starting at the level of grade 3 in Hamburg).
//
// The thinking tool: count the gaps, not the things. Between two posts there is one board, and how
// many posts a fence needs depends on its ends:
//
//   line   – a fence in a row, a post at each end:        posts = boards + 1
//   trees  – a fence from tree to tree (the trees hold it): posts = boards − 1
//   ring   – a fence all around the pond, no ends:          posts = boards
//   sides  – a fence in a row on both sides of a path:      posts = 2 × (boards + 1)
//
// The same tool solves the classic olympiad traps: how often you saw a log, how long a bell takes to
// strike, how many steps up a tower. In Chinese teaching this family is the "tree planting problem"
// (植树问题). The forschen board changes only one thing at a time (teaching by variation).
//
// Four levels (the "ranges" of the idea, 1 … 4), up to the hardest this family gets for 12-year-olds:
//   1  long fences: count posts and boards, up to 20 boards (longer fences are drawn with "…")
//   2  with metres: a fence of 36 m, a post every 4 m; trees on a path; a bell; a tower with platforms
//   3  backwards and with time: posts → length, sawing takes minutes, bigger numbers
//   4  masters: a field with four sides and corners, time backwards (minutes → pieces), part of a tower
//
// Everyday looks: the same problem comes as a fence, trees along a street, children in a row or a
// circle, little flags on a string, lights along a path (LOOKS), a field as a meadow, a football
// pitch or a vegetable bed (FIELDS). Anwenden tells it as chocolate, a train, pages of a book, a class
// trip (days and nights), running from tree to tree and stairs in a house. Only the picture and the
// words change, never the thinking: that is the point.
//
// Explaining counts as much as the answer: when the owl is wrong, the child first finds the right
// number and then picks WHY she was wrong (`why`, and two other reasons that sound good).
//
//   task({ p, range }, r) → one task as plain data (no DOM, no texts). Every task has `answer`.
//
//   look – on fence tasks (sehen, forschen, pruefen): which everyday picture (LOOKS, FIELDS)
//
//   sehen     { kind, posts, answer }                          numbered posts stand: how many boards?
//   machen    { mode: "boards", boards, slots }                set posts: a fence with `boards` boards
//             { mode: "every", ends, step, spots, every, answer: [spot indices] }
//                                                              plant every `every` m (ends: also at both ends)
//   forschen  { kind, boards, every?, length?, ask: "posts", answer }
//             { kind, posts, every, ask: "length", answer }      level 3: backwards
//   anwenden  { story, n, answer }                              level 1: saw | beads | necklace | choc | train
//             { story: "pages", from, to, answer }              read from page `from` to `to`: to − from + 1
//             { story: "trip", from, to, ask: nights|days, answer } a class trip from the `from`th to the `to`th
//             { story, a, given, b, answer, unit }               bell | tower | sawtime | run | floors: a things take
//                                                              `given`; how much for b?
//   pruefen   like forschen (levels 1, 2) or anwenden (level 3) plus { said, right }
//   key – short text that tells tasks apart.

export const LEVELS = [1, 2, 3, 4];
/** The answers are typed: up to this many digits. */
export const DIGITS = 3;
/** Fences with more boards than this are drawn with "…" in the middle. */
export const DRAWN = 12;
/** A ring is always drawn whole. */
export const RING_MAX = 24;

export const postsFor = (kind, boards) =>
  kind === "line" ? boards + 1 : kind === "trees" ? boards - 1 : kind === "sides" ? 2 * (boards + 1) : boards; // ring, rect: no ends
/** Level 3 backwards: from the posts and the distance to the length. */
export const lengthFor = (kind, posts, every) => (kind === "line" ? posts - 1 : kind === "trees" ? posts + 1 : posts) * every;
/** Things in a row and the gaps between them: a closed necklace has as many gaps as beads. */
export const gapsFor = (story, n) => (story === "necklace" ? n : n - 1);
/** Pages from `from` to `to` (both read); a trip: nights between, days counted with both ends. */
export const countFor = (t) => (t.story === "trip" && t.ask === "nights" ? t.to - t.from : t.to - t.from + 1);

/** The everyday looks of a fence task and the kinds of fence each one can be. */
export const LOOKS = {
  zaun: ["line", "trees", "ring", "sides"],
  baeume: ["line", "trees", "ring", "sides"],
  kinder: ["line", "trees", "ring", "sides"],
  fahnen: ["line", "trees", "ring", "sides"],
  lichter: ["line", "trees", "ring", "sides"],
};
/** The looks of a field with four sides (level 4). */
export const FIELDS = ["zaun", "feld", "beet"];

function lookFor(kind, r) {
  if (kind === "rect") return r.pick(FIELDS);
  return r.pick(Object.keys(LOOKS).filter((l) => LOOKS[l].includes(kind)));
}

const EVERY = [2, 3, 4, 5, 6, 10];

/** a things (strikes, platforms, pieces) take `given`; b things take (b − 1) gaps. */
function timeTask(story, r, level) {
  const big = level === 3;
  const spec = {
    bell: { unit: r.pick(big ? [2, 3, 4, 5] : [1, 2, 3]), a: r.int(3, 6), b: [8, big ? 12 : 10] },
    tower: { unit: r.pick(big ? [12, 14, 15, 16, 18] : [8, 10, 12]), a: r.int(2, 4), b: [5, big ? 10 : 8] },
    sawtime: { unit: r.pick(big ? [3, 4, 5, 6] : [2, 3, 4, 5]), a: r.int(3, 5), b: [6, big ? 12 : 9] },
    run: { unit: r.pick(big ? [4, 5, 6, 8] : [2, 3, 4, 5]), a: r.int(3, 6), b: [7, big ? 15 : 10] },
    floors: { unit: r.pick(big ? [12, 15, 16, 18, 20] : [10, 12, 15]), a: r.int(2, 4), b: [5, big ? 12 : 8] },
  }[story];
  const b = r.int(Math.max(spec.b[0], spec.a + 2), spec.b[1]);
  return { story, a: spec.a, b, unit: spec.unit, given: (spec.a - 1) * spec.unit, answer: (b - 1) * spec.unit, key: `${story}${spec.a}${b}${spec.unit}` };
}

/** Counting with both ends: pages of a book (bigger with the level), or a class trip (days or nights). */
function countTask(story, r, level) {
  if (story === "trip") {
    const from = r.int(1, 20);
    const to = from + r.int(3, level === 1 ? 6 : 10);
    const ask = r.pick(["nights", "days"]);
    const t = { story, from, to, ask };
    return { ...t, answer: countFor(t), key: `trip${from}${to}${ask}` };
  }
  const from = level === 1 ? r.int(3, 30) : level < 4 ? r.int(12, 90) : r.int(60, 400);
  const to = from + (level === 1 ? r.int(4, 15) : level < 4 ? r.int(15, 60) : r.int(80, 300));
  return { story, from, to, answer: to - from + 1, key: `pages${from}${to}` };
}

/** Level 4, backwards: every cut takes `unit` minutes, all cuts took `given`. How many pieces? */
function sawBack(r) {
  const unit = r.pick([3, 4, 5, 6, 7]);
  const cuts = r.int(5, 12);
  return { story: "sawback", unit, given: unit * cuts, answer: cuts + 1, key: `sb${unit}${cuts}` };
}

/** Level 4: from platform 1 to a are `given` steps. How many from platform c to d? */
function towerPart(r) {
  const unit = r.pick([12, 14, 15, 16, 18, 21, 24]);
  const a = r.int(3, 5);
  const c = r.int(2, 5);
  const d = r.int(c + 2, 10);
  return { story: "towerpart", unit, a, c, d, given: (a - 1) * unit, answer: (d - c) * unit, key: `tp${unit}${a}${c}${d}` };
}

/** Reasons why the owl can be wrong. The right one is `why`; the board shows it with two others. */
export const REASONS = {
  fence: ["ends", "noEnds", "ring", "sides", "corners", "noCorners"],
  time: ["twice", "strikes", "oneMore"],
};

/** Level 4: a field of a × b metres, a post every `every` m all around. Corners count once. */
function rectTask(r) {
  const every = r.pick(EVERY);
  const i = r.int(3, 9);
  const j = r.int(2, Math.min(6, i));
  const look = lookFor("rect", r);
  return { kind: "rect", look, every, a: i * every, b: j * every, boards: 2 * (i + j), ask: "posts", answer: 2 * (i + j), key: `rect${look}${i}${j}${every}` };
}

const makers = {
  sehen(level, r) {
    const kind = level === 3 ? "trees" : level === 4 ? r.pick(["line", "trees"]) : "line";
    const posts = level === 1 ? r.int(8, 16) : level === 2 ? r.int(15, 40) : level === 3 ? r.int(12, 40) : r.int(50, 150);
    const look = lookFor(kind, r);
    return { kind, look, posts, answer: kind === "line" ? posts - 1 : posts + 1, key: `${look}${kind}${posts}` };
  },
  machen(level, r) {
    if (level === 1) {
      const boards = r.int(5, 9);
      return { mode: "boards", boards, slots: boards + 3, key: `b${boards}` };
    }
    // Spots along a path, one every `step` metres. Plant every `every` metres.
    const step = r.pick([1, 2, 5]);
    const per = r.pick([2, 3, 4]); // spots per gap
    const spots = 13; // 12 gaps: a tree every 2, 3 or 4 spots ends exactly at the end
    const ends = level === 2;
    // Level 4 like level 3, with bigger steps.
    if (level === 4) return { ...makers.machen(3, r), key: `e${step}${per}4` };
    const answer = [];
    for (let i = 0; i < spots; i += per) if (ends || (i > 0 && i < spots - 1)) answer.push(i);
    return { mode: "every", ends, step, spots, every: step * per, answer, key: `e${step}${per}${ends}` };
  },
  forschen(level, r) {
    if (level === 1) {
      const kind = r.pick(["line", "trees", "ring"]);
      const boards = r.int(6, 20);
      const look = lookFor(kind, r);
      return { kind, look, boards, ask: "posts", answer: postsFor(kind, boards), key: `${look}${kind}${boards}` };
    }
    if (level === 2) {
      const kind = r.pick(["line", "trees", "ring", "sides"]);
      const every = r.pick(EVERY);
      const most = Math.min(kind === "ring" ? RING_MAX : 24, Math.floor(120 / every));
      const boards = r.int(4, most);
      const look = lookFor(kind, r);
      return { kind, look, boards, every, length: boards * every, ask: "posts", answer: postsFor(kind, boards), key: `${look}${kind}${boards}${every}` };
    }
    if (level === 4) return rectTask(r);
    const kind = r.pick(["line", "trees", "ring"]);
    const every = r.pick(EVERY);
    const posts = r.int(kind === "trees" ? 5 : 8, kind === "ring" ? RING_MAX : 40);
    const look = lookFor(kind, r);
    return { kind, look, posts, every, ask: "length", answer: lengthFor(kind, posts, every), key: `${look}${kind}${posts}${every}` };
  },
  anwenden(level, r) {
    if (level === 1) {
      const story = r.pick(["saw", "beads", "necklace", "choc", "train", "pages", "trip"]);
      if (story === "pages" || story === "trip") return countTask(story, r, level);
      const n = story === "saw" || story === "choc" ? r.int(5, 12) : r.int(6, 18);
      return { story, n, answer: gapsFor(story, n), key: `${story}${n}` };
    }
    if (level === 4) return r.pick([sawBack, towerPart, (q) => timeTask(q.pick(["bell", "run", "floors"]), q, 3), (q) => countTask("pages", q, 4)])(r);
    if (r.chance(0.25)) return countTask(r.pick(["pages", "trip"]), r, level);
    return timeTask(r.pick(level === 2 ? ["bell", "tower", "run", "floors"] : ["sawtime", "bell", "tower", "run", "floors"]), r, level);
  },
  pruefen(level, r) {
    // The owl is quick and very sure of herself, and wrong in about 6 of 10 tasks. Each wrong number
    // comes with the reason behind it (why), so the child can explain the mistake.
    const owl = (t, options) => {
      const right = r.chance(0.4);
      const wrongs = options.filter(([k]) => k !== t.answer && k > 0 && String(k).length <= DIGITS);
      if (right || !wrongs.length) return { ...t, said: t.answer, right: true, why: null, key: `${t.key}:ok` };
      const [said, why] = r.pick(wrongs);
      return { ...t, said, right: false, why, key: `${t.key}:${said}` };
    };
    if (level === 4 && r.chance(0.5)) {
      const t = rectTask(r);
      return owl(t, [[t.answer + 4, "corners"], [t.answer - 4, "noCorners"]]);
    }
    if (level < 3 || level === 4) {
      const t = makers.forschen(Math.min(level, 2), r);
      const b = t.boards;
      const options = {
        line: [[b, "ends"]],
        trees: [[b, "noEnds"], [b + 1, "noEnds"]],
        ring: [[b + 1, "ring"], [b - 1, "ring"]],
        sides: [[b + 1, "sides"], [2 * b, "ends"]],
      }[t.kind];
      return owl(t, options);
    }
    const t = timeTask(r.pick(["sawtime", "bell", "run", "floors"]), r, level);
    const twice = (t.given * t.b) / t.a; // "twice as many, twice as long"
    const options = [[t.b * t.unit, "strikes"], [t.answer + t.unit, "oneMore"]];
    if (Number.isInteger(twice)) options.push([twice, "twice"], [twice, "twice"]);
    return owl(t, options);
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 1 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (t.p !== "machen" && !fits(t.answer)) problems.push(`answer ${t.answer}`);
  if (t.p === "sehen" && t.answer !== (t.kind === "line" ? t.posts - 1 : t.posts + 1)) problems.push("wrong answer");
  if (t.p === "machen") {
    if (t.mode === "boards" && (t.slots > DRAWN || t.boards + 2 > t.slots)) problems.push("the fence does not fit");
    if (t.mode === "every") {
      const per = t.every / t.step;
      if ((t.spots - 1) % per) problems.push("the path does not end on a tree");
      if (t.answer.some((i) => i % per) || t.answer.length < 2) problems.push("bad answer");
      if (t.ends !== t.answer.includes(0)) problems.push("ends do not match");
    }
  }
  if (t.p === "forschen" || (t.p === "pruefen" && "kind" in t)) {
    if (t.ask === "posts" && t.answer !== postsFor(t.kind, t.boards)) problems.push("wrong posts");
    if (t.ask === "length" && t.answer !== lengthFor(t.kind, t.posts, t.every)) problems.push("wrong length");
    if (t.kind === "ring" && (t.boards ?? t.posts) > RING_MAX) problems.push("ring too big to draw");
    if (t.length && t.length !== t.boards * t.every) problems.push("bad length");
  }
  if (t.kind === "rect" && (t.answer !== 2 * (t.a + t.b) / t.every || t.a % t.every || t.b % t.every)) problems.push("bad field");
  if (t.story === "sawback" && (t.given !== (t.answer - 1) * t.unit)) problems.push("bad saw back");
  if (t.story === "towerpart" && (t.given !== (t.a - 1) * t.unit || t.answer !== (t.d - t.c) * t.unit)) problems.push("bad tower part");
  if ("given" in t && "b" in t) {
    if (t.given !== (t.a - 1) * t.unit || t.answer !== (t.b - 1) * t.unit || t.b <= t.a) problems.push("bad time story");
  }
  if (t.p === "anwenden" && "n" in t && t.answer !== gapsFor(t.story, t.n)) problems.push("bad story");
  if ("from" in t && (t.answer !== countFor(t) || t.to <= t.from)) problems.push("bad count");
  if ("kind" in t && t.p !== "machen") {
    const looks = t.kind === "rect" ? FIELDS : Object.keys(LOOKS).filter((l) => LOOKS[l].includes(t.kind));
    if (!looks.includes(t.look)) problems.push(`look ${t.look} for ${t.kind}`);
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && !(REASONS.fence.includes(t.why) || REASONS.time.includes(t.why))) problems.push(`no reason for ${t.said}`);
  }
  return problems;
}
