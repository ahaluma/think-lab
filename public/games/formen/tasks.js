// The tasks of "Formen": one function makes one task (see shared/gen.js).
//
//   task(level, r) → one task as plain data, no texts:
//     level – the id of the level the task is from (in "mix" levels one of the others)
//     kind  – "find", "riddle", "build", "all" or "count"
//     want  – the shape the child looks for (build: the shape of the first gap)
//     find, riddle: choices – [{ shape, spec }] the shape buttons (spec: how it is drawn, see lone())
//     build: pic (a key of PICTURES), steps – one per gap, biggest first: { gap (part index), choices }
//     all:   cells – nine { shape, spec }, targets – how many of them are `want`
//     count: pic, answer (how many `want` are in it), numbers (three to pick from, smallest first)
//     key   – the task in short, for "not the same task again"; pic – the picture (or the shape) for
//             "not the same picture twice in a row"

import { LEVELS } from "./levels.js";

export const SHAPES = ["circle", "triangle", "square", "rectangle"];
export const COLORS = ["#ff5a36", "#ffc83a", "#12a564", "#2456b8", "#e8488a", "#8a5cd6", "#ff9f1c", "#20b2c9"];
const INK = "#1b2140";

// ---------- Pictures made of shapes (viewBox 0 0 100 100)
// A part: [shape, x, y, w, h, colour, turn (degrees, around its middle), triangle form].
// Triangles point up; "right": the tip is above the left corner. Circles: w = h. Parts are drawn in this order.
// Only things children in Nepal and in Germany both know, in every climate (no snowman).

export const PICTURES = {
  house: [["square", 25, 46, 50, 50, "#ffc83a"], ["triangle", 17, 12, 66, 34, "#ff5a36"], ["rectangle", 43, 68, 14, 28, "#9a5b2e"]],
  iceCream: [["triangle", 33, 44, 34, 52, "#e0a458", 180], ["circle", 29, 8, 42, 42, "#e8488a"]],
  caterpillar: [["circle", 4, 46, 30, 30, "#12a564"], ["circle", 28, 40, 32, 32, "#12a564"], ["circle", 54, 26, 40, 40, "#8fd36b"]],
  tree: [["rectangle", 43, 64, 14, 32, "#9a5b2e"], ["triangle", 18, 6, 64, 60, "#12a564"]],
  lollipop: [["rectangle", 47, 54, 6, 42, "#9aa3c7"], ["circle", 25, 6, 50, 50, "#e8488a"]],
  boat: [["triangle", 30, 16, 40, 50, "#2456b8", 0, "right"], ["rectangle", 12, 68, 76, 18, "#ff5a36"], ["circle", 76, 6, 16, 16, "#ffc83a"]],
  fish: [["triangle", 62, 32, 30, 36, "#ff9f1c", -90], ["circle", 12, 22, 56, 56, "#ff9f1c"], ["circle", 24, 38, 10, 10, INK]],
  car: [["square", 32, 26, 28, 28, "#8fd3ff"], ["rectangle", 8, 48, 84, 24, "#ff5a36"], ["circle", 16, 62, 24, 24, INK], ["circle", 60, 62, 24, 24, INK]],
  rocket: [["triangle", 16, 58, 20, 32, "#ff5a36"], ["triangle", 64, 58, 20, 32, "#ff5a36"], ["rectangle", 34, 30, 32, 52, "#c9b6ff"],
    ["triangle", 34, 4, 32, 26, "#ff5a36"], ["circle", 41, 40, 18, 18, "#2456b8"]],
  robot: [["rectangle", 30, 78, 14, 20, "#9aa3c7"], ["rectangle", 56, 78, 14, 20, "#9aa3c7"], ["rectangle", 22, 44, 56, 34, "#20b2c9"],
    ["square", 32, 6, 36, 36, "#20b2c9"], ["circle", 38, 16, 10, 10, INK], ["circle", 52, 16, 10, 10, INK]],
  train: [["rectangle", 4, 44, 40, 28, "#2456b8"], ["rectangle", 50, 44, 46, 28, "#ff5a36"], ["square", 68, 18, 26, 26, "#ff5a36"],
    ["rectangle", 54, 26, 8, 18, INK], ["circle", 8, 64, 16, 16, INK], ["circle", 26, 64, 16, 16, INK],
    ["circle", 56, 64, 16, 16, INK], ["circle", 76, 64, 16, 16, INK]],
  flower: [["rectangle", 47, 50, 6, 46, "#12a564"], ["triangle", 53, 62, 22, 18, "#12a564", 90], ["triangle", 25, 70, 22, 18, "#12a564", -90],
    ["circle", 38, 2, 24, 24, "#e8488a"], ["circle", 22, 16, 24, 24, "#e8488a"], ["circle", 54, 16, 24, 24, "#e8488a"],
    ["circle", 28, 32, 24, 24, "#e8488a"], ["circle", 48, 32, 24, 24, "#e8488a"], ["circle", 40, 19, 20, 20, "#ffc83a"]],
};
const SETS = {
  small: ["house", "iceCream", "caterpillar", "tree", "lollipop", "boat", "fish"],
  big: ["car", "rocket", "robot", "house", "fish", "boat"],
  count: ["car", "rocket", "robot", "train", "flower", "caterpillar", "house", "fish", "boat"],
};
export const part = ([shape, x, y, w, h, color, rot = 0, tri = "iso"]) => ({ shape, x, y, w, h, color, rot, tri });

/** A shape alone in a 100 × 100 box, for buttons. look: "same", "size" or "turn" (see levels.js). */
export function lone(r, shape, look, color) {
  let w, h, rot = 0, tri = "iso";
  if (shape === "circle") w = h = 70;
  else if (shape === "triangle") [w, h] = [76, 66];
  else if (shape === "square") w = h = 62;
  else [w, h] = [84, 46];
  if (look === "turn") {
    if (shape === "triangle") {
      tri = r.pick(["iso", "right", "lean"]);
      [w, h] = r.pick([[76, 66], [80, 50], [56, 76]]);
      rot = r.pick([0, 30, 90, 180, -60, 140]);
    } else if (shape === "square") {
      rot = r.pick([0, 15, 30, 45]);
      w = h = rot ? 56 : 62;
    } else if (shape === "rectangle") {
      [w, h] = r.pick([[84, 40], [86, 30], [76, 42]]);
      rot = r.pick([0, 90, 25, -30, 60]);
      if (rot % 90) [w, h] = [w * 0.92, h * 0.92];
    }
  }
  if (look !== "same") {
    const k = shape === "circle" || look === "size" ? r.int(65, 100) / 100 : r.int(85, 100) / 100;
    w *= k;
    h *= k;
  }
  return { shape, x: 50 - w / 2, y: 50 - h / 2, w, h, color, rot, tri };
}

// ---------- The kinds of task

function find(l, r) {
  const shapes = r.sample(l.shapes, l.choices);
  const want = r.pick(shapes);
  const one = r.pick(COLORS);
  const colors = r.shuffle(COLORS);
  const choices = shapes.map((shape, i) => ({ shape, spec: lone(r, shape, l.look, l.look === "same" ? one : colors[i]) }));
  return { want, choices, pic: want };
}

function riddle(l, r) {
  const want = r.pick(SHAPES);
  const colors = r.shuffle(COLORS);
  const choices = r.shuffle(SHAPES).map((shape, i) => ({ shape, spec: lone(r, shape, "turn", colors[i]) }));
  return { want, choices, pic: want };
}

// Build: the gaps biggest first, so the picture is recognisable early; the little ones (eyes, windows) at the end.
function build(l, r) {
  const pic = r.pick(SETS[l.pics]);
  const parts = PICTURES[pic].map(part);
  const order = parts.map((_, i) => i).sort((a, b) => parts[b].w * parts[b].h - parts[a].w * parts[a].h);
  const steps = order.map((gap) => {
    const shape = parts[gap].shape;
    const others = r.sample(SHAPES.filter((s) => s !== shape), l.choices - 1);
    const color = r.pick(COLORS);
    return { gap, choices: r.shuffle([shape, ...others]).map((s) => ({ shape: s, spec: lone(r, s, "same", color) })) };
  });
  return { pic, want: parts[order[0]].shape, steps };
}

// All: nine shapes in a 3 × 3 grid, 2 to 4 of them are the ones to find.
function all(l, r) {
  const want = r.pick(SHAPES);
  const targets = r.int(2, 4);
  const others = SHAPES.filter((s) => s !== want);
  const list = r.shuffle([...Array(targets).fill(want), ...others, ...Array.from({ length: 6 - targets }, () => r.pick(others))]);
  const colors = r.shuffle(COLORS);
  return { want, targets, cells: list.map((shape, i) => ({ shape, spec: lone(r, shape, "turn", colors[i % colors.length]) })), pic: want };
}

// Count: a finished picture. Which shape to count: one that is in it, preferably more than once.
function count(l, r) {
  const pic = r.pick(SETS.count);
  const parts = PICTURES[pic].map(part);
  const counts = Object.fromEntries(SHAPES.map((s) => [s, parts.filter((p) => p.shape === s).length]));
  const present = SHAPES.filter((s) => counts[s] > 0);
  const several = present.filter((s) => counts[s] > 1);
  const want = r.pick(several.length && r.chance(0.8) ? several : present);
  const answer = counts[want];
  const near = r.shuffle([answer + 1, answer - 1, answer + 2, answer - 2].filter((n) => n >= 1 && n <= 9));
  return { pic, want, answer, numbers: [answer, ...near.slice(0, 2)].sort((a, b) => a - b) };
}

const MAKERS = { find, riddle, build, all, count };

export function task(level, r) {
  const id = level.kind === "mix" ? r.pick(level.levels) : level.id;
  const l = LEVELS.find((x) => x.id === id);
  const t = MAKERS[l.kind](l, r);
  return { level: l.id, kind: l.kind, ...t, answer: t.answer ?? t.want, key: `${l.kind} ${t.pic} ${t.want}` };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const l = LEVELS.find((x) => x.id === t.level);
  if (level.kind === "mix" ? !level.levels.includes(t.level) : t.level !== level.id) problems.push("wrong level");
  const oneRight = (choices, want) => choices.filter((c) => c.shape === want).length === 1;
  const inBox = (s) => s.x >= -1 && s.y >= -1 && s.x + s.w <= 101 && s.y + s.h <= 101;
  if (t.kind === "find" || t.kind === "riddle") {
    if (!oneRight(t.choices, t.want)) problems.push("not one right shape");
    if (t.kind === "find" && (t.choices.length !== l.choices || t.choices.some((c) => !l.shapes.includes(c.shape)))) problems.push("wrong choices");
    if (t.choices.some((c) => !inBox(c.spec))) problems.push("shape outside its box");
  }
  if (t.kind === "build") {
    const parts = PICTURES[t.pic];
    if (t.steps.length !== parts.length) problems.push("a gap missing");
    if (t.steps.some((s) => !oneRight(s.choices, parts[s.gap][0]) || s.choices.length !== l.choices)) problems.push("gap without its shape");
    if (!SETS[l.pics].includes(t.pic)) problems.push("picture not in the set");
  }
  if (t.kind === "all") {
    if (t.cells.length !== 9 || t.cells.filter((c) => c.shape === t.want).length !== t.targets) problems.push("wrong board");
    if (SHAPES.some((s) => !t.cells.some((c) => c.shape === s))) problems.push("a shape missing on the board");
  }
  if (t.kind === "count") {
    if (PICTURES[t.pic].filter((p) => p[0] === t.want).length !== t.answer || !t.answer) problems.push("count wrong");
    if (!t.numbers.includes(t.answer) || new Set(t.numbers).size !== t.numbers.length || t.numbers.length !== 3) problems.push("numbers wrong");
  }
  return problems;
}
