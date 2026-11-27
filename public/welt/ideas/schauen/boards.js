// The five boards of the idea "Schauen" (look closely: differences, copy, remember, the twin).
// Same contract as every idea (see ideas/teile/boards.js): board(host, t, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "schauen".

import { el, button, shake, wait } from "../../frame/parts.js";

/** A grid of places with icons (or empty places to colour). Buttons only where `tap` is given. */
function grid(size, cells, { tap, cls = "" } = {}) {
  const box = el("div", `sc-grid ${cls}`);
  box.style.setProperty("--n", size);
  const places = cells.map((icon, i) => {
    const c = tap ? button("sc-cell", "", icon ?? "") : el("span", "sc-cell", icon ?? "");
    if (tap) c.addEventListener("click", () => tap(i, c));
    box.append(c);
    return c;
  });
  return { box, places };
}

const empty = (size) => Array.from({ length: size * size }, () => null);

// ---------- Sehen: two pictures. Tap the differences in the right one.

export function sehen(host, t, ctx) {
  const S = ctx.T.schauen.sehen;
  const scene = el("div", "scene card sc-scene");
  const left = grid(t.size, t.left);
  let found = 0;
  let locked = false;
  const right = grid(t.size, t.right, {
    tap: (i, c) => {
      if (locked || c.classList.contains("found")) return;
      if (!t.diffs.includes(i)) {
        shake(c);
        ctx.miss(S.miss);
        return;
      }
      ctx.tap();
      c.classList.add("found");
      left.places[i].classList.add("found");
      found++;
      if (found < t.diffs.length) return void ctx.tell(S.oneMore);
      locked = true;
      ctx.solved(t.diffs.length > 1 ? S.doneAll : S.done);
    },
  });
  scene.append(left.box, right.box);
  host.append(scene);
  ctx.tell(t.diffs.length > 1 ? S.askTwo : S.ask);
  return {
    hint() {
      const open = t.diffs.find((i) => !right.places[i].classList.contains("found"));
      if (open === undefined) return S.hint;
      const row = Math.floor(open / t.size);
      for (let k = 0; k < t.size; k++) right.places[row * t.size + k].classList.add("look");
      return S.hint;
    },
  };
}

/** Colour the places of the model in an empty grid. → { box, places } */
function copyGrid(ctx, t, { onMiss, onDone }) {
  let filled = 0;
  let locked = false;
  return grid(t.size, empty(t.size), {
    cls: "sc-paint",
    tap: (i, c) => {
      if (locked || c.classList.contains("on")) return;
      if (!t.model.includes(i)) {
        shake(c);
        onMiss();
        return;
      }
      ctx.tap();
      c.classList.add("on");
      filled++;
      if (filled < t.model.length) return;
      locked = true;
      onDone();
    },
  });
}

// ---------- Machen: colour the same places as in the model.

export function machen(host, t, ctx) {
  const M = ctx.T.schauen.machen;
  const scene = el("div", "scene card sc-scene");
  const model = grid(t.size, empty(t.size), { cls: "sc-model" });
  for (const i of t.model) model.places[i].classList.add("on");
  const mine = copyGrid(ctx, t, { onMiss: () => ctx.miss(M.miss), onDone: () => ctx.solved(M.done) });
  scene.append(model.box, el("b", "sc-arrow", "→"), mine.box);
  host.append(scene);
  ctx.tell(M.ask);
  return {
    hint() {
      return M.hint;
    },
  };
}

// ---------- Forschen: look, then from memory.

export function forschen(host, t, ctx) {
  const R = ctx.T.schauen.forschen;
  const scene = el("div", "scene card sc-scene");
  const model = grid(t.size, empty(t.size), { cls: "sc-model" });
  for (const i of t.model) model.places[i].classList.add("on");
  const mine = copyGrid(ctx, t, { onMiss: () => ctx.miss(R.miss), onDone: () => ctx.solved(R.done) });
  mine.box.classList.add("waiting");
  scene.append(model.box, el("b", "sc-arrow", "→"), mine.box);
  host.append(scene);
  const peek = async (ms) => {
    model.box.classList.remove("covered");
    await wait(ms);
    if (host.isConnected) model.box.classList.add("covered");
  };
  (async () => {
    await ctx.tell(R.look);
    await peek(t.show);
    if (!host.isConnected) return;
    mine.box.classList.remove("waiting");
    ctx.tell(R.ask);
  })();
  return {
    hint() {
      peek(1500);
      return R.hint;
    },
  };
}

// ---------- Anwenden: which one is just like the model?

export function anwenden(host, t, ctx) {
  const A = ctx.T.schauen.anwenden;
  const pic = (icons) => {
    const box = el("span", t.grid ? "sc-pic sc-pic-grid" : "sc-pic");
    for (const x of icons) box.append(el("span", "", x));
    return box;
  };
  const scene = el("div", "scene card sc-scene sc-twin");
  scene.append(pic(t.model));
  const row = el("div", "sc-choices");
  let locked = false;
  t.choices.forEach((c, i) => {
    const b = button("btn sc-choice", "");
    b.append(pic(c));
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.answer) {
        shake(b);
        b.disabled = true;
        ctx.miss(c.every((x) => t.model.includes(x)) ? A.missSwap : A.missChange);
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(A.done);
    });
    row.append(b);
  });
  host.append(scene, row);
  ctx.tell(A.ask);
  return {
    hint() {
      return A.hint;
    },
  };
}

// ---------- Prüfen: the owl says "They are the same!" Is it right? If not: tap the difference.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const P = T.schauen.pruefen;
  const talk = el("div", "talk");
  talk.append(el("span", "owl", "🦉"), el("div", "bubble sc-bubble", P.says));
  const scene = el("div", "scene card sc-scene");
  let locked = false;
  let fixing = false;
  const left = grid(t.size, t.left);
  const right = grid(t.size, t.right, {
    tap: (i, c) => {
      if (locked || !fixing) return;
      if (!t.diffs.includes(i)) return void (shake(c), ctx.miss(P.fixMiss));
      locked = true;
      c.classList.add("found");
      left.places[i].classList.add("found");
      ctx.solved(P.fixed);
    },
  });
  scene.append(left.box, right.box);
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.same) return void (shake(yes), ctx.miss(P.lookAgain));
    locked = true;
    ctx.solved(P.right);
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.same) return void (shake(no), ctx.miss(P.isRight));
    judge.hidden = true;
    fixing = true;
    ctx.tap();
    ctx.tell(P.fix);
  });
  host.append(talk, scene, judge);
  ctx.tell(P.question);
  return {
    hint() {
      return P.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
