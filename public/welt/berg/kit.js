// The shared parts of every camp of the thinking mountain (welt/ideas/<camp>/boards.js).
// One camp draws its own pictures; how a question is shown, how an answer is given and what comes
// after a solved task is the same in every camp, so a child knows it from the first camp on.
//
//   question(host, text, ask)          the whole question, always in sight → { ask(next) }
//   typed(ctx, host, right, { … })     the number pad                     → { box, open() }
//   story(host, ctx, first, ask, pad)  shows the question, opens the pad, reads it aloud
//   choose(host, ctx, options, right, { … })  buttons to pick one (a name, a house, "yes"/"no")
//   win(host, ctx, ways, text)         "Solved! And this works too:" with the other tools, then on
//
// Texts are in welt/lang/<language>.js under berg (pad, solved). Styles: welt.css, .berg-board.

import { el, button, shake } from "../frame/parts.js";
import { numpad } from "../../shared/numpad.js";

// ---------- The question: a box at the top of the board that stays on screen when the page scrolls
// (number pad, owl, other ways). The caption above keeps only what is new: a miss, a hint, praise.
// Everything else on the board is pushed down.

export function question(host, text, ask = "") {
  host.classList.add("berg-board");
  const box = el("div", "task-text card");
  const said = el("p", "task-story", text);
  const asked = el("p", "task-ask", ask);
  said.hidden = !text;
  asked.hidden = !ask;
  box.append(said, asked);
  host.prepend(box);
  // What scrolls into view must not hide behind the box.
  const fit = () => host.style.setProperty("--task-h", `${box.offsetHeight + 12}px`);
  if (typeof ResizeObserver === "function") new ResizeObserver(fit).observe(box);
  return {
    ask(next) {
      asked.textContent = next;
      asked.hidden = !next;
    },
  };
}

// ---------- Answers on the number pad (only one pad listens to the keyboard at a time)

let livePad = null;

export function typed(ctx, host, right, { onWrong, onRight, digits = 3 }) {
  livePad?.remove();
  const box = el("div");
  host.append(box);
  const P = ctx.T.berg.pad;
  let done = false;
  const pad = numpad(box, { yourAnswer: P.answer, erase: P.erase, check: P.check }, {
    digits,
    onCheck(n) {
      if (done) return true;
      if (n !== right) {
        onWrong(n);
        pad.clear();
        return false;
      }
      done = true;
      pad.show(n);
      pad.lock(true);
      livePad?.remove();
      onRight(n);
      return true;
    },
  });
  livePad = pad;
  pad.lock(true);
  return {
    box,
    open() {
      pad.lock(false);
      ctx.ready();
    },
  };
}

/** Shows the whole question, opens the pad and reads the question aloud. */
export function story(host, ctx, first, ask, pad) {
  question(host, first, ask);
  pad.open();
  ctx.tell(first ? `${first} ${ask}` : ask, "");
}

// ---------- Answers by choosing: options = [{ id, text }], right = the id that is right.
// A wrong choice shakes, is crossed out and calls onWrong(id); the right one calls onRight(id).

export function choose(host, ctx, options, right, { onWrong, onRight, className = "" }) {
  const box = el("div", `choices ${className}`.trim());
  let done = false;
  for (const o of options) {
    const b = button("btn choice-btn", o.label ?? o.text, o.text);
    b.addEventListener("click", () => {
      if (done) return;
      ctx.tap();
      if (o.id !== right) {
        shake(b);
        b.disabled = true;
        onWrong(o.id);
        return;
      }
      done = true;
      b.classList.add("right");
      onRight(o.id);
    });
    box.append(b);
  }
  host.append(box);
  ctx.ready();
  return box;
}

// ---------- Solved: first the other tools that crack the same task (一题多解), then on.

/** ways = [{ icon, name, text }] from the camp's ways.js. Shows the card "Solved! And this works too:"
 *  and waits for "Next". Without at least one way the round simply goes on. */
export async function win(host, ctx, ways, text) {
  if (!ways.length) return ctx.solved(text);
  const S = ctx.T.berg.solved;
  ctx.tap();
  const card = el("div", "ways-card card pop");
  card.append(el("strong", "ways-title", S.title));
  const list = el("ul", "ways-list");
  for (const w of ways) {
    const li = el("li");
    li.append(el("span", "ways-icon", w.icon));
    const body = el("span", "ways-body");
    body.append(el("b", "", w.name), el("span", "", w.text));
    li.append(body);
    list.append(li);
  }
  const next = button("btn go ways-next", S.next, S.next);
  card.append(list, next);
  for (const old of host.querySelectorAll(".numpad-box, .judge, .reasons, .choices, .fence-tools")) old.hidden = true;
  host.append(card);
  card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  ctx.ready();
  await ctx.tell(text);
  next.addEventListener("click", () => ctx.solved(""), { once: true });
}
