// The tasks of camp 2 of the thinking mountain, "Alle der Reihe nach" (the coat hooks): count every
// possibility, without missing one and without counting one twice. For 9 to 12, up to the hardest
// counting problems of competitions for 12-year-olds (Känguru, MOEMS, AMC 8).
//
// The thinking tools (t.tool):
//   mal      every choice with every choice: 4 flavours × 3 cones = 12 (a tree, a table)
//   ziffern  numbers from digit cards: the first place has k choices, the next one fewer (no 0 in front)
//   paare    everyone against everyone: n · (n − 1) / 2, because every game has two teams
//   reihe    who sits where: n · (n − 1) · … · 1
//   gitter   ways through the streets: at each corner add the ways from the left and from below
//   weg      all minus the bad ones (a building site in the street, two who must not sit side by side)
//   liste    write them down in order (house numbers with digit sum s)
//   zaun     from the backpack (camp 1): how many numbers from 37 to 112? 112 − 37 + 1
//
// Four levels: 1 two choices · 2 three choices, digit cards, locks · 3 tournaments, ways in the
// street grid, seats in the bus, Kombi with the fence · 4 building sites, "not side by side",
// digit sums, home and away games.
//
//   task({ p, range }, r) → { story, a, answer, tool, pic?, table?, said?, right?, why?, reasons?, key }
//   machen: { mode, items | groups, answer (how many there are), a, tool }  the child finds them all

export const LEVELS = [1, 2, 3, 4];
export const DIGITS = 3;

/** Things to choose from (pictures need no language). */
export const ICONS = {
  flavours: ["🍓", "🍫", "🍋", "🥭", "🫐", "🍒"],
  cones: ["🍦", "🥤", "🧇"],
  sauce: ["🍯", "🥥", "🌰"],
  tops: ["👕", "👚", "🧥", "🎽", "🥼"],
  bottoms: ["👖", "🩳", "🩲"],
  hats: ["🧢", "👒", "🎩"],
  bread: ["🥖", "🍞", "🥯", "🥐"],
  topping: ["🧀", "🥒", "🍅", "🥚", "🥕"],
  soup: ["🥣", "🍜", "🍲"],
  main: ["🍝", "🍛", "🥟", "🍕"],
  dessert: ["🍮", "🍎", "🍪"],
  kids: ["🧒", "👧", "👦", "👩‍🦱", "🧑‍🦰", "👱", "🧔", "👩"],
  teams: ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠", "⚫", "⚪"],
};

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const choose = (n, k) => (k < 0 || k > n ? 0 : fact(n) / (fact(k) * fact(n - k)));
/** Ways from corner (0,0) to (m,n), only right and up. */
export const paths = (m, n) => choose(m + n, m);
/** Three-digit numbers (100 … 999) with digit sum s. */
export const digitSum = (s) => {
  let k = 0;
  for (let i = 100; i < 1000; i++) if ([...String(i)].reduce((x, c) => x + +c, 0) === s) k++;
  return k;
};
/** Two-digit or three-digit numbers from these digit cards, each card once, no 0 in front. */
export const fromCards = (cards, places) => {
  const count = (left, place) => {
    if (place === places) return 1;
    let k = 0;
    left.forEach((c, i) => {
      if (place === 0 && c === 0) return;
      k += count(left.filter((_, j) => j !== i), place + 1);
    });
    return k;
  };
  return count(cards, 0);
};

/** Reasons why the owl can be wrong. */
export const REASONS = ["add", "wheels", "norepeat", "twice", "half", "repeat", "zero", "steps", "blocks", "ends", "stop", "all"];

const groupsOf = (r, names, sizes) => names.map((name, i) => ({ icons: r.sample(ICONS[name], sizes[i]) }));

/** Two choices (level 1) or three (level 2). */
function product(r, level, big = false) {
  const story = level === 1 ? r.pick(["eis", "outfit", "brot", "schulweg", "menue"]) : r.pick(["eis3", "outfit3", "menue3"]);
  const lo = big ? 5 : 2;
  const hi = big ? 9 : level === 1 ? 5 : 3;
  const x = r.int(lo, hi);
  const y = r.int(big ? 4 : 2, big ? 8 : level === 1 ? 4 : 3);
  const z = level === 1 ? 1 : r.int(2, big ? 5 : 3);
  const names = { eis: ["flavours", "cones"], outfit: ["tops", "bottoms"], brot: ["bread", "topping"], menue: ["soup", "main"], eis3: ["flavours", "cones", "sauce"], outfit3: ["tops", "bottoms", "hats"], menue3: ["soup", "main", "dessert"] }[story];
  const sizes = [x, y, z];
  const pic = names && !big && names.every((nm, i) => ICONS[nm].length >= sizes[i]) ? groupsOf(r, names, sizes) : undefined;
  const a = level === 1 ? { x, y } : { x, y, z };
  return { story, a, answer: x * y * z, tool: "mal", pic, key: `${story}${x}${y}${z}` };
}

/** Numbers from digit cards (each once) or a lock (every wheel has every digit). */
function digits(r, level) {
  if (r.chance(0.4)) {
    const k = r.int(level === 2 ? 3 : 4, level === 2 ? 5 : 6);
    const w = level === 2 ? r.int(2, 3) : 3;
    return { story: "schloss", a: { k, w }, answer: k ** w, tool: "mal", key: `lock${k}${w}` };
  }
  const zero = level >= 3 && r.chance(0.5);
  const places = level === 2 ? 2 : 3;
  const n = r.int(places === 2 ? 3 : 4, places === 2 ? 5 : 5);
  const cards = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], n - (zero ? 1 : 0)).sort((p, q) => p - q);
  if (zero) cards.unshift(0);
  const story = places === 2 ? "karten2" : "karten3";
  return { story, a: { cards, n, zero }, answer: fromCards(cards, places), tool: "ziffern", zero, key: `${story}${cards.join("")}` };
}

function tournament(r, level, big = false) {
  const n = big ? r.int(8, 16) : r.int(4, 7);
  if (level === 4 && r.chance(0.5)) return { story: "hinrueck", a: { n, m: n - 1 }, answer: n * (n - 1), tool: "paare", key: `hr${n}` };
  const story = r.pick(["turnier", "haende", "selfies"]);
  return { story, a: { n, m: n - 1 }, answer: (n * (n - 1)) / 2, tool: "paare", pic: n <= 8 ? [{ icons: ICONS[story === "turnier" ? "teams" : "kids"].slice(0, n) }] : undefined, key: `${story}${n}` };
}

function seats(r, level) {
  const n = level === 3 ? r.int(3, 5) : r.int(4, 5);
  const kids = ICONS.kids.slice(0, n);
  if (level === 4) {
    const together = 2 * fact(n - 1);
    return { story: "nichtneben", a: { n, all: fact(n), together }, answer: fact(n) - together, tool: "weg", pic: [{ icons: kids }], key: `nn${n}` };
  }
  return { story: r.pick(["bus", "foto"]), a: { n, f: Array.from({ length: n }, (_, i) => n - i) }, answer: fact(n), tool: "reihe", pic: [{ icons: kids }], key: `seat${n}` };
}

function grid(r, level) {
  const m = r.int(2, 4);
  const n = r.int(2, level === 3 ? 3 : 4);
  if (level === 4) {
    // A building site at a crossing inside the grid: all ways minus the ways through it.
    const px = r.int(1, m - 1);
    const py = r.int(1, n - 1);
    const all = paths(m, n);
    const through = paths(px, py) * paths(m - px, n - py);
    return { story: "baustelle", a: { m, n, all, through }, answer: all - through, tool: "weg", pic: { grid: [m, n], block: [px, py] }, key: `bs${m}${n}${px}${py}` };
  }
  return { story: "gitter", a: { m, n }, answer: paths(m, n), tool: "gitter", pic: { grid: [m, n] }, key: `grid${m}${n}` };
}

/** Kombi with camp 1 (the fence): counting with both ends. */
function fenceKombi(r, level) {
  const from = r.int(12, 60);
  const kind = level === 3 ? r.pick(["vonbis", "gerade"]) : r.pick(["vonbis", "gerade", "endziffer"]);
  if (kind === "vonbis") {
    const to = from + r.int(30, 120);
    return { story: "vonbis", a: { from, to, gap: to - from }, answer: to - from + 1, tool: "zaun", key: `vb${from}${to}` };
  }
  if (kind === "gerade") {
    const a = from + (from % 2);
    const to = a + 2 * r.int(15, 50);
    return { story: "gerade", a: { from: a, to, gap: to - a, gaps: (to - a) / 2 }, answer: (to - a) / 2 + 1, tool: "zaun", key: `ge${a}${to}` };
  }
  const e = r.int(1, 9);
  const to = from + r.int(60, 200);
  let first = from;
  while (first % 10 !== e) first++;
  let last = to;
  while (last % 10 !== e) last--;
  return { story: "endziffer", a: { from, to, e, first, last, gaps: (last - first) / 10 }, answer: (last - first) / 10 + 1, tool: "zaun", key: `ez${from}${to}${e}` };
}

function sumTask(r) {
  const s = r.int(3, 9);
  return { story: "quersumme", a: { s }, answer: digitSum(s), tool: "liste", key: `qs${s}` };
}

/** The story tasks of a level (Verstehen and Übertragen). kombi: tasks from the backpack's tools too. */
function storyTask(r, level, kombi) {
  if (kombi && r.chance(0.3)) return fenceKombi(r, level);
  if (level === 1) return product(r, 1, r.chance(0.3));
  if (level === 2) return r.chance(0.5) ? product(r, 2) : digits(r, 2);
  if (level === 3) return r.pick([() => tournament(r, 3, r.chance(0.5)), () => grid(r, 3), () => seats(r, 3), () => digits(r, 3)])();
  return r.pick([() => grid(r, 4), () => seats(r, 4), () => sumTask(r), () => tournament(r, 4, true), () => digits(r, 4)])();
}

/** The owl's wrong answers, each with the reason behind it. */
function owlOptions(t) {
  const a = t.a;
  switch (t.tool) {
    case "mal":
      return t.story === "schloss" ? [[a.k * a.w, "wheels"], [a.k * (a.k - 1) * (a.w > 2 ? a.k - 2 : 1), "norepeat"]] : [[a.x + a.y + (a.z ?? 0), "add"]];
    case "ziffern":
      return [[a.n ** (t.story === "karten2" ? 2 : 3), "repeat"], ...(t.zero ? [[fact(a.n) / fact(a.n - (t.story === "karten2" ? 2 : 3)), "zero"]] : [])];
    case "paare":
      return t.story === "hinrueck" ? [[t.answer / 2, "half"]] : [[a.n * (a.n - 1), "twice"], [a.n - 1, "stop"]];
    case "reihe":
      return [[a.n * a.n, "repeat"], [a.n * (a.n - 1), "stop"]];
    case "gitter":
      return [[a.m + a.n, "steps"], [a.m * a.n, "blocks"]];
    case "weg":
      return t.story === "baustelle" ? [[a.all, "all"], [a.all - 1, "all"]] : [[a.all, "all"], [a.all - a.together / 2, "half"]];
    case "zaun":
      return t.story === "endziffer" ? [[t.answer - 1, "ends"]] : [[t.answer - 1, "ends"]];
    default:
      return [];
  }
}

/** Ausprobieren: find them all. */
function findAll(r, level) {
  if (level === 1) {
    const story = r.pick(["eis", "outfit", "brot"]);
    const names = { eis: ["flavours", "cones"], outfit: ["tops", "bottoms"], brot: ["bread", "topping"] }[story];
    const x = r.int(2, 3);
    const y = r.int(2, 3) + (x === 2 ? 1 : 0);
    const groups = [r.sample(ICONS[names[0]], x), r.sample(ICONS[names[1]], Math.min(y, ICONS[names[1]].length))];
    const [gx, gy] = groups.map((g) => g.length);
    return { mode: "groups", story, groups, a: { x: gx, y: gy }, answer: gx * gy, tool: "mal", key: `m${story}${gx}${gy}` };
  }
  if (level === 2) {
    if (r.chance(0.5)) {
      const groups = [r.sample(ICONS.tops, 2), r.sample(ICONS.bottoms, 2), r.sample(ICONS.hats, r.int(2, 3))];
      return { mode: "groups", story: "outfit3", groups, a: { x: 2, y: 2, z: groups[2].length }, answer: 4 * groups[2].length, tool: "mal", key: `m3${groups[2].length}` };
    }
    const cards = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], r.int(3, 4)).sort((p, q) => p - q);
    return { mode: "cards", story: "karten2", items: cards, places: 2, a: { cards, n: cards.length, zero: false }, answer: fromCards(cards, 2), tool: "ziffern", key: `mk${cards.join("")}` };
  }
  if (level === 3) {
    if (r.chance(0.5)) {
      const n = r.int(4, 5);
      const story = r.pick(["haende", "selfies", "turnier"]);
      const items = r.sample(ICONS[story === "turnier" ? "teams" : "kids"], n);
      return { mode: "pairs", story, items, a: { n, m: n - 1 }, answer: (n * (n - 1)) / 2, tool: "paare", key: `mp${items.join("")}` };
    }
    const items = r.sample(ICONS.kids, 3);
    return { mode: "orders", story: r.pick(["bus", "foto"]), items, a: { n: 3, f: [3, 2, 1] }, answer: 6, tool: "reihe", key: `mo${items.join("")}` };
  }
  if (r.chance(0.5)) {
    const n = 6;
    const items = r.sample(ICONS.teams, n);
    return { mode: "pairs", story: "turnier", items, a: { n, m: n - 1 }, answer: 15, tool: "paare", key: `mp${items.join("")}` };
  }
  const cards = [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3).sort((p, q) => p - q)];
  return { mode: "cards", story: "karten2", items: cards, places: 2, a: { cards, n: 4, zero: true }, answer: fromCards(cards, 2), tool: "ziffern", zero: true, key: `mk0${cards.join("")}` };
}

/** Regel finden: a small table, one thing changes at a time; then the big question. */
function ruleTask(r, level) {
  if (level === 1) {
    const y = r.int(2, 4);
    const big = product(r, 1, true);
    return { ...big, pic: undefined, table: { id: "mal", fixed: y, rows: [1, 2, 3].map((x) => [x, x * y]), next: [4, 4 * y] }, key: `t${big.key}${y}` };
  }
  if (level === 2) {
    // A lock with only 2 (or 3) digits on each wheel; more wheels, more codes. Then a real lock.
    const small = r.int(2, 3);
    const k = r.int(4, 9);
    const w = k > 6 ? 2 : r.int(2, 3);
    return { story: "schloss", a: { k, w }, answer: k ** w, tool: "mal", table: { id: `schloss${small}`, rows: [1, 2, 3].map((x) => [x, small ** x]), next: [4, small ** 4] }, key: `ts${small}${k}${w}` };
  }
  if (level === 3) {
    if (r.chance(0.4)) {
      // Seats: 1, 2, 3 children; then 5 or 6.
      const n = r.int(5, 6);
      return { story: r.pick(["bus", "foto"]), a: { n, f: Array.from({ length: n }, (_, i) => n - i) }, answer: fact(n), tool: "reihe", table: { id: "reihe", rows: [[1, 1], [2, 2], [3, 6]], next: [4, 24] }, key: `tr${n}` };
    }
    const t = tournament(r, 3, true);
    const n = r.int(8, 20);
    return { ...t, a: { n, m: n - 1 }, answer: (n * (n - 1)) / 2, pic: undefined, table: { id: "paare", rows: [[2, 1], [3, 3], [4, 6]], next: [5, 10] }, key: `tp${t.story}${n}` };
  }
  if (r.chance(0.5)) {
    // Three-digit house numbers with digit sum 1, 2, 3, 4 … then a bigger sum.
    const t = sumTask(r);
    const sum = Math.max(5, t.a.s);
    return { ...t, a: { s: sum }, answer: digitSum(sum), table: { id: "quersumme", rows: [1, 2, 3].map((x) => [x, digitSum(x)]), next: [4, digitSum(4)] }, key: `tq${sum}` };
  }
  const n = r.int(8, 20);
  return { story: "hinrueck", a: { n, m: n - 1 }, answer: n * (n - 1), tool: "paare", table: { id: "hinrueck", rows: [[2, 2], [3, 6], [4, 12]], next: [5, 20] }, key: `th${n}` };
}

const makers = {
  sehen: (level, r) => storyTask(r, level, false),
  machen: (level, r) => findAll(r, level),
  forschen: (level, r) => ruleTask(r, level),
  anwenden: (level, r) => storyTask(r, level, level >= 3),
  pruefen(level, r) {
    const t = storyTask(r, level, level >= 3);
    const wrongs = owlOptions(t).filter(([k]) => Number.isInteger(k) && k > 0 && k !== t.answer && String(k).length <= DIGITS);
    const right = !wrongs.length || r.chance(0.4);
    const [said, why] = right ? [t.answer, null] : r.pick(wrongs);
    const reasons = right ? [] : r.shuffle([why, ...r.sample(REASONS.filter((x) => x !== why), 2)]);
    return { ...t, said, right, why, reasons, key: `${t.key}:${said}` };
  },
};

export function task(level, r) {
  return { p: level.p, range: level.range, ...makers[level.p](level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. Every answer is counted again
 *  here by brute force where that is possible. */
export function check(t, level) {
  const problems = [];
  const fits = (n) => Number.isInteger(n) && n >= 1 && String(n).length <= DIGITS;
  if (!LEVELS.includes(level.range)) problems.push(`no level ${level.range}`);
  if (!fits(t.answer)) problems.push(`answer ${t.answer}`);
  if (!t.tool) problems.push("no tool");
  const a = t.a ?? {};
  const want = {
    eis: () => a.x * a.y, outfit: () => a.x * a.y, brot: () => a.x * a.y, schulweg: () => a.x * a.y, menue: () => a.x * a.y,
    eis3: () => a.x * a.y * a.z, outfit3: () => a.x * a.y * a.z, menue3: () => a.x * a.y * a.z,
    schloss: () => a.k ** a.w,
    karten2: () => fromCards(a.cards, 2), karten3: () => fromCards(a.cards, 3),
    turnier: () => (a.n * (a.n - 1)) / 2, haende: () => (a.n * (a.n - 1)) / 2, selfies: () => (a.n * (a.n - 1)) / 2, hinrueck: () => a.n * (a.n - 1),
    bus: () => fact(a.n), foto: () => fact(a.n),
    nichtneben: () => {
      // Brute force: every order of n children, child 0 and child 1 not side by side.
      const perm = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm(xs.filter((_, j) => j !== i)).map((p) => [x, ...p])));
      return perm([...Array(a.n).keys()]).filter((p) => Math.abs(p.indexOf(0) - p.indexOf(1)) > 1).length;
    },
    gitter: () => paths(a.m, a.n),
    baustelle: () => {
      // Brute force: add the ways at every corner, none through the building site.
      const [bx, by] = t.pic.block;
      const w = [];
      for (let i = 0; i <= a.m; i++) {
        w[i] = [];
        for (let j = 0; j <= a.n; j++) w[i][j] = i === bx && j === by ? 0 : i === 0 && j === 0 ? 1 : (i ? w[i - 1][j] : 0) + (j ? w[i][j - 1] : 0);
      }
      return w[a.m][a.n];
    },
    quersumme: () => digitSum(a.s),
    vonbis: () => a.to - a.from + 1,
    gerade: () => [...Array(a.to - a.from + 1)].filter((_, i) => (a.from + i) % 2 === 0).length,
    endziffer: () => [...Array(a.to - a.from + 1)].filter((_, i) => (a.from + i) % 10 === a.e).length,
  }[t.story];
  if (!want) problems.push(`unknown story ${t.story}`);
  else if (t.p !== "machen" && want() !== t.answer) problems.push(`answer ${t.answer}, counted ${want()}`);
  if (t.p === "machen") {
    const n = t.mode === "groups" ? t.groups.reduce((k, g) => k * g.length, 1) : t.mode === "cards" ? fromCards(t.items, t.places) : t.mode === "pairs" ? (t.items.length * (t.items.length - 1)) / 2 : fact(t.items.length);
    if (n !== t.answer) problems.push(`machen ${t.answer} vs ${n}`);
    if (t.answer > 16) problems.push("too many to find by hand");
    if (t.mode === "groups" && t.groups.some((g) => new Set(g).size !== g.length)) problems.push("same icon twice");
  }
  if (t.table) {
    const { rows, next } = t.table;
    if (rows.some(([x, y]) => !Number.isInteger(x) || !Number.isInteger(y)) || !Number.isInteger(next[1])) problems.push("bad table");
  }
  if (t.pic?.grid && (t.pic.grid[0] > 4 || t.pic.grid[1] > 4)) problems.push("grid too big to draw");
  if (Array.isArray(t.pic) && t.pic.some((row) => row.icons && new Set(row.icons).size !== row.icons.length)) problems.push("same icon twice");
  if (t.p === "pruefen") {
    if (!fits(t.said)) problems.push(`the owl says ${t.said}`);
    if (t.right !== (t.said === t.answer)) problems.push("right does not match");
    if (!t.right && (!REASONS.includes(t.why) || t.reasons.length !== 3 || !t.reasons.includes(t.why))) problems.push(`no reason for ${t.said}`);
  }
  return problems;
}
