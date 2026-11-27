// The five boards of the idea "Größe" (longer, higher, more water, heavier, in order of size).
// Same contract as every idea (see ideas/teile/boards.js): board(host, t, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "groesse".

import { el, button, shake } from "../../frame/parts.js";

const COLORS = ["#ff5a36", "#3a8dde", "#57b86a", "#e8488a", "#ffc83a"];
const ITEM_ICONS = { bett: "🛏️", stuhl: "🪑", schuessel: "🥣", pulli: "👕", schuh: "👟" };
const SCALE = [0.6, 0.9, 1.25];

/** One thing to compare: a snake (lang), a tower (hoch) or a glass of water (wasser). */
function thing(kind, size, offset, i, label) {
  const b = button(`gr-thing gr-${kind}`, label);
  b.style.setProperty("--size", `${size}%`);
  b.style.setProperty("--off", `${offset}%`);
  b.style.setProperty("--color", COLORS[i % COLORS.length]);
  b.append(el("span", "gr-body"));
  return b;
}

function row(kind, sizes, offsets, label, onTap) {
  const box = el("div", `scene card gr-scene gr-row-${kind}`);
  const buttons = sizes.map((s, i) => {
    const b = thing(kind, s, offsets?.[i] ?? 0, i, label);
    b.addEventListener("click", () => onTap(i, b));
    box.append(b);
    return b;
  });
  return { box, buttons };
}

// ---------- Sehen: which snake is longer? Which glass has the least water?

export function sehen(host, t, ctx) {
  const G = ctx.T.groesse;
  const S = G.sehen;
  const many = t.sizes.length > 2;
  const words = G.kinds[t.kind];
  let locked = false;
  const { box, buttons } = row(t.kind, t.sizes, t.offsets, words.one, (i, b) => {
    if (locked) return;
    if (i !== t.answer) {
      shake(b);
      b.disabled = true;
      ctx.miss(words.miss[t.ask]);
      return;
    }
    locked = true;
    b.classList.add("right");
    ctx.solved(words.done[t.ask][many ? "many" : "two"]);
  });
  host.append(box);
  ctx.tell(words.ask[t.ask][many ? "many" : "two"]);
  return {
    hint() {
      if (t.kind === "lang") box.classList.add("aligned"); // they slide to one line
      buttons.forEach((b) => b.classList.add("measured"));
      return t.kind === "lang" ? S.hintLine : S.hint;
    },
  };
}

// ---------- Machen: from the smallest to the biggest. Tap them in order.

export function machen(host, t, ctx) {
  const G = ctx.T.groesse;
  const M = G.machen;
  const words = G.kinds[t.kind];
  const sorted = el("div", `scene card gr-scene gr-row-${t.kind} gr-sorted`);
  let at = 0;
  let locked = false;
  const { box, buttons } = row(t.kind, t.sizes, null, words.one, (i, b) => {
    if (locked || b.classList.contains("used")) return;
    if (i !== t.order[at]) {
      shake(b);
      ctx.miss(at === 0 ? M.missFirst(words.smallest) : M.miss(words.smallest));
      return;
    }
    ctx.tap();
    b.classList.add("used");
    const copy = thing(t.kind, t.sizes[i], 0, i, words.one);
    copy.tabIndex = -1;
    copy.classList.add("pop");
    sorted.append(copy);
    at++;
    if (at < t.order.length) return;
    locked = true;
    ctx.solved(M.done);
  });
  box.classList.add("gr-pile");
  host.append(box, sorted);
  ctx.tell(M.ask(words.smallest));
  return {
    hint() {
      buttons.forEach((b, i) => b.classList.toggle("measured", !b.classList.contains("used") && i === t.order[at]));
      return M.hint(words.smallest);
    },
  };
}

// ---------- Forschen: the balance. Which one is heavier? Think first, then the balance shows it.

export function forschen(host, t, ctx) {
  const F = ctx.T.groesse.forschen;
  const scene = el("div", "scene card gr-balance");
  const beam = el("div", "gr-beam");
  const things = [0, 1].map((i) => {
    const heavyOne = i === t.heavy;
    const icon = heavyOne ? t.pair[0] : t.pair[1];
    const size = t.tricky ? (heavyOne ? 0.6 : 1.4) : 1;
    const b = button("gr-on-pan", "", icon);
    b.style.setProperty("--k", size);
    const pan = el("div", `gr-pan ${i ? "r" : "l"}`);
    pan.append(b);
    beam.append(pan);
    return b;
  });
  scene.append(beam, el("div", "gr-stand"));
  let locked = false;
  const tip = () => beam.classList.add(t.heavy === 0 ? "tip-l" : "tip-r");
  things.forEach((b, i) => {
    b.addEventListener("click", () => {
      if (locked) return;
      tip();
      if (i !== t.heavy) {
        shake(b);
        ctx.miss(t.tricky ? F.missTricky : F.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(t.tricky ? F.doneTricky : F.done);
    });
  });
  host.append(scene);
  ctx.tell(F.ask);
  return {
    hint() {
      return F.hint;
    },
  };
}

// ---------- Anwenden: the small bear needs a bed. Which one fits?

export function anwenden(host, t, ctx) {
  const A = ctx.T.groesse.anwenden;
  const scene = el("div", "scene card gr-bears");
  const bear = el("span", "gr-bear pop", "🐻");
  bear.style.setProperty("--k", SCALE[t.bear]);
  scene.append(bear);
  const items = el("div", "gr-items");
  let locked = false;
  t.sizes.forEach((size, i) => {
    const b = button("btn gr-item", "", ITEM_ICONS[t.item]);
    b.style.setProperty("--k", SCALE[size]);
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.answer) {
        shake(b);
        b.disabled = true;
        ctx.miss(size > t.bear ? A.tooBig : A.tooSmall);
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(A.done(t.bear));
    });
    items.append(b);
  });
  host.append(scene, items);
  ctx.tell(A.ask(A.bears[t.bear], A.items[t.item]));
  return {
    hint() {
      return A.hint;
    },
  };
}

// ---------- Prüfen: the owl points at one snake: "This one is the longest." Is it right?

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const G = T.groesse;
  const P = G.pruefen;
  const talk = el("div", "talk");
  talk.append(el("span", "owl", "🦉"), el("div", "bubble gr-bubble", P.says));
  let locked = false;
  let fixing = false;
  const { box, buttons } = row("lang", t.sizes, t.offsets, G.kinds.lang.one, (i, b) => {
    if (locked || !fixing) return;
    if (i !== t.answer) return void (shake(b), (b.disabled = true), ctx.miss(P.fixMiss));
    locked = true;
    b.classList.add("right");
    box.classList.add("aligned");
    ctx.solved(P.fixed);
  });
  buttons[t.said].classList.add("owl-pick");
  buttons.forEach((b) => (b.tabIndex = -1));
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(t.level === 3 ? P.lookStart : P.lookAgain));
    locked = true;
    ctx.solved(P.right);
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(P.isRight));
    judge.hidden = true;
    fixing = true;
    buttons.forEach((b) => (b.tabIndex = 0));
    ctx.tap();
    ctx.tell(P.fix);
  });
  host.append(talk, box, judge);
  ctx.tell(P.question);
  return {
    hint() {
      box.classList.add("aligned");
      return P.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
