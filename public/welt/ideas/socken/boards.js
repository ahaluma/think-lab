// The boards of camp 10, "Der schlimmste Fall" (welt/berg/). Verstehen, Regel finden (the table),
// Übertragen and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   machen   Ausprobieren: a goblin in the dark box hands out the worst sock every time. Draw until
//            you must have won, then say how many it took. That number is the "sure" answer.
//
// Texts: welt/lang/<language>.js under "socken".

import { el, button } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, storyOf, picture } from "../../berg/camp.js";
import { DIGITS, COLORS, worstNext, won } from "./tasks.js";

export const TOOLS = { schlimm: "😈", jede: "🌈", schubfach: "🗄️", rest: "🧺", probe: "🧪", tabelle: "📋", bild: "✏️" };

function machen(host, t, ctx) {
  const S = ctx.T.socken;
  const M = S.machen;
  const win = solvedBy(ctx, "socken", TOOLS);
  host.append(picture(ctx, t.pic));
  const hand = el("div", "card swap-row drawn");
  const count = el("p", "scale-status");
  const draw = button("btn go draw-btn", M.draw, `🖐️ ${M.draw}`);
  const drawn = [];
  const [text] = storyOf(ctx, "socken", t);
  const q = kit.question(host, `${text} ${M.goblin}`, M.ask);
  const show = () => (count.textContent = M.count(ctx.num(drawn.length)));
  draw.addEventListener("click", () => {
    if (won(t, drawn)) return;
    ctx.tap();
    const id = worstNext(t, drawn);
    drawn.push(id);
    hand.append(el("span", "camp-thing", COLORS[id]));
    show();
    if (won(t, drawn)) {
      draw.disabled = true;
      q.ask(M.howMany);
      const pad = kit.typed(ctx, host, t.answer, { digits: DIGITS, onWrong: () => ctx.miss(M.countAgain), onRight: () => win(host, t, M.done(ctx.num(t.answer))) });
      pad.open();
      ctx.tell(`${M.got} ${M.howMany}`, "");
    }
  });
  host.append(hand, count, draw);
  show();
  ctx.ready();
  ctx.tell(`${text} ${M.goblin} ${M.ask}`, "");
  return { hint: () => M.hint };
}

export const BOARDS = campBoards("socken", { TOOLS, DIGITS, machen });
