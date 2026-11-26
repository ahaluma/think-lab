// The tasks of "Zahlenzug": one function makes one task (see shared/gen.js).
//
//   task(level, r) → { kind, train, row, shown, answer, choices, yard, key }
//     kind    – "missing", "after", "before" or "order" ("mixed" levels pick after or before)
//     train   – what is on each wagon, left to right; null = an empty place ("?")
//     row     – the numbers of the whole train, small to big (missing, order)
//     shown   – the number on the wagon (after, before)
//     answer  – the number the child has to find (not for order)
//     choices – three number buttons, smallest first (not for order)
//     yard    – order: the wagons' indices in row, in the mixed-up order they wait in (never already in order)
//     key     – short text that tells tasks apart, for "not the same task again"

const MAX = 20;

export function task(level, r) {
  const kind = level.kind === "mixed" ? r.pick(["after", "before"]) : level.kind;
  const from = r.int(...level.from);

  if (kind === "order") {
    const row = Array.from({ length: level.len }, (_, i) => from + i);
    let yard;
    do yard = r.shuffle([...row.keys()]);
    while (yard.every((x, i) => x === i));
    return { kind, train: row.map(() => null), row, yard, key: `order:${row[0]}:${yard}` };
  }

  let t;
  if (kind === "missing") {
    const row = Array.from({ length: level.len }, (_, i) => from + i);
    const hole = r.int(0, level.len - 1);
    t = { kind, row, train: row.map((n, i) => (i === hole ? null : n)), answer: row[hole] };
  } else {
    // "before" needs a number of at least 2, so the answer is 1 or more.
    const shown = kind === "before" ? Math.max(2, from) : from;
    t = kind === "after"
      ? { kind, shown, answer: shown + 1, train: [shown, null] }
      : { kind, shown, answer: shown - 1, train: [null, shown] };
  }
  // The answer and two of its neighbours (one or two more or less), between 1 and 20.
  const near = r.shuffle([-2, -1, 1, 2].map((d) => t.answer + d).filter((n) => n >= 1 && n <= MAX));
  t.choices = [t.answer, ...near.slice(0, 2)].sort((a, b) => a - b);
  t.key = `${kind}:${t.train}`;
  return t;
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (level.kind === "mixed" ? !["after", "before"].includes(t.kind) : t.kind !== level.kind) problems.push("wrong kind");
  const numbers = t.train.filter((n) => n !== null);
  if (numbers.some((n) => n < 1 || n > MAX)) problems.push("number outside 1–20");
  if (t.kind === "order") {
    if (t.row.length !== level.len || t.row.some((n, i) => i && n !== t.row[i - 1] + 1)) problems.push("row not in steps of one");
    if ([...t.yard].sort((a, b) => a - b).join() !== [...t.row.keys()].join()) problems.push("yard is not every wagon once");
    if (t.yard.every((x, i) => x === i)) problems.push("yard already in order");
    if (t.row[0] < level.from[0] || t.row[0] > level.from[1]) problems.push("first number outside from");
    return problems;
  }
  if (t.train.filter((n) => n === null).length !== 1) problems.push("not exactly one gap");
  if (t.answer < 1 || t.answer > MAX) problems.push("answer outside 1–20");
  if (t.kind === "missing" && t.row[t.train.indexOf(null)] !== t.answer) problems.push("answer does not fill the gap");
  if (t.kind === "after" && t.answer !== t.shown + 1) problems.push("after ≠ shown + 1");
  if (t.kind === "before" && t.answer !== t.shown - 1) problems.push("before ≠ shown − 1");
  if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
  if (!t.choices.includes(t.answer)) problems.push("answer missing in choices");
  if (t.choices.some((n) => n < 1 || n > MAX)) problems.push("choice outside 1–20");
  return problems;
}
