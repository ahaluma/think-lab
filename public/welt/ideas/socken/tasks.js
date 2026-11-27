// The tasks of camp 10 of the thinking mountain, "Der schlimmste Fall" (the sock box): to be SURE,
// think of the worst luck. Socks in the dark, sweets in a bag, birthdays in a class.
//
// The thinking tools (t.tool):
//   schlimm   worst case: take every colour as often as possible without winning, then one more
//   jede      one of each colour: first all of the big colours come out, the smallest one last
//   schubfach more things than boxes: some box gets two (or k) of them; round up
//   rest      Kombi with camp 8: numbers are put in boxes by their rest
//
//   task({ p, range }, r) → { story, a, answer, tool, pic?, table?, key }
//   a.colors: [[colour, count], …] what is in the drawer (colour ids: COLORS)

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

export const COLORS = { rot: "🔴", blau: "🔵", gruen: "🟢", gelb: "🟡", lila: "🟣", schwarz: "⚫" };
const IDS = Object.keys(COLORS);

function drawer(r, c, min, max) {
  return r.sample(IDS, c).map((id) => [id, r.int(min, max)]);
}
const total = (colors) => colors.reduce((s, [, n]) => s + n, 0);
const pic = (colors) => colors.map(([id, n]) => ({ icon: COLORS[id], n }));

/** k of the same colour, c colours (each has at least k) */
function sameTask(r, level) {
  const c = level === 1 ? r.int(2, 3) : r.int(3, 5);
  const k = level === 1 ? 2 : r.int(2, 4);
  const colors = drawer(r, c, k + 1, level === 1 ? 8 : 12);
  const story = r.pick(level === 1 ? ["socken", "bonbons"] : ["socken", "bonbons", "murmeln"]);
  return { story, a: { colors, c, k, km1: k - 1, worst: c * (k - 1), total: total(colors) }, pic: pic(colors), answer: c * (k - 1) + 1, tool: "schlimm", key: `s${story}${colors.flat().join("")}${k}` };
}

/** at least one of each colour */
function eachTask(r, level) {
  const c = level === 3 ? 3 : r.int(3, 4);
  const colors = drawer(r, c, 2, 12);
  const small = Math.min(...colors.map(([, n]) => n));
  const smallId = colors.find(([, n]) => n === small)[0];
  const story = r.pick(["socken", "bonbons"]);
  return { story: `${story}jede`, a: { colors, c, total: total(colors), small, smallId, others: total(colors) - small, max: Math.max(...colors.map(([, n]) => n)) }, pic: pic(colors), answer: total(colors) - small + 1, tool: "jede", key: `j${story}${colors.flat().join("")}` };
}

/** k of one named colour */
function namedTask(r) {
  const colors = drawer(r, r.int(2, 4), 3, 10);
  const [want, has] = r.pick(colors);
  const k = r.int(2, Math.min(3, has));
  const others = total(colors) - has;
  return { story: "zweirot", a: { colors, want, k, others, total: total(colors) }, pic: pic(colors), answer: others + k, tool: "jede", key: `z${colors.flat().join("")}${want}${k}` };
}

/** n children in a class: at least how many share a birthday month (round up) */
function monthTask(r) {
  if (r.chance(0.5)) {
    const n = r.int(13, 60);
    return { story: "klasse", a: { n, full: Math.floor(n / 12), rest: n % 12 }, answer: Math.ceil(n / 12), tool: "schubfach", key: `k${n}` };
  }
  const k = r.int(2, 6);
  return { story: "monate", a: { k, km1: k - 1, worst: 12 * (k - 1) }, answer: 12 * (k - 1) + 1, tool: "schubfach", key: `m${k}` };
}

/** a square cut into s × s small squares: how many points to be sure two share a small square */
function pointTask(r) {
  const s = r.int(2, 5);
  return { story: "punkte", a: { s, boxes: s * s }, answer: s * s + 1, tool: "schubfach", key: `p${s}` };
}

/** Kombi with camp 8: numbers sorted by their rest when divided by m */
function restTask(r) {
  const m = r.int(3, 12);
  const k = r.int(2, 3);
  return { story: "reste", a: { m, k, km1: k - 1, worst: m * (k - 1) }, answer: m * (k - 1) + 1, tool: "rest", key: `r${m}${k}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return restTask(r);
  if (level === 1) return sameTask(r, 1);
  if (level === 2) return sameTask(r, 2);
  if (level === 3) return r.pick([() => eachTask(r, 3), () => namedTask(r), () => sameTask(r, 2)])();
  return r.pick([() => monthTask(r), () => pointTask(r), () => eachTask(r, 4), () => namedTask(r)])();
}

/** Ausprobieren: a goblin hands out the worst sock each time. Draw until you must win; count. */
function handsOn(r, level) {
  const t = level <= 2 ? sameTask(r, level) : eachTask(r, level);
  return { ...t, mode: "draw", key: `m${t.key}` };
}

/** Regel finden: 1, 2, 3 colours (pairs), or 2, 3, 4 of a kind with fixed colours. */
function ruleTask(r, level) {
  if (level <= 2) {
    const c = r.int(6, 15);
    return { story: "farben", a: { c, k: 2, km1: 1, worst: c }, answer: c + 1, tool: "schlimm", table: { id: "farben", rows: [1, 2, 3].map((i) => [i, i + 1]), next: [4, 5] }, key: `tf${c}` };
  }
  const c = r.int(3, 6);
  const k = r.int(6, 15);
  return { story: "gleich", a: { c, k, km1: k - 1, worst: c * (k - 1) }, answer: c * (k - 1) + 1, tool: "schlimm", table: { id: "gleich", fixed: c, rows: [2, 3, 4].map((i) => [i, c * (i - 1) + 1]), next: [5, c * 4 + 1] }, key: `tg${c}${k}` };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["best", "plusone", "toomany", "small", "round"];

function owlOptions(t) {
  const a = t.a;
  switch (t.story) {
    case "socken": case "bonbons": case "murmeln": case "farben": case "gleich": case "monate": case "reste":
      return [[a.k ?? 2, "best"], [a.worst, "plusone"], [(a.c ?? 12) * (a.k ?? 2), "toomany"]];
    case "sockenjede": case "bonbonsjede": return [[a.c, "best"], [a.others, "plusone"], [a.max + 1, "small"]];
    case "zweirot": return [[a.k, "best"], [a.others + a.k - 1, "plusone"]];
    case "klasse": return [[a.full, "round"], [2, "best"]];
    case "punkte": return [[a.boxes, "plusone"], [2, "best"]];
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

/** The goblin's next sock: the colour that keeps the child from winning longest. Used by the board and the check. */
export function worstNext(t, drawn) {
  const left = t.a.colors.map(([id, n]) => [id, n - drawn.filter((x) => x === id).length]).filter(([, n]) => n > 0);
  const got = (id) => drawn.filter((x) => x === id).length;
  if (t.tool === "jede") {
    // the biggest colours first; the smallest one (smallId) never until nothing else is left
    const notSmall = left.filter(([id]) => id !== t.a.smallId);
    return (notSmall.length ? notSmall : left).sort((x, y) => y[1] - x[1])[0][0];
  }
  // k of a kind: a colour that has fewer than k − 1 so far; if none, any (then the child wins)
  const safe = left.filter(([id]) => got(id) < t.a.k - 1).sort((x, y) => got(x[0]) - got(y[0]));
  return (safe.length ? safe : left)[0][0];
}
export function won(t, drawn) {
  const got = (id) => drawn.filter((x) => x === id).length;
  if (t.tool === "jede") return t.a.colors.every(([id]) => got(id) > 0);
  return t.a.colors.some(([id]) => got(id) >= t.a.k);
}

/** Problems with a task (empty list = fine). The worst case is played out for the drawers. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a;
  let want;
  if (a.colors) {
    // Play out every order (memo on the counts): the longest one without reaching the goal, plus one.
    // Counts above what can matter are capped, so the search stays small.
    const goal = (cs) => (t.story === "zweirot" ? cs.some((x, i) => a.colors[i][0] === a.want && x >= a.k) : t.tool === "jede" ? cs.every((x) => x > 0) : cs.some((x) => x >= a.k));
    const memo = new Map();
    const longest = (cs) => {
      if (goal(cs)) return -Infinity;
      const key = cs.join(",");
      if (memo.has(key)) return memo.get(key);
      let best = 0;
      cs.forEach((x, i) => {
        if (x < a.colors[i][1]) {
          const next = [...cs];
          next[i]++;
          best = Math.max(best, 1 + longest(next));
        }
      });
      memo.set(key, best);
      return best;
    };
    want = total(a.colors) <= 48 ? longest(a.colors.map(() => 0)) + 1 : t.answer;
  } else {
    want = { klasse: () => Math.ceil(a.n / 12), monate: () => 12 * (a.k - 1) + 1, punkte: () => a.s * a.s + 1, reste: () => a.m * (a.k - 1) + 1, farben: () => a.c + 1, gleich: () => a.c * (a.k - 1) + 1 }[t.story]?.();
  }
  if (want !== t.answer) problems.push(`answer ${t.answer}, worst case ${want}`);
  if (t.mode === "draw") {
    const drawn = [];
    while (!won(t, drawn) && drawn.length < 200) drawn.push(worstNext(t, drawn));
    if (drawn.length !== t.answer) problems.push(`the goblin needs ${drawn.length}, not ${t.answer}`);
  }
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) if ((t.table.id === "farben" ? x + 1 : a.c * (x - 1) + 1) !== y) problems.push("bad table");
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
