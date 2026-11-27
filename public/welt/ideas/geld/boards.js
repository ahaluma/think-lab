// The five boards of the idea "Geld" (money): one per perspective.
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "geld". Coins and notes are drawn with CSS (.coin, .note).

import { el, button, shake } from "../../frame/parts.js";
import { numpad } from "../../../shared/numpad.js";
import { MONEY, fewest } from "./tasks.js";

let current = null;
function pad(box, ctx, digits, onCheck) {
  current?.remove();
  current = numpad(box, ctx.T, { digits, onCheck });
  return current;
}

const ICON = { bread: "🍞", cheese: "🧀", honey: "🍯", melon: "🍉", pumpkin: "🎃", cake: "🎂", ball: "⚽", book: "📖" };
const sum = (list) => list.reduce((a, b) => a + b, 0);
const euro = (ctx, n) => `${ctx.num(n)} €`;

/** One coin or note. */
function piece(ctx, v, tag = "span", label = "") {
  const p = tag === "button" ? button(`money ${v >= 5 ? "note" : "coin"} v${v}`, label, "") : el("span", `money ${v >= 5 ? "note" : "coin"} v${v}`);
  p.append(el("b", "", `${ctx.num(v)} €`));
  return p;
}

function counter(ctx, money) {
  const box = el("div", "counter");
  for (const v of money) box.append(piece(ctx, v));
  return box;
}

/** A price tag on a thing. */
function tag(ctx, thing, price) {
  const t = el("div", "price-tag");
  t.append(el("span", "price-thing", ICON[thing] ?? "🛍️"), el("b", "", euro(ctx, price)));
  return t;
}

// ---------- Sehen: how much money lies on the counter?

export function sehen(host, t, ctx) {
  const G = ctx.T.geld.sehen;
  const scene = el("div", "scene card money-scene");
  scene.append(counter(ctx, t.money));
  const hintBox = el("div", "hint-box");
  const padBox = el("div");
  let locked = false;
  const p = pad(padBox, ctx, t.range === 100 ? 3 : 2, (n) => {
    if (locked) return false;
    if (n !== t.answer) {
      p.clear();
      ctx.miss(n === t.money.length ? G.pieces : G.miss);
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    ctx.solved(G.done(euro(ctx, n)));
    return true;
  });
  host.append(scene, hintBox, padBox);
  ctx.tell(G.ask);
  return {
    hint() {
      if (!hintBox.firstChild) {
        // Count on from the biggest: 10, 15, 17, 18.
        const row = el("div", "count-row pop");
        let run = 0;
        for (const v of t.money) {
          run += v;
          row.append(el("span", "chip", ctx.num(run)));
        }
        row.lastChild.textContent = "?";
        hintBox.append(row);
      }
      return G.hint;
    },
  };
}

/** The wallet: one button per coin and note of the range. Tap: it goes on the counter. */
function wallet(ctx, R, onAdd) {
  const box = el("div", "wallet");
  for (const v of MONEY[R]) {
    const b = piece(ctx, v, "button", euro(ctx, v));
    b.addEventListener("click", () => onAdd(v));
    box.append(b);
  }
  return box;
}

/** Money laid on the counter by the child: a tap on a piece takes it back. */
function laid(ctx, list, onTake) {
  const box = el("div", "counter laid");
  list.forEach((v, i) => {
    const b = piece(ctx, v, "button", euro(ctx, v));
    b.addEventListener("click", () => onTake(i));
    box.append(b);
  });
  if (!list.length) box.append(el("span", "unknown", "?"));
  return box;
}

// ---------- Machen: pay exactly.

export function machen(host, t, ctx) {
  const G = ctx.T.geld.machen;
  const on = [];
  let locked = false;
  const scene = el("div", "scene card money-scene");
  const top = el("div", "shop-row");
  top.append(tag(ctx, "basket", t.price));
  const sumBox = el("b", "money-sum");
  const table = el("div");
  scene.append(top, table, sumBox);
  const check = button("btn ok check-btn", G.check, "✓");
  const showSum = el("div", "hint-box");
  let helped = false;
  function draw() {
    table.replaceChildren(laid(ctx, on, (i) => {
      if (locked) return;
      on.splice(i, 1);
      ctx.tap();
      draw();
    }));
    sumBox.textContent = helped ? `= ${euro(ctx, sum(on))}` : "";
    check.disabled = !on.length;
  }
  const w = wallet(ctx, t.range, (v) => {
    if (locked) return;
    if (on.length >= 20) return;
    on.push(v);
    on.sort((a, b) => b - a);
    ctx.tap();
    draw();
  });
  check.addEventListener("click", () => {
    if (locked) return;
    const s = sum(on);
    if (s !== t.price) {
      shake(check);
      ctx.miss(s > t.price ? G.tooMuch(euro(ctx, s), euro(ctx, t.price)) : G.tooLittle(euro(ctx, s), euro(ctx, t.price)));
      return;
    }
    locked = true;
    ctx.solved(on.length === fewest(t.price, t.range).length ? G.doneFew(euro(ctx, t.price)) : G.done(euro(ctx, t.price)));
  });
  host.append(scene, w, check, showSum);
  draw();
  ctx.tell(G.question(euro(ctx, t.price)));
  return {
    hint() {
      helped = true;
      draw();
      return G.hint;
    },
  };
}

// ---------- Forschen: the same price, paid in two different ways.

export function forschen(host, t, ctx) {
  const G = ctx.T.geld.forschen;
  const on = [];
  const found = [];
  let locked = false;
  const scene = el("div", "scene card money-scene");
  const top = el("div", "shop-row");
  top.append(tag(ctx, "basket", t.price));
  const table = el("div");
  const ways = el("div", "ways money-ways");
  scene.append(top, table);
  const check = button("btn ok check-btn", G.check, "✓");
  function draw() {
    table.replaceChildren(laid(ctx, on, (i) => {
      if (locked) return;
      on.splice(i, 1);
      ctx.tap();
      draw();
    }));
    check.disabled = !on.length;
  }
  const w = wallet(ctx, t.range, (v) => {
    if (locked || on.length >= 20) return;
    on.push(v);
    on.sort((a, b) => b - a);
    ctx.tap();
    draw();
  });
  check.addEventListener("click", () => {
    if (locked) return;
    const s = sum(on);
    if (s !== t.price) {
      shake(check);
      ctx.miss(s > t.price ? G.tooMuch : G.tooLittle);
      return;
    }
    const key = on.join("+");
    if (found.includes(key)) {
      shake(check);
      ctx.miss(G.same);
      return;
    }
    found.push(key);
    const chip = el("span", "chip pop", on.map((v) => ctx.num(v)).join(" + ") + ` = ${euro(ctx, s)}`);
    ways.append(chip);
    if (found.length >= t.ways) {
      locked = true;
      ctx.solved(G.done(euro(ctx, t.price)));
      return;
    }
    on.length = 0;
    draw();
    ctx.tell(G.again);
  });
  host.append(scene, ways, w, check);
  draw();
  ctx.tell(G.question(euro(ctx, t.price)));
  return {
    hint() {
      return found.length ? G.hintAgain : G.hint;
    },
  };
}

// ---------- Anwenden: shopping. Together? Change? Is it enough?

export function anwenden(host, t, ctx) {
  const G = ctx.T.geld.anwenden;
  let locked = false;
  const scene = el("div", "scene card money-scene");
  const hintBox = el("div", "hint-box");
  if (t.kind === "enough") {
    const top = el("div", "shop-row");
    top.append(tag(ctx, t.thing, t.price));
    scene.append(top, counter(ctx, t.money));
    const row = el("div", "name-row");
    for (const [ans, label] of [[true, G.yes], [false, G.no]]) {
      const b = button("btn name-btn", label, label);
      b.addEventListener("click", () => {
        if (locked) return;
        if (ans !== t.answer) return void (shake(b), (b.disabled = true), ctx.miss(G.enoughMiss));
        locked = true;
        b.classList.add("right");
        const have = euro(ctx, sum(t.money));
        ctx.solved(t.answer ? G.enoughYes(have, euro(ctx, t.price)) : G.enoughNo(have, euro(ctx, t.price)));
      });
      row.append(b);
    }
    host.append(scene, row, hintBox);
    ctx.tell(G.enoughAsk(G.things[t.thing]));
    return {
      hint() {
        if (!hintBox.firstChild) hintBox.append(el("p", "hint-text pop", G.enoughHint));
        return G.enoughHint;
      },
    };
  }
  const top = el("div", "shop-row");
  if (t.kind === "total") for (const i of t.items) top.append(tag(ctx, i.thing, i.price));
  else {
    top.append(tag(ctx, t.thing, t.price));
    const paid = el("div", "paid");
    paid.append(el("span", "", G.paidWith), piece(ctx, t.paid));
    top.append(paid);
  }
  scene.append(top);
  const padBox = el("div");
  const p = pad(padBox, ctx, t.range === 100 ? 3 : 2, (n) => {
    if (locked) return false;
    if (n !== t.answer) {
      p.clear();
      ctx.miss(t.kind === "total" ? G.totalMiss : n === t.paid + t.price ? G.changePlus : G.changeMiss);
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    ctx.solved(t.kind === "total" ? G.totalDone(euro(ctx, n)) : G.changeDone(euro(ctx, n)));
    return true;
  });
  host.append(scene, hintBox, padBox);
  ctx.tell(t.kind === "total" ? G.totalAsk(G.things[t.items[0].thing], G.things[t.items[1].thing]) : G.changeAsk(G.things[t.thing], euro(ctx, t.price), euro(ctx, t.paid)));
  return {
    hint() {
      if (!hintBox.firstChild) {
        if (t.kind === "change") {
          // Count up from the price to the note, like at the till.
          const row = el("div", "count-row pop");
          row.append(el("span", "chip", euro(ctx, t.price)));
          const next10 = Math.min(t.paid, Math.ceil((t.price + 1) / 10) * 10);
          if (next10 > t.price && next10 < t.paid) row.append(el("span", "chip", `+${ctx.num(next10 - t.price)} → ${euro(ctx, next10)}`));
          row.append(el("span", "chip", `… → ${euro(ctx, t.paid)}`));
          hintBox.append(row);
        }
      }
      return t.kind === "total" ? G.totalHint : G.changeHint;
    },
  };
}

// ---------- Prüfen: the owl counted the money.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const G = T.geld.pruefen;
  let locked = false;
  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const said = el("b", "said", euro(ctx, t.said));
  const bubble = el("div", "bubble");
  bubble.append(said);
  talk.append(el("span", "owl", "🦉"), bubble);
  scene.append(talk, counter(ctx, t.money));
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  const padBox = el("div");
  padBox.hidden = true;
  const total = sum(t.money);
  let p = null;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(G.lookAgain));
    locked = true;
    said.classList.add("right");
    ctx.solved(G.right(euro(ctx, total)));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(G.lookAgain));
    judge.hidden = true;
    padBox.hidden = false;
    said.classList.add("wrong");
    p = pad(padBox, ctx, t.range === 100 ? 3 : 2, (n) => {
      if (locked) return false;
      if (n !== total) {
        p.clear();
        ctx.miss(G.fixMiss);
        return false;
      }
      locked = true;
      p.show(n);
      p.lock(true);
      said.textContent = euro(ctx, n);
      said.classList.remove("wrong");
      said.classList.add("right");
      ctx.solved(G.fixed(euro(ctx, n)));
      return true;
    });
    ctx.tap();
    ctx.tell(t.kind === "pieces" ? G.fixPieces : G.fix);
  });
  host.append(scene, judge, padBox);
  ctx.tell(G.question(euro(ctx, t.said)));
  return {
    hint() {
      return t.kind === "pieces" ? G.hintPieces : G.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
