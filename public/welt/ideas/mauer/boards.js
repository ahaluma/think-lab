// The boards of camp 12, "Eingrenzen" (welt/berg/). Verstehen, Regel finden (the table),
// Übertragen and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   picture  a number wall (bricks, "?" for the asked one), or a magic square
//   machen   Ausprobieren: build the wall brick by brick from the bottom up; each brick is the sum
//            of the two below it
//
// Texts: welt/lang/<language>.js under "mauer".

import { el } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, picture as rows } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";

export const TOOLS = { mauer: "🧱", luecke: "🕳️", eingrenzen: "🔎", magisch: "✨", zaehlen: "🗂️", rueck: "⏪", probe: "🧪", tabelle: "📋", liste: "📝" };

/** The wall: rows from the top down, each value a number, null (empty) or "?". Returns the bricks. */
function wall(ctx, layout) {
  const box = el("div", "wall");
  const bricks = layout.map((row) => {
    const line = el("div", "wall-row");
    const out = row.map((v) => {
      const b = el("span", `brick${v === "?" ? " ask" : v === null ? " empty" : ""}`, v === null ? "" : v === "?" ? "?" : ctx.num(v));
      line.append(b);
      return b;
    });
    box.append(line);
    return out;
  });
  return { box, bricks };
}

function magic(ctx, grid) {
  const box = el("div", "magic");
  for (const v of grid) box.append(el("span", `magic-cell${v === "?" ? " ask" : v === null ? " empty" : ""}`, v === null ? "" : v === "?" ? "?" : ctx.num(v)));
  return box;
}

function picture(ctx, pic) {
  if (!pic?.wall && !pic?.magic) return rows(ctx, pic);
  const scene = el("div", "scene card camp-scene wall-scene");
  scene.append(pic.wall ? wall(ctx, pic.wall).box : magic(ctx, pic.magic));
  return scene;
}

function machen(host, t, ctx) {
  const W = ctx.T.mauer;
  const M = W.machen;
  const win = solvedBy(ctx, "mauer", TOOLS);
  const layout = t.rows.map((row, i) => (i === t.rows.length - 1 ? row : row.map(() => null)));
  const scene = el("div", "scene card camp-scene wall-scene");
  const w = wall(ctx, layout);
  scene.append(w.box);
  host.append(scene);
  // the order: from the row above the bottom, left to right, up to the top
  const order = [];
  for (let i = t.rows.length - 2; i >= 0; i--) for (let j = 0; j < t.rows[i].length; j++) order.push([i, j]);
  let at = 0;
  let pad = null;
  const q = kit.question(host, M.text, "");
  const step = () => {
    const [i, j] = order[at];
    w.bricks.flat().forEach((b) => b.classList.remove("now"));
    w.bricks[i][j].classList.add("now");
    w.bricks[i + 1][j].classList.add("now");
    w.bricks[i + 1][j + 1].classList.add("now");
    const ask = M.ask(ctx.num(t.rows[i + 1][j]), ctx.num(t.rows[i + 1][j + 1]));
    q.ask(ask);
    pad?.box.remove();
    pad = kit.typed(ctx, host, t.rows[i][j], {
      digits: DIGITS,
      onWrong: () => ctx.miss(M.miss),
      onRight: async () => {
        const b = w.bricks[i][j];
        b.textContent = ctx.num(t.rows[i][j]);
        b.classList.remove("empty");
        at++;
        if (at === order.length) {
          w.bricks.flat().forEach((x) => x.classList.remove("now"));
          pad.box.remove();
          return win(host, t, M.done(ctx.num(t.rows[0][0])));
        }
        await ctx.tell(M.good);
        if (host.isConnected) step();
      },
    });
    pad.open();
    ctx.tell(ask, "");
  };
  step();
  ctx.tell(M.text, "");
  return { hint: () => M.hint };
}

export const BOARDS = campBoards("mauer", { TOOLS, DIGITS, machen, picture });
