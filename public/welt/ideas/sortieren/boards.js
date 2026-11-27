// The five boards of the idea "Sortieren" (what belongs together: kind, colour, size).
// Same contract as every idea (see ideas/teile/boards.js): board(host, t, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "sortieren".

import { el, button, shake } from "../../frame/parts.js";
import { ITEMS, RULES, groupFor } from "./tasks.js";

const KIND_ICON = { animal: "🐾", fruit: "🍎", vehicle: "🚗", flower: "🌷" };
const COLOR = { red: "#ff5a36", yellow: "#ffc83a", green: "#57b86a", blue: "#3a8dde" };

/** The sign on a basket: a picture for a kind, a colour spot, a big or a small circle. */
function sign(group) {
  if (KIND_ICON[group]) return el("span", "so-sign", KIND_ICON[group]);
  if (COLOR[group]) {
    const s = el("span", "so-sign so-color");
    s.style.background = COLOR[group];
    return s;
  }
  return el("span", `so-sign so-size ${group}`);
}

function basket(ctx, rule, g, { label = true, onTap } = {}) {
  const group = RULES[rule].groups[g];
  const b = button("so-basket", label ? ctx.T.sortieren.groups[group] : "");
  const inside = el("span", "so-inside");
  b.append(inside, el("span", "so-weave"));
  if (label) b.append(sign(group));
  if (onTap) b.addEventListener("click", () => onTap(b));
  return { b, inside };
}

const icon = (thing) => ITEMS[thing].i;

// ---------- Sehen: one thing. Which basket?

export function sehen(host, t, ctx) {
  const S = ctx.T.sortieren;
  const scene = el("div", "scene card so-scene");
  const big = el("div", "so-thing pop", icon(t.thing));
  const row = el("div", "so-baskets");
  let locked = false;
  const baskets = RULES[t.rule].groups.map((group, g) => {
    const { b, inside } = basket(ctx, t.rule, g, {
      onTap: (bb) => {
        if (locked) return;
        if (g !== t.answer) {
          shake(bb);
          ctx.miss(S.sehen.miss(S.is[RULES[t.rule].groups[t.answer]], S.groups[group]));
          return;
        }
        locked = true;
        big.remove();
        inside.append(el("span", "pop", icon(t.thing)));
        bb.classList.add("right");
        ctx.solved(S.is[group]);
      },
    });
    row.append(b);
    return b;
  });
  scene.append(big, row);
  host.append(scene);
  ctx.tell(S.sehen.ask(S.rules[t.rule]));
  return {
    hint() {
      shake(baskets[t.answer]);
      return S.hints[RULES[t.rule].attr];
    },
  };
}

// ---------- Machen: six things, one after the other into the baskets.

export function machen(host, t, ctx) {
  const S = ctx.T.sortieren;
  const scene = el("div", "scene card so-scene");
  const queue = el("div", "so-queue");
  const items = t.things.map((x) => {
    const s = el("span", "so-small", icon(x));
    queue.append(s);
    return s;
  });
  const row = el("div", "so-baskets");
  let at = 0;
  let locked = false;
  const mark = () => items.forEach((s, i) => s.classList.toggle("now", i === at));
  const baskets = RULES[t.rule].groups.map((group, g) => {
    const { b, inside } = basket(ctx, t.rule, g, {
      onTap: (bb) => {
        if (locked) return;
        if (g !== t.answers[at]) {
          shake(bb);
          ctx.miss(S.machen.miss(S.is[RULES[t.rule].groups[t.answers[at]]]));
          return;
        }
        ctx.tap();
        items[at].classList.add("gone");
        inside.append(el("span", "pop", icon(t.things[at])));
        at++;
        if (at < t.things.length) return void mark();
        locked = true;
        ctx.solved(S.machen.done);
      },
    });
    row.append(b);
    return b;
  });
  mark();
  scene.append(queue, row);
  host.append(scene);
  ctx.tell(S.machen.ask(S.rules[t.rule]));
  return {
    hint() {
      if (at < t.answers.length) shake(baskets[t.answers[at]]);
      return S.hints[RULES[t.rule].attr];
    },
  };
}

// ---------- Forschen: four things. Which one does not fit?

export function forschen(host, t, ctx) {
  const S = ctx.T.sortieren;
  const scene = el("div", "scene card so-scene");
  const row = el("div", "so-four");
  let locked = false;
  const others = RULES[t.rule].groups[groupFor(t.rule, t.things[(t.odd + 1) % 4])];
  const odd = RULES[t.rule].groups[groupFor(t.rule, t.things[t.odd])];
  t.things.forEach((x, i) => {
    const b = button("btn so-pick", "", icon(x));
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.odd) {
        shake(b);
        b.disabled = true;
        ctx.miss(S.forschen.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(S.forschen.done(S.are[others], S.is[odd]));
    });
    row.append(b);
  });
  scene.append(row);
  host.append(scene);
  ctx.tell(S.forschen.ask);
  return {
    hint() {
      return S.hints[RULES[t.rule].attr];
    },
  };
}

// ---------- Anwenden: the baskets have no sign. Where does the new thing go?

export function anwenden(host, t, ctx) {
  const S = ctx.T.sortieren;
  const scene = el("div", "scene card so-scene");
  const big = el("div", "so-thing pop", icon(t.thing));
  const row = el("div", "so-baskets");
  let locked = false;
  t.baskets.forEach((things, g) => {
    const { b, inside } = basket(ctx, t.rule, g, {
      label: false,
      onTap: (bb) => {
        if (locked) return;
        if (g !== t.answer) {
          shake(bb);
          ctx.miss(S.anwenden.miss);
          return;
        }
        locked = true;
        big.remove();
        inside.append(el("span", "pop", icon(t.thing)));
        bb.classList.add("right");
        ctx.solved(S.anwenden.done(S.are[RULES[t.rule].groups[g]]));
      },
    });
    for (const x of things) inside.append(el("span", "", icon(x)));
    row.append(b);
  });
  scene.append(big, row);
  host.append(scene);
  ctx.tell(S.anwenden.ask);
  return {
    hint() {
      return S.anwenden.hint;
    },
  };
}

// ---------- Prüfen: the owl sorted. Is everything right? If not: tap the thing in the wrong basket.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const S = T.sortieren;
  const P = S.pruefen;
  const talk = el("div", "talk");
  talk.append(el("span", "owl", "🦉"), el("div", "bubble so-bubble", P.says));
  const scene = el("div", "scene card so-scene");
  const row = el("div", "so-baskets");
  let locked = false;
  let fixing = false;
  t.baskets.forEach((things, g) => {
    const { b, inside } = basket(ctx, t.rule, g);
    b.tabIndex = -1;
    b.classList.add("still");
    things.forEach((x, i) => {
      const s = button("so-in", "", icon(x));
      s.addEventListener("click", () => {
        if (locked || !fixing) return;
        const wrong = t.wrong && t.wrong[0] === g && t.wrong[1] === i;
        if (!wrong) return void (shake(s), ctx.miss(P.fixMiss));
        locked = true;
        s.classList.add("right");
        ctx.solved(P.fixed(S.is[RULES[t.rule].groups[1 - g]]));
      });
      inside.append(s);
    });
    row.append(b);
  });
  scene.append(row);
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  yes.addEventListener("click", () => {
    if (locked) return;
    if (t.wrong) return void (shake(yes), ctx.miss(P.lookAgain));
    locked = true;
    ctx.solved(P.right);
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (!t.wrong) return void (shake(no), ctx.miss(P.isRight));
    judge.hidden = true;
    fixing = true;
    scene.classList.add("fixing");
    ctx.tap();
    ctx.tell(P.fix);
  });
  host.append(talk, scene, judge);
  ctx.tell(P.question(S.rules[t.rule]));
  return {
    hint() {
      return S.hints[RULES[t.rule].attr];
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
