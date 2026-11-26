// The tasks of camp 3 of the thinking mountain, "Wer wohnt wo?" (the huts): logic puzzles, solved by
// ruling out. Every puzzle is made by a solver that tries every possible assignment, so each one has
// exactly one solution, and each clue is needed (none is there just for show).
//
// The thinking tools (t.tool):
//   tabelle   a grid of people and things: ✗ where it cannot be, ✓ where it must be
//   rest      when only one is left in a row or a column, it must be that one
//   kette     two kinds of things at once: what goes with what (the dog lives in the red house)
//   reihe     seats in a row: left, right, next to each other, one in between
//   luege     truth-tellers and liars: try each suspect and count the true sentences
//   zaehlen   Kombi with camp 2: how many arrangements are still possible after the clues?
//
// Four levels: 1 three people, two or three clues · 2 four people, only "not" clues · 3 two kinds of
// things at once, counting what is left · 4 seats in a row, liars, five people.
//
//   task({ p, range }, r) → { kind, story, n, clues, solution, ask, answer, options, tool, key }
//     kind "grid":  people 0…n−1, things of one or two kinds (dims); solution[d][person] = thing
//     kind "seats": solution[0][person] = seat (0 = far left)
//     kind "liar":  statements [{ who, says: "did"|"not", whom }], truth: "one"|"lie"; answer = culprit
//     ask { d, v } "who has thing v of kind d?" (answer: a person) · count: answer is a number
//     options: the person ids to choose from (or none when the answer is typed)

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

/** The everyday pictures. icons per thing; the words are in welt/lang under huetten.kinds. */
export const KINDS = {
  tiere: ["🐶", "🐱", "🐰", "🐹", "🐦"],
  brot: ["🧀", "🥒", "🍅", "🥚", "🍌"],
  musik: ["🎸", "🥁", "🎹", "🎺", "🎻"],
  sport: ["⚽", "🏀", "🏊", "🎾", "🏓"],
  zimmer: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"],
  haus: ["🟥", "🟦", "🟩", "🟨", "🟪"],
  sitz: ["1", "2", "3", "4", "5"],
};
/** Stories with one kind of thing. Level 3 adds a second kind (haus). */
const ONE = ["tiere", "brot", "musik", "sport", "zimmer"];
export const PEOPLE = ["🧒", "👧", "👦", "👩‍🦱", "🧑‍🦰"];

// ---------- The solver: every assignment, and which ones fit the clues

const perms = (n) => {
  const go = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => go(xs.filter((_, j) => j !== i)).map((p) => [x, ...p])));
  return go([...Array(n).keys()]);
};

/** Every assignment of a grid puzzle: one permutation per kind of thing. */
export function worlds(n, dims) {
  let out = [[]];
  for (let d = 0; d < dims; d++) out = out.flatMap((w) => perms(n).map((p) => [...w, p]));
  return out;
}

/** Does a clue hold in this world? w[d][person] = thing (seats: w[0][person] = seat). */
export function holds(c, w) {
  const owner = (d, v) => w[d].indexOf(v);
  switch (c.type) {
    case "is": return w[c.d][c.p] === c.v;
    case "not": return w[c.d][c.p] !== c.v;
    case "link": return owner(0, c.v) === owner(1, c.w); // the one with thing v also has thing w
    case "nolink": return owner(0, c.v) !== owner(1, c.w);
    case "end": return w[0][c.p] === (c.side === "left" ? 0 : w[0].length - 1);
    case "next": return Math.abs(w[0][c.p] - w[0][c.q]) === 1;
    case "apart": return Math.abs(w[0][c.p] - w[0][c.q]) !== 1;
    case "leftof": return w[0][c.p] < w[0][c.q];
    case "between": return Math.abs(w[0][c.p] - w[0][c.q]) === 2;
    default: return false;
  }
}

export const fits = (clues, all) => all.filter((w) => clues.every((c) => holds(c, w)));

/** Liar puzzles: is statement s true when `culprit` did it? */
export const said = (s, culprit) => (s.says === "did" ? culprit === s.whom : culprit !== s.whom);
export function culprits(t) {
  return [...Array(t.n).keys()].filter((c) => {
    const right = t.statements.filter((s) => said(s, c)).length;
    return t.truth === "one" ? right === 1 : right === t.n - 1;
  });
}

// ---------- Making a puzzle: add true clues until there is one solution, then drop clues not needed

function clueFor(r, kind, w, n, types) {
  const type = r.pick(types);
  const p = r.int(0, n - 1);
  let q = r.int(0, n - 2);
  if (q >= p) q++;
  const d = kind === "grid" && w.length > 1 ? r.int(0, 1) : 0;
  switch (type) {
    case "is": return { type, d, p, v: w[d][p] };
    case "not": {
      let v = r.int(0, n - 2);
      if (v >= w[d][p]) v++;
      return { type, d, p, v };
    }
    case "link": return { type, v: w[0][p], w: w[1][p] };
    case "nolink": return { type, v: w[0][p], w: w[1][q] };
    case "end": {
      const s = w[0][p];
      return s === 0 ? { type, p, side: "left" } : s === n - 1 ? { type, p, side: "right" } : null;
    }
    case "next": return Math.abs(w[0][p] - w[0][q]) === 1 ? { type, p, q } : null;
    case "apart": return Math.abs(w[0][p] - w[0][q]) !== 1 ? { type, p, q } : null;
    case "leftof": return w[0][p] < w[0][q] ? { type, p, q } : { type, p: q, q: p };
    case "between": return Math.abs(w[0][p] - w[0][q]) === 2 ? { type, p, q } : null;
    default: return null;
  }
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** A puzzle with exactly one solution and no clue that could be left out. */
function puzzle(r, { kind, n, dims = 1, types, most }) {
  const all = worlds(n, dims);
  for (let tries = 0; tries < 200; tries++) {
    const w = r.pick(all);
    let clues = [];
    let left = all;
    for (let k = 0; k < 40 && left.length > 1 && clues.length <= most; k++) {
      const c = clueFor(r, kind, w, n, types);
      if (!c || clues.some((x) => same(x, c))) continue;
      const next = fits([c], left);
      if (next.length < left.length) {
        clues.push(c);
        left = next;
      }
    }
    if (left.length !== 1 || clues.length > most) continue;
    // Drop clues that are not needed (each clue must count).
    for (let i = clues.length - 1; i >= 0; i--) {
      const without = clues.filter((_, j) => j !== i);
      if (fits(without, all).length === 1) clues = without;
    }
    return { w, clues };
  }
  return null;
}

/** Who has thing v of kind d (or sits in seat v)? Options: every person. */
function asked(r, base, w, n, dims) {
  const d = r.int(0, dims - 1);
  const v = r.int(0, n - 1);
  return { ...base, solution: w, ask: { d, v }, answer: w[d].indexOf(v), options: [...Array(n).keys()] };
}

const levels = {
  1: { kind: "grid", n: 3, types: ["is", "not", "not"], most: 3 },
  2: { kind: "grid", n: 4, types: ["not"], most: 7 },
  3: { kind: "grid", n: 3, dims: 2, types: ["not", "link", "nolink", "is"], most: 6 },
  4: { kind: "seats", n: 5, types: ["end", "next", "apart", "leftof", "between"], most: 6 },
};

function gridTask(r, level, story = null) {
  const spec = level === 4 && r.chance(0.35) ? { kind: "grid", n: 5, types: ["not", "not", "is"], most: 8 } : levels[level];
  const made = puzzle(r, spec);
  const kind = spec.kind;
  const dims = spec.dims ?? 1;
  const st = kind === "seats" ? "bus" : story ?? r.pick(dims === 2 ? ONE.filter((k) => k !== "zimmer") : ONE);
  const kinds = kind === "seats" ? ["sitz"] : dims === 2 ? [st, "haus"] : [st];
  const base = { kind, story: st, kinds, n: spec.n, clues: made.clues, tool: kind === "seats" ? "reihe" : dims === 2 ? "kette" : level === 1 ? "rest" : "tabelle" };
  const t = asked(r, base, made.w, spec.n, dims);
  return { ...t, key: `${st}${JSON.stringify(made.clues)}${t.ask.d}${t.ask.v}` };
}

/** Who broke the window? Every child says one sentence; exactly one tells the truth (or exactly one lies). */
function liarTask(r) {
  const story = r.pick(["fenster", "kuchen", "vase"]);
  for (let tries = 0; tries < 200; tries++) {
    const n = r.int(3, 4);
    const truth = r.pick(["one", "lie"]);
    const statements = [...Array(n).keys()].map((who) => {
      const says = r.pick(["did", "not"]);
      const whom = r.chance(0.4) ? who : r.int(0, n - 1);
      return { who, says, whom };
    });
    const t = { kind: "liar", story, n, statements, truth };
    const c = culprits(t);
    if (c.length !== 1) continue;
    return { ...t, answer: c[0], options: [...Array(n).keys()], tool: "luege", key: `${story}${truth}${JSON.stringify(statements)}` };
  }
  return null;
}

/** Kombi with camp 2: some clues, then: how many arrangements are still possible? */
function countTask(r, level) {
  const n = level === 3 ? 3 : 4;
  const kind = level === 4 && r.chance(0.5) ? "seats" : "grid";
  const types = kind === "seats" ? ["end", "next", "apart", "leftof"] : ["not", "not", "is"];
  const all = worlds(n, 1);
  for (let tries = 0; tries < 100; tries++) {
    const w = r.pick(all);
    const clues = [];
    const k = r.int(1, level === 3 ? 2 : 3);
    for (let i = 0; i < 20 && clues.length < k; i++) {
      const c = clueFor(r, kind, w, n, types);
      if (c && !clues.some((x) => same(x, c)) && fits([...clues, c], all).length < fits(clues, all).length) clues.push(c);
    }
    const left = fits(clues, all).length;
    if (clues.length < k || left < 2) continue;
    const story = kind === "seats" ? "bus" : r.pick(ONE);
    return { kind, story, kinds: kind === "seats" ? ["sitz"] : [story], n, clues, solution: [w[0]], count: true, all: all.length, answer: left, tool: "zaehlen", key: `cnt${story}${JSON.stringify(clues)}` };
  }
  return null;
}

/** Regel finden here: clue after clue, how many arrangements are left? Then the question. */
function stepTask(r, level) {
  const spec = level === 1 ? { kind: "grid", n: 3, types: ["not", "not", "is"], most: 3 } : level === 2 ? { kind: "grid", n: 3, types: ["not"], most: 4 } : level === 3 ? { kind: "grid", n: 4, types: ["not", "is"], most: 5 } : { kind: "seats", n: 4, types: ["end", "next", "apart", "leftof"], most: 5 };
  const made = puzzle(r, spec);
  const all = worlds(spec.n, 1);
  const steps = made.clues.map((_, i) => fits(made.clues.slice(0, i + 1), all).length);
  const story = spec.kind === "seats" ? "bus" : r.pick(ONE);
  const base = { kind: spec.kind, story, kinds: spec.kind === "seats" ? ["sitz"] : [story], n: spec.n, clues: made.clues, all: all.length, steps, tool: "rest" };
  const t = asked(r, base, made.w, spec.n, 1);
  return { ...t, key: `st${story}${JSON.stringify(made.clues)}${t.ask.v}` };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["missed", "flip", "liar", "first", "count"];

function owl(r, t) {
  const right = r.chance(0.35);
  if (right) return { ...t, said: t.answer, right: true, why: null, reasons: [] };
  let said = null;
  let why = null;
  if (t.kind === "liar") {
    // She believes the first child (the first sentence is true) or simply blames the first one.
    const other = t.options.filter((p) => p !== t.answer);
    said = r.pick(other);
    why = r.pick(["liar", "first"]);
  } else if (t.count) {
    said = r.chance(0.5) ? t.all : t.answer + 1;
    why = said === t.all ? "missed" : "count";
  } else {
    // A clue left out, or a "not" read as if it were not there: another person seems possible.
    const all = worlds(t.n, t.solution.length);
    const tries = r.shuffle(t.clues.map((_, i) => i));
    for (const i of tries) {
      const c = t.clues[i];
      const flipped = c.type === "not" ? { ...c, type: "is" } : null;
      const set = flipped && r.chance(0.5) ? t.clues.map((x, j) => (j === i ? flipped : x)) : t.clues.filter((_, j) => j !== i);
      const others = [...new Set(fits(set, all).map((w) => w[t.ask.d].indexOf(t.ask.v)))].filter((p) => p !== t.answer);
      if (others.length) {
        said = r.pick(others);
        why = set.length === t.clues.length ? "flip" : "missed";
        break;
      }
    }
  }
  if (said === null || said === t.answer || said <= 0 && t.count) return { ...t, said: t.answer, right: true, why: null, reasons: [] };
  const reasons = r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
  return { ...t, said, right: false, why, reasons };
}

const makers = {
  sehen: (level, r) => (level === 4 && r.chance(0.3) ? liarTask(r) : gridTask(r, level)),
  machen: (level, r) => gridTask(r, level === 4 ? 4 : level),
  forschen: (level, r) => stepTask(r, level),
  anwenden(level, r) {
    if (level >= 3 && r.chance(0.3)) return countTask(r, level);
    if (level >= 3 && r.chance(0.3)) return liarTask(r);
    return gridTask(r, level);
  },
  pruefen(level, r) {
    const t = level >= 3 && r.chance(0.25) ? countTask(r, level) : level >= 3 && r.chance(0.3) ? liarTask(r) : gridTask(r, level);
    const o = owl(r, t);
    return { ...o, key: `${t.key}:${o.said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs: the solver runs again. */
export function check(t, level) {
  const problems = [];
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!t.tool) problems.push("no tool");
  if (t.kind === "liar") {
    const c = culprits(t);
    if (c.length !== 1 || c[0] !== t.answer) problems.push(`liar puzzle has ${c.length} solutions`);
  } else {
    const all = worlds(t.n, t.solution.length);
    const left = fits(t.clues, all);
    if (t.count) {
      if (left.length !== t.answer || t.answer < 2) problems.push(`count ${t.answer} vs ${left.length}`);
    } else {
      if (left.length !== 1) problems.push(`${left.length} solutions`);
      else if (left[0][t.ask.d].indexOf(t.ask.v) !== t.answer) problems.push("wrong answer");
      for (let i = 0; i < t.clues.length; i++) if (fits(t.clues.filter((_, j) => j !== i), all).length === 1) problems.push(`clue ${i} not needed`);
      if (t.steps && t.steps.some((k, i) => k !== fits(t.clues.slice(0, i + 1), all).length)) problems.push("bad steps");
    }
    if (t.clues.length > 8) problems.push("too many clues");
    if (t.kinds.some((k) => !KINDS[k])) problems.push("unknown kind");
  }
  if (t.p === "pruefen") {
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
    if (!t.count && !t.options.includes(t.said)) problems.push("owl says no option");
    if (t.count && !(t.said >= 1)) problems.push("owl count");
  }
  return problems;
}
