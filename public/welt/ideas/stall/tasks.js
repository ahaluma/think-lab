// The tasks of camp 7 of the thinking mountain, "Annehmen und verbessern" (the stable): two kinds of
// things, how many there are together and what they have together (legs, wheels, chairs, points).
// Assume they are all the small kind, see how much is missing, and swap one at a time.
//
// The thinking tools (t.tool):
//   annehmen  assume all are the small kind; each swap to the big kind adds the difference
//   drei      a third kind with the same number as the small kind: it changes nothing, count it in
//   quiz      points: right +5, wrong −2. Assume all right; each wrong one costs 7
//   waage     Kombi with camp 6: the same with weights in kg
//
//   task({ p, range }, r) → { story, a, answer, tool, table?, icons?, key }
//   a: n things, total, vs and vb (each small / big one), base = vs · n, extra = total − base,
//      diff = vb − vs; the answer is how many of the big kind (for drei: the small kind).

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

/** The stories: what is small and big, and how much each has. */
export const KINDS = {
  stall: { icons: ["🐔", "🐐"], vs: 2, vb: 4 },
  fahrrad: { icons: ["🚲", "🛺"], vs: 2, vb: 3 },
  tische: { icons: ["🪑", "🪑"], vs: 4, vb: 6 },
  boote: { icons: ["🛶", "⛵"], vs: 2, vb: 4 },
  spinnen: { icons: ["🐞", "🕷️"], vs: 6, vb: 8 },
  muenzen: { icons: ["2 €", "5 €"], vs: 2, vb: 5 },
};

function assume(r, story, n, tool = "annehmen", values = null) {
  const { vs, vb } = values ?? KINDS[story];
  const big = r.int(1, n - 1);
  const total = vs * n + (vb - vs) * big;
  return { story, a: { kind: story, n, total, vs, vb, base: vs * n, extra: total - vs * n, diff: vb - vs, small: n - big }, answer: big, tool, key: `${story}${n}${big}${vb}` };
}

/** Quiz: n questions, +5 for right, −2 for wrong. How many right? */
function quizTask(r) {
  const n = r.int(10, 20);
  const right = r.int(Math.ceil(n / 3), n - 1);
  const wrong = n - right;
  const total = 5 * right - 2 * wrong;
  return { story: "quiz", a: { n, total, all: 5 * n, lost: 5 * n - total, wrong }, answer: right, tool: "quiz", key: `q${n}${right}` };
}

/** Hens, ducks (both 2 legs) and goats: d ducks are known. How many hens? */
function threeTask(r) {
  const goats = r.int(2, 12);
  const ducks = r.int(2, 9);
  const hens = r.int(2, 15);
  const n = goats + ducks + hens;
  const total = 2 * (hens + ducks) + 4 * goats;
  return { story: "drei", a: { n, total, d: ducks, base: 2 * n, extra: total - 2 * n, goats, birds: n - goats }, answer: hens, tool: "drei", key: `d${goats}${ducks}${hens}` };
}

/** Kombi with camp 6: hens of 2 kg and goats of w kg, n animals weigh total kg together. */
function weightTask(r) {
  const vb = r.pick([20, 25, 30, 40]);
  const n = r.int(6, 15);
  const t = assume(r, "gewicht", n, "waage", { vs: 2, vb });
  if (t.a.total > 999) return weightTask(r);
  return t;
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return weightTask(r);
  if (level === 1) return assume(r, r.pick(["stall", "stall", "boote"]), r.int(3, 6));
  if (level === 2) {
    const story = r.pick(["stall", "tische", "boote", "fahrrad"]);
    return assume(r, story, r.int(8, 30));
  }
  if (level === 3) return r.pick([() => assume(r, r.pick(["fahrrad", "spinnen", "tische"]), r.int(10, 40)), () => threeTask(r)])();
  return r.pick([() => quizTask(r), () => threeTask(r), () => assume(r, r.pick(["spinnen", "muenzen"]), r.int(15, 60))])();
}

/** Ausprobieren: all are the small kind at first. Tap one to swap it, until the total is right. */
function handsOn(r, level) {
  const story = level === 1 ? "stall" : level === 2 ? r.pick(["stall", "boote"]) : r.pick(["fahrrad", "spinnen", "muenzen"]);
  const n = level === 1 ? r.int(3, 6) : level === 2 ? r.int(6, 12) : r.int(10, 16);
  const t = assume(r, story, n);
  return { ...t, mode: "swap", icons: KINDS[story].icons, key: `m${t.key}` };
}

/** Regel finden: 0, 1, 2 of the big kind; then the real question. */
function ruleTask(r, level) {
  const t = level === 1 ? assume(r, "stall", r.int(4, 6)) : level === 2 ? assume(r, r.pick(["stall", "boote", "tische"]), r.int(10, 30)) : assume(r, r.pick(["fahrrad", "spinnen", "muenzen"]), r.int(15, 50));
  const row = (k) => [k, t.a.base + k * t.a.diff];
  return { ...t, table: { id: "tausch", rows: [0, 1, 2].map(row), next: row(3) } };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["other", "divide", "base", "minus", "ducks", "half"];

function owlOptions(t) {
  const a = t.a;
  switch (t.tool) {
    case "annehmen": case "waage": return [[a.small, "other"], [a.extra, "divide"], [Math.round(a.total / a.vb), "base"], [Math.round(a.n / 2), "half"]];
    case "quiz": return [[Math.round(a.total / 5), "minus"], [a.wrong, "other"], [Math.round(a.lost / 5), "minus"]];
    case "drei": return [[a.birds, "ducks"], [a.goats, "other"]];
    default: return [];
  }
}

const makers = {
  sehen: (level, r) => storyTask(r, level, false),
  machen: (level, r) => handsOn(r, level),
  forschen: (level, r) => ruleTask(r, level),
  anwenden: (level, r) => storyTask(r, level, level >= 3),
  pruefen(level, r) {
    const t = storyTask(r, level, level >= 3);
    const wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k >= 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs: every answer is counted by trying all. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a;
  // Try every split and keep those that fit: there must be exactly one.
  const fits2 = [];
  if (t.tool === "quiz") {
    for (let right = 0; right <= a.n; right++) if (5 * right - 2 * (a.n - right) === a.total) fits2.push(right);
  } else if (t.tool === "drei") {
    for (let hens = 0; hens <= a.n - a.d; hens++) if (2 * (hens + a.d) + 4 * (a.n - a.d - hens) === a.total) fits2.push(hens);
  } else {
    for (let big = 0; big <= a.n; big++) if (a.vs * (a.n - big) + a.vb * big === a.total) fits2.push(big);
  }
  if (fits2.length !== 1 || fits2[0] !== t.answer) problems.push(`answer ${t.answer}, tried ${fits2}`);
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) if (a.vs * (a.n - x) + a.vb * x !== y) problems.push("bad table");
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
