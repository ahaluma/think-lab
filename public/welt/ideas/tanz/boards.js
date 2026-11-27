// The boards of camp 8, "Paare bilden" (welt/berg/). Verstehen, Regel finden (the table),
// Übertragen and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   picture  a chessboard with squares taken away (dominoes)
//   machen   Ausprobieren: tap the dancers into groups of k (pairs at level 1), then say how many are left
//
// Texts: welt/lang/<language>.js under "tanz".

import { el } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, picture as rows } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";

export const TOOLS = { paar: "👫", rest: "🧺", farbe: "🏁", zyklus: "🔄", reste: "🥚", woche: "📅", probe: "🧪", tabelle: "📋", liste: "📝" };

const SVG = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};

function picture(ctx, pic) {
  if (!pic?.board) return rows(ctx, pic);
  const { s, gone } = pic.board;
  const U = Math.floor(240 / s);
  const scene = el("div", "scene card camp-scene");
  const svg = svgEl("svg", { viewBox: `0 0 ${s * U} ${s * U}`, width: s * U, height: s * U, class: "board-svg" });
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const out = gone.some(([gy, gx]) => gy === y && gx === x);
    svgEl("rect", { x: x * U, y: y * U, width: U, height: U, class: out ? "cell gone" : (x + y) % 2 === 0 ? "cell dark" : "cell light" }, svg);
    if (out) svgEl("text", { x: x * U + U / 2, y: y * U + U * 0.72, "text-anchor": "middle", "font-size": U * 0.7, class: "cell-x" }, svg).textContent = "✕";
  }
  scene.append(svg);
  return scene;
}

const KIDS = ["🧒", "👧", "👦", "🧒🏽", "👧🏾", "👦🏻", "🧒🏿", "👧🏼"];

function machen(host, t, ctx) {
  const D = ctx.T.tanz;
  const M = D.machen;
  const win = solvedBy(ctx, "tanz", TOOLS);
  const { n, k } = t.a;
  const floor = el("div", "card swap-row dance-floor");
  const status = el("p", "scale-status");
  let group = [];
  let groups = 0;
  let asked = false;
  const kids = Array.from({ length: n }, (_, i) => {
    const b = el("button", "btn swap-btn dancer", KIDS[i % KIDS.length]);
    b.type = "button";
    b.setAttribute("aria-label", M.dancer);
    b.addEventListener("click", () => {
      if (asked || b.dataset.g) return;
      ctx.tap();
      b.dataset.g = String(groups % 6);
      b.classList.add("picked");
      group.push(b);
      if (group.length === k) {
        group.forEach((x) => x.classList.replace("picked", "grouped"));
        group = [];
        groups++;
      }
      show();
    });
    floor.append(b);
    return b;
  });
  const q = kit.question(host, M.text(ctx.num(n), ctx.num(k)), M.ask(ctx.num(k)));
  const show = () => {
    status.textContent = M.made(ctx.num(groups));
    const free = kids.filter((b) => !b.dataset.g).length;
    if (!asked && !group.length && free < k) {
      asked = true;
      const ask = M.left;
      q.ask(ask);
      const pad = kit.typed(ctx, host, t.answer, { digits: DIGITS, onWrong: () => ctx.miss(D.miss.rest), onRight: () => win(host, t, M.done(ctx.num(groups), ctx.num(t.answer))) });
      pad.open();
      ctx.tell(ask, "");
    }
  };
  host.append(floor, status);
  show();
  ctx.ready();
  ctx.tell(`${M.text(ctx.num(n), ctx.num(k))} ${M.ask(ctx.num(k))}`, "");
  return { hint: () => (asked ? D.hints.rest : M.hint) };
}

export const BOARDS = campBoards("tanz", { TOOLS, DIGITS, machen, picture });
