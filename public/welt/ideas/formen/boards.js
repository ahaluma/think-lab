// The five boards of the idea "Formen" (shapes, solids, symmetry, measuring): one per perspective.
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "formen"; the names of the shapes under formen.names.
// Shapes and solids are drawn as SVG here, so they can be turned and their corners can be tapped.

import { el, button, shake } from "../../frame/parts.js";
import { numpad } from "../../../shared/numpad.js";
import { CORNERS } from "./tasks.js";

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

let current = null;
function pad(box, ctx, digits, onCheck) {
  current?.remove();
  current = numpad(box, ctx.T, { digits, onCheck });
  return current;
}

const FILL = { kreis: "#ffc83a", dreieck: "#ff8a65", quadrat: "#8fd3ff", rechteck: "#b8e6d0", fuenfeck: "#d8c8ff", sechseck: "#ffd0e8" };

/** The corners of a flat shape, before turning. */
function flatPoints(shape, uneven) {
  const ring = (n, rad, start = -90) => Array.from({ length: n }, (_, i) => {
    const a = ((start + (360 * i) / n) * Math.PI) / 180;
    return [rad * Math.cos(a), rad * Math.sin(a)];
  });
  if (shape === "dreieck") return uneven ? [[-62, 48], [66, 48], [-24, -56]] : ring(3, 64);
  if (shape === "quadrat") return [[-50, -50], [50, -50], [50, 50], [-50, 50]];
  if (shape === "rechteck") return [[-70, -38], [70, -38], [70, 38], [-70, 38]];
  if (shape === "fuenfeck") return ring(5, 62);
  if (shape === "sechseck") return ring(6, 62, 0);
  return [];
}

const turnPt = ([x, y], deg) => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

/** Solids: faces (filled, front ones last), hidden edges (dashed) and corners. */
const SOLID = {
  wuerfel: () => {
    const A = [-45, -10], B = [25, -10], C = [25, 60], D = [-45, 60];
    const o = (p) => [p[0] + 25, p[1] - 25];
    return { faces: [[A, o(A), o(B), B, "#ffd0a6"], [B, o(B), o(C), C, "#f5b07a"], [A, B, C, D, "#ffe2c4"]], hidden: [[o(A), o(D)], [o(D), o(C)], [D, o(D)]], corners: [A, B, C, D, o(A), o(B), o(C), o(D)] };
  },
  quader: () => {
    const A = [-62, 2], B = [30, 2], C = [30, 50], D = [-62, 50];
    const o = (p) => [p[0] + 30, p[1] - 30];
    return { faces: [[A, o(A), o(B), B, "#b8e6d0"], [B, o(B), o(C), C, "#8fcfb2"], [A, B, C, D, "#d4f2e4"]], hidden: [[o(A), o(D)], [o(D), o(C)], [D, o(D)]], corners: [A, B, C, D, o(A), o(B), o(C), o(D)] };
  },
  pyramide: () => {
    const A = [-55, 48], B = [35, 48], C = [62, 18], D = [-28, 18], P = [4, -62];
    return { faces: [[P, B, C, "#f5c96b"], [P, A, B, "#ffe08a"]], hidden: [[A, D], [D, C], [P, D]], corners: [A, B, C, D, P] };
  },
};

/** One shape or solid as SVG. Returns { svg, corners: [[x, y]] in the svg's coordinates }. */
function draw(t, { size = 170 } = {}) {
  const svg = svgEl("svg", { viewBox: "-85 -85 170 170", width: size, height: size, class: "shape-svg" });
  const line = { stroke: "#1b2140", "stroke-width": 4, "stroke-linejoin": "round" };
  let corners = [];
  if (t.shape in CORNERS) {
    if (t.shape === "kreis") svg.append(svgEl("circle", { r: 62, fill: FILL.kreis, ...line }));
    else {
      corners = flatPoints(t.shape, t.uneven).map((p) => turnPt(p, t.turn));
      svg.append(svgEl("polygon", { points: corners.map((p) => p.join(",")).join(" "), fill: FILL[t.shape], ...line }));
    }
    return { svg, corners };
  }
  if (SOLID[t.shape]) {
    const s = SOLID[t.shape]();
    for (const f of s.faces) svg.append(svgEl("polygon", { points: f.slice(0, -1).map((p) => p.join(",")).join(" "), fill: f[f.length - 1], "fill-opacity": 0.85, ...line }));
    // The edges at the back, seen through: dashed.
    for (const [a, b] of s.hidden) svg.append(svgEl("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#1b2140", "stroke-width": 2.5, "stroke-dasharray": "6 5" }));
    return { svg, corners: s.corners };
  }
  const round = { kugel: "#8fd3ff", zylinder: "#ffd0e8", kegel: "#d8c8ff" }[t.shape];
  if (t.shape === "kugel") {
    svg.append(svgEl("circle", { r: 60, fill: round, ...line }));
    svg.append(svgEl("ellipse", { rx: 60, ry: 16, fill: "none", stroke: "#1b2140", "stroke-width": 2, "stroke-dasharray": "6 5" }));
    svg.append(svgEl("circle", { cx: -22, cy: -26, r: 10, fill: "#fff", opacity: 0.7 }));
  } else if (t.shape === "zylinder") {
    svg.append(svgEl("path", { d: "M-46 -46 L-46 48 A46 15 0 0 0 46 48 L46 -46", fill: round, ...line }));
    svg.append(svgEl("ellipse", { cy: -46, rx: 46, ry: 15, fill: "#ffe6f2", ...line }));
  } else if (t.shape === "kegel") {
    svg.append(svgEl("path", { d: "M0 -64 L-50 46 A50 15 0 0 0 50 46 Z", fill: round, ...line }));
    svg.append(svgEl("path", { d: "M-50 46 A50 15 0 0 1 50 46", fill: "none", stroke: "#1b2140", "stroke-width": 2, "stroke-dasharray": "6 5" }));
  }
  return { svg, corners };
}

const nameOf = (ctx, id) => ctx.T.formen.names[id];

/** Three name buttons. onPick(id, button). */
function nameButtons(ctx, ids, onPick) {
  const row = el("div", "name-row");
  for (const id of ids) {
    const b = button("btn name-btn", nameOf(ctx, id).name, nameOf(ctx, id).name);
    b.addEventListener("click", () => onPick(id, b));
    row.append(b);
  }
  return row;
}

// ---------- Sehen: which shape is this?

export function sehen(host, t, ctx) {
  const F = ctx.T.formen;
  const scene = el("div", "scene card shape-scene");
  scene.append(draw(t).svg);
  const hintBox = el("div", "hint-box");
  let locked = false;
  const names = nameButtons(ctx, t.choices, (id, b) => {
    if (locked) return;
    if (id !== t.shape) {
      shake(b);
      b.disabled = true;
      ctx.miss(F.sehen.miss(nameOf(ctx, id).name, F.facts[id]));
      return;
    }
    locked = true;
    b.classList.add("right");
    ctx.solved(F.sehen.done(nameOf(ctx, t.shape).a, F.facts[t.shape]));
  });
  host.append(scene, names, hintBox);
  ctx.tell(F.sehen.ask);
  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(el("p", "hint-text pop", F.facts[t.shape]));
      return F.sehen.hint;
    },
  };
}

// ---------- Machen: the mirror. One half is coloured, colour the other half.

export function machen(host, t, ctx) {
  const F = ctx.T.formen.machen;
  const v = t.axis === "v";
  const H = v ? t.rows : 2 * t.cols;
  const W = v ? 2 * t.cols : t.rows;
  const mirror = ([y, x]) => (v ? [y, W - 1 - x] : [H - 1 - y, x]);
  const want = new Set(t.cells.map((c) => mirror(c).join()));
  const given = new Set(t.cells.map((c) => c.join()));
  const mine = new Set();
  let locked = false;
  const grid = el("div", "mirror-grid " + (v ? "v" : "h"));
  grid.style.gridTemplateColumns = `repeat(${W}, 1fr)`;
  const cellAt = {};
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const key = `${y},${x}`;
      const free = v ? x >= t.cols : y >= t.cols;
      const c = free ? button("m-cell free", F.cell, "") : el("span", "m-cell" + (given.has(key) ? " on" : ""));
      if (v && x === t.cols) c.classList.add("after-line");
      if (!v && y === t.cols) c.classList.add("below-line");
      if (free)
        c.addEventListener("click", () => {
          if (locked) return;
          if (mine.has(key)) mine.delete(key);
          else mine.add(key);
          c.classList.toggle("on", mine.has(key));
          c.classList.remove("glow-next");
          ctx.tap();
        });
      cellAt[key] = c;
      grid.append(c);
    }
  const scene = el("div", "scene card mirror-scene");
  scene.append(grid);
  const check = button("btn ok check-btn", F.check, "✓");
  check.addEventListener("click", () => {
    if (locked) return;
    const missing = [...want].filter((k) => !mine.has(k)).length;
    const extra = [...mine].filter((k) => !want.has(k)).length;
    if (missing || extra) {
      shake(check);
      ctx.miss(extra ? F.extra(ctx.num(extra), extra) : F.missing(ctx.num(missing), missing));
      return;
    }
    locked = true;
    grid.classList.add("done");
    ctx.solved(F.done);
  });
  host.append(scene, check);
  ctx.tell(v ? F.question : F.questionH);
  return {
    hint() {
      const next = [...want].find((k) => !mine.has(k));
      if (next) cellAt[next].classList.add("glow-next");
      return v ? F.hint : F.hintH;
    },
  };
}

// ---------- Forschen: tap every corner (shapes), or count faces, edges, corners (solids).

export function forschen(host, t, ctx) {
  const F = ctx.T.formen.forschen;
  const N = ctx.T.formen.names[t.shape];
  const scene = el("div", "scene card shape-scene");
  const { svg, corners } = draw(t, { size: 200 });
  scene.append(svg);
  let locked = false;

  if (t.range !== 3) {
    // Every corner is a spot to tap: it gets its number, so the child counts each corner once.
    let count = 0;
    for (const [x, y] of corners) {
      const g = svgEl("g", { class: "corner", tabindex: 0, role: "button" });
      g.append(svgEl("circle", { cx: x, cy: y, r: 20, class: "corner-hit" }));
      const label = svgEl("text", { x, y: y + 6, "text-anchor": "middle", class: "corner-no" });
      g.append(label);
      const tapIt = () => {
        if (locked || g.classList.contains("on")) return;
        count++;
        g.classList.add("on");
        label.textContent = ctx.num(count);
        ctx.tap();
        if (count === corners.length) {
          locked = true;
          ctx.solved(F.doneCorners(N.a, ctx.word(count)));
        }
      };
      g.addEventListener("click", tapIt);
      g.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && tapIt());
      svg.append(g);
    }
    host.append(scene);
    ctx.tell(F.tapCorners);
    return {
      hint() {
        for (const g of svg.querySelectorAll(".corner:not(.on)")) g.classList.add("glow");
        return F.hintCorners;
      },
    };
  }

  const padBox = el("div");
  const p = pad(padBox, ctx, 2, (n) => {
    if (locked) return false;
    if (n !== t.answer) {
      p.clear();
      ctx.miss(F.miss[t.ask]);
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    ctx.solved(F.done[t.ask](N.a, ctx.word(n)));
    return true;
  });
  host.append(scene, padBox);
  ctx.tell(F.ask[t.ask](N.a));
  return {
    hint() {
      if (t.ask === "corners") for (const [x, y] of corners) svg.append(svgEl("circle", { cx: x, cy: y, r: 6, class: "corner-dot" }));
      return F.hint[t.ask];
    },
  };
}

// ---------- Anwenden: measure with the ruler. How long is it? How much longer?

const CM = 21; // pixels per centimetre in the svg
const BAR = { pencil: "#ffc83a", key: "#c9a227", nail: "#9aa5b4", crayon: "#e8488a", spoon: "#b8c4d6" };
const ICON = { pencil: "✏️", key: "🔑", nail: "🔩", crayon: "🖍️", spoon: "🥄" };

function ruler(svg, y) {
  svg.append(svgEl("rect", { x: 0, y, width: 15 * CM + 20, height: 40, rx: 6, fill: "#fff6e0", stroke: "#1b2140", "stroke-width": 2.5 }));
  for (let c = 0; c <= 15; c++) {
    const x = 10 + c * CM;
    svg.append(svgEl("line", { x1: x, y1: y, x2: x, y2: y + (c % 5 === 0 ? 18 : 12), stroke: "#1b2140", "stroke-width": 2 }));
    const tx = svgEl("text", { x, y: y + 34, "text-anchor": "middle", class: "cm-no" });
    tx.textContent = c;
    svg.append(tx);
  }
}

function bar(svg, thing, from, len, y) {
  const x = 10 + from * CM;
  const w = len * CM;
  svg.append(svgEl("rect", { x, y, width: w, height: 18, rx: 9, fill: BAR[thing], stroke: "#1b2140", "stroke-width": 2.5 }));
  const t = svgEl("text", { x: x + w / 2, y: y - 4, "text-anchor": "middle", class: "thing-icon" });
  t.textContent = ICON[thing];
  svg.append(t);
}

export function anwenden(host, t, ctx) {
  const F = ctx.T.formen.anwenden;
  const diff = t.kind === "diff";
  const h = diff ? 150 : 110;
  const svg = svgEl("svg", { viewBox: `0 0 ${15 * CM + 20} ${h}`, class: "ruler-svg" });
  if (diff) {
    bar(svg, t.thing, 0, t.len, 34);
    bar(svg, t.other, 0, t.otherLen, 78);
    ruler(svg, 104);
  } else {
    bar(svg, t.thing, t.from, t.len, 50);
    ruler(svg, 68);
  }
  const scene = el("div", "scene card ruler-scene");
  scene.append(svg);
  const padBox = el("div");
  let locked = false;
  const thingName = F.things[t.thing];
  const p = pad(padBox, ctx, 2, (n) => {
    if (locked) return false;
    if (n !== t.answer) {
      p.clear();
      if (!diff && t.from > 0 && n === t.from + t.len) ctx.miss(F.missEnd(ctx.num(t.from)));
      else ctx.miss(diff ? F.missDiff : F.miss);
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    ctx.solved(diff ? F.doneDiff(ctx.word(n)) : F.done(thingName, ctx.word(n)));
    return true;
  });
  host.append(scene, padBox);
  ctx.tell(diff ? F.askDiff : F.ask(thingName));
  return {
    hint() {
      // Mark start and end on the ruler.
      const marks = diff ? [t.otherLen, t.len] : [t.from, t.from + t.len];
      for (const c of marks) svg.append(svgEl("line", { x1: 10 + c * CM, y1: 0, x2: 10 + c * CM, y2: h, stroke: "#e8488a", "stroke-width": 2.5, "stroke-dasharray": "5 4" }));
      return diff ? F.hintDiff : t.from ? F.hintFrom : F.hint;
    },
  };
}

// ---------- Prüfen: the owl names the shape. Is that right?

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const F = T.formen.pruefen;
  let locked = false;
  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const bubble = el("div", "bubble", nameOf(ctx, t.said).name);
  talk.append(el("span", "owl", "🦉"), bubble);
  const pic = draw(t, { size: 150 }).svg;
  scene.append(talk, pic);
  const hintBox = el("div", "hint-box");
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  const fixer = nameButtons(ctx, t.choices, (id, b) => {
    if (locked) return;
    if (id !== t.shape) {
      shake(b);
      b.disabled = true;
      ctx.miss(F.fixMiss);
      return;
    }
    locked = true;
    b.classList.add("right");
    bubble.textContent = nameOf(ctx, id).name;
    ctx.solved(F.fixed(nameOf(ctx, id).a, T.formen.facts[id]));
  });
  fixer.hidden = true;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(F.lookAgain));
    locked = true;
    ctx.solved(F.right(nameOf(ctx, t.shape).a, T.formen.facts[t.shape]));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(t.turn ? F.turned : F.lookAgain));
    judge.hidden = true;
    fixer.hidden = false;
    bubble.classList.add("wrong");
    ctx.tap();
    ctx.tell(F.fix);
  });
  host.append(scene, judge, fixer, hintBox);
  ctx.tell(F.question(nameOf(ctx, t.said).a));
  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(el("p", "hint-text pop", T.formen.facts[t.shape]));
      return t.turn ? F.turned : F.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
