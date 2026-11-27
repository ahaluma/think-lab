// The boards of camp 4, "Rückwärts denken" (welt/berg/). Verstehen, Regel finden (the number
// machine), Übertragen and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   machen   Ausprobieren: the steps as a chain of boxes, the end is known. Rewind: from the right,
//            fill in each box before a step, until the start. Every step shows what undoes it.
//
// Texts: welt/lang/<language>.js under "vorrat".

import { el } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, storyOf } from "../../berg/camp.js";
import { DIGITS, along } from "./tasks.js";

export const TOOLS = { rueck: "⏪", halb: "½", teich: "🪷", zaun: "🪵", probe: "🧪", bild: "📊", tabelle: "📋" };

function machen(host, t, ctx) {
  const V = ctx.T.vorrat;
  const M = V.machen;
  const win = solvedBy(ctx, "vorrat", TOOLS);
  const path = along(t.answer, t.ops);
  const row = el("div", "card chain");
  const boxes = path.map((v, i) => {
    const box = el("span", `chain-box${i === path.length - 1 ? " known" : ""}`, i === path.length - 1 ? ctx.num(v) : "?");
    return box;
  });
  const arrows = t.ops.map((op) => {
    const arrow = el("span", "chain-step");
    arrow.append(el("b", "", V.short[op.type](ctx.num(op.k), ctx.num(op.k - 1))), el("small", "chain-undo", ""));
    return arrow;
  });
  boxes.forEach((box, i) => {
    row.append(box);
    if (arrows[i]) row.append(arrows[i]);
  });
  host.append(row);
  const [text] = storyOf(ctx, "vorrat", t);
  let at = path.length - 2; // the box to fill now (left of the step at `at`)
  const q = kit.question(host, text, "");
  let pad = null;
  const step = () => {
    boxes.forEach((b, i) => b.classList.toggle("now", i === at));
    arrows[at].classList.add("now");
    // Long chains scroll sideways: the box to fill stays in sight.
    row.scrollLeft = Math.max(0, boxes[at].offsetLeft - row.clientWidth / 2 + 60);
    arrows[at].querySelector(".chain-undo").textContent = `⏪ ${V.undo[t.ops[at].type](ctx.num(t.ops[at].k), ctx.num(t.ops[at].k - 1))}`;
    const ask = M.ask(ctx.num(at + 1));
    q.ask(ask);
    pad?.box.remove();
    pad = kit.typed(ctx, host, path[at], {
      digits: DIGITS,
      onWrong: () => ctx.miss(M.miss(V.undo[t.ops[at].type](ctx.num(t.ops[at].k), ctx.num(t.ops[at].k - 1)))),
      onRight: async () => {
        boxes[at].textContent = ctx.num(path[at]);
        boxes[at].classList.add("known");
        arrows[at].classList.remove("now");
        if (at === 0) {
          boxes[0].classList.remove("now");
          pad.box.remove();
          return win(host, t, M.done(ctx.num(path[0])));
        }
        at--;
        await ctx.tell(M.good);
        if (host.isConnected) step();
      },
    });
    pad.open();
    ctx.tell(ask, "");
  };
  step();
  ctx.tell(text, "");
  return { hint: () => M.hint };
}

export const BOARDS = campBoards("vorrat", { TOOLS, DIGITS, machen });
