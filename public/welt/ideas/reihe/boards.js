// The five boards of the idea "Reihe" (every number has its place in the row): one per perspective.
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "reihe".
//
// One picture everywhere: the track at the station is the number line. Short ticks, long ticks with
// their number, the train stops at a number. Smaller numbers are on the left, bigger on the right, so
// "smaller than" means "further left". Typed answers go on the number pad (shared/numpad.js).

import { el, button, shake } from "../../frame/parts.js";
import { numpad } from "../../../shared/numpad.js";
import { DIGITS, TRACK } from "./tasks.js";

/** Only one pad listens to the keyboard: a new board removes the pad of the board before. */
let current = null;
function pad(box, ctx, range, onCheck) {
  current?.remove();
  current = numpad(box, ctx.T, { digits: DIGITS[range] ?? 3, onCheck });
  return current;
}

/** The range of a number, for a surprise task without one. */
const rangeOf = (t) => t.range ?? (Math.max(t.n ?? 0, t.a ?? 0, t.b ?? 0, t.from ?? 0) > 100 ? 1000 : Math.max(t.n ?? 0, t.a ?? 0, t.b ?? 0, t.from ?? 0) > 20 ? 100 : 20);

/**
 * The track: a number line from 0 to R. labels: "ends" (only 0 and R, and the middle), "long" (every
 * long tick). Returns { box, at(value, icon, cls) → a mark on the track, label(v), labelAll(), valueAt(x) }.
 */
function track(ctx, R, labels = "ends") {
  const { tick, long } = TRACK[R];
  const box = el("div", "track");
  const line = el("div", "track-line");
  box.append(line);
  const shown = new Set();
  const label = (v) => {
    if (shown.has(v)) return;
    shown.add(v);
    const l = el("span", "track-label pop", ctx.num(v));
    l.style.left = `${(100 * v) / R}%`;
    line.append(l);
  };
  for (let v = 0; v <= R; v += tick) {
    const isLong = v % long === 0;
    const t = el("i", isLong ? "tick long" : "tick");
    t.style.left = `${(100 * v) / R}%`;
    line.append(t);
  }
  const labelAll = () => {
    for (let v = 0; v <= R; v += long) label(v);
  };
  if (labels === "long") labelAll();
  else [0, R / 2, R].forEach(label);
  return {
    box,
    label,
    labelAll,
    at(v, icon, cls = "") {
      const m = el("span", "track-mark " + cls, icon);
      m.style.left = `${(100 * v) / R}%`;
      line.append(m);
      return m;
    },
    move(m, v) {
      m.style.left = `${(100 * v) / R}%`;
    },
    valueAt(clientX) {
      const r = line.getBoundingClientRect();
      const v = ((clientX - r.left) / r.width) * R;
      return Math.max(0, Math.min(R, Math.round(v / tick) * tick));
    },
  };
}

// ---------- Sehen: where does the train stop?

export function sehen(host, t, ctx) {
  const R = rangeOf(t);
  const S = ctx.T.reihe.sehen;
  const scene = el("div", "scene card track-scene");
  const tr = track(ctx, R);
  tr.at(t.n, "🚂", "train");
  const stopMark = tr.at(t.n, "", "stop");
  stopMark.append(el("b", "", "?"));
  scene.append(tr.box);
  const padBox = el("div");
  let locked = false;
  let helped = false;
  const p = pad(padBox, ctx, R, (n) => {
    if (locked) return false;
    if (n !== t.n) {
      p.clear();
      ctx.miss(n < t.n ? S.missLeft(ctx.num(n)) : n > t.n ? S.missRight(ctx.num(n)) : S.miss);
      if (!helped) tr.label(n <= R ? Math.round(n / TRACK[R].long) * TRACK[R].long : R);
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    stopMark.querySelector("b").textContent = ctx.num(n);
    stopMark.classList.add("right");
    ctx.solved(S.done(ctx.word(t.n)));
    return true;
  });
  host.append(scene, padBox);
  ctx.tell(S.ask);
  return {
    hint() {
      helped = true;
      tr.labelAll();
      return S.hint(ctx.num(TRACK[R].long), ctx.num(TRACK[R].tick));
    },
  };
}

// ---------- Machen: the train must stop at n. Tap the place on the track, then ✓.

export function machen(host, t, ctx) {
  const R = rangeOf(t);
  const S = ctx.T.reihe.machen;
  const goal = el("div", "stellen-goal");
  goal.append(el("span", "", "🚉"), el("b", "", ctx.num(t.n)));
  const scene = el("div", "scene card track-scene tap-track");
  const tr = track(ctx, R);
  let at = 0;
  const train = tr.at(0, "🚂", "train");
  scene.append(tr.box);
  const check = button("btn ok check-btn", S.check, "✓");
  check.disabled = true;
  let locked = false;

  scene.addEventListener("click", (e) => {
    if (locked) return;
    at = tr.valueAt(e.clientX);
    tr.move(train, at);
    check.disabled = at === 0;
    ctx.tap();
  });

  check.addEventListener("click", () => {
    if (locked) return;
    if (at !== t.n) {
      shake(check);
      tr.label(Math.round(at / TRACK[R].long) * TRACK[R].long);
      ctx.miss((at < t.n ? S.tooSmall : S.tooBig)(ctx.num(at), ctx.num(t.n)));
      return;
    }
    locked = true;
    train.classList.add("right");
    tr.label(t.n);
    ctx.solved(S.done(ctx.word(t.n)));
  });

  host.append(goal, scene, check);
  ctx.tell(S.question(ctx.word(t.n)));
  return {
    hint() {
      tr.labelAll();
      return S.hint(ctx.num(TRACK[R].long), ctx.num(TRACK[R].tick));
    },
  };
}

// ---------- Forschen: the wagons carry a row of numbers. One number is missing: what is the rule?

export function forschen(host, t, ctx) {
  const R = rangeOf(t);
  const S = ctx.T.reihe.forschen;
  const scene = el("div", "scene card wagon-scene");
  const row = el("div", "wagons");
  row.append(el("span", "engine", "🚂"));
  const wagons = [];
  for (let i = 0; i < t.len; i++) {
    const w = el("div", i === t.gap ? "wagon gap" : "wagon");
    w.append(el("b", "", i === t.gap ? "?" : ctx.num(t.from + i * t.step)));
    wagons.push(w);
    row.append(w);
  }
  scene.append(row);
  const steps = el("div", "wagon-steps");
  const padBox = el("div");
  let locked = false;
  const p = pad(padBox, ctx, R, (n) => {
    if (locked) return false;
    if (n !== t.answer) {
      p.clear();
      ctx.miss(S.miss);
      return false;
    }
    locked = true;
    p.show(n);
    p.lock(true);
    const w = wagons[t.gap];
    w.classList.remove("gap");
    w.classList.add("pop");
    w.querySelector("b").textContent = ctx.num(n);
    ctx.solved((t.step > 0 ? S.doneUp : S.doneDown)(ctx.num(Math.abs(t.step))));
    return true;
  });
  host.append(scene, steps, padBox);
  ctx.tell(t.step > 0 ? S.question : S.questionDown);
  return {
    hint() {
      if (!steps.firstChild) {
        // Between two wagons that both show a number: how far is it from one to the next?
        const i = t.gap >= 2 ? 0 : t.gap + 1;
        const a = t.from + i * t.step;
        steps.append(el("span", "chip pop", `${ctx.num(a)} ➜ ${ctx.num(a + t.step)}: ${t.step > 0 ? "+" : "−"}${ctx.num(Math.abs(t.step))}`));
      }
      return S.hint;
    },
  };
}

// ---------- Anwenden: compare two numbers, the neighbour before or after, the third wagon.

export function anwenden(host, t, ctx) {
  if (t.kind === "ordinal") return ordinal(host, t, ctx);
  if (t.kind === "next") return next(host, t, ctx);
  return compare(host, t, ctx);
}

const SIGNS = ["<", "=", ">"];

/** Three buttons: <, =, >. onPick(sign, button). */
function signButtons(ctx, onPick) {
  const S = ctx.T.reihe;
  const row = el("div", "sign-row");
  for (const s of SIGNS) {
    const b = button("btn sign-btn", S.signName[s], s);
    b.addEventListener("click", () => onPick(s, b));
    row.append(b);
  }
  return row;
}

/** Both numbers on the track: the smaller one stands further left. */
function bothOnTrack(ctx, R, a, b) {
  const tr = track(ctx, R);
  tr.at(a, ctx.num(a), "flag a");
  tr.at(b, ctx.num(b), "flag b");
  const box = el("div", "scene card track-scene pop");
  box.append(tr.box);
  return box;
}

function compare(host, t, ctx) {
  const R = rangeOf(t);
  const S = ctx.T.reihe.anwenden;
  const scene = el("div", "scene card compare-scene");
  const mid = el("b", "cmp-gap", "?");
  scene.append(el("b", "cmp-num", ctx.num(t.a)), mid, el("b", "cmp-num", ctx.num(t.b)));
  const hintBox = el("div", "hint-box");
  let locked = false;
  const signs = signButtons(ctx, (s, b) => {
    if (locked) return;
    if (s !== t.answer) {
      shake(b);
      ctx.miss(t.a === t.b ? S.compareMissSame : R === 20 ? S.compareMissSmall : S.compareMiss(ctx.num(t.a), ctx.num(t.b)));
      return;
    }
    locked = true;
    b.classList.add("right");
    mid.textContent = s;
    mid.classList.add("right");
    ctx.solved(S.compareDone[s](ctx.word(t.a), ctx.word(t.b)));
  });
  host.append(scene, signs, hintBox);
  ctx.tell(S.compare);
  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(bothOnTrack(ctx, R, t.a, t.b));
      return S.compareHint;
    },
  };
}

function next(host, t, ctx) {
  const R = rangeOf(t);
  const S = ctx.T.reihe.anwenden;
  const scene = el("div", "scene card compare-scene");
  const gap = el("b", "cmp-num gap", "?");
  const n = el("b", "cmp-num", ctx.num(t.n));
  if (t.side === "before") scene.append(gap, el("span", "cmp-gap", "➜"), n);
  else scene.append(n, el("span", "cmp-gap", "➜"), gap);
  const padBox = el("div");
  const hintBox = el("div", "hint-box");
  let locked = false;
  const p = pad(padBox, ctx, R, (x) => {
    if (locked) return false;
    if (x !== t.answer) {
      p.clear();
      ctx.miss(t.side === "before" ? S.beforeMiss : S.afterMiss);
      return false;
    }
    locked = true;
    p.show(x);
    p.lock(true);
    gap.textContent = ctx.num(x);
    gap.classList.remove("gap");
    ctx.solved((t.side === "before" ? S.beforeDone : S.afterDone)(ctx.word(t.n), ctx.word(t.answer)));
    return true;
  });
  host.append(scene, hintBox, padBox);
  ctx.tell((t.side === "before" ? S.before : S.after)(ctx.word(t.n)));
  return {
    hint() {
      if (!hintBox.firstChild) {
        const row = el("div", "count-row pop");
        for (let x = t.n - 2; x <= t.n + 2; x++) if (x >= 0) row.append(el("span", x === t.n ? "chip now" : x === t.answer ? "chip gap" : "chip", x === t.answer ? "?" : ctx.num(x)));
        hintBox.append(row);
      }
      return t.side === "before" ? S.beforeHint : S.afterHint;
    },
  };
}

/** The train with the engine in front (left). Tap the pos-th wagon. */
function ordinal(host, t, ctx) {
  const S = ctx.T.reihe.anwenden;
  const scene = el("div", "scene card wagon-scene");
  const row = el("div", "wagons ordinal");
  row.append(el("span", "engine", "🚂"));
  let locked = false;
  const wagons = [];
  for (let i = 1; i <= t.len; i++) {
    const w = button("wagon", S.wagonName(i), "");
    w.append(el("span", "rider", t.animal));
    w.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.pos) {
        shake(w);
        ctx.miss(S.ordinalMiss(S.ordinals[i - 1], ctx.num(i)));
        return;
      }
      locked = true;
      w.classList.add("right");
      ctx.solved(S.ordinalDone(S.ordinals[i - 1], ctx.num(i)));
    });
    wagons.push(w);
    row.append(w);
  }
  scene.append(row);
  host.append(scene);
  ctx.tell(S.ordinal(S.ordinals[t.pos - 1], ctx.num(t.pos)));
  return {
    hint() {
      wagons.forEach((w, i) => {
        if (!w.querySelector(".place-no")) w.append(el("small", "place-no pop", `${ctx.num(i + 1)}.`));
      });
      return S.ordinalHint;
    },
  };
}

// ---------- Prüfen: the owl compares. She often looks at the last digit first.

export function pruefen(host, t, ctx) {
  const R = rangeOf(t);
  const { T } = ctx;
  const S = T.reihe.pruefen;
  let locked = false;
  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const said = el("b", "said", t.said);
  const bubble = el("div", "bubble cmp-bubble");
  bubble.append(el("span", "", ctx.num(t.a)), said, el("span", "", ctx.num(t.b)));
  talk.append(el("span", "owl", "🦉"), bubble);
  scene.append(talk);
  const hintBox = el("div", "hint-box");

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);

  const fixer = signButtons(ctx, (s, b) => {
    if (locked) return;
    said.textContent = s;
    if (s !== t.answer) {
      shake(b);
      ctx.miss(S.fixMiss);
      return;
    }
    locked = true;
    b.classList.add("right");
    said.classList.add("right");
    ctx.solved(S.fixed(ctx.word(t.a), ctx.word(t.b), T.reihe.anwenden.compareDone[t.answer](ctx.word(t.a), ctx.word(t.b))));
  });
  fixer.hidden = true;

  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(S.lookAgain));
    locked = true;
    said.classList.add("right");
    ctx.solved(S.right(T.reihe.anwenden.compareDone[t.answer](ctx.word(t.a), ctx.word(t.b))));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(S.lookAgain));
    judge.hidden = true;
    fixer.hidden = false;
    said.classList.add("wrong");
    ctx.tap();
    ctx.tell(S.fix);
  });

  host.append(scene, judge, fixer, hintBox);
  ctx.tell(S.question(ctx.word(t.a), t.said, ctx.word(t.b)));
  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(bothOnTrack(ctx, R, t.a, t.b));
      return S.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };

