// The tasks of camp 11 of the thinking mountain, "Vom Ende her" (the heap of stones): games against
// the owl. Who takes the last stone wins (or loses). Think from the end: which heaps are traps?
//
// The thinking tools (t.tool):
//   falle     take 1 to k: heaps of k + 1, 2 (k + 1) … are traps for whoever must move. Leave a trap
//   letzter   the last one loses: leave 1 more than a trap (1, k + 2, 2 (k + 1) + 1 …)
//   zaehlen   the counting game to T: the numbers T, T − (k + 1) … win. Say the smallest one first
//   gleich    two heaps: make them equal, then copy the owl on the other heap
//   brueche   a chocolate bar: every break makes one piece more. m · n pieces need m · n − 1 breaks
//   paar      Kombi with camp 8: the number of breaks is fixed; odd means the first player makes the last
//
//   task({ p, range }, r) → { story, a, answer, tool, choices?, pic?, table?, key }

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

/** take 1..k, last one wins: how many to take now from n (never a multiple of k + 1) */
function takeTask(r, level, story = r.pick(["steine", "hoelzer", "kekse"])) {
  const k = level === 1 ? 2 : r.int(3, 5);
  // never a trap at the start; drawn again (not n + 1, that would make the answer 1 too often)
  let n;
  do n = r.int(level === 1 ? 4 : 10, level === 1 ? 10 : level === 2 ? 30 : 60);
  while (n % (k + 1) === 0);
  const first = n % (k + 1);
  return { story, a: { n, k, k1: k + 1, first, trap: n - first }, pic: [{ icon: { steine: "🪨", hoelzer: "🥢", kekse: "🍪" }[story], n }], answer: first, tool: "falle", key: `${story}${n}${k}` };
}

/** the last one loses */
function lastTask(r) {
  const k = r.int(2, 4);
  let n;
  do n = r.int(8, 40);
  while ((n - 1) % (k + 1) === 0);
  const first = (n - 1) % (k + 1);
  return { story: "chili", a: { n, k, k1: k + 1, first, trap: n - first }, pic: [{ icon: "🍬", n }], answer: first, tool: "letzter", key: `c${n}${k}` };
}

/** the counting game: start at 0, add 1..k, who says T wins. Which number do you say first? */
function countTask(r, level) {
  const k = level === 3 ? 2 : r.int(2, 5);
  let T;
  do T = level === 3 ? r.int(15, 30) : r.int(30, 100);
  while (T % (k + 1) === 0);
  const first = T % (k + 1);
  return { story: "zaehlen", a: { T, k, k1: k + 1, first, next: first + k + 1 }, answer: first, tool: "zaehlen", key: `z${T}${k}` };
}

/** two heaps, take any number from one heap, the last one wins: how many to take? */
function twoTask(r) {
  const a = r.int(3, 20);
  let b = r.int(3, 20);
  if (a === b) b++;
  const [small, big] = [Math.min(a, b), Math.max(a, b)];
  return { story: "zwei", a: { x: a, y: b, small, big }, pic: [{ icon: "🪨", n: a }, { icon: "🪨", n: b }], answer: big - small, tool: "gleich", key: `h${a}${b}` };
}

/** a chocolate bar: how many breaks to get all small pieces? */
function chocoTask(r) {
  const m = r.int(2, 8);
  const n = r.int(3, 10);
  return { story: "schokolade", a: { m, n, pieces: m * n }, pic: Array.from({ length: m }, () => ({ icon: "🟫", n })), answer: m * n - 1, tool: "brueche", key: `s${m}${n}` };
}

/** Kombi with camp 8: who makes the last break? */
function whoTask(r) {
  // half the bars have an odd number of pieces (then the owl makes the last break), not just a quarter
  const odd = r.chance(0.5);
  const m = odd ? r.pick([3, 5, 7]) : r.int(2, 7);
  const n = odd ? r.pick([3, 5, 7, 9]) : r.pick(m % 2 ? [2, 4, 6, 8] : [2, 3, 4, 5, 6, 7, 8, 9]);
  const breaks = m * n - 1;
  return { story: "schokower", a: { m, n, pieces: m * n, breaks }, pic: Array.from({ length: m }, () => ({ icon: "🟫", n })), answer: breaks % 2 === 1 ? 0 : 1, choices: { kind: "who", ids: [0, 1] }, tool: "paar", key: `w${m}${n}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return whoTask(r);
  if (level === 1) return takeTask(r, 1);
  if (level === 2) return takeTask(r, 2);
  if (level === 3) return r.pick([() => lastTask(r), () => countTask(r, 3), () => takeTask(r, 3)])();
  return r.pick([() => twoTask(r), () => chocoTask(r), () => countTask(r, 4), () => lastTask(r)])();
}

/** Ausprobieren: play against the owl. You start from a heap you can win. */
function handsOn(r, level) {
  const t = level === 1 ? takeTask(r, 1, "steine") : level === 2 ? takeTask(r, 2, "steine") : takeTask(r, 3, "steine");
  return { ...t, mode: "play", key: `m${t.key}` };
}

/** Regel finden: the traps, one after another; then the first move from a big heap. */
function ruleTask(r, level) {
  const t = takeTask(r, level <= 2 ? level : 2, "steine");
  const k1 = t.a.k1;
  return { ...t, story: "fallen", pic: undefined, table: { id: "fallen", rows: [1, 2, 3].map((i) => [i, i * k1]), next: [4, 4 * k1] } };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["greedy", "kplus", "last", "equal", "breaks", "parity"];

function owlOptions(t) {
  const a = t.a;
  if (t.choices) return [[1 - t.answer, "parity"]];
  switch (t.story) {
    case "steine": case "hoelzer": case "kekse": case "fallen": return [[a.k, "greedy"], [a.n % a.k, "kplus"], [1, "greedy"]];
    case "chili": return [[a.n % a.k1, "last"], [a.k, "greedy"]];
    case "zaehlen": return [[a.T % a.k, "kplus"], [a.k, "greedy"]];
    case "zwei": return [[a.small, "equal"], [a.big, "equal"], [1, "greedy"]];
    case "schokolade": return [[a.pieces, "breaks"], [(a.m - 1) * (a.n - 1), "breaks"], [a.m + a.n, "breaks"]];
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
    const wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k > 0 && k !== t.answer && String(k).length <= DIGITS && (!t.a.k || t.story === "schokolade" || k <= t.a.k || t.story === "zwei"));
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** The owl's move on a heap of n (take 1..k, last wins): to a trap if it can, else 1. */
export function owlMove(n, k) {
  const m = n % (k + 1);
  return m === 0 ? 1 : m;
}

/** Problems with a task (empty list = fine). Every game is solved by looking at all moves from the end. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => (t.choices ? t.choices.ids.includes(n) : Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS);
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a;
  // win[n] = the player to move on n can force a win. Moves: the winning first moves.
  const solve = (n, k, lastLoses) => {
    const win = [lastLoses];
    for (let i = 1; i <= n; i++) {
      win[i] = false;
      for (let j = 1; j <= Math.min(k, i); j++) if (!win[i - j]) win[i] = true;
    }
    const good = [];
    for (let j = 1; j <= Math.min(k, n); j++) if (!win[n - j]) good.push(j);
    return good;
  };
  let want;
  switch (t.story) {
    case "steine": case "hoelzer": case "kekse": case "fallen": {
      const good = solve(a.n, a.k, false);
      want = good.length === 1 ? good[0] : NaN;
      break;
    }
    case "chili": {
      const good = solve(a.n, a.k, true);
      want = good.length === 1 ? good[0] : NaN;
      break;
    }
    case "zaehlen": {
      // saying x is like leaving a heap of T − x
      const good = solve(a.T, a.k, false);
      want = good.length === 1 ? good[0] : NaN;
      break;
    }
    case "zwei": {
      // take j from one heap; the position (p, q) is lost for the mover when p === q (all heaps tried)
      const memo = new Map();
      const lost = (p, q) => {
        const key = `${p},${q}`;
        if (!memo.has(key)) {
          let l = true;
          for (let j = 1; j <= p && l; j++) if (lost(p - j, q)) l = false;
          for (let j = 1; j <= q && l; j++) if (lost(p, q - j)) l = false;
          memo.set(key, l);
        }
        return memo.get(key);
      };
      const good = [];
      for (let j = 1; j <= a.x; j++) if (lost(a.x - j, a.y)) good.push(j);
      for (let j = 1; j <= a.y; j++) if (lost(a.x, a.y - j)) good.push(j);
      want = good.length === 1 ? good[0] : NaN;
      break;
    }
    case "schokolade": {
      // break every piece until all are 1 × 1, counting pieces
      let pieces = [[a.m, a.n]];
      let breaks = 0;
      while (pieces.some(([p, q]) => p * q > 1)) {
        const i = pieces.findIndex(([p, q]) => p * q > 1);
        const [p, q] = pieces[i];
        pieces.splice(i, 1, ...(p > 1 ? [[1, q], [p - 1, q]] : [[p, 1], [p, q - 1]]));
        breaks++;
      }
      want = breaks;
      break;
    }
    case "schokower": want = (a.m * a.n - 1) % 2 === 1 ? 0 : 1; break;
    default: problems.push(`unknown story ${t.story}`);
  }
  if (want !== t.answer) problems.push(`answer ${t.answer}, solved ${want}`);
  if (t.table) for (const [x, y] of [...t.table.rows, t.table.next]) if (solve(y, a.k, false).length || x * a.k1 !== y) problems.push("bad table");
  if (t.mode === "play") {
    // play it out: child takes the winning move, the owl answers; the child must take the last stone
    let n = a.n;
    let child = true;
    let last = null;
    for (let guard = 0; n > 0 && guard < 200; guard++) {
      const j = child ? (n % a.k1 || 1) : owlMove(n, a.k);
      n -= j;
      last = child;
      child = !child;
    }
    if (last !== true) problems.push("the child does not win");
  }
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
