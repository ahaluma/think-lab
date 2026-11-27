// The five boards of the idea "Form" (circle, triangle, square, rectangle: preschool).
// Same contract as every idea (see ideas/teile/boards.js): board(host, t, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "form". Shapes are SVG, drawn here.

import { el, button, shake } from "../../frame/parts.js";
import { PICTURES } from "./tasks.js";

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

/** The outline of a shape in the box x, y, w, h. look: triangle 1 flat, 2 right-angled; rectangle 1 tall. */
function outline(kind, x, y, w, h, look = 0) {
  if (kind === "kreis") return svgEl("ellipse", { cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2 });
  if (kind === "dreieck") {
    if (look === 1) (y += h * 0.3), (h *= 0.55);
    const top = look === 2 ? x : x + w / 2;
    return svgEl("polygon", { points: `${top},${y} ${x + w},${y + h} ${x},${y + h}` });
  }
  if (kind === "rechteck") {
    const [rw, rh] = look === 1 ? [w * 0.42, h * 0.92] : [w * 0.92, h * 0.46];
    return svgEl("rect", { x: x + (w - rw) / 2, y: y + (h - rh) / 2, width: rw, height: rh, rx: 2 });
  }
  return svgEl("rect", { x, y, width: w, height: h, rx: 2 });
}

/** One shape as a small picture: { kind, color, size, turn, look }. */
export function shapeSvg(s, px = 80) {
  const svg = svgEl("svg", { viewBox: "0 0 100 100", width: px, height: px, class: "form-svg" });
  const side = 84 * s.size;
  const o = (100 - side) / 2;
  const fig = outline(s.kind, o, o, side, side, s.look);
  fig.setAttribute("fill", s.color);
  fig.setAttribute("stroke", "#1b2140");
  fig.setAttribute("stroke-width", 4);
  fig.setAttribute("stroke-linejoin", "round");
  if (s.turn) fig.setAttribute("transform", `rotate(${s.turn} 50 50)`);
  svg.append(fig);
  return svg;
}

const plain = (kind) => ({ kind, color: "#fff", size: 0.8, turn: 0, look: 0 });
const THING_ICONS = { uhr: "🕐", keks: "🍪", donut: "🍩", muenze: "🪙", pizza: "🍕", kaese: "🧀", sandwich: "🥪", segel: "⛵", fenster: "🪟", waffel: "🧇", wuerfel: "🎲", tuer: "🚪", buch: "📕", brief: "✉️", handy: "📱" };

/** Buttons with the shape names, a small picture on each. */
function nameRow(ctx, kinds, onPick) {
  const row = el("div", "kinds form-names");
  for (const k of kinds) {
    const b = button("btn form-name", ctx.T.form.names[k].name);
    b.append(shapeSvg(plain(k), 40), el("span", "", ctx.T.form.names[k].name));
    b.addEventListener("click", () => onPick(k, b));
    row.append(b);
  }
  return row;
}

/** Shapes as buttons in a loose field. */
function field(shapes, onTap) {
  const box = el("div", "scene card form-field");
  shapes.forEach((s, i) => {
    const b = button("form-shape pop", "");
    b.append(shapeSvg(s, 76));
    b.addEventListener("click", () => onTap(s, b, i));
    box.append(b);
  });
  return box;
}

// ---------- Sehen: tap the circle.

export function sehen(host, t, ctx) {
  const F = ctx.T.form;
  const S = F.sehen;
  let locked = false;
  const box = field(t.shapes, (s, b) => {
    if (locked) return;
    if (s.kind !== t.kind) {
      shake(b);
      b.disabled = true;
      ctx.miss(S.miss(F.names[s.kind].a, F.facts[s.kind]));
      return;
    }
    locked = true;
    b.classList.add("right");
    ctx.solved(S.done(F.names[t.kind].a, F.facts[t.kind]));
  });
  host.append(box);
  ctx.tell(S.ask(F.names[t.kind].the));
  return {
    hint() {
      return F.facts[t.kind];
    },
  };
}

// ---------- Machen: build the picture. The glowing piece is next: which shape fits?

export function machen(host, t, ctx) {
  const F = ctx.T.form;
  const M = F.machen;
  const scene = el("div", "scene card form-build");
  const svg = svgEl("svg", { viewBox: "0 0 200 200", class: "form-picture" });
  const slots = PICTURES[t.picture].map(([kind, x, y, w, h, turn]) => {
    const fig = outline(kind, x, y, w, h);
    fig.setAttribute("class", "form-slot");
    if (turn) fig.setAttribute("transform", `rotate(${turn} ${x + w / 2} ${y + h / 2})`);
    svg.append(fig);
    return { kind, fig };
  });
  scene.append(svg);
  let at = 0;
  let locked = false;
  const colors = ["#ff5a36", "#3a8dde", "#ffc83a", "#57b86a", "#e8488a", "#9b6bd6"];
  const mark = () => slots.forEach((s, i) => s.fig.classList.toggle("next", i === at));
  mark();
  const tray = nameRow(ctx, t.tray, (k, b) => {
    if (locked) return;
    if (k !== slots[at].kind) {
      shake(b);
      ctx.miss(M.miss(F.names[k].a, F.facts[slots[at].kind]));
      return;
    }
    ctx.tap();
    slots[at].fig.classList.add("placed");
    slots[at].fig.setAttribute("fill", colors[at % colors.length]);
    at++;
    if (at < slots.length) return void (mark(), ctx.tell(M.next));
    locked = true;
    mark();
    ctx.solved(M.done(F.pictures[t.picture]));
  });
  tray.classList.add("form-tray");
  host.append(scene, tray);
  ctx.tell(M.ask(F.pictures[t.picture]));
  return {
    hint() {
      return M.hint(F.facts[slots[at]?.kind ?? "kreis"]);
    },
  };
}

// ---------- Forschen: find all triangles.

export function forschen(host, t, ctx) {
  const F = ctx.T.form;
  const R = F.forschen;
  let found = 0;
  let locked = false;
  const box = field(t.shapes, (s, b) => {
    if (locked || b.classList.contains("right")) return;
    if (s.kind !== t.kind) {
      shake(b);
      ctx.miss(R.miss(F.names[s.kind].a, F.facts[t.kind]));
      return;
    }
    ctx.tap();
    b.classList.add("right");
    found++;
    if (found < t.count) return;
    locked = true;
    ctx.solved(R.done(ctx.word(t.count), F.names[t.kind].many));
  });
  host.append(box);
  ctx.tell(R.ask(F.names[t.kind].many));
  return {
    hint() {
      return `${F.facts[t.kind]} ${R.hint}`;
    },
  };
}

// ---------- Anwenden: which shape has the clock?

export function anwenden(host, t, ctx) {
  const F = ctx.T.form;
  const A = F.anwenden;
  const scene = el("div", "scene card form-thing");
  scene.append(el("span", "form-thing-icon pop", THING_ICONS[t.thing]));
  let locked = false;
  const names = nameRow(ctx, t.choices, (k, b) => {
    if (locked) return;
    if (k !== t.kind) {
      shake(b);
      b.disabled = true;
      ctx.miss(A.miss(F.facts[k]));
      return;
    }
    locked = true;
    b.classList.add("right");
    ctx.solved(A.done(F.things[t.thing], F.names[t.kind].a));
  });
  host.append(scene, names);
  ctx.tell(A.ask(F.things[t.thing]));
  return {
    hint() {
      return A.hint;
    },
  };
}

// ---------- Prüfen: the owl names the shape. Is it right?

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const F = T.form;
  const P = F.pruefen;
  let locked = false;
  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const bubble = el("div", "bubble", F.names[t.said].name);
  talk.append(el("span", "owl", "🦉"), bubble);
  scene.append(talk, shapeSvg(t.shape, 120));
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  const kind = t.shape.kind;
  const fixer = nameRow(ctx, t.choices, (k, b) => {
    if (locked) return;
    if (k !== kind) return void (shake(b), (b.disabled = true), ctx.miss(P.fixMiss(F.facts[k])));
    locked = true;
    b.classList.add("right");
    bubble.textContent = F.names[kind].name;
    bubble.classList.remove("wrong");
    ctx.solved(P.fixed(F.names[kind].a));
  });
  fixer.hidden = true;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(P.lookAgain(F.facts[t.said])));
    locked = true;
    ctx.solved(P.right(F.names[kind].a, F.facts[kind]));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(P.isRight(F.facts[kind])));
    judge.hidden = true;
    fixer.hidden = false;
    bubble.classList.add("wrong");
    ctx.tap();
    ctx.tell(P.fix);
  });
  host.append(scene, judge, fixer);
  ctx.tell(P.question(F.names[t.said].a));
  return {
    hint() {
      return P.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
