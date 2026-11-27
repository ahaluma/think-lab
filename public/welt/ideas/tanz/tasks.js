// The tasks of camp 8 of the thinking mountain, "Paare bilden" (the dance floor): who finds a partner,
// what is left over. Even and odd, groups and the rest, colours on a board, endings that come round.
//
// The thinking tools (t.tool):
//   paar      pairs: even works out, odd leaves one. Each switch, each flip changes even and odd
//   rest      groups of k: how many groups, how many left; a group that is not full still needs a place
//   farbe     colour the board: a domino always covers one dark and one light square
//   zyklus    last digits come round: 7, 9, 3, 1, 7 … only the place in the round counts
//   reste     the same rest for 2, 3, 4: one more than a number they all go into
//   woche     Kombi with camp 5: every k-th day, which day of the week
//
//   task({ p, range }, r) → { story, a, answer, tool, choices?, pic?, table?, key }
//   choices: { kind: "yesno" | "light" | "parity" | "days", ids }

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

const YES = { kind: "yesno", ids: [0, 1] }; // 0 yes, 1 no
const LIGHT = { kind: "light", ids: [0, 1] }; // 0 on, 1 off
const PARITY = { kind: "parity", ids: [0, 1] }; // 0 even, 1 odd
const DAYS = { kind: "days", ids: [0, 1, 2, 3, 4, 5, 6] };

/** Do all dancers find a partner? */
function danceTask(r, level) {
  const n = r.int(level === 1 ? 7 : 20, level === 1 ? 31 : 99);
  return { story: "tanz", a: { n, pairs: Math.floor(n / 2), left: n % 2 }, answer: n % 2 === 0 ? 0 : 1, choices: YES, tool: "paar", key: `t${n}` };
}

/** The light is off; the switch is pressed n times. */
function lightTask(r, level) {
  const n = r.int(level === 1 ? 4 : 30, level === 1 ? 25 : 150);
  return { story: "licht", a: { n, pairs: Math.floor(n / 2) }, answer: n % 2 === 1 ? 0 : 1, choices: LIGHT, tool: "paar", key: `l${n}` };
}

/** A sum of numbers: even or odd? Only the odd ones count. */
function sumTask(r, level) {
  const count = level === 1 ? r.int(3, 5) : r.int(5, 8);
  const nums = Array.from({ length: count }, () => r.int(1, level === 1 ? 20 : 99));
  const odd = nums.filter((x) => x % 2).length;
  return { story: "summe", a: { nums, odd, count }, answer: odd % 2, choices: PARITY, tool: "paar", key: `s${nums.join(",")}` };
}

/** The sum 1 + 2 + … + n: even or odd? */
function gaussTask(r) {
  const n = r.int(10, 60);
  const odd = Math.ceil(n / 2);
  return { story: "bis", a: { n, odd }, answer: odd % 2, choices: PARITY, tool: "paar", key: `g${n}` };
}

/** n children, groups (teams, compartments) of k: how many left over, or how many groups needed. */
function groupTask(r, level, story = r.pick(["teams", "zug"])) {
  const k = level === 1 ? 2 : r.int(3, 8);
  let n = r.int(k + 1, level <= 2 ? 40 : 99);
  if (n % k === 0) n++;
  const full = Math.floor(n / k);
  const rest = n % k;
  const answer = story === "zug" ? full + (rest ? 1 : 0) : rest;
  return { story, a: { n, k, full, rest, missing: k - rest }, answer, tool: "rest", key: `${story}${n}${k}` };
}

/** A chessboard with squares taken away: can dominoes cover the rest? */
function dominoTask(r) {
  const s = r.pick([4, 6, 8]);
  const kind = r.pick(["opposite", "opposite", "row", "neighbour", "one"]);
  const gone = { opposite: [[0, 0], [s - 1, s - 1]], row: [[0, 0], [0, s - 1]], neighbour: [[0, 0], [0, 1]], one: [[0, 0]] }[kind];
  const dark = gone.filter(([y, x]) => (x + y) % 2 === 0).length;
  const ok = gone.length === 2 && dark === 1;
  return { story: "domino", a: { s, kind, cells: s * s - gone.length, dark: (s * s) / 2 - dark, light: (s * s) / 2 - (gone.length - dark) }, pic: { board: { s, gone } }, answer: ok ? 0 : 1, choices: YES, tool: "farbe", key: `d${s}${kind}` };
}

/** n coins, h show heads. One move: turn over exactly 2. Can all show tails? */
function coinTask(r) {
  const n = r.int(5, 15);
  const h = r.int(1, n);
  return { story: "muenzen", a: { n, h, tails: n - h }, answer: h % 2 === 0 ? 0 : 1, choices: YES, tool: "paar", key: `m${n}${h}` };
}

/** last digit of a^n */
function lastDigit(a, n) {
  let d = 1;
  for (let i = 0; i < n; i++) d = (d * a) % 10;
  return d;
}
function powerTask(r, level) {
  const b = r.pick([2, 3, 7, 8]);
  const n = level === 3 ? r.int(10, 30) : r.int(40, 100);
  const round = [1, 2, 3, 4].map((i) => lastDigit(b, i));
  const place = ((n - 1) % 4) + 1;
  return { story: "hoch", a: { b, n, round, place, full: Math.floor((n - 1) / 4) }, answer: lastDigit(b, n), tool: "zyklus", key: `h${b}${n}` };
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
/** The smallest number that leaves the same rest for each of a few groups (and maybe goes into d). */
function restsTask(r) {
  const sets = [[2, 3, 4], [3, 4, 5], [2, 3, 5], [4, 5, 6], [2, 3, 4, 5], [3, 5, 6], [2, 5, 7]];
  const ms = r.pick(sets);
  const rest = r.int(1, Math.min(...ms) - 1);
  const L = ms.reduce(lcm, 1);
  const d = r.chance(0.4) ? r.pick([7, 11, 13].filter((x) => !ms.includes(x))) : 0;
  let x = rest;
  while (x <= rest || (d && x % d) || ms.some((m) => x % m !== rest)) x += 1;
  if (x > 999) return restsTask(r);
  return { story: d ? "eier" : "reihen", a: { ms, rest, L, d, prod: ms.reduce((p, m) => p * m, 1) }, answer: x, tool: "reste", key: `r${ms.join("")}${rest}${d}` };
}

/** Kombi with camp 5: practice every k-th day, starting on day `start`. Which day is practice m? */
function weekTask(r) {
  const k = r.int(2, 4);
  const m = r.int(10, 40);
  const start = r.int(0, 6);
  const later = k * (m - 1);
  return { story: "proben", a: { k, m, start, startKey: String(start), later, rest: later % 7 }, answer: (start + later) % 7, choices: DAYS, tool: "woche", key: `p${k}${m}${start}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return weekTask(r);
  if (level === 1) return r.pick([() => danceTask(r, 1), () => lightTask(r, 1), () => sumTask(r, 1), () => groupTask(r, 1, "teams")])();
  if (level === 2) return r.pick([() => groupTask(r, 2, "teams"), () => groupTask(r, 2, "zug"), () => lightTask(r, 2), () => sumTask(r, 2)])();
  if (level === 3) return r.pick([() => dominoTask(r), () => coinTask(r), () => gaussTask(r), () => groupTask(r, 3), () => powerTask(r, 3)])();
  return r.pick([() => powerTask(r, 4), () => restsTask(r), () => dominoTask(r), () => coinTask(r)])();
}

/** Ausprobieren: tap the dancers into groups of k. What is left over? */
function handsOn(r, level) {
  const k = level === 1 ? 2 : level === 2 ? r.int(3, 4) : r.int(4, 6);
  let n = r.int(k + 2, level === 1 ? 15 : 26);
  if (n % k === 0 && r.chance(0.7)) n++;
  return { mode: "groups", story: "teams", a: { n, k, full: Math.floor(n / k), rest: n % k, missing: k - (n % k) }, answer: n % k, tool: "rest", key: `mg${n}${k}` };
}

/** Regel finden: a small table first, then far away. */
function ruleTask(r, level) {
  if (level <= 2) {
    const t = groupTask(r, level, "teams");
    const k = t.a.k;
    const start = r.int(k + 1, 2 * k);
    return { ...t, table: { id: "rest", rows: [0, 1, 2].map((i) => [start + i, (start + i) % k]), next: [start + 3, (start + 3) % k] } };
  }
  const t = powerTask(r, level);
  return { ...t, table: { id: "hoch", rows: [1, 2, 3].map((i) => [i, lastDigit(t.a.b, i)]), next: [4, lastDigit(t.a.b, 4)] } };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["parity", "rest", "groups", "other", "colors", "cycle", "times", "lcm", "week"];

const CHOICE_REASON = { paar: "parity", farbe: "colors", woche: "week" };
function owlOptions(t) {
  const a = t.a;
  if (t.choices) return t.choices.ids.filter((id) => id !== t.answer).map((id) => [id, CHOICE_REASON[t.tool]]);
  switch (t.story) {
    case "zug": return [[a.full, "rest"], [a.full + 1 + (a.rest ? 0 : 1), "rest"]];
    case "teams": return [[a.missing, "other"], [a.full, "groups"]];
    case "hoch": return [[lastDigit(a.b, a.n % 4), "cycle"], [(a.b * a.n) % 10, "times"], [lastDigit(a.b, a.place + 1), "cycle"]];
    case "reihen": case "eier": return [[a.prod + a.rest, "lcm"], [a.L, "rest"]];
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

/** Can dominoes cover the board? Tried for real (small boards: every way). */
function tiles(s, gone) {
  const free = Array.from({ length: s }, (_, y) => Array.from({ length: s }, (_, x) => !gone.some(([gy, gx]) => gy === y && gx === x)));
  const go = () => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      if (!free[y][x]) continue;
      free[y][x] = false;
      for (const [dy, dx] of [[0, 1], [1, 0]]) {
        if (free[y + dy]?.[x + dx]) {
          free[y + dy][x + dx] = false;
          if (go()) return true;
          free[y + dy][x + dx] = true;
        }
      }
      free[y][x] = true;
      return false;
    }
    return true;
  };
  return go();
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs: every answer is worked out again. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => (t.choices ? t.choices.ids.includes(n) : Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS);
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a;
  const want = {
    tanz: () => (a.n % 2 ? 1 : 0),
    licht: () => {
      let on = false;
      for (let i = 0; i < a.n; i++) on = !on;
      return on ? 0 : 1;
    },
    summe: () => a.nums.reduce((s, x) => s + x, 0) % 2,
    bis: () => ((a.n * (a.n + 1)) / 2) % 2,
    teams: () => a.n % a.k,
    zug: () => Math.ceil(a.n / a.k),
    domino: () => (a.s <= 6 ? (tiles(a.s, t.pic.board.gone) ? 0 : 1) : t.answer),
    muenzen: () => {
      // every state reachable from h heads by turning 2: search
      const seen = new Set([a.h]);
      const todo = [a.h];
      while (todo.length) {
        const h = todo.pop();
        for (const k of [0, 1, 2]) {
          const next = h - k + (2 - k); // k heads turned to tails, 2 − k tails to heads
          if (k <= h && 2 - k <= a.n - h && !seen.has(next)) seen.add(next), todo.push(next);
        }
      }
      return seen.has(0) ? 0 : 1;
    },
    hoch: () => Number(String(BigInt(a.b) ** BigInt(a.n)).at(-1)),
    reihen: () => {
      for (let x = a.rest + 1; ; x++) if (a.ms.every((m) => x % m === a.rest) && (!a.d || x % a.d === 0)) return x;
    },
    proben: () => (a.start + a.k * (a.m - 1)) % 7,
  };
  want.eier = want.reihen;
  const w = want[t.story];
  if (!w) problems.push(`unknown story ${t.story}`);
  else if (w() !== t.answer) problems.push(`answer ${t.answer}, worked out ${w()}`);
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) {
      const f = t.table.id === "rest" ? x % a.k : Number(String(BigInt(a.b) ** BigInt(x)).at(-1));
      if (f !== y) problems.push("bad table");
    }
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
