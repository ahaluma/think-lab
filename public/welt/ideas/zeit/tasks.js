// The tasks of the idea "Zeit": the clock, the calendar, reading charts, chance. The weather station in
// the town. One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = 1, 2 or 3 (a level):
//     1 full hours; pictures of the weather, one picture a day; a bag with a clear favourite
//     2 half and quarter hours; bars with a scale, "how many more?"; certain, possible, impossible
//     3 every five minutes; how much later, which day in n days; closer bags
//
//   sehen     { range, h, m, choices: [{ h, m }] }       read the clock: which time is it?
//   machen    { range, h, m, step, startH, startM }      set the clock to h:m (minute buttons by step)
//   forschen  { range, bag: { colour: count }, kind, colour?, answer }
//               "most"   which colour comes out most often? answer: a colour or "same"
//               "chance" taking `colour` out is "sure", "maybe" or "never"
//   anwenden  { range, kind, … }
//               "most"  { days: { weather: count }, answer: weather }    which weather was most often?
//               "count" { days, ask: weather, answer }                   on how many days?
//               "diff"  { days, a, b, answer }                           how many more a than b?
//               "later" { h, add, answer }                               h o'clock, in `add` hours?
//               "day"   { today, add, answer }                           which weekday in `add` days?
//   pruefen   { range, h, m, said: { h, m }, right, choices }  the owl reads the clock
//   key – short text that tells tasks apart, for "not the same task again".
//
// Weekdays are 0 = Monday … 6 = Sunday. Hours are 1 … 12 on the clock face.

export const RANGES = [1, 2, 3];
export const COLOURS = ["red", "blue", "yellow", "green"];
export const WEATHER = ["sun", "cloud", "rain", "snow"];
const MINUTES = { 1: [0], 2: [0, 30, 15, 45], 3: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] };

const rangeOf = (range) => (RANGES.includes(range) ? range : 1);
const same = (a, b) => a.h === b.h && a.m === b.m;
const hour = (h) => ((h - 1 + 120) % 12) + 1;

function time(R, r) {
  return { h: r.int(1, 12), m: r.pick(MINUTES[R]) };
}

/** Wrong readings children (and the owl) make: the hands swapped, the hour one off (half past: the
 *  hour hand is already past the number). */
function wrongs(t, R) {
  const out = [];
  const swapped = { h: t.m === 0 ? 12 : t.m / 5, m: (t.h % 12) * 5 };
  if (!same(swapped, t) && Number.isInteger(swapped.h)) out.push(swapped);
  if (t.m >= 30) out.push({ h: hour(t.h + 1), m: t.m });
  out.push({ h: hour(t.h - 1), m: t.m }, { h: hour(t.h + 1), m: t.m });
  if (R > 1 && t.m !== 0) out.push({ h: t.h, m: (t.m + 30) % 60 });
  return out.filter((w) => !same(w, t));
}

function choices(t, R, r) {
  const list = [t];
  for (const w of r.shuffle(wrongs(t, R))) if (list.length < 3 && !list.some((x) => same(x, w))) list.push(w);
  return r.shuffle(list);
}

/** Two weeks of weather: 14 days, one weather that clearly comes most. */
function fortnight(R, r) {
  const kinds = r.shuffle(WEATHER).slice(0, R === 1 ? 3 : 4);
  for (;;) {
    const days = Object.fromEntries(kinds.map((k) => [k, 0]));
    for (let i = 0; i < 14; i++) days[r.pick(kinds)]++;
    const counts = Object.values(days).sort((a, b) => b - a);
    if (counts[0] > counts[1] && counts[counts.length - 1] > 0) return days;
  }
}

const makers = {
  sehen(R, r) {
    const t = time(R, r);
    return { range: R, ...t, choices: choices(t, R, r), key: `${t.h}:${t.m}` };
  },
  machen(R, r) {
    const t = time(R, r);
    const step = R === 1 ? 60 : R === 2 ? 15 : 5;
    let start;
    do start = { h: r.int(1, 12), m: R === 1 ? 0 : r.pick(MINUTES[R]) };
    while (same(start, t));
    return { range: R, ...t, step, startH: start.h, startM: start.m, key: `${t.h}:${t.m}` };
  },
  forschen(R, r) {
    const kind = R === 1 ? "most" : r.pick(["most", "chance"]);
    const n = R === 1 ? 2 : 3;
    const cols = r.shuffle(COLOURS).slice(0, n);
    const bag = {};
    if (kind === "most") {
      // Level 1: one colour clearly more; later closer, sometimes the same.
      const big = R === 1 ? r.int(5, 7) : r.int(3, 5);
      cols.forEach((c, i) => (bag[c] = i === 0 ? big : r.int(1, big - (R === 3 ? 1 : 2))));
      if (R > 1 && r.chance(0.2)) bag[cols[1]] = big;
      const max = Math.max(...Object.values(bag));
      const top = cols.filter((c) => bag[c] === max);
      return { range: R, bag, kind, answer: top.length > 1 ? "same" : top[0], key: `m${JSON.stringify(bag)}` };
    }
    cols.forEach((c) => (bag[c] = r.int(1, 4)));
    const pick = r.int(1, 3);
    let colour, answer;
    if (pick === 1) {
      // sure: every ball has this colour
      colour = cols[0];
      for (const c of cols.slice(1)) delete bag[c];
      bag[colour] = r.int(3, 6);
      answer = "sure";
    } else if (pick === 2) {
      colour = r.pick(COLOURS.filter((c) => !(c in bag)));
      answer = "never";
    } else {
      colour = r.pick(cols);
      answer = "maybe";
    }
    return { range: R, bag, kind, colour, answer, key: `c${JSON.stringify(bag)}${colour}` };
  },
  anwenden(R, r) {
    if (R === 3 && r.chance(0.6)) {
      if (r.chance(0.5)) {
        const h = r.int(1, 12);
        const add = r.int(2, 5);
        return { range: R, kind: "later", h, add, answer: hour(h + add), key: `l${h}+${add}` };
      }
      const today = r.int(0, 6);
      const add = r.int(1, 6);
      return { range: R, kind: "day", today, add, answer: (today + add) % 7, key: `d${today}+${add}` };
    }
    const days = fortnight(R, r);
    const kinds = Object.keys(days);
    const kind = R === 1 ? r.pick(["most", "count"]) : r.pick(["count", "diff", "diff"]);
    if (kind === "most") {
      const max = Math.max(...Object.values(days));
      return { range: R, kind, days, answer: kinds.find((k) => days[k] === max), key: `w${JSON.stringify(days)}` };
    }
    if (kind === "count") {
      const ask = r.pick(kinds);
      return { range: R, kind, days, ask, answer: days[ask], key: `c${JSON.stringify(days)}${ask}` };
    }
    let a, b;
    do [a, b] = r.shuffle(kinds).slice(0, 2);
    while (days[a] === days[b]);
    if (days[a] < days[b]) [a, b] = [b, a];
    return { range: R, kind, days, a, b, answer: days[a] - days[b], key: `x${JSON.stringify(days)}${a}${b}` };
  },
  pruefen(R, r) {
    const t = time(R, r);
    const right = r.chance(0.4);
    const said = right ? t : r.pick(wrongs(t, R));
    return { range: R, ...t, said, right, choices: choices(t, R, r), key: `${t.h}:${t.m}=${said.h}:${said.m}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`zeit: unknown perspective ${level.p}`);
  return { p: level.p, ...make(rangeOf(level.range), r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const R = rangeOf(level.range);
  const problems = [];
  const okTime = (x) => x.h >= 1 && x.h <= 12 && MINUTES[R].includes(x.m);
  if (level.p === "sehen" || level.p === "pruefen") {
    if (!okTime(t)) problems.push(`time ${t.h}:${t.m}`);
    if (t.choices.length !== 3 || !t.choices.some((c) => same(c, t)) || new Set(t.choices.map((c) => `${c.h}:${c.m}`)).size !== 3) problems.push("choices");
    if (level.p === "pruefen" && same(t.said, t) !== t.right) problems.push("right does not match");
  } else if (level.p === "machen") {
    if (!okTime(t) || same({ h: t.startH, m: t.startM }, t) || t.m % t.step) problems.push("clock");
  } else if (level.p === "forschen") {
    const cols = Object.keys(t.bag);
    if (!cols.length || cols.some((c) => t.bag[c] < 1)) problems.push("bag");
    if (t.kind === "most") {
      const max = Math.max(...Object.values(t.bag));
      const top = cols.filter((c) => t.bag[c] === max);
      if (t.answer !== (top.length > 1 ? "same" : top[0])) problems.push("most");
    } else {
      const want = !(t.colour in t.bag) ? "never" : cols.length === 1 ? "sure" : "maybe";
      if (want !== t.answer) problems.push(`chance ${t.answer} should be ${want}`);
    }
  } else if (level.p === "anwenden") {
    if (t.days) {
      const sum = Object.values(t.days).reduce((a, b) => a + b, 0);
      if (sum !== 14) problems.push("not 14 days");
      if (t.kind === "count" && t.answer !== t.days[t.ask]) problems.push("count");
      if (t.kind === "diff" && (t.answer !== t.days[t.a] - t.days[t.b] || t.answer < 1)) problems.push("diff");
    } else if (t.kind === "later") {
      if (t.answer !== hour(t.h + t.add)) problems.push("later");
    } else if (t.kind === "day") {
      if (t.answer !== (t.today + t.add) % 7) problems.push("day");
    }
  }
  return problems;
}
