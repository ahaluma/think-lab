// The tasks of camp 4 of the thinking mountain, "Rückwärts denken" (the store cave): the end is
// known, the start is not. Go back step by step and undo every step: + becomes −, doubling becomes
// halving, and the last step is undone first.
//
// The thinking tools (t.tool):
//   rueck    undo every step, from the end to the start
//   halb     "half and 1 more": undo the 1 first, then double
//   teich    something doubles every day: one day before full it was half full
//   zaun     Kombi with camp 1: stairs between floors (from floor 2 to 5 are 3 flights)
//
// Four levels: 1 one step · 2 three steps, one of them halving · 3 "half and k more", the pond,
// stairs between floors · 4 parts (a third, a quarter) and long chains, bigger numbers.
//
//   task({ p, range }, r) → { story, a: { ops, end, … }, ops, start, answer, tool, key }
//     ops: [{ type, k }] in the order they happened. type: plus, minus, double, half, triple, third,
//          halfminus (half of it and k more go away), part (one k-th goes away)

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;
const MAX = 999;

/** One step forward. */
export function forward(x, { type, k }) {
  switch (type) {
    case "plus": return x + k;
    case "minus": return x - k;
    case "double": return 2 * x;
    case "half": return x / 2;
    case "triple": return 3 * x;
    case "third": return x / 3;
    case "halfminus": return x / 2 - k;
    case "part": return (x * (k - 1)) / k;
    default: return NaN;
  }
}

/** One step back (the step undone). */
export function back(y, { type, k }) {
  switch (type) {
    case "plus": return y - k;
    case "minus": return y + k;
    case "double": return y / 2;
    case "half": return 2 * y;
    case "triple": return y / 3;
    case "third": return 3 * y;
    case "halfminus": return 2 * (y + k);
    case "part": return (y * k) / (k - 1);
    default: return NaN;
  }
}

export const run = (x, ops) => ops.reduce(forward, x);
export const undo = (y, ops) => [...ops].reverse().reduce(back, y);
/** The numbers along the way: start, after step 1, …, end. */
export const along = (x, ops) => ops.reduce((list, op) => [...list, forward(list.at(-1), op)], [x]);

const whole = (list) => list.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX);

/** A chain of steps whose numbers are whole all the way. */
function chain(r, story, kinds, { most = 99, least = 1 } = {}) {
  for (let tries = 0; tries < 300; tries++) {
    const ops = kinds.map((type) => ({ type, k: type === "part" ? r.pick([3, 4, 5]) : type === "halfminus" ? r.int(1, 4) : ["double", "half"].includes(type) ? 2 : ["triple", "third"].includes(type) ? 3 : r.int(2, Math.min(most, 40)) })).map((o) => ({ ...o, rest: o.k - 1 }));
    const start = r.int(Math.max(least, 2), most);
    const path = along(start, ops);
    if (!whole(path) || path.slice(1).some((v) => v < 1)) continue;
    const end = path.at(-1);
    return { story, ops, start, a: { ops, end }, answer: start, end, tool: kinds.includes("halfminus") ? "halb" : "rueck", key: `${story}${start}${JSON.stringify(ops)}` };
  }
  return null;
}

const STORIES = ["murmeln", "karten", "geld", "kekse"];

/** Level 1: one step. */
function oneStep(r) {
  if (r.chance(0.3)) {
    const t = chain(r, "aufzug", [r.pick(["plus", "minus"])], { most: 20, least: 1 });
    return { ...t, ops: t.ops.map((o) => ({ ...o, k: Math.min(o.k, 9) })), ...fixLift(t) };
  }
  return chain(r, r.pick(STORIES), [r.pick(["plus", "minus", "double", "half"])], { most: 60 });
}

/** A lift never goes below the ground floor and moves at most 9 floors at once. */
function fixLift(t) {
  const ops = t.ops.map((o) => ({ ...o, k: Math.min(o.k, 9) }));
  const path = along(t.start, ops);
  const ok = path.every((v) => v >= 0 && v <= 30);
  const start = ok ? t.start : 10;
  const p2 = along(start, ops);
  return { ops, start, answer: start, end: p2.at(-1), a: { ops, end: p2.at(-1) }, key: `lift${start}${JSON.stringify(ops)}` };
}

/** Level 2: three steps, one of them halving (or doubling). */
function threeSteps(r) {
  if (r.chance(0.25)) {
    const t = chain(r, "aufzug", r.shuffle(["plus", "minus", "plus"]), { most: 12 });
    return { ...t, ...fixLift(t) };
  }
  const kinds = r.shuffle([r.pick(["half", "double"]), r.pick(["plus", "minus"]), r.pick(["plus", "minus", "double"])]);
  return chain(r, r.pick(STORIES), kinds, { most: 80 });
}

/** Level 3: "half and k more" two or three times, the pond, stairs between floors. */
function level3(r, kombi) {
  if (kombi && r.chance(0.35)) return stairs(r);
  if (r.chance(0.25)) return pond(r, 3);
  const n = r.int(2, 3);
  const t = chain(r, "teilen", Array(n).fill("halfminus"), { most: 200 });
  return { ...t, a: { ...t.a, names: n } };
}

/** Level 4: parts (a third goes away), long chains, the pond backwards further. */
function level4(r, kombi) {
  if (kombi && r.chance(0.3)) return stairs(r, true);
  if (r.chance(0.2)) return pond(r, 4);
  if (r.chance(0.4)) {
    const t = chain(r, "vorrat", [r.pick(["part", "halfminus"]), "part", r.pick(["halfminus", "minus"])], { most: 400 });
    return t;
  }
  const kinds = r.shuffle(["triple", "minus", "half", "plus"]).slice(0, 4);
  return chain(r, r.pick(STORIES), kinds, { most: 120 });
}

/** The pond: the water lilies double every day; on day d the pond is full. When was it half (a quarter, an eighth) full? */
function pond(r, level) {
  const d = r.int(12, 60);
  const back = level === 3 ? r.pick([1, 2]) : r.pick([2, 3, 4]);
  const story = r.pick(["teich", "schimmel", "geruecht"]);
  return { story, a: { d, part: 2 ** back, frac: String(2 ** back) }, answer: d - back, tool: "teich", key: `${story}${d}${back}` };
}

/** Kombi with the fence: I walked up `steps` stairs, `per` steps between two floors, now I am on floor f. */
function stairs(r, big = false) {
  const per = r.pick(big ? [14, 15, 16, 18, 20] : [10, 12, 15]);
  const flights = r.int(2, big ? 9 : 6);
  const f = r.int(flights + 1, flights + 8);
  return { story: "treppe", a: { per, steps: per * flights, f, flights }, answer: f - flights, tool: "zaun", key: `tr${per}${flights}${f}` };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["forward", "order", "sign", "plusone", "half", "floors"];

function owlOptions(t) {
  if (t.tool === "teich") return [[t.a.d - 1 === t.answer ? Math.floor(t.a.d / 2) : t.a.d - 1, t.a.d - 1 === t.answer ? "half" : "order"], [Math.floor(t.a.d / t.a.part), "half"]];
  if (t.tool === "zaun") return [[t.a.f - t.a.flights - 1, "floors"], [t.a.f + t.a.flights, "sign"]];
  const ops = t.ops;
  const opts = [[run(t.end, ops), "forward"], [ops.reduce(back, t.end), "order"]];
  if (t.tool === "halb") opts.push([ops.reduce((y) => 2 * y, t.end), "plusone"], [[...ops].reverse().reduce((y, o) => 2 * y + o.k, t.end), "plusone"]);
  const flipped = undo(t.end, ops.map((o) => ({ ...o, type: o.type === "plus" ? "minus" : o.type === "minus" ? "plus" : o.type })));
  if (ops.some((o) => o.type === "plus" || o.type === "minus")) opts.push([flipped, "sign"]);
  return opts;
}

/** Regel finden: the same chain with different ends. What comes out at the start? Then a big end. */
function ruleTask(r, level) {
  const kinds = level === 1 ? [r.pick(["plus", "minus"])] : level === 2 ? [r.pick(["double", "triple"]), r.pick(["plus", "minus"])] : level === 3 ? ["halfminus"] : [r.pick(["double", "triple"]), r.pick(["plus", "minus"]), "double"];
  for (let tries = 0; tries < 300; tries++) {
    const ops = kinds.map((type) => ({ type, k: type === "halfminus" ? r.int(1, 3) : ["double", "half"].includes(type) ? 2 : ["triple", "third"].includes(type) ? 3 : r.int(2, 9) })).map((o) => ({ ...o, rest: o.k - 1 }));
    const starts = level === 3 ? [4, 6, 8, 10] : [10, 11, 12, 13];
    const ends = starts.map((s) => run(s, ops));
    if (!whole(ends) || ends.some((e) => e < 1)) continue;
    const startBig = level === 3 ? 2 * r.int(30, 99) : r.int(30, 150);
    const endBig = run(startBig, ops);
    if (!whole([endBig]) || endBig < 1) continue;
    return { story: "maschine", ops, a: { ops, end: endBig }, start: startBig, end: endBig, answer: startBig, tool: kinds.includes("halfminus") ? "halb" : "rueck", table: { id: "maschine", rows: starts.slice(0, 3).map((s, i) => [ends[i], s]), next: [ends[3], starts[3]] }, key: `m${JSON.stringify(ops)}${startBig}` };
  }
  return null;
}

const storyTask = (r, level, kombi) => (level === 1 ? oneStep(r) : level === 2 ? threeSteps(r) : level === 3 ? level3(r, kombi) : level4(r, kombi));

const makers = {
  sehen: (level, r) => storyTask(r, level, false),
  // Ausprobieren: the chain of steps, undone box by box from the end (only tasks with steps).
  machen(level, r) {
    for (;;) {
      const t = storyTask(r, level, false);
      if (t.ops) return t;
    }
  },
  forschen: (level, r) => ruleTask(r, level),
  anwenden: (level, r) => storyTask(r, level, level >= 3),
  pruefen(level, r) {
    const t = storyTask(r, level, level >= 3);
    const wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k > 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs: every chain is run forward again. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  if (t.ops) {
    const path = along(t.answer, t.ops);
    if (!whole(path)) problems.push(`not whole: ${path}`);
    if (path.at(-1) !== t.end || t.a.end !== t.end) problems.push("end does not match");
    if (undo(t.end, t.ops) !== t.answer) problems.push("undo does not give the start");
    if (t.story === "aufzug" && path.some((v) => v > 30 || v < 0)) problems.push("lift out of the house");
  }
  if (t.table) {
    for (const [e, s] of [...t.table.rows, t.table.next]) if (run(s, t.ops) !== e) problems.push("bad table row");
  }
  if (t.tool === "teich" && t.answer !== t.a.d - Math.log2(t.a.part)) problems.push("bad pond");
  if (t.tool === "zaun" && (t.a.steps !== t.a.per * t.a.flights || t.answer !== t.a.f - t.a.flights || t.answer < 0)) problems.push("bad stairs");
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
