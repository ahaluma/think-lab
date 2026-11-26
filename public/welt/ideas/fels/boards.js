// The boards of camp 9, "Ordentlich zählen, im Kopf drehen" (welt/berg/). Verstehen, Regel finden,
// Übertragen and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   picture  the signs on the rock: a fan of lines (triangles), a grid (squares, rectangles),
//            a clock seen in a mirror (no numbers, only the 12 at the top), a cube net with numbers
//   machen   Ausprobieren: find every triangle of a fan by tapping the two corners on the bottom
//
// Texts: welt/lang/<language>.js under "fels".

import { el, shake } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, storyOf } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";

export const TOOLS = { ordnung: "🗂️", spiegel: "🪞", netz: "🎲", falten: "📄", wuerfel: "🧊", haken: "✅", tabelle: "📋", probe: "🧪", bild: "✏️" };

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};
const LETTERS = "ABCDEFGH";

/** A fan: rays from the top to m + 1 points at the bottom, h lines across. Returns the svg and the points. */
function fan({ m, h }, labels = true) {
  const W = 260;
  const H = 190;
  const top = [W / 2, 12];
  const y0 = H - 26;
  const base = Array.from({ length: m + 1 }, (_, i) => [20 + (i * (W - 40)) / m, y0]);
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "rock-svg" });
  const shade = svgEl("g", {}, svg);
  for (const [x, y] of base) svgEl("line", { x1: top[0], y1: top[1], x2: x, y2: y, class: "rock-line" }, svg);
  for (let k = 1; k <= h; k++) {
    const f = k / h;
    const ya = top[1] + f * (y0 - top[1]);
    const xa = top[0] + f * (base[0][0] - top[0]);
    const xb = top[0] + f * (base[m][0] - top[0]);
    svgEl("line", { x1: xa, y1: ya, x2: xb, y2: ya, class: "rock-line" }, svg);
  }
  if (labels) base.forEach(([x, y], i) => (svgEl("text", { x, y: y + 20, "text-anchor": "middle", class: "rock-label" }, svg).textContent = LETTERS[i]));
  return { svg, shade, top, base };
}

function grid({ w, h }) {
  const U = Math.min(44, Math.floor(240 / Math.max(w, h)));
  const svg = svgEl("svg", { viewBox: `-4 -4 ${w * U + 8} ${h * U + 8}`, width: w * U + 8, height: h * U + 8, class: "rock-svg" });
  for (let x = 0; x <= w; x++) svgEl("line", { x1: x * U, y1: 0, x2: x * U, y2: h * U, class: "rock-line" }, svg);
  for (let y = 0; y <= h; y++) svgEl("line", { x1: 0, y1: y * U, x2: w * U, y2: y * U, class: "rock-line" }, svg);
  return svg;
}

/** The clock as the mirror shows it: no numbers, a dot at the 12, the hour hand on `shown`. */
function clock(shown) {
  const svg = svgEl("svg", { viewBox: "-60 -60 120 120", width: 150, height: 150, class: "rock-svg clock-svg" });
  svgEl("circle", { cx: 0, cy: 0, r: 54, class: "clock-face" }, svg);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    svgEl("line", { x1: 44 * Math.sin(a), y1: -44 * Math.cos(a), x2: 50 * Math.sin(a), y2: -50 * Math.cos(a), class: "clock-tick" }, svg);
  }
  svgEl("circle", { cx: 0, cy: -38, r: 4, class: "clock-twelve" }, svg);
  const a = (shown * Math.PI) / 6;
  svgEl("line", { x1: 0, y1: 0, x2: 28 * Math.sin(a), y2: -28 * Math.cos(a), class: "clock-hour" }, svg);
  svgEl("line", { x1: 0, y1: 0, x2: 0, y2: -42, class: "clock-minute" }, svg);
  svgEl("circle", { cx: 0, cy: 0, r: 4, class: "clock-twelve" }, svg);
  return svg;
}

function net(ctx, { cells, nums, mark }) {
  const U = 44;
  const w = Math.max(...cells.map(([, x]) => x)) + 1;
  const h = Math.max(...cells.map(([y]) => y)) + 1;
  const svg = svgEl("svg", { viewBox: `-3 -3 ${w * U + 6} ${h * U + 6}`, width: w * U + 6, height: h * U + 6, class: "rock-svg" });
  cells.forEach(([y, x], i) => {
    svgEl("rect", { x: x * U, y: y * U, width: U, height: U, class: i === mark ? "net-cell mark" : "net-cell" }, svg);
    svgEl("text", { x: x * U + U / 2, y: y * U + U * 0.68, "text-anchor": "middle", class: "net-num" }, svg).textContent = ctx.num(nums[i]);
  });
  return svg;
}

function picture(ctx, pic) {
  const scene = el("div", "scene card camp-scene rock-scene");
  if (pic?.fan) scene.append(fan(pic.fan).svg);
  if (pic?.grid) scene.append(grid(pic.grid));
  if (pic?.clock) scene.append(clock(pic.clock));
  if (pic?.net) scene.append(net(ctx, pic.net));
  return scene;
}

function machen(host, t, ctx) {
  const F = ctx.T.fels;
  const M = F.machen;
  const win = solvedBy(ctx, "fels", TOOLS);
  const { m } = t.a;
  const f = fan({ m, h: 1 });
  const scene = el("div", "scene card camp-scene rock-scene");
  scene.append(f.svg);
  const row = el("div", "find-row");
  const list = el("div", "find-list");
  const count = el("p", "scale-status");
  const found = new Set();
  let first = null;
  let done = false;
  const show = () => (count.textContent = M.found(ctx.num(found.size)));
  const draw = (i, j, cls) => {
    const pts = [f.top, f.base[i], f.base[j]].map((p) => p.join(",")).join(" ");
    f.shade.textContent = "";
    svgEl("polygon", { points: pts, class: cls }, f.shade);
  };
  const buttons = f.base.map((_, i) => {
    const b = el("button", "btn find-btn", LETTERS[i]);
    b.type = "button";
    b.addEventListener("click", () => {
      if (done) return;
      ctx.tap();
      if (first === null) {
        first = i;
        b.classList.add("on");
        return;
      }
      buttons[first].classList.remove("on");
      if (first === i) return void (first = null);
      const [x, y] = [Math.min(first, i), Math.max(first, i)];
      first = null;
      const name = LETTERS[x] + LETTERS[y];
      if (found.has(name)) {
        draw(x, y, "tri again");
        const chip = [...list.children].find((c) => c.textContent === name);
        chip?.classList.remove("again");
        void chip?.offsetWidth;
        chip?.classList.add("again");
        shake(b);
        return void ctx.miss(M.again);
      }
      found.add(name);
      draw(x, y, "tri");
      list.append(el("span", "find-chip", name));
      show();
      if (found.size === t.answer) {
        done = true;
        win(host, t, M.done(ctx.num(t.answer)));
      }
    });
    row.append(b);
    return b;
  });
  host.append(scene, row, count, list);
  show();
  const [text] = storyOf(ctx, "fels", t);
  kit.question(host, text, M.ask);
  ctx.ready();
  ctx.tell(`${text} ${M.ask}`, "");
  return { hint: () => M.hint };
}

export const BOARDS = campBoards("fels", { TOOLS, DIGITS, machen, picture });
