// The five boards of the idea "Stellen" (tens and ones): one per perspective.
// A board draws one task (plain data from tasks.js) into `host` and takes the child's answer.
// It never counts or saves anything: it tells the round (welt/spiel/spiel.js) through ctx (see
// ideas/teile/boards.js for what ctx holds).
//
// The picture is the same everywhere, so the child learns one picture of a number: single flowers
// (ones, in rows of five), bunches of ten flowers tied with a ribbon (tens) and baskets of ten
// bunches (hundreds). Answers are typed on the number pad (shared/numpad.js).

import { el, button, shake, wait } from "../../frame/parts.js";
import { numpad } from "../../../shared/numpad.js";
import { DIGITS, NUMBERS, digits } from "./tasks.js";

/** Only one pad listens to the keyboard: a new board removes the pad of the board before. */
let current = null;
function pad(box, ctx, range, onCheck, display) {
  current?.remove();
  current = numpad(box, ctx.T, { digits: DIGITS[range] ?? 3, onCheck, display });
  return current;
}

/** The picture of a number: baskets, bunches, flowers. scatter: the flowers come first. */
export function bundles(h, z, e, { small = false, scatter = false } = {}) {
  const box = el("div", "bundles" + (small ? " small" : ""));
  const groups = [];
  if (h) {
    const g = el("div", "b-group hundreds");
    for (let i = 0; i < h; i++) g.append(el("span", "hundred pop"));
    groups.push(g);
  }
  if (z) {
    const g = el("div", "b-group tens");
    for (let i = 0; i < z; i++) g.append(el("span", "bunch pop"));
    groups.push(g);
  }
  if (e) {
    const g = el("div", "b-group ones");
    for (let i = 0; i < e; i++) g.append(el("span", "flower pop"));
    groups.push(g);
  }
  if (scatter) groups.reverse();
  box.append(...groups);
  return box;
}

const pictureOf = (n, range, scatter = false) => {
  const { h, z, e } = digits(n);
  return bundles(h, z, e, { small: range === 1000, scatter });
};

/** The place-value table: H | Z | E (hundreds only up to 1000). cells: { h, z, e } as text or "?". */
function table(ctx, range, cells, over = false) {
  const { T } = ctx;
  const S = T.stellen;
  const cols = range === 1000 ? ["h", "z", "e"] : ["z", "e"];
  const t = el("div", "pv-table");
  for (const c of cols) {
    const col = el("div", "pv-col");
    col.append(el("span", "pv-head", S.short[c]));
    const v = cells[c];
    const cell = el("b", "pv-cell" + (v === "?" ? " gap" : "") + (over && c === "e" ? " over" : ""), v === "?" ? "?" : v === "" || v === undefined ? "" : ctx.num(v));
    cell.dataset.c = c;
    col.append(cell);
    t.append(col);
  }
  return t;
}

/** What kind of wrong answer a typed number is, so the sentence can say what happened. */
function why(n, given) {
  const { h, z, e } = digits(n);
  if (z > 0 && given === 100 * h + 10 * e + z && e !== z) return "swap";
  if (given === h + z + e || given === 100 * h + z + e) return "counted";
  if (Math.abs(given - n) === 10 || Math.abs(given - n) === 100) return "ten";
  return "other";
}

function missText(ctx, n, given) {
  const S = ctx.T.stellen;
  const { z } = digits(n);
  const kind = why(n, given);
  if (kind === "swap") return S.miss.swap(ctx.num(z), ctx.num(z * 10));
  if (kind === "counted") return S.miss.counted;
  if (kind === "ten") return S.miss.ten;
  return S.miss.other;
}

/** Under the picture: "3 Sträuße: 30 · 4 Blumen: 4" – the hint that shows the structure. */
function labels(ctx, n) {
  const S = ctx.T.stellen;
  const { h, z, e } = digits(n);
  const row = el("div", "b-labels pop");
  if (h) row.append(el("span", "chip", S.label.h(ctx.num(h), ctx.num(h * 100))));
  if (z) row.append(el("span", "chip", S.label.z(ctx.num(z), ctx.num(z * 10))));
  if (e) row.append(el("span", "chip", S.label.e(ctx.num(e))));
  return row;
}

// ---------- Sehen: bunches and flowers. How many flowers are they?

export function sehen(host, t, ctx) {
  const range = rangeFrom(t.n);
  const S = ctx.T.stellen;
  const scene = el("div", "scene card stellen-scene");
  scene.append(pictureOf(t.n, range, t.scatter));
  const hintBox = el("div", "hint-box");
  const padBox = el("div");
  let locked = false;
  const p = pad(padBox, ctx, range, (n) => {
    if (locked) return false;
    if (n !== t.n) {
      p.clear();
      ctx.miss(missText(ctx, t.n, n));
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    hintBox.innerHTML = "";
    hintBox.append(labels(ctx, t.n));
    ctx.solved(S.sehen.done(ctx.word(t.n), S.parts(digits(t.n), ctx.num)));
    return true;
  });
  host.append(scene, hintBox, padBox);
  ctx.tell(S.sehen.ask);
  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(labels(ctx, t.n));
      return S.sehen.hint;
    },
  };
}

/** The range of a number, for boards that get only the number (the surprise task knows its range). */
function rangeFrom(n) {
  return n > 100 ? 1000 : n > 50 ? 100 : n > 20 ? 50 : 20;
}

// ---------- Machen: make the number out of bunches and single flowers.

export function machen(host, t, ctx) {
  const S = ctx.T.stellen;
  const range = rangeFrom(t.n);
  const have = { h: 0, z: 0, e: 0 };
  let locked = false;

  const goal = el("div", "stellen-goal");
  goal.append(el("b", "", ctx.num(t.n)));
  const scene = el("div", "scene card stellen-scene make");
  const tools = el("div", "stellen-tools");
  const add = (c, icon, label) => {
    const b = button(`btn add-btn add-${c}`, label, "");
    b.append(el("span", `add-icon ${c}`), el("span", "", icon));
    b.addEventListener("click", () => {
      if (locked) return;
      if (have[c] >= 19) return void shake(b);
      have[c]++;
      ctx.tap();
      draw();
    });
    tools.append(b);
  };
  if (range === 1000) add("h", "+", S.machen.addH);
  add("z", "+", S.machen.addZ);
  add("e", "+", S.machen.addE);
  const check = button("btn ok check-btn", S.machen.check, "✓");

  function draw() {
    scene.innerHTML = "";
    const pic = bundles(have.h, have.z, have.e, { small: range === 1000 });
    // A tap on a basket, bunch or flower takes it away again.
    const kinds = { hundred: "h", bunch: "z", flower: "e" };
    for (const item of pic.querySelectorAll(".hundred, .bunch, .flower")) {
      item.classList.remove("pop");
      item.addEventListener("click", () => {
        if (locked) return;
        have[kinds[item.classList[0]]]--;
        ctx.tap();
        draw();
      });
    }
    if (!have.h && !have.z && !have.e) scene.append(el("span", "unknown", "?"));
    scene.append(pic);
    check.disabled = !have.h && !have.z && !have.e;
  }

  check.addEventListener("click", async () => {
    if (locked) return;
    const value = 100 * have.h + 10 * have.z + have.e;
    if (value !== t.n) {
      shake(check);
      ctx.miss(S.machen.miss(ctx.num(value), ctx.num(t.n)));
      return;
    }
    locked = true;
    // More than nine of one kind: ten flowers are tied into a bunch, ten bunches go into a basket.
    if (have.e > 9 || have.z > 9) {
      await ctx.tell(have.e > 9 ? S.machen.tie : S.machen.pack);
      const { h, z, e } = digits(t.n);
      Object.assign(have, { h, z, e });
      draw();
      await wait(600);
    }
    ctx.solved(S.machen.done(ctx.word(t.n), S.parts(digits(t.n), ctx.num)));
  });

  host.append(goal, scene, tools, check);
  draw();
  ctx.tell(S.machen.question(ctx.word(t.n)));

  return {
    hint() {
      if (!host.querySelector(".pv-table")) goal.append(table(ctx, range, digits(t.n)));
      return S.machen.hint;
    },
  };
}

// ---------- Forschen: one more flower, one more bunch. Try it, then say what comes out first.

const NEED = 2; // right predictions to finish the task

export function forschen(host, t, ctx) {
  const S = ctx.T.stellen;
  const range = t.range;
  const [lo, hi] = NUMBERS[range];
  const min = range === 20 ? 1 : lo;
  let now = t.start;
  let mode = "try";
  let at = 0;
  let right = 0;
  let tried = 0;
  let locked = false;

  const scene = el("div", "scene card stellen-scene explore");
  const big = el("b", "stellen-number");
  const pic = el("div", "explore-pic");
  scene.append(big, pic);
  const log = el("div", "ways");
  const tools = el("div", "stellen-tools");
  const know = button("btn sun know-btn", S.forschen.know, "💡");
  know.hidden = true;
  const padBox = el("div");
  padBox.hidden = true;
  const sign = (op) => `${op > 0 ? "+" : "−"} ${ctx.num(Math.abs(op))}`;

  function show(n) {
    big.textContent = n === null ? "?" : ctx.num(n);
    pic.innerHTML = "";
    if (n !== null) pic.append(pictureOf(n, range));
  }

  for (const op of t.ops) {
    const b = button(`btn op-btn ${Math.abs(op) === 1 ? "e" : Math.abs(op) === 10 ? "z" : "h"}`, S.forschen.opName(op), sign(op));
    b.addEventListener("click", () => {
      if (locked || mode !== "try") return;
      const next = now + op;
      if (next < min || next > hi) return void (shake(b), ctx.tell(S.forschen.edge));
      ctx.tap();
      log.append(el("span", "chip pop", `${ctx.num(now)} ${sign(op)} ➜ ${ctx.num(next)}`));
      while (log.children.length > 4) log.firstChild.remove();
      now = next;
      tried++;
      show(now);
      if (tried >= 3) know.hidden = false;
      ctx.tell(tried === 1 ? S.forschen.more : tried === 3 ? S.forschen.ready : S.forschen.opName(op));
    });
    tools.append(b);
  }

  function ask() {
    const a = t.asks[at];
    show(a.from);
    big.textContent = `${ctx.num(a.from)} ${sign(a.op)}`;
    p.clear();
    p.lock(false);
    ctx.tell(S.forschen.predict(ctx.word(a.from), a.op));
  }

  const p = pad(padBox, ctx, range, async (n) => {
    if (locked || mode !== "predict") return false;
    const a = t.asks[at];
    locked = true;
    p.lock(true);
    show(a.answer);
    big.textContent = `${ctx.num(a.from)} ${sign(a.op)} = ${ctx.num(a.answer)}`;
    at++;
    if (n === a.answer) {
      right++;
      p.show(n);
      if (right >= NEED || at >= t.asks.length) {
        ctx.solved(S.forschen.done);
        return true;
      }
      await ctx.tell(S.forschen.yes(ctx.word(a.from), ctx.word(a.answer)));
    } else {
      await ctx.miss(S.forschen.predictMiss(ctx.word(a.from), ctx.word(a.answer), a.op));
      if (at >= t.asks.length) {
        ctx.solved(S.forschen.done);
        return false;
      }
    }
    await wait(500);
    if (!host.isConnected) return true;
    locked = false;
    ask();
    return n === a.answer;
  });

  know.addEventListener("click", () => {
    if (locked || mode !== "try") return;
    mode = "predict";
    know.hidden = true;
    tools.hidden = true;
    padBox.hidden = false;
    ctx.tap();
    ask();
  });

  host.append(scene, log, tools, know, padBox);
  show(now);
  ctx.tell(S.forschen.question);

  return {
    hint() {
      if (mode === "try") return S.forschen.hintTry;
      const a = t.asks[at];
      if (a) pic.querySelector(Math.abs(a.op) === 1 ? ".ones" : Math.abs(a.op) === 10 ? ".tens" : ".hundreds")?.classList.add("glow");
      return S.forschen.hint(a?.op ?? 1);
    },
  };
}

// ---------- Anwenden: just the numbers, in the place-value table.

export function anwenden(host, t, ctx) {
  const S = ctx.T.stellen;
  const range = t.range;
  const box = el("div", "scene card stellen-use");
  const hintBox = el("div", "hint-box");
  let question;
  if (t.kind === "split") {
    box.append(el("b", "stellen-number", ctx.num(t.n)), table(ctx, range, { h: "", z: "", e: "", [t.ask]: "?" }));
    question = S.anwenden.split(ctx.num(t.n), t.ask);
  } else if (t.kind === "swap") {
    // The ones are said first: no table, so the order is the child's own work.
    const words = el("div", "pv-words");
    words.append(el("span", "chip", S.label.e(ctx.num(t.e))), el("span", "chip", S.label.z(ctx.num(t.z), "")));
    if (t.h) words.append(el("span", "chip", S.label.h(ctx.num(t.h), "")));
    box.append(words);
    question = S.anwenden.swap(ctx.num(t.h), ctx.num(t.z), ctx.num(t.e), t.h > 0);
  } else {
    const cells = range === 1000 ? { h: t.h, z: t.z, e: t.e } : { z: t.z, e: t.e };
    box.append(table(ctx, range, cells, t.kind === "over"));
    question = S.anwenden.build(ctx.num(t.h), ctx.num(t.z), ctx.num(t.e), range === 1000);
  }
  const display = el("output", "numpad-display stellen-answer");
  box.append(display);
  const padBox = el("div");
  let locked = false;
  const p = pad(
    padBox,
    ctx,
    range,
    (n) => {
      if (locked) return false;
      if (n !== t.answer) {
        p.clear();
        ctx.miss(t.kind === "split" ? S.anwenden.missSplit(t.ask) : t.kind === "over" ? S.anwenden.missOver : missText(ctx, t.answer, n));
        return false;
      }
      locked = true;
      p.show(n);
      p.lock(true);
      const cell = box.querySelector(".pv-cell.gap");
      if (cell) {
        cell.textContent = ctx.num(n);
        cell.classList.add("found");
      }
      ctx.solved(t.kind === "split" ? S.anwenden.doneSplit(ctx.num(t.n), S.parts(digits(t.n), ctx.num)) : S.anwenden.done(ctx.word(t.answer), S.parts(digits(t.answer), ctx.num)));
      return true;
    },
    display,
  );
  host.append(box, hintBox, padBox);
  ctx.tell(question);
  return {
    hint() {
      if (!hintBox.firstChild) {
        if (t.kind === "split") hintBox.append(pictureOf(t.n, range));
        else hintBox.append(bundles(t.h, t.z, t.e, { small: range === 1000 }));
      }
      return t.kind === "over" ? S.anwenden.hintOver : S.anwenden.hint;
    },
  };
}

// ---------- Prüfen: the owl has counted. Is that right? If not: type the right number.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const S = T.stellen;
  const range = rangeFrom(t.n);
  let locked = false;
  const scene = el("div", "scene card owl-scene stellen-owl");
  const talk = el("div", "talk");
  const said = el("b", "said", ctx.num(t.said));
  const bubble = el("div", "bubble");
  bubble.append(said);
  talk.append(el("span", "owl", "🦉"), bubble);
  scene.append(talk, pictureOf(t.n, range));
  const hintBox = el("div", "hint-box");

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  const padBox = el("div");
  padBox.hidden = true;

  const p = pad(padBox, ctx, range, (n) => {
    if (locked) return false;
    said.textContent = ctx.num(n);
    if (n !== t.n) {
      p.clear();
      ctx.miss(missText(ctx, t.n, n));
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    said.classList.remove("wrong");
    said.classList.add("right");
    ctx.solved(S.pruefen.fixed(ctx.word(t.n), S.parts(digits(t.n), ctx.num)));
    return true;
  });

  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(S.pruefen.look));
    locked = true;
    said.classList.add("right");
    ctx.solved(S.pruefen.right(ctx.word(t.n), S.parts(digits(t.n), ctx.num)));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(S.pruefen.look));
    judge.hidden = true;
    padBox.hidden = false;
    said.classList.add("wrong");
    ctx.tap();
    ctx.tell(S.pruefen.fix);
  });

  host.append(scene, hintBox, judge, padBox);
  ctx.tell(S.pruefen.question(ctx.word(t.said)));
  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(labels(ctx, t.n));
      return S.pruefen.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
