// The tasks of the idea "Muster": a row goes on and on, because one piece comes again and again.
// The forest on the map. One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. p = perspective id. range says how long the piece is:
//     5  → two things, turn by turn        🍄🌰 🍄🌰
//     10 → three things in a piece         🍄🌰🌰  ·  🍄🍄🌰  ·  🍄🌰🍂
//     20 → four things in a piece          🍄🍄🌰🌰 · 🍄🌰🍄🍂 · 🍄🌰🌰🍂 · 🍄🍄🌰🍂 · 🍄🌰🍂🐌
//
//   A piece ("unit") is written as letters, "ABB". `icons` gives every letter its picture.
//
//   sehen     { unit, icons, shown, answer, choices }   the row stops: what comes next?
//   machen    { unit, icons, shown, fill, kinds }       lay the next `fill` things yourself
//   forschen  { unit, icons, shown, choices, answer }   which piece comes again and again? (pieces as letters)
//   anwenden  { unit, icons, shown, rows, answer }      which other row goes the same way?
//                                                       rows: [{ unit, icons }], answer = index
//   pruefen   { unit, icons, shown, wrongAt, wrong }    the owl laid a row. wrongAt = place of the one
//                                                       wrong thing (or -1), wrong = its letter
//   key – short text that tells tasks apart, for "not the same task again".
//
// This is the idea of the old game "Muster-Kette", in the frame of the new world.

export const UNITS = {
  5: ["AB"],
  10: ["ABB", "AAB", "ABC"],
  20: ["AABB", "ABAC", "ABBC", "AABC", "ABCD"],
};
export const FOREST = ["🍄", "🌰", "🍂", "🐌", "🐞", "🌲", "🐿️", "🐦"]; // old, well-known emoji: old phones show them too
export const MAX_SHOWN = 10; // more things get too small in one row on a small phone

const letters = (unit) => [...new Set(unit)];
/** The thing at place i of the endless row. */
export const at = (unit, i) => unit[i % unit.length];
/** "ABB" → "ABB", "BBA" → "AAB": the letters renamed in the order they come. */
const renamed = (u) => {
  const names = {};
  return [...u].map((l) => (names[l] ??= "ABCD"[Object.keys(names).length])).join("");
};
/**
 * Is v the row of u, only started at another place or made of other things? "ABB" and "AAB" are:
 * 🍄🌰🌰🍄🌰🌰 is 🌰🌰🍄🌰🌰🍄 one step later. Such a pair must never be "right" and "wrong" in one task.
 */
export const sameWay = (u, v) => {
  const n = u.length * v.length;
  const long = (w) => Array.from({ length: n * 2 }, (_, i) => at(w, i)).join("");
  for (let shift = 0; shift < u.length; shift++) if (renamed(long(u).slice(shift, shift + n)) === renamed(long(v).slice(0, n))) return true;
  return false;
};

/** A piece of the range and a picture for each of its letters. */
function pattern(range, r, not = []) {
  const unit = r.pick((UNITS[range] || UNITS[5]).filter((u) => !not.includes(u)));
  const pics = r.shuffle(FOREST);
  const icons = Object.fromEntries(letters(unit).map((l, i) => [l, pics[i]]));
  return { unit, icons };
}

/** How many things are shown: two full pieces and a bit, so the piece is seen twice. */
const shownFor = (unit, r, extraMax = unit.length - 1) => Math.min(MAX_SHOWN - 1, unit.length * 2 + r.int(0, extraMax));

const makers = {
  sehen(range, r) {
    const { unit, icons } = pattern(range, r);
    const shown = shownFor(unit, r);
    return { unit, icons, shown, answer: at(unit, shown), choices: r.shuffle(letters(unit)), key: `${unit}:${shown % unit.length}` };
  },
  machen(range, r) {
    const { unit, icons } = pattern(range, r);
    const shown = unit.length * 2;
    const fill = Math.min(unit.length + 1, MAX_SHOWN - shown);
    return { unit, icons, shown, fill, kinds: r.shuffle(letters(unit)), key: unit };
  },
  forschen(range, r) {
    const { unit, icons } = pattern(range, r);
    const shown = Math.min(MAX_SHOWN, unit.length * 3);
    // Wrong pieces: too short or too long. Never the same piece started at another place ("BBA" for "ABB"):
    // that piece comes again and again as well.
    const wrong = new Set([unit.slice(0, -1), unit + unit[0], unit[0] + unit, unit + unit.at(-1)]);
    const others = r.shuffle([...wrong].filter((w) => w.length >= 1 && !sameWay(w, unit))).slice(0, 2);
    const choices = r.shuffle([unit, ...others]);
    return { unit, icons, shown, choices, answer: choices.indexOf(unit), key: unit };
  },
  anwenden(range, r) {
    const { unit, icons } = pattern(range, r);
    const shown = Math.min(MAX_SHOWN, unit.length * 2 + (unit.length < 4 ? unit.length : 0));
    // Other pictures for the other rows: the same way to go on, but with other things.
    const rest = r.shuffle(FOREST.filter((f) => !Object.values(icons).includes(f)));
    const other = Object.fromEntries(["A", "B", "C", "D"].map((l, i) => [l, rest[i]]));
    // Wrong rows go another way, also when started at another place. First choice: rows with the same
    // number of different things, so only the order tells them apart.
    const n = letters(unit).length;
    const all = [...UNITS[5], ...UNITS[10], ...UNITS[20]].filter((u) => !sameWay(u, unit));
    const sorted = [...r.shuffle(all.filter((u) => letters(u).length === n)), ...r.shuffle(all.filter((u) => letters(u).length !== n))];
    const picked = [];
    for (const u of sorted) if (picked.length < (range <= 5 ? 1 : 2) && !picked.some((p) => sameWay(p, u))) picked.push(u);
    const rows = r.shuffle([{ unit, right: true }, ...picked.map((u) => ({ unit: u, right: false }))]);
    return {
      unit,
      icons,
      shown,
      rows: rows.map((row) => ({ unit: row.unit, icons: other })),
      answer: rows.findIndex((row) => row.right),
      key: `${unit}:${picked.join()}`,
    };
  },
  pruefen(range, r) {
    const { unit, icons } = pattern(range, r);
    const shown = Math.min(MAX_SHOWN, unit.length * 3);
    const right = r.chance(0.4);
    // The wrong thing is never in the first piece: the first piece shows how the row goes.
    const wrongAt = right ? -1 : r.int(unit.length, shown - 1);
    const wrong = right ? "" : r.pick(letters(unit).filter((l) => l !== at(unit, wrongAt)));
    return { unit, icons, shown, wrongAt, wrong, key: `${unit}:${wrongAt}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  return { p: level.p, range: level.range, ...make(level.range, r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const units = UNITS[level.range];
  if (!units.includes(t.unit)) problems.push(`piece ${t.unit} is not of this range`);
  for (const l of letters(t.unit)) if (!t.icons[l]) problems.push(`no picture for ${l}`);
  if (new Set(letters(t.unit).map((l) => t.icons[l])).size !== letters(t.unit).length) problems.push("two letters look the same");
  if (t.shown < t.unit.length * 2) problems.push("the piece is not shown twice");
  if (t.shown + (t.p === "sehen" ? 1 : t.p === "machen" ? t.fill : 0) > MAX_SHOWN) problems.push("row too long");
  if (t.p === "sehen") {
    if (t.answer !== at(t.unit, t.shown) || !t.choices.includes(t.answer)) problems.push("bad answer");
    if (t.choices.length < 2) problems.push("nothing to choose");
  }
  if (t.p === "machen" && (t.fill < 2 || t.kinds.length < 2)) problems.push("nothing to lay");
  if (t.p === "forschen") {
    if (t.choices[t.answer] !== t.unit) problems.push("bad answer");
    if (t.choices.length < 2) problems.push("nothing to choose");
    if (new Set(t.choices).size !== t.choices.length) problems.push("the same piece twice");
    t.choices.forEach((c, i) => i !== t.answer && sameWay(c, t.unit) && problems.push(`${c} is right as well`));
  }
  if (t.p === "anwenden") {
    if (t.rows.length < 2 || t.rows[t.answer]?.unit !== t.unit) problems.push("bad answer");
    t.rows.forEach((row, i) => {
      if (i !== t.answer && sameWay(row.unit, t.unit)) problems.push(`row ${row.unit} is right as well`);
      for (const l of letters(row.unit)) {
        if (!row.icons[l]) problems.push(`row without a picture for ${l}`);
        if (Object.values(t.icons).includes(row.icons[l])) problems.push("a row uses the pictures of the model");
      }
    });
    if (new Set(t.rows.map((row) => row.unit)).size !== t.rows.length) problems.push("the same row twice");
  }
  if (t.p === "pruefen" && t.wrongAt >= 0) {
    if (t.wrongAt < t.unit.length || t.wrongAt >= t.shown) problems.push("wrong thing at a bad place");
    if (t.wrong === at(t.unit, t.wrongAt) || !t.unit.includes(t.wrong)) problems.push("the wrong thing is not wrong");
  }
  return problems;
}
