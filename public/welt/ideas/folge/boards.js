// The five boards of the idea "Folge" (first and then: picture stories, what comes next, first,
// second, third in a row). Same contract as every idea (see ideas/teile/boards.js):
// board(host, t, ctx) → { hint() }. Texts are in welt/lang/<language>.js under "folge".

import { el, button, shake } from "../../frame/parts.js";
import { STORIES, ICONS, placeOf } from "./tasks.js";

const pic = (story, step) => STORIES[story][step];

/** A row of picture cards, numbered places for the story: → { box, slots, put(step) } */
function slotsRow(n) {
  const box = el("div", "fo-slots");
  const slots = Array.from({ length: n }, (_, i) => {
    const s = el("span", "fo-card fo-slot");
    s.append(el("i", "fo-no", String(i + 1)));
    box.append(s);
    return s;
  });
  return { box, slots };
}

/** Tap the pictures in the order of the story. Used to make it and to fix the owl's story. */
function orderBoard(host, ctx, story, order, { onDone, missText }) {
  const n = STORIES[story].length;
  const { box, slots } = slotsRow(n);
  const pile = el("div", "fo-pile");
  let at = 0;
  let locked = false;
  const cards = order.map((step) => {
    const b = button("btn fo-card fo-pick", "", pic(story, step));
    b.addEventListener("click", () => {
      if (locked || b.classList.contains("used")) return;
      if (step !== at) {
        shake(b);
        ctx.miss(missText(at));
        return;
      }
      ctx.tap();
      b.classList.add("used");
      slots[at].classList.add("filled");
      slots[at].append(el("span", "pop", pic(story, step)));
      at++;
      if (at < n) return;
      locked = true;
      onDone();
    });
    pile.append(b);
    return { b, step };
  });
  host.append(box, pile);
  return { next: () => cards.find((c) => c.step === at)?.b };
}

// ---------- Sehen: two pictures of a story. What was first?

export function sehen(host, t, ctx) {
  const F = ctx.T.folge;
  const S = F.sehen;
  const first = Math.min(...t.shown);
  const scene = el("div", "scene card fo-scene");
  const row = el("div", "fo-two");
  let locked = false;
  for (const step of t.shown) {
    const b = button("btn fo-card fo-big", "", pic(t.story, step));
    b.addEventListener("click", () => {
      if (locked) return;
      if (step !== first) {
        shake(b);
        b.disabled = true;
        ctx.miss(S.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(F.stories[t.story][first]);
    });
    row.append(b);
  }
  scene.append(row);
  host.append(scene);
  ctx.tell(S.ask);
  return {
    hint() {
      return `${S.hint} ${F.stories[t.story][first]}`;
    },
  };
}

// ---------- Machen: put the story in order.

export function machen(host, t, ctx) {
  const F = ctx.T.folge;
  const M = F.machen;
  const scene = el("div", "scene card fo-scene");
  host.append(scene);
  const { next } = orderBoard(scene, ctx, t.story, t.mixed, {
    missText: (at) => (at === 0 ? M.missFirst : M.miss),
    onDone: () => ctx.solved(F.ends[t.story]),
  });
  ctx.tell(M.ask);
  return {
    hint() {
      const b = next();
      if (b) shake(b);
      return M.hint;
    },
  };
}

// ---------- Forschen: what comes next? (Level 3 also: what was before?)

export function forschen(host, t, ctx) {
  const F = ctx.T.folge;
  const R = F.forschen;
  const scene = el("div", "scene card fo-scene");
  const now = el("div", "fo-now");
  const shown = el("span", "fo-card fo-big", pic(t.story, t.at));
  const gap = el("span", "fo-card fo-slot fo-gap", "?");
  if (t.back) now.append(gap, el("b", "fo-arrow", "→"), shown);
  else now.append(shown, el("b", "fo-arrow", "→"), gap);
  scene.append(now);
  const row = el("div", "fo-choices");
  let locked = false;
  t.choices.forEach((c, i) => {
    const b = button("btn fo-card fo-pick", "", pic(c.story, c.step));
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.answer) {
        shake(b);
        b.disabled = true;
        ctx.miss(c.story !== t.story ? R.missOther : t.back ? R.missAfter : R.missBefore);
        return;
      }
      locked = true;
      b.classList.add("right");
      gap.textContent = pic(c.story, c.step);
      gap.classList.add("filled");
      ctx.solved(F.stories[t.story][c.step]);
    });
    row.append(b);
  });
  host.append(scene, row);
  ctx.tell(`${F.stories[t.story][t.at]} ${t.back ? R.askBack : R.ask}`);
  return {
    hint() {
      return R.hint;
    },
  };
}

// ---------- Anwenden: animals in a row, the flag on the left. Who is first? Who is third?

export function anwenden(host, t, ctx) {
  const F = ctx.T.folge;
  const A = F.anwenden;
  const pets = ctx.T.lage.pets;
  const scene = el("div", "scene card fo-race");
  const row = el("div", "fo-queue");
  row.append(el("span", "fo-flag", "🏁"));
  const want = placeOf(t);
  let locked = false;
  const buttons = t.pets.map((pet, i) => {
    const b = button("fo-pet", pets[pet][0], ICONS[pet]);
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== want) {
        shake(b);
        ctx.miss(A.miss(pets[pet][0], A.places[i] ?? A.places[4]));
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(A.done(pets[pet][0], t.ask === 0 ? A.last : A.places[i]));
    });
    row.append(b);
    return b;
  });
  scene.append(row);
  host.append(scene);
  ctx.tell(t.ask === 0 ? A.askLast : A.ask(A.places[t.ask - 1]));
  return {
    hint() {
      buttons.forEach((b, i) => b.append(el("i", "fo-count pop", String(i + 1))));
      return A.hint;
    },
  };
}

// ---------- Prüfen: the owl laid the story. Is the order right? If not: lay it again.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const F = T.folge;
  const P = F.pruefen;
  const talk = el("div", "talk");
  talk.append(el("span", "owl", "🦉"), el("div", "bubble fo-bubble", P.says));
  const scene = el("div", "scene card fo-scene");
  const owlRow = el("div", "fo-slots");
  for (const step of t.shown) owlRow.append(el("span", "fo-card filled", pic(t.story, step)));
  scene.append(owlRow);
  let locked = false;
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(P.lookAgain));
    locked = true;
    ctx.solved(`${P.right} ${F.ends[t.story]}`);
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(P.isRight));
    locked = true;
    judge.hidden = true;
    owlRow.classList.add("wrong");
    const fix = el("div", "scene card fo-scene");
    host.append(fix);
    orderBoard(fix, ctx, t.story, t.shown, {
      missText: () => P.fixMiss,
      onDone: () => ctx.solved(`${P.fixed} ${F.ends[t.story]}`),
    });
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
