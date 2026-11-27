// The boards of camp 7, "Annehmen und verbessern" (welt/berg/). Verstehen, Regel finden (the
// table: 0, 1, 2 of the big kind), Übertragen and Begründen are the shared camp boards. This camp's own:
//
//   machen   Ausprobieren: all things start as the small kind (all hens). Tap one to swap it for
//            the big kind (a goat) and back. The count shows what there is now and what is wanted.
//
// Texts: welt/lang/<language>.js under "stall".

import { el, button } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, storyOf, args } from "../../berg/camp.js";
import { DIGITS } from "./tasks.js";

export const TOOLS = { annehmen: "🤔", drei: "🦆", quiz: "🎯", waage: "⚖️", tabelle: "📋", probe: "🧪", bild: "✏️" };

function machen(host, t, ctx) {
  const S = ctx.T.stall;
  const M = S.machen;
  const win = solvedBy(ctx, "stall", TOOLS);
  const a = args(ctx, t);
  const [text] = storyOf(ctx, "stall", t);
  const big = Array(t.a.n).fill(false);
  const row = el("div", "card swap-row");
  const count = el("p", "scale-status");
  let done = false;
  const show = () => {
    const now = big.reduce((s, b) => s + (b ? t.a.vb : t.a.vs), 0);
    count.textContent = M.now(ctx.num(now), a.total, S.what[t.story]);
    count.classList.toggle("ok", now === t.a.total);
    if (now === t.a.total && !done) {
      done = true;
      win(host, t, M.done(ctx.num(big.filter(Boolean).length)));
    }
  };
  big.forEach((_, i) => {
    const b = button("btn swap-btn", M.swap, t.icons[0]);
    b.addEventListener("click", () => {
      if (done) return;
      ctx.tap();
      big[i] = !big[i];
      b.textContent = t.icons[big[i] ? 1 : 0];
      b.classList.toggle("big", big[i]);
      show();
    });
    row.append(b);
  });
  host.append(row, count);
  show();
  kit.question(host, text, M.ask);
  ctx.ready();
  ctx.tell(`${text} ${M.ask}`, "");
  return { hint: () => M.hint(a) };
}

export const BOARDS = campBoards("stall", { TOOLS, DIGITS, machen });
