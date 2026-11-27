// The boards of camp 5, "Die Regel finden" (welt/berg/). Verstehen, Regel finden (the table),
// Übertragen and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   picture  figures from matches: figure 1, 2, 3 side by side
//   machen   Ausprobieren: go on with a row of shapes (levels 1, 2), or lay figure 4 from matches,
//            match by match, and then say how many figure n needs (levels 3, 4)
//
// Texts: welt/lang/<language>.js under "ameisen".

import { el, button, shake } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, picture as rows } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";

export const TOOLS = { plusk: "➕", wechsel: "🔁", muster: "🧩", streich: "🔥", woche: "📅", gauss: "🤝", stellen: "🔢", quadrat: "⬛", zaun: "🪵", tabelle: "📋", liste: "📝" };

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};

/** The matches of figure n, as lines in units (a square is 1 × 1, y goes up). Shared sides once. */
export function sticksOf(shape, n) {
  const seen = new Map();
  const add = (a, b, c, d) => {
    const [p, q] = [`${a},${b}`, `${c},${d}`].sort();
    seen.set(`${p}|${q}`, [a, b, c, d]);
  };
  if (shape === "dreiecke") {
    const h = 0.87;
    for (let i = 0; i < n; i++) {
      const x = Math.floor(i / 2);
      const pts = i % 2 === 0 ? [[x, 0], [x + 1, 0], [x + 0.5, h]] : [[x + 0.5, h], [x + 1.5, h], [x + 1, 0]];
      for (let j = 0; j < 3; j++) add(...pts[j], ...pts[(j + 1) % 3]);
    }
  } else {
    const rowsN = shape === "doppel" ? 2 : 1;
    for (let y = 0; y < rowsN; y++) for (let x = 0; x < n; x++) {
      add(x, y, x + 1, y);
      add(x, y + 1, x + 1, y + 1);
      add(x, y, x, y + 1);
      add(x + 1, y, x + 1, y + 1);
    }
  }
  return [...seen.values()];
}

function figure(shape, n, { slots = false, onTap = null, U = 30 } = {}) {
  const lines = sticksOf(shape, n);
  const w = Math.max(...lines.flatMap(([a, , c]) => [a, c])) * U + 16;
  const h = Math.max(...lines.flatMap(([, b, , d]) => [b, d])) * U + 16;
  const svg = svgEl("svg", { viewBox: `-8 -8 ${w} ${h}`, width: w, height: h, class: "sticks-svg" });
  const top = Math.max(...lines.flatMap(([, b, , d]) => [b, d]));
  const flip = (y) => (top - y) * U;
  return {
    svg,
    lines: lines.map(([a, b, c, d], i) => {
      const g = svgEl("g", { class: slots ? "stick slot" : "stick" }, svg);
      svgEl("line", { x1: a * U, y1: flip(b), x2: c * U, y2: flip(d), class: "wood" }, g);
      if (slots) {
        svgEl("line", { x1: a * U, y1: flip(b), x2: c * U, y2: flip(d), class: "hit" }, g);
        g.addEventListener("click", () => onTap?.(i, g));
      }
      return g;
    }),
  };
}

function picture(ctx, pic) {
  if (!pic?.sticks) return rows(ctx, pic);
  const scene = el("div", "scene card camp-scene sticks-scene");
  const row = el("div", "sticks-row");
  for (let n = 1; n <= pic.upTo; n++) {
    const box = el("figure", "sticks-fig");
    box.append(figure(pic.sticks, n).svg, el("figcaption", "", ctx.T.ameisen.figure(ctx.num(n))));
    row.append(box);
  }
  scene.append(row);
  return scene;
}

function machen(host, t, ctx) {
  const A = ctx.T.ameisen;
  const M = A.machen;
  const win = solvedBy(ctx, "ameisen", TOOLS);
  if (t.mode === "shapes") {
    const line = el("div", "card shape-line");
    t.shown.forEach((s) => line.append(el("span", "shape", s)));
    const slots = t.next.map(() => {
      const s = el("span", "shape slot", "");
      line.append(s);
      return s;
    });
    let at = 0;
    const pick = el("div", "find-row");
    for (const k of t.kinds) {
      const b = button("btn find-btn", k, k);
      b.addEventListener("click", () => {
        if (at >= slots.length) return;
        ctx.tap();
        if (k !== t.next[at]) return void (shake(b), ctx.miss(M.wrongShape));
        slots[at].textContent = k;
        slots[at].classList.remove("slot");
        at++;
        if (at === slots.length) win(host, t, M.shapesDone);
      });
      pick.append(b);
    }
    host.append(line, pick);
    kit.question(host, "", M.shapesAsk);
    ctx.ready();
    ctx.tell(M.shapesAsk, "");
    return { hint: () => M.shapesHint };
  }

  // Matches: figures 1–3, figure 4 to lay, then figure n to count.
  host.append(picture(ctx, t.pic));
  const box = el("div", "card build-box");
  const counter = el("div", "find-count");
  let laid = 0;
  const fig = figure(t.shape, t.build, {
    slots: true,
    U: 54,
    onTap(i, g) {
      if (g.classList.contains("on")) return;
      ctx.tap();
      g.classList.add("on");
      laid++;
      show();
      if (laid === fig.lines.length) countNow();
    },
  });
  const show = () => {
    counter.textContent = "";
    counter.append(el("b", "", ctx.num(laid)), el("small", "", M.laid));
  };
  box.append(el("strong", "", A.figure(ctx.num(t.build))), fig.svg, counter);
  host.append(box);
  show();
  const q = kit.question(host, "", M.build(ctx.num(t.build)));
  async function countNow() {
    await ctx.tell(M.built(ctx.num(laid)));
    if (!host.isConnected) return;
    const ask = M.count(ctx.num(t.a.n));
    q.ask(ask);
    const pad = kit.typed(ctx, host, t.answer, {
      digits: DIGITS,
      onWrong: () => ctx.miss(A.miss.streich),
      onRight: () => win(host, t, ""),
    });
    pad.open();
    ctx.tell(ask, "");
  }
  ctx.ready();
  ctx.tell(M.build(ctx.num(t.build)), "");
  return { hint: () => (laid < fig.lines.length ? M.buildHint : A.hints.streich) };
}

export const BOARDS = campBoards("ameisen", { TOOLS, DIGITS, machen, picture });
