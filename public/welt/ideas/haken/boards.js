// The boards of camp 2, "Alle der Reihe nach" (welt/berg/). Verstehen, Regel finden, Übertragen and
// Begründen are the shared camp boards (berg/camp.js). Only two things are this camp's own:
//
//   machen   Ausprobieren: find them all. Tap one thing of each group (an ice cream: a flavour and a
//            cone), two digit cards, two teams, or three children in the order they sit. Every new
//            one goes on the list, one found before is not counted twice. When the child thinks the
//            list is complete it says so: "Das sind alle!"
//   picture  the street grid (from home 🏠 to school 🏫, only right and up), with a building site 🚧
//
// Texts: welt/lang/<language>.js under "haken".

import { el, button, shake } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, picture as rows, solvedBy, args } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";

export const TOOLS = { mal: "✖️", baum: "🌳", tabelle: "📋", ziffern: "🔢", paare: "🤝", reihe: "🪑", gitter: "🗺️", weg: "➖", liste: "📝", zaun: "🪵" };

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};

/** The street grid: m blocks to the right, n blocks up. */
function streets(ctx, [m, n], block) {
  const scene = el("div", "scene card camp-scene grid-scene");
  const cell = 46;
  const pad = 26;
  const w = m * cell + 2 * pad;
  const h = n * cell + 2 * pad;
  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, class: "grid-svg" });
  const X = (i) => pad + i * cell;
  const Y = (j) => h - pad - j * cell;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) svgEl("rect", { x: X(i) + 5, y: Y(j + 1) + 5, width: cell - 10, height: cell - 10, rx: 6, fill: "#9ed36a", stroke: "#1b2140", "stroke-width": 2 }, svg);
  for (let i = 0; i <= m; i++) svgEl("line", { x1: X(i), y1: Y(0), x2: X(i), y2: Y(n), stroke: "#e3c79a", "stroke-width": 6, "stroke-linecap": "round" }, svg);
  for (let j = 0; j <= n; j++) svgEl("line", { x1: X(0), y1: Y(j), x2: X(m), y2: Y(j), stroke: "#e3c79a", "stroke-width": 6, "stroke-linecap": "round" }, svg);
  const mark = (x, y, icon, size = 24) => {
    const t = svgEl("text", { x, y: y + size * 0.35, "font-size": size, "text-anchor": "middle" }, svg);
    t.textContent = icon;
  };
  mark(X(0), Y(0), "🏠");
  mark(X(m), Y(n), "🏫");
  if (block) mark(X(block[0]), Y(block[1]), "🚧", 22);
  scene.append(svg);
  return scene;
}

function picture(ctx, pic) {
  return pic?.grid ? streets(ctx, pic.grid, pic.block) : rows(ctx, pic);
}

// ---------- Ausprobieren: find them all

function machen(host, t, ctx) {
  const H = ctx.T.haken;
  const M = H.machen;
  const win = solvedBy(ctx, "haken", TOOLS);
  const found = new Map(); // key → chip
  let pick = [];
  let locked = false;

  const groups = t.mode === "groups" ? t.groups : [t.items];
  const need = t.mode === "groups" ? groups.length : t.mode === "orders" ? t.items.length : 2;
  const label = (x) => (typeof x === "number" ? ctx.num(x) : x);

  const box = el("div", "scene card find-box");
  const rowsEl = groups.map((g, gi) => {
    const row = el("div", "find-row");
    g.forEach((item) => {
      const b = button("btn find-btn", String(item), label(item));
      b.addEventListener("click", () => choose(gi, item, b));
      row.append(b);
    });
    box.append(row);
    return row;
  });
  const now = el("div", "find-now");
  const list = el("div", "find-list");
  const counter = el("div", "find-count");
  const done = button("btn ok find-done", M.done, M.done);
  const tools = el("div", "fence-tools find-tools");
  tools.append(counter, done);
  host.append(box, now, list, tools);

  const show = () => {
    now.textContent = "";
    for (let i = 0; i < need; i++) now.append(el("span", "find-slot", pick[i] === undefined ? "" : label(pick[i].item)));
    counter.textContent = "";
    counter.append(el("b", "", ctx.num(found.size)), el("small", "", M.found));
    for (const row of rowsEl) for (const b of row.children) b.classList.remove("on");
    for (const p of pick) p.b.classList.add("on");
  };

  function choose(gi, item, b) {
    if (locked) return;
    ctx.tap();
    if (t.mode === "groups") {
      pick = pick.filter((p) => p.gi !== gi);
      pick.push({ gi, item, b });
      pick.sort((p, q) => p.gi - q.gi);
    } else {
      const at = pick.findIndex((p) => p.item === item);
      if (at >= 0) pick.splice(at, 1);
      else pick.push({ gi, item, b });
    }
    show();
    if (pick.length < need) return;
    const items = pick.map((p) => p.item);
    if (t.mode === "cards" && items[0] === 0) {
      pick = [];
      show();
      return void ctx.miss(M.zero);
    }
    const key = t.mode === "pairs" ? [...items].sort().join("+") : items.join(t.mode === "cards" ? "" : "+");
    pick = [];
    if (found.has(key)) {
      const chip = found.get(key);
      chip.classList.remove("again");
      void chip.offsetWidth;
      chip.classList.add("again");
      show();
      return void ctx.tell(M.again);
    }
    const chip = el("span", "find-chip pop", t.mode === "cards" ? items.map(label).join("") : items.map(label).join(t.mode === "pairs" ? "–" : ""));
    found.set(key, chip);
    list.append(chip);
    show();
    if (found.size === 1) ctx.tell(M.first);
  }

  done.addEventListener("click", () => {
    if (locked) return;
    if (found.size < t.answer) return void (shake(done), ctx.miss(M.notAll));
    locked = true;
    done.classList.add("right");
    win(host, t, M.all(ctx.num(t.answer)));
  });

  const ask = M.ask[t.mode === "groups" ? t.story : t.mode === "cards" ? "cards" : t.story](args(ctx, t));
  kit.question(host, "", ask);
  show();
  ctx.ready();
  ctx.tell(ask, "");
  return { hint: () => M.hint[t.mode] };
}

export const BOARDS = campBoards("haken", { TOOLS, DIGITS, machen, picture });
