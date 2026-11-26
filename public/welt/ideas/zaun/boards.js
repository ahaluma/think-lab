// The five boards of the idea "Zaun" (posts and gaps), camp 1 of the thinking mountain, for 9 to 12.
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "zaun". Answers are typed on the number pad.
//
// The pictures are SVG and true to the world: posts stand upright in the ground, a board always hangs
// between two posts (or a post and a tree), never in the air. Boards not built yet lie on the grass
// where they will go. A fence with more than DRAWN boards is drawn with "…" in the middle, as in a
// competition problem: the child has to think, not count.

import { el, button, shake, wait } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { DIGITS, DRAWN, REASONS } from "./tasks.js";
import { waysFor } from "./ways.js";

const SVG = "http://www.w3.org/2000/svg";
const W = 340;
const H = 180;
const LEFT = 34;
const RIGHT = W - 34;
const INK = "#1b2140";
const WOOD = "#a8703f";
const PLANK = "#c48a4e";

/** Everyday looks (tasks.js LOOKS): what stands, what holds the ends, what lies in the middle of a ring. */
const LOOK = {
  zaun: { thing: null, ring: { fill: "#8fd3ff" } },
  baeume: { thing: "🌳", end: "🏠", gap: "hammock", ring: { fill: "#f3dd9b", icon: "🏰" } },
  kinder: { thing: "🧒", end: "🧑‍🏫", gap: "rope", ring: { fill: "#a7d68c", icon: "⚽" } },
  fahnen: { thing: "🚩", end: "tree", gap: "string", ring: { fill: "#fff3c4", icon: "🎪" } },
  lichter: { thing: "🏮", end: "lamp", gap: null, ring: { fill: "#d9dde6", icon: "⛲" } },
};
/** The looks of a field (level 4): the animal or thing in the middle and the colour of the spots. */
const FIELD = {
  zaun: { icon: "🐐", fill: WOOD, grass: "#a7d68c" },
  feld: { icon: "⚽", fill: "#e8488a", grass: "#7cc46a" },
  beet: { icon: "🥕", fill: "#ffc83a", grass: "#c9a27a" },
};
/** The texts of a task's look (welt/lang: zaun.looks). */
const lookOf = (ctx, t) => ctx.T.zaun.looks[t.look ?? "zaun"];

function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.append(e);
  return e;
}

function label(parent, x, y, text, { size = 14, anchor = "middle", color = INK, box = false } = {}) {
  const g = svgEl("g", { class: "label" }, parent);
  if (box) {
    const w = String(text).length * size * 0.62 + 12;
    svgEl("rect", { x: anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w + 4 : x - 4, y: y - size - 1, width: w, height: size + 8, rx: 6, fill: "#fff", stroke: INK, "stroke-width": 2 }, g);
  }
  const t = svgEl("text", { x, y: y + 1, "text-anchor": anchor, "font-size": size, "font-weight": 800, fill: color }, g);
  t.textContent = text;
  return g;
}

function canvas(className = "", horizon = 110) {
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: `fence-svg ${className}` });
  svgEl("rect", { width: W, height: horizon, fill: "#cfeaff" }, svg);
  svgEl("rect", { y: horizon, width: W, height: H - horizon, fill: "#b9e5a0" }, svg);
  return svg;
}

function tree(parent, x, ground, size = 1) {
  const g = svgEl("g", { class: "tree" }, parent);
  svgEl("rect", { x: x - 7 * size, y: ground - 66 * size, width: 14 * size, height: 66 * size, fill: "#8a5a33", stroke: INK, "stroke-width": 3 }, g);
  svgEl("circle", { cx: x, cy: ground - 82 * size, r: 26 * size, fill: "#57b86a", stroke: INK, "stroke-width": 3 }, g);
  return g;
}

/** An emoji standing on the ground at (x, y). */
function emoji(parent, x, y, char, size, cls = "") {
  const e = svgEl("text", { x, y, "font-size": size, "text-anchor": "middle", class: cls }, parent);
  e.textContent = char;
  return e;
}

/** A street lamp that is already there (the ends of a row of lights). */
function lamp(parent, x, ground) {
  const g = svgEl("g", {}, parent);
  svgEl("rect", { x: x - 3, y: ground - 74, width: 6, height: 74, fill: "#6f7a89", stroke: INK, "stroke-width": 2 }, g);
  svgEl("circle", { cx: x, cy: ground - 80, r: 10, fill: "#ffc83a", stroke: INK, "stroke-width": 3 }, g);
  return g;
}

/** What holds the ends of a "trees" row in this look: a tree, a house, a teacher, a lamp. */
function endHolder(parent, look, x, ground) {
  const end = LOOK[look].end ?? "tree";
  if (end === "tree") return tree(parent, x, ground);
  if (end === "lamp") return lamp(parent, x, ground);
  return emoji(parent, x, ground + 2, end, 52);
}

/** A post: a pointed wooden stake standing at (x, y). ghost = only its place, dashed. */
function post(parent, x, y, h, ghost = false) {
  const w = h > 34 ? 4 : 3;
  return svgEl(
    "path",
    {
      d: `M${x - w} ${y} V${y - h + 6} L${x} ${y - h} L${x + w} ${y - h + 6} V${y} Z`,
      class: ghost ? "post ghost" : "post",
      fill: ghost ? "none" : WOOD,
      stroke: INK,
      "stroke-width": ghost ? 2 : 3,
      "stroke-dasharray": ghost ? "4 3" : "none",
    },
    parent,
  );
}

/** One board between two ground points: built (two rails) or lying on the grass in front. */
function plank(parent, [x1, y1], [x2, y2], h, lying) {
  const g = svgEl("g", { class: lying ? "plank lying" : "plank" }, parent);
  if (lying) {
    for (const [stroke, width] of [[INK, 8], [PLANK, 4]]) {
      svgEl("line", { x1: x1 + 3, y1: y1 + 10, x2: x2 - 3, y2: y2 + 10, stroke, "stroke-width": width, "stroke-linecap": "round" }, g);
    }
    return g;
  }
  for (const dy of [h * 0.72, h * 0.32]) {
    svgEl("line", { x1, y1: y1 - dy, x2, y2: y2 - dy, stroke: INK, "stroke-width": h > 34 ? 9 : 7 }, g);
    svgEl("line", { x1, y1: y1 - dy, x2, y2: y2 - dy, stroke: PLANK, "stroke-width": h > 34 ? 5 : 3 }, g);
  }
  return g;
}

/** What lies between two neighbours in a look: a hammock, a rope, a piece of string, or nothing. */
function lookGap(parent, look, [x1, y1], [x2, y2], h, lying) {
  const kind = LOOK[look].gap;
  const g = svgEl("g", { class: lying ? "plank lying" : "plank" }, parent);
  const color = kind === "hammock" ? "#e8488a" : kind === "rope" ? "#ff5a36" : kind === "string" ? INK : "#e3c79a";
  if (lying || !kind) {
    svgEl("line", { x1: x1 + 5, y1: y1 + 10, x2: x2 - 5, y2: y2 + 10, stroke: color, "stroke-width": kind ? 4 : 6, "stroke-linecap": "round" }, g);
    return g;
  }
  const top = kind === "hammock" ? h * 0.55 : kind === "rope" ? h * 0.45 : h * 0.95;
  const sag = kind === "hammock" ? 14 : kind === "rope" ? 6 : 5;
  const [ya, yb] = [y1 - top, y2 - top];
  svgEl("path", { d: `M${x1} ${ya} Q${(x1 + x2) / 2} ${(ya + yb) / 2 + sag} ${x2} ${yb}`, fill: "none", stroke: color, "stroke-width": kind === "hammock" ? 5 : 3, "stroke-linecap": "round" }, g);
  return g;
}

/**
 * The places of a fence row from `left` to `right` at height `ground`. More than DRAWN boards: four
 * boards, then "…", then two boards. → { gaps: [{ a, b, dots }], ends: [[x, y]], posts: [end index] }
 */
function rowLayout(kind, boards, ground, left = LEFT, right = RIGHT) {
  const cut = boards > DRAWN;
  const slots = cut ? 7 : boards;
  const step = (right - left) / slots;
  const ends = Array.from({ length: slots + 1 }, (_, i) => [left + i * step, ground]);
  const gaps = Array.from({ length: slots }, (_, i) => ({ a: ends[i], b: ends[i + 1], dots: cut && i === 4 }));
  const posts = ends.map((_, i) => i).filter((i) => kind !== "trees" || (i > 0 && i < slots));
  return { gaps, ends, posts };
}

function ringLayout(boards) {
  const ends = Array.from({ length: boards }, (_, i) => {
    const a = (2 * Math.PI * i) / boards + Math.PI / 2;
    return [W / 2 + 140 * Math.cos(a), 122 + 42 * Math.sin(a)];
  });
  const gaps = ends.map((a, i) => ({ a, b: ends[(i + 1) % boards], dots: false }));
  return { gaps, ends, posts: ends.map((_, i) => i) };
}

/**
 * A fence picture. kind: line | trees | ring | sides. boards: how many boards.
 *   boardsAs "up" | "lying" | "none", postsAs "up" | "none"
 *   numbers: true → the first and the last post carry their number (1 … posts)
 *   length / every: labels "36 m" over the whole fence and "4 m" under the first gap
 *   count: a label for the number of boards ("15 Bretter"), when the fence is drawn with "…"
 * → { svg, showPosts(), ghostPosts(), raise(), markGaps() }
 */
function fence(ctx, kind, boards, { look = "zaun", boardsAs = "up", postsAs = "up", numbers = false, length = null, every = null, count = null } = {}) {
  const L = LOOK[look] ?? LOOK.zaun;
  const svg = canvas(`fence-${kind}`, kind === "ring" ? 96 : 110);
  const rows = [];
  if (kind === "ring") {
    svgEl("ellipse", { cx: W / 2, cy: 122, rx: 98, ry: 22, fill: L.ring.fill, stroke: INK, "stroke-width": 3 }, svg);
    if (L.ring.icon) emoji(svg, W / 2, 132, L.ring.icon, 22);
    rows.push({ ...ringLayout(boards), h: (y) => 26 + (y - 80) * 0.3 });
  } else if (kind === "sides") {
    svgEl("rect", { y: 112, width: W, height: 26, fill: "#e3c79a" }, svg);
    rows.push({ ...rowLayout("line", boards, 108), h: () => 30 });
    rows.push({ ...rowLayout("line", boards, 168), h: () => 42 });
  } else {
    if (kind === "trees") {
      endHolder(svg, look, LEFT, 150);
      endHolder(svg, look, RIGHT, 150);
    }
    rows.push({ ...rowLayout(kind, boards, 150), h: () => 48 });
  }

  const layer = svgEl("g", {}, svg);
  const gapLayer = svgEl("g", {}, svg);
  const labels = svgEl("g", {}, svg);
  const planks = [];
  const gapMarks = [];
  // Back first: on the ring the far side is drawn before the near side.
  const all = rows.flatMap((row) => row.gaps.map((g) => ({ ...g, row })));
  if (kind === "ring") all.sort((p, q) => p.a[1] + p.b[1] - (q.a[1] + q.b[1]));

  function drawPlanks(lying) {
    for (const p of planks) p.remove();
    planks.length = 0;
    for (const g of all) {
      if (g.dots) continue;
      const [a, b] = g.a[0] <= g.b[0] ? [g.a, g.b] : [g.b, g.a];
      const h = g.row.h((a[1] + b[1]) / 2);
      const p = L.thing ? lookGap(layer, look, a, b, h, lying) : plank(layer, a, b, h, lying);
      if (!lying) {
        p.classList.add("pop-in");
        layer.prepend(p); // behind the posts
      }
      planks.push(p);
    }
  }
  if (boardsAs !== "none") drawPlanks(boardsAs === "lying");

  for (const g of all) {
    const [x1, y] = g.a;
    const x2 = g.b[0];
    if (g.dots) label(labels, (x1 + x2) / 2, y - 18, "…", { size: 26 });
    else if (kind !== "ring") gapMarks.push(svgEl("rect", { x: x1 + 4, y: y - 44, width: x2 - x1 - 8, height: 38, rx: 6, fill: "#ffc83a", opacity: 0, class: "gap" }, gapLayer));
  }

  const postEls = [];
  function drawPosts(ghost) {
    for (const row of rows) {
      for (const i of [...row.posts].sort((a, b) => row.ends[a][1] - row.ends[b][1])) {
        const [x, y] = row.ends[i];
        if (L.thing) {
          const step = row.gaps.length ? Math.abs(row.gaps[0].b[0] - row.gaps[0].a[0]) : 40;
          const size = Math.max(14, Math.min(row.h(y) * 0.8, step * 1.15));
          postEls.push(emoji(layer, x, y + 2, L.thing, size, ghost ? "ghost-thing" : ""));
        } else postEls.push(post(layer, x, y, row.h(y) + 4, ghost));
      }
    }
  }
  if (postsAs === "up") drawPosts(false);

  // Labels: numbers on the first and the last post, the length, the distance, the count.
  if (numbers) {
    const row = rows[0];
    const first = row.ends[row.posts[0]];
    const last = row.ends[row.posts.at(-1)];
    const n = kind === "line" ? boards + 1 : boards - 1;
    label(labels, first[0], first[1] + 20, ctx.num(1), { box: true });
    label(labels, last[0], last[1] + 20, ctx.num(n), { box: true });
  }
  if (length !== null) {
    if (kind === "ring") label(labels, W / 2, 128, length, { size: 15, box: true });
    else {
      const y = 14;
      svgEl("path", { d: `M${LEFT} ${y + 8} V${y} H${RIGHT} V${y + 8}`, fill: "none", stroke: INK, "stroke-width": 2 }, labels);
      label(labels, W / 2, y + 6, length, { size: 15, box: true });
    }
  }
  if (every !== null && kind !== "ring") {
    const g = rows.at(-1).gaps[0];
    // Under the first gap; above it when the numbers of the posts are already under the ground line.
    const y = numbers ? g.a[1] - 58 : Math.min(H - 4, g.a[1] + 24);
    label(labels, (g.a[0] + g.b[0]) / 2, y, every, { size: 13, box: true });
  }
  if (every !== null && kind === "ring") label(labels, W / 2, 26, every, { size: 13, box: true });
  if (count !== null) label(labels, W / 2, kind === "trees" ? 26 : 40, count, { size: 14, box: true });

  return {
    svg,
    showPosts() {
      for (const p of postEls) p.remove();
      postEls.length = 0;
      drawPosts(false);
      for (const p of postEls) p.classList.add("pop-in");
    },
    ghostPosts() {
      if (!postEls.length) drawPosts(true);
    },
    raise: () => drawPlanks(false),
    markGaps() {
      for (const g of gapMarks) g.setAttribute("opacity", 0.55);
    },
  };
}

// ---------- Question, number pad and the "So geht es auch" card: shared by every camp (berg/kit.js)

const typed = (ctx, host, right, on) => kit.typed(ctx, host, right, { ...on, digits: DIGITS });
const { question, story } = kit;
/** Solved: the other tools that crack this task (ways.js), then on. */
const win = (host, ctx, t, text) => kit.win(host, ctx, waysFor(ctx, t), text);

const n = (ctx, fn, k) => fn(k, ctx.word(k), ctx.num(k));

// ---------- Sehen: numbered posts stand (1 … n). How many boards go in between?

export function sehen(host, t, ctx) {
  const Z = ctx.T.zaun;
  const boards = t.answer;
  const scene = el("div", "scene card fence-scene");
  const L = lookOf(ctx, t);
  const f = fence(ctx, t.kind, boards, { look: t.look, boardsAs: "none", numbers: true });
  scene.append(f.svg);
  if (ctx.fresh() && boards <= DRAWN) f.markGaps();
  host.append(scene);
  const pad = typed(ctx, host, t.answer, {
    onWrong: (k) => ctx.miss(k === t.posts ? Z.sehen.missPosts : Z.sehen.miss[t.kind]),
    onRight: () => {
      f.raise();
      win(host, ctx, t, Z.sehen.done[t.kind](n(ctx, L.thing, t.posts), n(ctx, L.gap, boards)));
    },
  });
  story(host, ctx, L.see[t.kind], L.seeAsk, pad);
  return {
    hint() {
      f.markGaps();
      return Z.sehen.hint[t.kind];
    },
  };
}

// ---------- Machen: build it yourself. Level 1: set posts so the fence has exactly b boards.
// Levels 2 and 3: plant along a measured path, one every `every` metres (with or without the ends).

export function machen(host, t, ctx) {
  return t.mode === "boards" ? buildBoards(host, t, ctx) : plantEvery(host, t, ctx);
}

function spotRow(svg, count, ground, onToggle, slotLabel) {
  const step = (RIGHT - LEFT) / (count - 1);
  const xs = Array.from({ length: count }, (_, i) => LEFT + i * step);
  const layer = svgEl("g", {}, svg);
  const spots = xs.map((x, i) => {
    const g = svgEl("g", { class: "spot", tabindex: 0, role: "button", "aria-label": slotLabel }, layer);
    svgEl("rect", { x: x - step / 2, y: 40, width: step, height: H - 40, fill: "transparent" }, g);
    svgEl("ellipse", { cx: x, cy: ground + 3, rx: Math.min(9, step / 2.4), ry: 4, fill: "#8a5a33", stroke: INK, "stroke-width": 2 }, g);
    const toggle = () => onToggle(i);
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && toggle());
    return g;
  });
  return { xs, spots, step };
}

function buildBoards(host, t, ctx) {
  const Z = ctx.T.zaun;
  const M = Z.machen;
  const ground = 140;
  const svg = canvas("fence-build");
  const scene = el("div", "scene card fence-scene");
  scene.append(svg);
  const set = Array(t.slots).fill(false);
  const boardLayer = svgEl("g", {}, svg);
  const postLayer = svgEl("g", {}, svg);
  let locked = false;
  const row = spotRow(svg, t.slots, ground, (i) => {
    if (locked) return;
    set[i] = !set[i];
    ctx.tap();
    draw();
  }, M.slot);

  const built = () => set.reduce((k, on, i) => k + (on && set[i + 1] ? 1 : 0), 0);
  const counter = el("div", "fence-count");
  function draw() {
    boardLayer.innerHTML = "";
    postLayer.innerHTML = "";
    set.forEach((on, i) => {
      if (on && set[i + 1]) plank(boardLayer, [row.xs[i], ground], [row.xs[i + 1], ground], 50, false);
      if (on) post(postLayer, row.xs[i], ground, 54);
    });
    row.spots.forEach((g, i) => g.classList.toggle("on", set[i]));
    counter.textContent = "";
    counter.append(el("span", "", "🪵"), el("b", "", ctx.num(built())), el("small", "", M.counter));
  }

  const check = button("btn ok check-btn", M.check, "✓");
  check.addEventListener("click", () => {
    if (locked) return;
    const on = set.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    if (on.length < 2) return void (shake(check), ctx.miss(M.none));
    if (on.at(-1) - on[0] !== on.length - 1) return void (shake(check), ctx.miss(M.hole));
    if (built() !== t.boards) return void (shake(check), ctx.miss(M.count(n(ctx, Z.boards, built()), n(ctx, Z.boards, t.boards))));
    locked = true;
    check.classList.add("right");
    win(host, ctx, t, M.done(n(ctx, Z.posts, on.length), n(ctx, Z.boards, t.boards)));
  });

  const tools = el("div", "fence-tools");
  tools.append(counter, check);
  host.append(scene, tools);
  draw();
  const ask = M.ask(n(ctx, Z.boards, t.boards));
  question(host, "", ask);
  ctx.tell(ask, "");
  return { hint: () => M.hint };
}

function plantEvery(host, t, ctx) {
  const Z = ctx.T.zaun;
  const M = Z.machen;
  const ground = 132;
  const svg = canvas("fence-build");
  const scene = el("div", "scene card fence-scene");
  scene.append(svg);
  svgEl("rect", { x: LEFT - 10, y: ground - 4, width: RIGHT - LEFT + 20, height: 12, rx: 6, fill: "#e3c79a" }, svg);
  if (!t.ends) {
    tree(svg, LEFT, ground, 0.8);
    tree(svg, RIGHT, ground, 0.8);
  }
  const set = Array(t.spots).fill(false);
  const plantLayer = svgEl("g", {}, svg);
  let locked = false;
  const row = spotRow(svg, t.spots, ground, (i) => {
    if (locked || (!t.ends && (i === 0 || i === t.spots - 1))) return;
    set[i] = !set[i];
    ctx.tap();
    draw();
  }, M.slot);
  if (!t.ends) [0, t.spots - 1].forEach((i) => (row.spots[i].style.display = "none"));
  // The ruler: metres under the spots (every second one when they are close).
  const ruler = svgEl("g", {}, svg);
  row.xs.forEach((x, i) => {
    if (i % 2 === 0 || i === t.spots - 1) label(ruler, x, ground + 30, ctx.num(i * t.step), { size: 12 });
  });
  label(ruler, RIGHT + 2, ground + 46, M.metres, { size: 11, anchor: "end" });

  function draw() {
    plantLayer.innerHTML = "";
    set.forEach((on, i) => {
      if (!on) return;
      if (t.ends) tree(plantLayer, row.xs[i], ground, 0.42);
      else post(plantLayer, row.xs[i], ground, 44);
    });
    row.spots.forEach((g, i) => g.classList.toggle("on", set[i]));
  }

  const check = button("btn ok check-btn", M.check, "✓");
  check.addEventListener("click", () => {
    if (locked) return;
    const on = set.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    const want = new Set(t.answer);
    if (t.ends && !(set[0] && set[t.spots - 1])) return void (shake(check), ctx.miss(M.endsMissing));
    const wrong = on.find((i) => !want.has(i));
    if (wrong !== undefined) {
      shake(row.spots[wrong]);
      return void (shake(check), ctx.miss(M.wrongSpot(ctx.num(wrong * t.step))));
    }
    if (on.length !== want.size) return void (shake(check), ctx.miss(M.gapTooBig));
    locked = true;
    check.classList.add("right");
    win(host, ctx, t, M.planted[t.ends ? "ends" : "between"](ctx.num(on.length), ctx.num((t.spots - 1) * t.step), ctx.num(t.every)));
  });
  const tools = el("div", "fence-tools");
  tools.append(check);
  host.append(scene, tools);
  draw();
  const ask = M.every[t.ends ? "ends" : "between"](ctx.num((t.spots - 1) * t.step), ctx.num(t.every));
  question(host, "", ask);
  ctx.tell(ask, "");
  return { hint: () => M.everyHint(ctx.num(t.every)) };
}

// ---------- Forschen: think first. Level 1 and 2: how many posts? Level 3: backwards, how long?
// From task to task only one thing changes: the ends (a post, a tree, no end, both sides).

/** Level 4: a field seen from above, a × b metres, a post every `every` m all around. */
function fieldPlan(ctx, t) {
  const Z = ctx.T.zaun;
  const F = FIELD[t.look] ?? FIELD.zaun;
  const svg = canvas("field", 0);
  const i = t.a / t.every;
  const j = t.b / t.every;
  const w = 250;
  const h = Math.min(118, (w * t.b) / t.a);
  const [x0, y0] = [(W - w) / 2 + 10, 36 + (118 - h) / 2];
  svgEl("rect", { x: x0, y: y0, width: w, height: h, fill: F.grass, stroke: INK, "stroke-width": 2, "stroke-dasharray": "6 4" }, svg);
  if (t.look === "feld") {
    svgEl("line", { x1: x0 + w / 2, y1: y0, x2: x0 + w / 2, y2: y0 + h, stroke: "#fff", "stroke-width": 2 }, svg);
    svgEl("circle", { cx: x0 + w / 2, cy: y0 + h / 2, r: Math.min(22, h / 3), fill: "none", stroke: "#fff", "stroke-width": 2 }, svg);
  }
  emoji(svg, x0 + w / 2, y0 + h / 2 + 10, F.icon, 26);
  const spots = [];
  for (let k = 0; k < i; k++) spots.push([x0 + (k * w) / i, y0], [x0 + w - (k * w) / i, y0 + h]);
  for (let k = 0; k < j; k++) spots.push([x0 + w, y0 + (k * h) / j], [x0, y0 + h - (k * h) / j]);
  const layer = svgEl("g", {}, svg);
  const draw = (ghost) => {
    layer.innerHTML = "";
    for (const [x, y] of spots) svgEl("circle", { cx: x, cy: y, r: 5, fill: ghost ? "none" : F.fill, stroke: ghost ? "#e8488a" : INK, "stroke-width": 2.5, class: ghost ? "" : "pop-in" }, layer);
  };
  label(svg, x0 + w / 2, y0 - 10, Z.metres(ctx.num(t.a)), { size: 13, box: true });
  label(svg, x0 - 8, y0 + h / 2 + 5, Z.metres(ctx.num(t.b)), { size: 13, box: true, anchor: "end" });
  label(svg, x0 + w / 2, H - 6, Z.everyLabel(Z.metres(ctx.num(t.every))), { size: 12, box: true });
  return { svg, showPosts: () => draw(false), ghostPosts: () => draw(true), raise() {} };
}

function fenceTask(ctx, t, opts = {}) {
  if (t.kind === "rect") return fieldPlan(ctx, t);
  const Z = ctx.T.zaun;
  const boards = t.ask === "length" ? (t.kind === "line" ? t.posts - 1 : t.kind === "trees" ? t.posts + 1 : t.posts) : t.boards;
  const m = (k) => Z.metres(ctx.num(k));
  const known = {
    length: t.length ? (t.kind === "ring" ? Z.around(m(t.length)) : m(t.length)) : null,
    every: t.every ? m(t.every) : null,
    count: t.ask === "posts" && !t.every && boards > DRAWN ? n(ctx, lookOf(ctx, t).gap, boards) : null,
  };
  if (t.ask === "length") known.length = t.kind === "ring" ? Z.around("?") : "?";
  return fence(ctx, t.kind, boards, {
    look: t.look,
    boardsAs: t.ask === "length" ? "up" : "lying",
    postsAs: t.ask === "length" ? "up" : "none",
    numbers: t.ask === "length" && t.kind !== "ring",
    ...known,
    ...opts,
  });
}

/** The sentence that tells a fence task. */
function fenceStory(ctx, t) {
  const Z = ctx.T.zaun;
  const L = lookOf(ctx, t);
  if (t.kind === "rect") return L.field(Z.metres(ctx.num(t.a)), Z.metres(ctx.num(t.b)), Z.metres(ctx.num(t.every)));
  if (t.ask === "length") return L.back[t.kind](n(ctx, L.thing, t.posts), Z.metres(ctx.num(t.every)));
  if (t.every) return L.metres[t.kind](Z.metres(ctx.num(t.length)), Z.metres(ctx.num(t.every)));
  return L.count[t.kind](n(ctx, L.gap, t.boards));
}

export function forschen(host, t, ctx) {
  const Z = ctx.T.zaun;
  const F = Z.forschen;
  const scene = el("div", "scene card fence-scene");
  const f = fenceTask(ctx, t);
  scene.append(f.svg);
  host.append(scene);
  const pad = typed(ctx, host, t.answer, {
    onWrong: () => ctx.miss(t.ask === "length" ? F.backMiss[t.kind] : F.miss[t.kind]),
    onRight: async () => {
      if (t.ask === "posts") {
        f.showPosts();
        await wait(350);
        f.raise();
      }
      const got = t.ask === "length" ? Z.metres(ctx.num(t.answer)) : n(ctx, lookOf(ctx, t).thing, t.answer);
      win(host, ctx, t, `${F.got(got)} ${F.rule[t.kind]}`);
    },
  });
  story(host, ctx, fenceStory(ctx, t), t.ask === "length" ? F.askLength : lookOf(ctx, t).ask, pad);
  return {
    hint() {
      f.ghostPosts();
      return F.hint[t.kind];
    },
  };
}

// ---------- Anwenden: the same tool in other stories.
// Level 1: cuts in a log, knots between beads. Levels 2 and 3: a bell, a tower, sawing with time.

const BEAD_COLORS = ["#e8488a", "#ffc83a", "#57b86a", "#8fd3ff", "#ff5a36", "#b07ce8"];

function sawScene(k) {
  const svg = canvas("saw");
  const [x0, x1, y] = [24, W - 40, 64];
  svgEl("rect", { x: x0, y, width: x1 - x0, height: 34, rx: 8, fill: WOOD, stroke: INK, "stroke-width": 3 }, svg);
  svgEl("ellipse", { cx: x1, cy: y + 17, rx: 9, ry: 17, fill: "#e3c79a", stroke: INK, "stroke-width": 3 }, svg);
  const fire = svgEl("text", { x: 20, y: 160, "font-size": 24 }, svg);
  fire.textContent = "🔥";
  const size = Math.min(18, 260 / k - 4);
  for (let i = 0; i < k; i++) svgEl("rect", { x: 54 + i * (size + 4), y: 142, width: size, height: 14, rx: 3, fill: PLANK, stroke: INK, "stroke-width": 2 }, svg);
  const marks = [];
  for (let i = 1; i < k; i++) {
    const x = x0 + (i * (x1 - x0)) / k;
    marks.push(svgEl("line", { x1: x, y1: y - 8, x2: x, y2: y + 42, stroke: "#e8488a", "stroke-width": 3, "stroke-dasharray": "5 4", opacity: 0 }, svg));
  }
  return { svg, show: () => marks.forEach((m) => m.setAttribute("opacity", 1)), ghost: () => marks.forEach((m) => m.setAttribute("opacity", 0.45)) };
}

function beadScene(k, closed) {
  const svg = canvas(closed ? "necklace" : "beads");
  const [cx, cy, rx, ry] = [W / 2, 92, 128, 62];
  const pts = closed
    ? Array.from({ length: k }, (_, i) => {
        const a = (2 * Math.PI * i) / k - Math.PI / 2;
        return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
      })
    : Array.from({ length: k }, (_, i) => [30 + (i * (W - 60)) / (k - 1), 92]);
  if (closed) svgEl("ellipse", { cx, cy, rx, ry, fill: "none", stroke: INK, "stroke-width": 2 }, svg);
  else svgEl("line", { x1: 12, y1: 92, x2: W - 12, y2: 92, stroke: INK, "stroke-width": 2 }, svg);
  const knotLayer = svgEl("g", {}, svg);
  const knots = [];
  const pairs = closed ? pts.map((p, i) => [p, pts[(i + 1) % k]]) : pts.slice(0, -1).map((p, i) => [p, pts[i + 1]]);
  for (const [[ax, ay], [bx, by]] of pairs) {
    let [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
    if (closed) {
      const a = Math.atan2((my - cy) / ry, (mx - cx) / rx); // back onto the string
      [mx, my] = [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    }
    knots.push(svgEl("circle", { cx: mx, cy: my, r: 4, fill: INK, opacity: 0 }, knotLayer));
  }
  const r = closed ? Math.min(11, 300 / k) : Math.min(11, (W - 60) / (k - 1) / 2.8);
  pts.forEach(([x, y], i) => svgEl("circle", { cx: x, cy: y, r, fill: BEAD_COLORS[i % BEAD_COLORS.length], stroke: INK, "stroke-width": 2.5 }, svg));
  return {
    svg,
    show: () => knots.forEach((c) => (c.setAttribute("opacity", 1), c.setAttribute("fill", INK))),
    ghost: () => knots.forEach((c) => (c.setAttribute("opacity", 0.5), c.setAttribute("fill", "#e8488a"))),
  };
}

/** A bar of chocolate with k pieces in a row; the breaks show in the end. */
function chocScene(k) {
  const svg = canvas("choc", 180);
  svgEl("rect", { width: W, height: H, fill: "#fbefe6" }, svg);
  const [x0, x1, y] = [24, W - 24, 70];
  const step = (x1 - x0) / k;
  for (let i = 0; i < k; i++) svgEl("rect", { x: x0 + i * step + 1.5, y, width: step - 3, height: 46, rx: 4, fill: "#7b4a2e", stroke: INK, "stroke-width": 2.5 }, svg);
  emoji(svg, W / 2, 46, "🍫", 26);
  const breaks = [];
  for (let i = 1; i < k; i++) breaks.push(svgEl("line", { x1: x0 + i * step, y1: y - 8, x2: x0 + i * step, y2: y + 54, stroke: "#e8488a", "stroke-width": 3, "stroke-dasharray": "5 4", opacity: 0 }, svg));
  return { svg, show: () => breaks.forEach((b) => b.setAttribute("opacity", 1)), ghost: () => breaks.forEach((b) => b.setAttribute("opacity", 0.45)) };
}

/** A train: the engine and k − 1 wagons; the couplings between them show in the end. */
function trainScene(k) {
  const svg = canvas("train", 120);
  svgEl("rect", { y: 132, width: W, height: 6, fill: "#6f7a89" }, svg);
  const [x0, x1] = [14, W - 14];
  const step = (x1 - x0) / k;
  const w = step * 0.78;
  const links = [];
  for (let i = 0; i < k; i++) {
    const x = x0 + i * step;
    svgEl("rect", { x, y: 98, width: w, height: 28, rx: 4, fill: i === 0 ? "#ff5a36" : BEAD_COLORS[i % BEAD_COLORS.length], stroke: INK, "stroke-width": 2.5 }, svg);
    for (const dx of [w * 0.25, w * 0.75]) svgEl("circle", { cx: x + dx, cy: 128, r: Math.min(5, w / 6), fill: INK }, svg);
    if (i > 0) links.push(svgEl("rect", { x: x - (step - w) - 1, y: 110, width: step - w + 2, height: 5, fill: "#e8488a", opacity: 0 }, svg));
  }
  emoji(svg, x0 + w / 2, 92, "🚂", 20);
  return { svg, show: () => links.forEach((l) => l.setAttribute("opacity", 1)), ghost: () => links.forEach((l) => l.setAttribute("opacity", 0.45)) };
}

/** Pages from `from` to `to`, or the days of a trip: one box per page or day (long rows with "…").
 *  A trip shows the nights as moons between the days. */
function stripScene(ctx, t, A) {
  const svg = canvas("strip", 180);
  svgEl("rect", { width: W, height: H, fill: "#eef3f8" }, svg);
  const total = t.to - t.from + 1;
  const cut = total > 10;
  const values = cut ? [t.from, t.from + 1, t.from + 2, null, t.to - 1, t.to] : Array.from({ length: total }, (_, i) => t.from + i);
  const [x0, x1, y] = [16, W - 16, 86];
  const step = (x1 - x0) / values.length;
  const w = step - 8;
  const trip = t.story === "trip";
  const name = trip ? A.day : A.page;
  const boxes = [];
  const moons = [];
  values.forEach((v, i) => {
    const x = x0 + i * step + 4;
    if (v === null) return void label(svg, x + w / 2, y + 20, "…", { size: 26 });
    boxes.push(svgEl("rect", { x, y, width: w, height: 40, rx: 6, fill: "#fff", stroke: INK, "stroke-width": 2.5 }, svg));
    if (!cut || i === 0 || i === values.length - 1 || trip) label(svg, x + w / 2, y + 26, name(ctx.num(v)), { size: Math.min(14, w / 3.2) });
    if (trip && i > 0 && values[i - 1] !== null) {
      const m = emoji(svg, x - 4, y - 8, "🌙", 16);
      m.setAttribute("opacity", 0);
      moons.push(m);
    }
  });
  emoji(svg, W / 2, 50, trip ? "🚌" : "📖", 28);
  const mark = (o) => (trip && t.ask === "nights" ? moons.forEach((m) => m.setAttribute("opacity", o)) : boxes.forEach((b) => b.setAttribute("fill", o === 1 ? "#ffe59a" : "#fff6d6")));
  return { svg, show: () => mark(1), ghost: () => mark(0.45) };
}

/** A time line: k strikes of a bell (dots), the gaps between them, and a label over the whole. */
function strikes(parent, k, y, text, icon = "🔔") {
  const [x0, x1] = [64, W - 22];
  svgEl("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: INK, "stroke-width": 2 }, parent);
  const gaps = [];
  for (let i = 0; i < k; i++) {
    const x = x0 + (i * (x1 - x0)) / (k - 1);
    svgEl("circle", { cx: x, cy: y, r: 6, fill: "#ffc83a", stroke: INK, "stroke-width": 2 }, parent);
    if (i > 0) gaps.push(svgEl("rect", { x: x - (x1 - x0) / (k - 1) + 7, y: y - 5, width: (x1 - x0) / (k - 1) - 14, height: 10, rx: 4, fill: "#e8488a", opacity: 0 }, parent));
  }
  svgEl("path", { d: `M${x0} ${y - 12} V${y - 18} H${x1} V${y - 12}`, fill: "none", stroke: INK, "stroke-width": 2 }, parent);
  label(parent, (x0 + x1) / 2, y - 20, text, { size: 13, box: true });
  const bell = svgEl("text", { x: 14, y: y + 9, "font-size": 26 }, parent);
  bell.textContent = icon;
  return gaps;
}

/** A log cut into k pieces (k − 1 cuts) with a label. */
function cutLog(parent, k, y, text) {
  const [x0, x1] = [20, W - 20];
  const step = (x1 - x0) / k;
  const cuts = [];
  for (let i = 0; i < k; i++) svgEl("rect", { x: x0 + i * step + 2, y, width: step - 4, height: 24, rx: 5, fill: WOOD, stroke: INK, "stroke-width": 2.5 }, parent);
  for (let i = 1; i < k; i++) cuts.push(svgEl("line", { x1: x0 + i * step, y1: y - 6, x2: x0 + i * step, y2: y + 30, stroke: "#e8488a", "stroke-width": 3, opacity: 0 }, parent));
  label(parent, W / 2, y - 8, text, { size: 13, box: true });
  return cuts;
}

/** A tower with platforms 1 … top and a ladder; a bracket for what is known and one for the question. */
function towerScene(ctx, t, A) {
  const part = t.story === "towerpart";
  const top = part ? Math.max(t.d, t.a) : t.b;
  const svg = canvas("tower", 150);
  const base = 166;
  const gap = Math.min(16, 140 / top);
  const x = 150;
  svgEl("rect", { x: x - 30, y: base - gap * (top - 1) - 8, width: 60, height: gap * (top - 1) + 8, fill: "#d9dde6", stroke: INK, "stroke-width": 3 }, svg);
  const rungs = [];
  for (let i = 0; i < top; i++) {
    const y = base - gap * i;
    svgEl("line", { x1: x - 38, y1: y, x2: x + 38, y2: y, stroke: INK, "stroke-width": 4 }, svg);
    label(svg, x - 52, y + 5, ctx.num(i + 1), { size: 12, anchor: "end" });
    if (i > 0) rungs.push(svgEl("rect", { x: x - 6, y: y + 3, width: 12, height: gap - 6, fill: "#e8488a", opacity: 0 }, svg));
  }
  const bracket = (to, side, text, from = 1) => {
    const [y0, y1] = [base - gap * (from - 1), base - gap * (to - 1)];
    const bx = x + side;
    svgEl("path", { d: `M${bx - 6} ${y0} H${bx} V${y1} H${bx - 6}`, fill: "none", stroke: INK, "stroke-width": 2 }, svg);
    label(svg, bx + 6, (y0 + y1) / 2 + 5, text, { size: String(text).length > 9 ? 11 : 13, anchor: "start", box: true });
  };
  bracket(t.a, 50, `${ctx.num(t.given)} ${A.unit[t.story]}`);
  if (part) bracket(t.d, 140, "?", t.c);
  else bracket(t.b, 140, "?");
  return { svg, show: () => rungs.forEach((r) => r.setAttribute("opacity", 0.7)), ghost: () => rungs.forEach((r) => r.setAttribute("opacity", 0.35)) };
}

/** Level 4: a log, every cut takes `unit` minutes, all cuts together `given`. The cuts appear at the end. */
function sawBackScene(ctx, t, A) {
  const svg = canvas("sawback", 180);
  svgEl("rect", { width: W, height: H, fill: "#eef3f8" }, svg);
  const [x0, x1, y] = [20, W - 20, 96];
  svgEl("rect", { x: x0, y, width: x1 - x0, height: 32, rx: 8, fill: WOOD, stroke: INK, "stroke-width": 3 }, svg);
  label(svg, W / 2, 34, A.perCut(ctx.num(t.unit)), { size: 13, box: true });
  label(svg, W / 2, 66, A.allCuts(ctx.num(t.given)), { size: 13, box: true });
  const k = t.answer;
  const cuts = [];
  for (let i = 1; i < k; i++) cuts.push(svgEl("line", { x1: x0 + (i * (x1 - x0)) / k, y1: y - 6, x2: x0 + (i * (x1 - x0)) / k, y2: y + 38, stroke: "#e8488a", "stroke-width": 3, opacity: 0 }, svg));
  return { svg, show: () => cuts.forEach((c) => c.setAttribute("opacity", 1)), ghost() {} };
}

function timeScene(ctx, t, A, ownGuess = null) {
  if (t.story === "tower" || t.story === "towerpart" || t.story === "floors") return towerScene(ctx, t, A);
  if (t.story === "sawback") return sawBackScene(ctx, t, A);
  const svg = canvas(t.story, 180);
  svgEl("rect", { width: W, height: H, fill: "#eef3f8" }, svg);
  const unit = A.unit[t.story];
  const marks =
    t.story === "bell" || t.story === "run"
      ? [...strikes(svg, t.a, 58, `${ctx.num(t.given)} ${unit}`, t.story === "run" ? "🌳" : "🔔"), ...strikes(svg, t.b, 140, ownGuess ?? "?", t.story === "run" ? "🌳" : "🔔")]
      : [...cutLog(svg, t.a, 44, `${ctx.num(t.given)} ${unit}`), ...cutLog(svg, t.b, 128, ownGuess ?? "?")];
  return { svg, show: () => marks.forEach((m) => m.setAttribute("opacity", 0.8)), ghost: () => marks.forEach((m) => m.setAttribute("opacity", 0.4)) };
}

export function anwenden(host, t, ctx) {
  const A = ctx.T.zaun.anwenden;
  const scene = el("div", "scene card fence-scene");
  const time = "given" in t;
  const count = "from" in t;
  const trip = t.story === "trip";
  const pic = time
    ? timeScene(ctx, t, A)
    : count
      ? stripScene(ctx, t, A)
      : { saw: sawScene, choc: chocScene, train: trainScene }[t.story]?.(t.n) ?? beadScene(t.n, t.story === "necklace");
  scene.append(pic.svg);
  host.append(scene);
  const pad = typed(ctx, host, t.answer, {
    onWrong: (k) => ctx.miss(time && "b" in t && k === (t.given * t.b) / t.a ? A.twice : trip ? A.miss.trip[t.ask] : A.miss[t.story]),
    onRight: () => {
      pic.show();
      const fromTo = [ctx.num(t.from), ctx.num(t.to), ctx.num(t.answer)];
      const done = count
        ? trip
          ? A.done.trip[t.ask](...fromTo)
          : A.done.pages(...fromTo)
        : !time
        ? A.done[t.story](ctx.num(t.answer), ctx.num(t.n))
        : t.story === "towerpart"
          ? A.timeDone.towerpart(ctx.num(t.d - t.c), ctx.num(t.answer))
          : t.story === "sawback"
            ? A.timeDone.sawback(ctx.num(t.answer - 1), ctx.num(t.answer))
            : A.timeDone[t.story](ctx.num(t.b - 1), ctx.num(t.answer));
      win(host, ctx, t, done);
    },
  });
  const tell = count
    ? A.story[t.story](ctx.num(t.from), ctx.num(t.to))
    : !time
    ? A.story[t.story](ctx.num(t.n))
    : t.story === "towerpart"
      ? A.story.towerpart(ctx.num(t.a), ctx.num(t.given), ctx.num(t.c), ctx.num(t.d))
      : t.story === "sawback"
        ? A.story.sawback(ctx.num(t.unit), ctx.num(t.given))
        : A.story[t.story](ctx.num(t.a), ctx.num(t.given), ctx.num(t.b));
  const ask = trip ? A.ask.trip[t.ask] : typeof A.ask[t.story] === "function" ? A.ask[t.story](ctx.num(t.b)) : A.ask[t.story];
  story(host, ctx, tell, ask, pad);
  return {
    hint() {
      pic.ghost();
      return A.hint[t.story];
    },
  };
}

// ---------- Prüfen: the owl answers fast and sure. Is she right? If not: what is right?

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const Z = T.zaun;
  const P = Z.pruefen;
  const A = Z.anwenden;
  const time = "given" in t;
  const scene = el("div", "scene card fence-scene owl-fence");
  const pic = time ? timeScene(ctx, t, A) : fenceTask(ctx, t);
  const talk = el("div", "talk");
  const bubble = el("span", "bubble");
  const unitWord = time ? A.unit[t.story] : t.ask === "length" ? Z.metres("").trim() : lookOf(ctx, t).word;
  bubble.append(el("span", "", ctx.num(t.said)), el("small", "bubble-word", " " + unitWord));
  talk.append(el("span", "owl", "🦉"), bubble);
  scene.append(talk, pic.svg);
  let locked = false;

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  host.append(scene, judge);
  const said = `${ctx.num(t.said)} ${unitWord}`;
  const task = time ? `${A.story[t.story](ctx.num(t.a), ctx.num(t.given), ctx.num(t.b))} ${A.ask[t.story](ctx.num(t.b))}` : fenceStory(ctx, t);
  const q = question(host, task, P.ask(said));

  const show = () => (time ? pic.show() : t.ask === "posts" && pic.showPosts());
  const rule = time ? A.rule : Z.forschen.rule[t.kind];
  let fixer = null;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(P.lookAgain));
    locked = true;
    show();
    win(host, ctx, t, `${P.right} ${rule}`);
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(P.lookAgain));
    locked = true;
    judge.hidden = true;
    ctx.tap();
    fixer = typed(ctx, host, t.answer, {
      onWrong: () => ctx.miss(time ? A.miss[t.story] : Z.forschen.miss[t.kind]),
      onRight: async () => {
        show();
        await ctx.tell(P.fixed);
        if (host.isConnected) askWhy();
      },
    });
    fixer.open();
    q.ask(P.fix);
    ctx.tell(P.fix, "");
  });

  // Explaining: why was the owl wrong? The true reason and two that sound good.
  function askWhy() {
    fixer.box.hidden = true;
    const group = time ? REASONS.time : REASONS.fence;
    const others = group.filter((id) => id !== t.why).sort(() => Math.random() - 0.5).slice(0, 2);
    const box = el("div", "reasons");
    let done = false;
    for (const id of [t.why, ...others].sort(() => Math.random() - 0.5)) {
      const b = button("btn reason-btn", "", P.reasons[id]);
      b.addEventListener("click", () => {
        if (done) return;
        if (id !== t.why) {
          shake(b);
          b.disabled = true;
          ctx.miss(P.reasonMiss);
          return;
        }
        done = true;
        b.classList.add("right");
        win(host, ctx, t, `${P.reasonRight} ${rule}`);
      });
      box.append(b);
    }
    host.append(box);
    ctx.ready();
    q.ask(P.why);
    ctx.tell(P.why, "");
  }

  ctx.ready();
  ctx.tell(`${task} ${P.ask(said)}`, "");
  return {
    hint() {
      if (time) pic.ghost();
      else pic.ghostPosts();
      return time ? A.hint[t.story] : Z.forschen.hint[t.kind];
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
