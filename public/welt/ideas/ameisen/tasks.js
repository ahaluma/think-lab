// The tasks of camp 5 of the thinking mountain, "Die Regel finden" (the ant road): a row goes on by
// a rule. Find the rule, then jump far ahead without writing everything down.
//
// The thinking tools (t.tool):
//   plusk    always + k: at place n there is first + (n − 1) · k (from 1 to n are n − 1 jumps: camp 1)
//   wechsel  two jumps taking turns: look at the pairs
//   muster   a piece that comes again: divide the place by the length of the piece, look at the rest
//   streich  figures from matches: the first figure, then the same number more each time
//   woche    the days of the week come again every 7 days: only the rest counts
//   gauss    adding a long row: first + last, second + second-to-last … always the same
//   stellen  counting digits in blocks: 9 one-digit numbers, 90 two-digit numbers …
//   quadrat  square and rectangle numbers: n · n, n · (n + 1)
//   zaun     Kombi with camp 1: matches in a row of squares, tiles around a square (corners once)
//
//   task({ p, range }, r) → { story, a, answer, tool, choices?, pic?, table?, key }
//     choices: answers to tap instead of typing (shapes, days of the week): { kind, ids }

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

export const SHAPES = ["🔺", "🔵", "🟩", "⭐", "🟨", "💜"];
/** Matches per figure n: a row of squares, a row of triangles, two rows of squares. */
export const STICKS = { quadrate: (n) => 3 * n + 1, dreiecke: (n) => 2 * n + 1, doppel: (n) => 5 * n + 2 };
/** The digit at place p of 123456789101112… */
export function digitAt(p) {
  let len = 1;
  let count = 9;
  let start = 1;
  while (p > len * count) {
    p -= len * count;
    len++;
    count *= 10;
    start *= 10;
  }
  const n = start + Math.floor((p - 1) / len);
  return Number(String(n)[(p - 1) % len]);
}

/** always + k (or − k) */
function plusTask(r, level) {
  const story = r.pick(["folge", "sparen", "kino", "baum"]);
  const k = level === 1 ? r.int(2, 9) : r.int(3, 15);
  const first = r.int(1, 20);
  const n = level === 1 ? r.int(6, 12) : r.int(15, 40);
  const answer = first + (n - 1) * k;
  if (answer > 999) return plusTask(r, level);
  const shown = [0, 1, 2, 3].map((i) => first + i * k);
  return { story, a: { shown, n, k, first, jumps: n - 1 }, answer, tool: "plusk", key: `${story}${first}${k}${n}` };
}

/** two jumps taking turns: + a, + b, + a, + b … What is at place n? */
function alternating(r) {
  const x = r.int(1, 9);
  const y = r.int(2, 9);
  const first = r.int(1, 15);
  const n = r.int(9, 20);
  const at = (i) => first + Math.floor(i / 2) * (x + y) + (i % 2) * x; // i from 0
  const shown = [0, 1, 2, 3, 4, 5].map(at);
  return { story: "wechsel", a: { shown, n, x, y, pairs: Math.floor((n - 1) / 2), sum: x + y }, answer: at(n - 1), tool: "wechsel", key: `w${first}${x}${y}${n}` };
}

/** a piece of shapes that comes again: which shape is at place n? (tap) or: how many of one shape among the first n? */
function shapeTask(r, level) {
  const len = level === 2 ? r.int(3, 4) : r.int(4, 6);
  const kinds = r.sample(SHAPES, Math.min(len, r.int(2, 3)));
  const piece = Array.from({ length: len }, (_, i) => kinds[i < kinds.length ? i : r.int(0, kinds.length - 1)]);
  const n = r.int(20, level === 2 ? 60 : 200);
  const shown = Array.from({ length: 2 * len + 1 }, (_, i) => piece[i % len]);
  if (r.chance(0.5)) {
    return { story: "formen", a: { n, len, rest: n % len || len }, piece, pic: [{ icons: shown }], answer: piece[(n - 1) % len], choices: { kind: "icons", ids: kinds }, tool: "muster", key: `f${piece.join("")}${n}` };
  }
  const which = r.pick(kinds);
  const per = piece.filter((s) => s === which).length;
  const full = Math.floor(n / len);
  const answer = full * per + piece.slice(0, n % len).filter((s) => s === which).length;
  return { story: "formenzahl", a: { n, len, which, full, per }, piece, pic: [{ icons: shown }], answer, tool: "muster", key: `fz${piece.join("")}${n}${which}` };
}

/** matches: figure n of a row of squares (triangles, two rows) */
function stickTask(r, level, kombi = false) {
  const shape = kombi ? "quadrate" : level === 4 ? r.pick(["quadrate", "dreiecke", "doppel"]) : r.pick(["quadrate", "dreiecke"]);
  const n = kombi ? r.int(12, 60) : r.int(level === 3 ? 10 : 20, level === 3 ? 30 : 99);
  const f = STICKS[shape];
  return { story: kombi ? "zaunreihe" : "hoelzer", a: { shape, n, first: f(1), step: f(2) - f(1), jumps: n - 1 }, shape, pic: { sticks: shape, upTo: 3 }, answer: f(n), tool: kombi ? "zaun" : "streich", key: `s${shape}${n}${kombi}` };
}

/** days of the week: today is day d; which day is it in `later` days (or on the m-th of the month)? */
function weekTask(r, level) {
  const today = r.int(0, 6);
  if (level === 4 || r.chance(0.4)) {
    const first = r.int(0, 6);
    const day = r.int(15, 31);
    return { story: "kalender", a: { first, firstKey: String(first), day, later: day - 1, rest: (day - 1) % 7 }, answer: (first + day - 1) % 7, choices: { kind: "days", ids: [0, 1, 2, 3, 4, 5, 6] }, tool: "woche", key: `k${first}${day}` };
  }
  const later = r.int(20, level === 3 ? 100 : 400);
  return { story: "wochentag", a: { today, todayKey: String(today), later, rest: later % 7, weeks: Math.floor(later / 7) }, answer: (today + later) % 7, choices: { kind: "days", ids: [0, 1, 2, 3, 4, 5, 6] }, tool: "woche", key: `wt${today}${later}` };
}

/** adding a long row: stairs of cubes, seats in a stadium */
function sumTask(r, level) {
  if (level === 3 || r.chance(0.5)) {
    const n = r.int(level === 3 ? 8 : 20, level === 3 ? 20 : 44);
    return { story: "wuerfeltreppe", a: { n, pair: n + 1, half: n / 2 }, answer: (n * (n + 1)) / 2, tool: "gauss", key: `wt${n}` };
  }
  const first = r.int(5, 15);
  const k = r.int(1, 3);
  const rows = r.int(6, 14);
  const last = first + (rows - 1) * k;
  const answer = (rows * (first + last)) / 2;
  if (answer > 999 || !Number.isInteger(answer)) return sumTask(r, level);
  return { story: "stadion", a: { first, k, rows, last, pair: first + last }, answer, tool: "gauss", key: `st${first}${k}${rows}` };
}

function digitTask(r) {
  const p = r.int(10, 999);
  return { story: "ziffernband", a: { p }, answer: digitAt(p), tool: "stellen", key: `dz${p}` };
}

function squareTask(r, kombi = false) {
  const n = r.int(8, kombi ? 40 : 30);
  if (kombi) return { story: "randfliesen", a: { n, side: n - 1 }, answer: 4 * (n - 1), tool: "zaun", key: `rf${n}` };
  if (r.chance(0.5)) return { story: "fliesen", a: { n }, answer: n * n, tool: "quadrat", key: `fl${n}` };
  return { story: "punkte", a: { n, m: n + 1 }, answer: n * (n + 1), tool: "quadrat", key: `pk${n}` };
}

function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return r.chance(0.5) ? stickTask(r, level, true) : squareTask(r, true);
  if (level === 1) return plusTask(r, 1);
  if (level === 2) return r.pick([() => plusTask(r, 2), () => alternating(r), () => shapeTask(r, 2)])();
  if (level === 3) return r.pick([() => stickTask(r, 3), () => weekTask(r, 3), () => sumTask(r, 3), () => shapeTask(r, 3)])();
  return r.pick([() => digitTask(r), () => sumTask(r, 4), () => squareTask(r), () => stickTask(r, 4), () => weekTask(r, 4)])();
}

/** Ausprobieren: go on with the shapes (levels 1, 2), or lay figure 4 from matches and then count figure n (3, 4). */
function handsOn(r, level) {
  if (level <= 2) {
    const len = level === 1 ? r.int(2, 3) : r.int(3, 4);
    const kinds = r.sample(SHAPES, Math.min(len, 3));
    const piece = Array.from({ length: len }, (_, i) => kinds[i < kinds.length ? i : r.int(0, kinds.length - 1)]);
    const shown = Array.from({ length: len + 2 }, (_, i) => piece[i % len]);
    const next = Array.from({ length: 6 }, (_, i) => piece[(shown.length + i) % len]);
    return { mode: "shapes", story: "formen", piece, shown, next, kinds, a: { n: shown.length + 6, len, rest: (shown.length + 6) % len || len }, answer: next.length, tool: "muster", key: `mf${piece.join("")}` };
  }
  const t = stickTask(r, level);
  return { ...t, mode: "sticks", build: 4, key: `ms${t.key}` };
}

/** Regel finden: figure 1, 2, 3 in a table, then figure 4, then far away. */
function ruleTask(r, level) {
  if (level === 1) {
    const t = plusTask(r, 1);
    return { ...t, table: { id: "folge", rows: [1, 2, 3].map((i) => [i, t.a.first + (i - 1) * t.a.k]), next: [4, t.a.first + 3 * t.a.k] } };
  }
  if (level === 4 && r.chance(0.5)) {
    const t = squareTask(r);
    const f = t.story === "fliesen" ? (n) => n * n : (n) => n * (n + 1);
    return { ...t, table: { id: t.story, rows: [1, 2, 3].map((i) => [i, f(i)]), next: [4, f(4)] } };
  }
  if (level >= 3 && r.chance(0.4)) {
    const n = r.int(10, 44);
    return { story: "wuerfeltreppe", a: { n, pair: n + 1, half: n / 2 }, answer: (n * (n + 1)) / 2, tool: "gauss", table: { id: "wuerfeltreppe", rows: [[1, 1], [2, 3], [3, 6]], next: [4, 10] }, key: `tw${n}` };
  }
  const t = stickTask(r, Math.max(level, 3));
  const f = STICKS[t.shape];
  return { ...t, table: { id: t.shape, rows: [1, 2, 3].map((i) => [i, f(i)]), next: [4, f(4)] } };
}

/** Reasons why the owl can be wrong. */
export const REASONS = ["start", "times", "next", "week", "pairs", "digits", "corners", "rest"];

function owlOptions(t) {
  const a = t.a;
  switch (t.tool) {
    case "plusk": return [[a.first + a.n * a.k, "start"], [a.n * a.k, "start"], [a.shown[3] + a.k, "next"]];
    case "wechsel": return [[t.answer + a.x, "rest"], [a.shown[0] + (a.n - 1) * a.x, "start"]];
    case "streich": return [[a.n * a.first, "times"], [a.n * a.step, "start"]];
    case "gauss": return t.story === "wuerfeltreppe" ? [[a.n * a.n, "pairs"], [(a.n * a.n) / 2, "pairs"]] : [[a.rows * a.first, "pairs"]];
    case "stellen": return [[(t.answer + 1) % 10, "digits"], [(t.answer + 9) % 10, "digits"]];
    case "quadrat": return [[t.answer - t.a.n, "start"], [4 * a.n, "times"]];
    case "zaun": return t.story === "randfliesen" ? [[4 * a.n, "corners"], [4 * a.n - 8, "corners"]] : [[4 * a.n, "times"], [3 * a.n, "start"]];
    case "muster": return t.story === "formenzahl" ? [[Math.round((a.n * a.per) / a.len) + 1, "rest"]] : [];
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
    let wrongs;
    if (t.choices) wrongs = t.choices.ids.filter((id) => id !== t.answer).map((id) => [id, t.tool === "woche" ? "week" : "rest"]);
    else wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k >= 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.35);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs: every answer is counted out. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => (t.choices ? t.choices.ids.includes(n) : Number.isInteger(n) && n >= 0 && String(n).length <= DIGITS);
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (t.mode !== "shapes" && !fits(t.answer)) problems.push(`answer ${t.answer}`);
  const a = t.a ?? {};
  const want = {
    folge: () => a.first + (a.n - 1) * a.k, sparen: () => a.first + (a.n - 1) * a.k, kino: () => a.first + (a.n - 1) * a.k, baum: () => a.first + (a.n - 1) * a.k,
    wechsel: () => {
      let v = a.shown[0];
      for (let i = 1; i < a.n; i++) v += i % 2 ? a.x : a.y;
      return v;
    },
    formen: () => (t.mode === "shapes" ? t.answer : t.piece[(a.n - 1) % a.len]),
    formenzahl: () => Array.from({ length: a.n }, (_, i) => t.piece[i % a.len]).filter((s) => s === a.which).length,
    hoelzer: () => STICKS[a.shape](a.n), zaunreihe: () => STICKS[a.shape](a.n),
    wochentag: () => (a.today + a.later) % 7, kalender: () => (a.first + a.day - 1) % 7,
    wuerfeltreppe: () => Array.from({ length: a.n }, (_, i) => i + 1).reduce((x, y) => x + y, 0),
    stadion: () => Array.from({ length: a.rows }, (_, i) => a.first + i * a.k).reduce((x, y) => x + y, 0),
    ziffernband: () => Number(Array.from({ length: 400 }, (_, i) => i + 1).join("")[a.p - 1]),
    fliesen: () => a.n * a.n, punkte: () => a.n * (a.n + 1),
    randfliesen: () => {
      let k = 0;
      for (let i = 0; i < a.n; i++) for (let j = 0; j < a.n; j++) if (i === 0 || j === 0 || i === a.n - 1 || j === a.n - 1) k++;
      return k;
    },
  }[t.story];
  if (!want) problems.push(`unknown story ${t.story}`);
  else if (want() !== t.answer) problems.push(`answer ${t.answer}, counted ${want()}`);
  if (t.table) {
    for (const [x, y] of [...t.table.rows, t.table.next]) {
      const f = t.story === "fliesen" ? x * x : t.story === "punkte" ? x * (x + 1) : t.story === "wuerfeltreppe" ? (x * (x + 1)) / 2 : t.shape ? STICKS[t.shape](x) : a.first + (x - 1) * a.k;
      if (f !== y) problems.push("bad table");
    }
  }
  if (t.mode === "shapes" && t.next.some((s, i) => s !== t.piece[(t.shown.length + i) % t.piece.length])) problems.push("bad shapes");
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3)) problems.push("no reason");
  }
  return problems;
}
