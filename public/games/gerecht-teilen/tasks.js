// The tasks of "Gerecht teilen": one function makes one task (see shared/gen.js).
//
//   task(level, r) → { kids, each, rest, half, total, treat, faces, choices, key }
//     kids    – how many friends share (level.kids)
//     each    – how many every friend gets: the answer
//     rest    – left over in the basket, 0 … kids − 1 (only with level.rest, 7 of 10 times)
//     half    – one more that is cut in half (level.half)
//     total   – in the basket: each × kids + rest (+ 1 to cut in half)
//     treat   – id of what is shared (TREATS); with half only one that can be cut
//     faces   – the friends' faces, one per friend, all different
//     choices – three number buttons, smallest first: the answer and typical mistakes
//               (one more, one less, the number of friends); only used with input "number"
//     key     – short text that tells tasks apart, for "not the same task again"

// What is shared. cut: can be cut in half (for the halving level). Names are in lang/<language>.js.
export const TREATS = [
  { id: "cookie", icon: "🍪", cut: true },
  { id: "apple", icon: "🍎", cut: true },
  { id: "strawberry", icon: "🍓", cut: false },
  { id: "candy", icon: "🍬", cut: false },
  { id: "carrot", icon: "🥕", cut: true },
  { id: "banana", icon: "🍌", cut: true },
  { id: "donut", icon: "🍩", cut: true },
];
// The friends who share. Only faces, so they never look like something to count.
export const FRIENDS = ["🐻", "🐰", "🐼", "🦊", "🐸", "🐯", "🐨", "🐷", "🐵", "🦁", "🐶", "🐱"];

/** The answer and two typical mistakes (one more, one less, the number of friends), smallest first. */
function choices(r, each, kids) {
  const ok = (n) => n >= 1 && n <= 10 && n !== each;
  const likely = r.shuffle([each + 1, each - 1, kids].filter(ok));
  const more = [each + 2, each - 2, each + 3].filter(ok);
  const picked = [...new Set([...likely, ...more])].slice(0, 2);
  return [each, ...picked].sort((x, y) => x - y);
}

export function task(level, r) {
  const half = !!level.half;
  const kids = r.int(level.kids[0], level.kids[1]);
  const most = Math.min(level.each[1], Math.floor((level.max - (half ? 1 : 0)) / kids));
  const each = r.int(Math.min(level.each[0], most), most);
  let rest = 0;
  if (level.rest && r.chance(0.7) && level.max - each * kids >= 1) rest = r.int(1, Math.min(kids - 1, level.max - each * kids));
  const total = each * kids + rest + (half ? 1 : 0); // halving: one more, it is cut in half
  const treats = half ? TREATS.filter((t) => t.cut) : TREATS;
  return {
    kids, each, rest, half, total,
    treat: r.pick(treats).id,
    faces: r.sample(FRIENDS, kids),
    choices: choices(r, each, kids),
    key: `${kids}-${total}`,
  };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  if (t.kids < level.kids[0] || t.kids > level.kids[1]) problems.push("friends outside level");
  if (t.each < 1 || t.each > level.each[1]) problems.push("each outside level");
  if (t.total !== t.each * t.kids + t.rest + (t.half ? 1 : 0)) problems.push("total does not add up");
  if (t.total > level.max) problems.push("more than max");
  if (t.rest < 0 || t.rest >= t.kids || (t.rest && !level.rest)) problems.push("bad rest");
  if (t.half !== !!level.half) problems.push("wrong half");
  if (t.half && !TREATS.find((x) => x.id === t.treat).cut) problems.push("cannot cut this treat");
  if (t.faces.length !== t.kids || new Set(t.faces).size !== t.kids) problems.push("bad faces");
  if (t.choices.length !== 3 || new Set(t.choices).size !== 3) problems.push("not three different choices");
  if (!t.choices.includes(t.each)) problems.push("answer missing in choices");
  return problems;
}
