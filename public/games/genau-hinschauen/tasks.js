// The tasks of "Genau hinschauen": one function makes one task (see shared/gen.js).
//
//   task(level, r, kind, thingIds?) → one task as plain data, no texts. kind: "diff" or "copy"
//   (the game takes turns: find, copy, find, copy, find).
//     diff: pics  – [upper, lower]: the places of the two pictures, null or { thing (id), flip, small, dx, dy }
//           diffs – [[place, { kind, a, b }]]: what is different ("gone", "swap", "flip", "small"),
//                   a / b the thing ids (b only for "swap")
//     copy: model  – the places of the model, null or { shape, color }
//           target – what the child must lay: the model, or the model mirrored (level.copy.mirror)
//           palette – the shapes to choose from (with one that is not in the model when level.copy.decoy)
//     key – the task in short, for "not the same picture again"
//   thingIds: the things that have a name in the child's language (default: all of shared/things.js).

import { THING_IDS } from "../../shared/things.js";

// Things that look different when mirrored (a snail looks left or right; a lion's face does not).
export const FLIPPABLE = ["fish", "ship", "snail", "duck", "elephant", "rhino", "unicorn", "giraffe", "dinosaur", "turtle",
  "car", "kangaroo", "whale", "crocodile", "shark", "banana", "carrot", "ant"];
const canFlip = (id) => FLIPPABLE.includes(id);

// ---------- Find the differences

function diff(cfg, r, all) {
  const places = cfg.size * cfg.size;
  // A few kinds of things per picture; with "flip" at least two that can look the other way.
  let types = r.sample(all, Math.min(5, Math.max(2, Math.ceil(cfg.items / 3))));
  if (cfg.kinds.includes("flip") && types.filter(canFlip).length < 2) {
    types = [...r.sample(all.filter(canFlip), 2), ...types.filter((t) => !canFlip(t))].slice(0, Math.max(types.length, 2));
  }
  const upper = Array(places).fill(null);
  for (const p of r.shuffle([...upper.keys()]).slice(0, cfg.items)) {
    upper[p] = { thing: r.pick(types), flip: false, small: false, dx: r.int(-12, 12), dy: r.int(-12, 12) };
  }
  const lower = upper.map((c) => c && { ...c });
  const pics = [upper, lower];
  const diffs = new Map();

  // The kinds of difference in turn, so a picture with three has three different ones when it can.
  let order = [];
  while (order.length < cfg.n) order.push(...r.shuffle(cfg.kinds));
  order = order.slice(0, cfg.n);
  const filled = () => r.shuffle([...upper.keys()].filter((p) => upper[p] && !diffs.has(p)));

  for (const k of order) {
    const p = filled()[0];
    if (p === undefined) break;
    const side = r.int(0, 1); // which picture changes
    const cell = pics[side][p];
    const was = cell.thing;
    if (k === "gone") {
      pics[side][p] = null;
      diffs.set(p, { kind: k, a: was });
    } else if (k === "swap") {
      const others = (cfg.similar ? types : all).filter((t) => t !== was);
      cell.thing = r.pick(others.length ? others : all.filter((t) => t !== was));
      diffs.set(p, { kind: k, a: pics[0][p].thing, b: pics[1][p].thing });
    } else if (k === "flip") {
      if (!canFlip(was)) {
        const turnable = types.filter(canFlip);
        const t = r.pick(turnable.length ? turnable : all.filter(canFlip));
        pics[0][p].thing = pics[1][p].thing = t;
      }
      cell.flip = true;
      diffs.set(p, { kind: k, a: cell.thing });
    } else {
      cell.small = true;
      diffs.set(p, { kind: k, a: was });
    }
  }
  return { pics, diffs: [...diffs.entries()], key: upper.map((c) => c?.thing ?? "-").join() };
}

// ---------- Copy the shapes

/** Upside down, as in water: the top row becomes the bottom row. */
export const mirrored = (cells, size) => cells.map((_, p) => cells[(size - 1 - Math.floor(p / size)) * size + (p % size)]);

function copy(cfg, r) {
  const places = cfg.size * cfg.size;
  const all = cfg.shapes.flatMap((shape) => cfg.colors.map((color) => ({ shape, color })));
  const mixed = r.shuffle(all);
  const used = mixed.slice(0, cfg.kinds);
  const pieces = [...used];
  while (pieces.length < cfg.pieces) pieces.push(r.pick(used));
  const model = Array(places).fill(null);
  r.shuffle([...model.keys()]).slice(0, cfg.pieces).forEach((p, i) => (model[p] = pieces[i]));
  const target = cfg.mirror ? mirrored(model, cfg.size) : model;
  const palette = r.shuffle(cfg.decoy && mixed[cfg.kinds] ? [...used, mixed[cfg.kinds]] : used);
  return { model, target, palette, key: model.map((c) => (c ? c.shape + c.color : "-")).join() };
}

/** kind left out (tools/check-tasks.mjs): one of the two, so both get checked. */
export function task(level, r, kind, thingIds = THING_IDS) {
  kind ??= r.pick(["diff", "copy"]);
  return { kind, answer: kind, ...(kind === "diff" ? diff(level.diff, r, thingIds) : copy(level.copy, r)) };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs (it checks both kinds). */
export function check(t, level) {
  const problems = [];
  if (t.kind === "diff") {
    const cfg = level.diff;
    const [a, b] = t.pics;
    const differs = a.map((c, p) => JSON.stringify(c) !== JSON.stringify(b[p]) ? p : -1).filter((p) => p >= 0);
    const listed = t.diffs.map(([p]) => p);
    if (differs.sort().join() !== [...listed].sort().join()) problems.push("differences not as listed");
    if (t.diffs.length !== cfg.n) problems.push("wrong number of differences");
    if (t.diffs.some(([, d]) => !cfg.kinds.includes(d.kind))) problems.push("a kind the level does not have");
    if (t.diffs.some(([, d]) => d.kind === "flip" && !canFlip(d.a))) problems.push("flipped thing looks the same");
    if (t.diffs.some(([, d]) => d.kind === "swap" && d.a === d.b)) problems.push("swapped with itself");
    if (a.filter((c, p) => c || b[p]).length !== cfg.items) problems.push("wrong number of things");
  }
  if (t.kind === "copy") {
    const cfg = level.copy;
    const pieces = t.model.filter(Boolean);
    const kinds = new Set(pieces.map((c) => c.shape + c.color));
    if (pieces.length !== cfg.pieces) problems.push("wrong number of pieces");
    if (kinds.size !== cfg.kinds) problems.push("wrong number of different shapes");
    if (pieces.some((c) => !cfg.shapes.includes(c.shape) || !cfg.colors.includes(c.color))) problems.push("shape not in the level");
    if ([...kinds].some((k) => !t.palette.some((c) => c.shape + c.color === k))) problems.push("a shape missing to choose from");
    if (t.palette.length !== kinds.size + (cfg.decoy && cfg.shapes.length * cfg.colors.length > cfg.kinds ? 1 : 0)) problems.push("palette wrong");
    const want = cfg.mirror ? mirrored(t.model, cfg.size) : t.model;
    if (want.some((c, p) => c !== t.target[p])) problems.push("target wrong");
  }
  return problems;
}
