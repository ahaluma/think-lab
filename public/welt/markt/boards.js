// The five perspectives at a stand, and the stories of the market square. Each board draws one task
// and takes the answer. The frame (stand.js) gives ctx: texts, the voice, misses and solving.
//
//   BOARDS[p](box, t, ctx) → { help(), way() }
//     help() shows the picture (after the second miss), way() the steps (after the third)
//   platzBoard(box, s, ctx) → the same for a story of the market square
//
// ctx: { T, num, tell(text, audible), choices: true | false, r, miss(given, kind, text), solved(text),
//        showHelp: picture from the start, started() (the answer clock starts) }

import { SIGN, choices, classify, owl, way, inverse, audible } from "./tasks.js";
import { picture, material, el } from "./picture.js";
import { numpad } from "../../shared/numpad.js";

/** The equation as big text. gap: the number to find shows as a box (returned as .gapBox). */
export function equation(t, ctx, { fill = null, hide = true } = {}) {
  const row = el("div", "equation");
  const n = (v) => ctx.num(v);
  const part = (field) => {
    if (hide && field === t.gap) {
      const box = el("span", "gap", fill === null ? "?" : n(fill));
      row.gapBox = box;
      return box;
    }
    return el("span", "eq-num", n(t[field]));
  };
  row.append(part("a"), el("span", "eq-sign", SIGN[t.op]), part("b"), el("span", "eq-sign", "="), part("c"));
  if (t.rest || t.gap === "rest") row.append(el("span", "eq-rest", ctx.T.rest), part("rest"));
  return row;
}

/** The pad of the task on the board: its keyboard listener goes when the next task comes. */
let activePad = null;
/** Before the next task or the end of the round. */
export function dropPad() {
  activePad?.remove();
  activePad = null;
}

/** The answer: three buttons (smaller children, small numbers) or the number pad. */
function answer(box, t, ctx, gapBox, onTry) {
  dropPad();
  const holder = el("div", "answer-box");
  box.append(holder);
  if (ctx.choices) {
    holder.className = "answers";
    for (const v of choices(t, ctx.r)) {
      const b = el("button", "btn answer");
      b.type = "button";
      b.append(el("span", "num", ctx.num(v)));
      b.addEventListener("click", () => {
        if (ctx.locked()) return;
        if (onTry(v)) {
          b.classList.add("right");
          if (gapBox) gapBox.textContent = ctx.num(v);
        } else b.classList.add("shake");
      });
      holder.append(b);
    }
    return { clear() {} };
  }
  const pad = numpad(holder, ctx.T, {
    digits: String(Math.max(t.range, t.answer)).length,
    display: gapBox ?? null,
    onCheck: (v) => {
      if (ctx.locked()) return true;
      const right = onTry(v);
      if (right) pad.show(v);
      else setTimeout(() => pad.clear(), 400);
      return right;
    },
  });
  activePad = pad;
  return pad;
}

/** Help that every board shares: the picture, and the way in steps (the last result as "?"). */
function helpers(box, t, ctx, at = null) {
  let pic = null;
  const place = at ?? box.querySelector(".equation") ?? box.firstChild;
  return {
    help() {
      if (pic) return;
      pic = picture(t);
      pic.classList.add("pop");
      place.after(pic);
    },
    way() {
      const steps = way(t);
      const list = el("ol", "way pop");
      steps.forEach(([l, s, rr, res], i) => {
        const last = i === steps.length - 1;
        list.append(el("li", "", `${ctx.num(l)} ${s} ${ctx.num(rr)} = ${last ? "?" : ctx.num(res)}`));
      });
      (pic ?? place).after(list);
      ctx.tell(ctx.T.wayHint, audible(t));
    },
  };
}

/** A number answer to the task t: right → solved, wrong → miss with its kind. */
function numberTry(t, ctx) {
  return (v) => {
    if (v === t.answer) {
      ctx.solved(ctx.T.full(t, ctx.num), t);
      return true;
    }
    const kind = classify(t, v);
    ctx.miss(v, kind, kind ? ctx.T.kinds[kind] : "");
    return false;
  };
}

// ---------- 👁️ See: which task does the picture show?

function sehen(box, t, ctx) {
  const pic = picture(t);
  box.append(pic);
  const S = SIGN[t.op];
  const right = `${t.a} ${S} ${t.b}`;
  const step = t.range > 100 ? 100 : t.range > 20 ? 10 : 1;
  const other = { plus: "−", minus: "+", mal: "+", geteilt: "−" }[t.op];
  const wrong = [
    `${t.a} ${S} ${t.b + step}`,
    `${t.a} ${S} ${Math.max(1, t.b - step)}`,
    `${t.a + step} ${S} ${t.b}`,
    `${t.a} ${other} ${t.b}`,
  ].filter((x) => x !== right);
  const options = ctx.r.shuffle([right, ...ctx.r.sample([...new Set(wrong)], 2)]);
  const holder = el("div", "picks");
  for (const o of options) {
    const b = el("button", "btn pick");
    b.type = "button";
    b.textContent = o.replace(/\d+/g, (d) => ctx.num(Number(d)));
    b.addEventListener("click", () => {
      if (ctx.locked()) return;
      if (o === right) {
        b.classList.add("right");
        ctx.solved(ctx.T.full(t, ctx.num), t);
      } else {
        b.classList.add("shake");
        const kind = o.includes(other) ? "rechenart" : null;
        ctx.miss(null, kind, ctx.T.seeMiss);
      }
    });
    holder.append(b);
  }
  box.append(holder);
  ctx.tell(ctx.T.seeAsk, audible(t));
  ctx.started();
  return {
    help() {
      ctx.tell(ctx.T.seeHelp[t.op], audible(t));
    },
    way() {
      // One wrong choice goes away: two are left.
      const wrongOne = [...holder.querySelectorAll(".pick")].find((b, i) => options[i] !== right && !b.disabled);
      if (wrongOne) wrongOne.disabled = true;
    },
  };
}

// ---------- ✋ Make: lay it with your own hands (dots, sticks and plates, rows, bags)

function machen(box, t, ctx) {
  const { op, a, b, c, rest, range } = t;
  const eq = equation({ ...t, gap: "c" }, ctx);
  box.append(eq);
  const stage = el("div", "make-stage");
  const status = el("div", "make-status");
  const tools = el("div", "make-tools");
  box.append(stage, status, tools);
  const units = range <= 20 ? [1] : range <= 100 ? [10, 1] : [100, 10, 1];
  let value = op === "plus" || op === "minus" ? a : op === "mal" ? 0 : a; // dots / heap
  let count = 0; // groups (times) or bags (divide)

  const draw = () => {
    stage.innerHTML = "";
    if (op === "plus" || op === "minus") {
      stage.append(material(value, { range }));
      status.textContent = ctx.T.makeNow(ctx.num(value));
    } else if (op === "mal") {
      const g = el("div", "make-groups");
      for (let i = 0; i < count; i++) {
        const one = el("div", "group");
        one.append(b <= 10 ? el("span", "mini-row", "●".repeat(b)) : material(b, { range: 1000 }));
        g.append(one);
      }
      stage.append(g);
      status.textContent = ctx.T.makeGroups(ctx.num(count), ctx.num(b));
    } else {
      stage.append(material(value, { range: a <= 20 ? 20 : 1000 }));
      const bags = el("div", "bag-row");
      bags.append(el("span", "bag", "🛍️"), el("strong", "", `× ${ctx.num(count)}`));
      stage.append(bags);
      status.textContent = ctx.T.makeBags(ctx.num(count), ctx.num(value));
    }
  };

  const button = (label, action, cls = "") => {
    const btn = el("button", `btn tool ${cls}`, label);
    btn.type = "button";
    btn.addEventListener("click", () => {
      if (ctx.locked()) return;
      ctx.tap();
      action();
      draw();
    });
    tools.append(btn);
    return btn;
  };

  if (op === "plus" || op === "minus") {
    for (const u of units) button(`+${ctx.num(u)}`, () => (value = Math.min(range, value + u)));
    for (const u of units) button(`−${ctx.num(u)}`, () => (value = Math.max(0, value - u)), "minus");
  } else if (op === "mal") {
    button(ctx.T.addGroup(ctx.num(b)), () => (count = Math.min(10, count + 1)));
    button("↩", () => (count = Math.max(0, count - 1)), "minus");
  } else {
    const sizes = c >= 100 ? [100, 10, 1] : c >= 10 ? [10, 1] : [1];
    for (const k of sizes) {
      button(k === 1 ? ctx.T.packOne(ctx.num(b)) : ctx.T.packMany(ctx.num(k)), () => {
        if (value >= k * b) {
          value -= k * b;
          count += k;
        }
      });
    }
    button("↩", () => {
      if (count > 0) {
        count--;
        value += b;
      }
    }, "minus");
  }
  const done = el("button", "btn ok check-btn");
  done.type = "button";
  done.innerHTML = "✓";
  done.setAttribute("aria-label", ctx.T.check);
  done.addEventListener("click", () => {
    if (ctx.locked()) return;
    let right, given;
    if (op === "plus" || op === "minus") [right, given] = [value === c, value];
    else if (op === "mal") [right, given] = [count === a, count * b];
    else [right, given] = [value < b, count];
    if (right) {
      eq.gapBox.textContent = ctx.num(c);
      ctx.solved(ctx.T.full({ ...t, gap: "c" }, ctx.num), t);
    } else {
      const text = op === "geteilt" ? ctx.T.makeLeft(ctx.num(value), ctx.num(b)) : op === "mal" ? ctx.T.makeCount(ctx.num(count), ctx.num(a)) : ctx.T.makeHave(ctx.num(value));
      ctx.miss(given, op === "geteilt" || op === "mal" ? null : classify({ ...t, gap: "c", answer: c }, value), text);
    }
  });
  box.append(done);
  draw();
  ctx.tell(ctx.T.makeAsk[op](t, ctx.num), audible(t));
  ctx.started();
  return helpers(box, { ...t, gap: "c", answer: c }, ctx, eq);
}

// ---------- 🔍 Explore: a row that goes on, or the same numbers the other way round

function forschen(box, t, ctx) {
  const row = paeckchen(t);
  const useRow = row && (t.gap !== "c" || t.rest || ctx.r.chance(0.5));
  let ask;
  if (useRow) {
    const list = el("div", "row-tasks");
    row.slice(0, 2).forEach((s) => list.append(equation(s, ctx, { hide: false })));
    ask = row[2];
    const last = equation(ask, ctx);
    list.append(last);
    box.append(list);
    ctx.tell(ctx.T.rowAsk, audible(ask));
    const pad = answer(box, ask, ctx, last.gapBox, numberTry(ask, ctx));
    ctx.started();
    return { ...helpers(box, ask, ctx, list), pad };
  }
  ask = t.gap === "c" && !t.rest ? inverse(t) : t;
  const list = el("div", "row-tasks");
  if (ask !== t) list.append(equation(t, ctx, { hide: false }));
  const last = equation(ask, ctx);
  list.append(last);
  box.append(list);
  ctx.tell(ask !== t ? ctx.T.inverseAsk : ctx.T.ask(ask, ctx.num), audible(ask));
  answer(box, ask, ctx, last.gapBox, numberTry(ask, ctx));
  ctx.started();
  return helpers(box, ask, ctx, list);
}

/** Three tasks in a row, one number growing step by step ("schöne Päckchen"). The last one is asked. */
function paeckchen(t) {
  const { op, a, b, range } = t;
  const d = range > 100 && a % 100 !== a ? 100 : range > 20 ? 10 : 1;
  const make = (x, y) => {
    const c = op === "plus" ? x + y : op === "minus" ? x - y : op === "mal" ? x * y : x / y;
    return { ...t, a: x, b: y, c, gap: "c", answer: c, rest: 0, max: Math.max(x, y, c) };
  };
  let list = null;
  if (op === "plus" && a - 2 * d >= 1) list = [make(a - 2 * d, b), make(a - d, b), make(a, b)];
  if (op === "minus" && a - 2 * d - b >= 0) list = [make(a - 2 * d, b), make(a - d, b), make(a, b)];
  if (op === "mal" && b >= 3) list = [make(a, b - 2), make(a, b - 1), make(a, b)];
  if (op === "geteilt" && !t.rest && t.c >= 3) list = [make(a - 2 * b, b), make(a - b, b), make(a, b)];
  return list && list.every((s) => s.max <= range && Number.isInteger(s.c) && s.c >= 0) ? list : null;
}

// ---------- 🔑 Use: just the numbers, also with a gap

function anwenden(box, t, ctx) {
  const eq = equation(t, ctx);
  box.append(eq);
  ctx.tell(ctx.T.ask(t, ctx.num), audible(t));
  answer(box, t, ctx, eq.gapBox, numberTry(t, ctx));
  ctx.started();
  return helpers(box, t, ctx, eq);
}

// ---------- ✅ Check: the owl has computed. Is it right?

function pruefen(box, t, ctx) {
  const honest = ctx.r.chance(0.3);
  const [claim, kind] = honest ? [t.answer, null] : owl(t, ctx.r);
  const say = el("div", "owl-says");
  say.append(el("span", "owl", "🦉"));
  const eq = equation(t, ctx, { fill: claim });
  eq.classList.add("claim");
  say.append(eq);
  box.append(say);
  const judge = el("div", "judge");
  const yes = el("button", "btn ok", ctx.T.owlRight);
  const no = el("button", "btn go", ctx.T.owlWrong);
  yes.type = no.type = "button";
  judge.append(yes, no);
  box.append(judge);
  ctx.tell(ctx.T.owlAsk(ctx.T.full({ ...t, [t.gap]: claim, c: t.gap === "c" ? claim : t.c, rest: t.gap === "rest" ? claim : t.rest }, ctx.num)), audible(t));
  ctx.started();
  const done = () => ctx.solved(honest ? ctx.T.owlWasRight : `${ctx.T.why[kind]} ${ctx.T.full(t, ctx.num)}`, t);
  yes.addEventListener("click", () => {
    if (ctx.locked()) return;
    if (honest) return done();
    ctx.miss(null, null, ctx.T.owlLookAgain);
  });
  no.addEventListener("click", () => {
    if (ctx.locked()) return;
    if (honest) return ctx.miss(null, null, ctx.T.owlLookAgain);
    judge.remove();
    eq.gapBox.textContent = "?";
    eq.classList.remove("claim");
    ctx.tell(ctx.T.owlFix, audible(t));
    answer(box, t, ctx, eq.gapBox, (v) => {
      if (v === t.answer) {
        done();
        return true;
      }
      const k = classify(t, v);
      ctx.miss(v, k, k ? ctx.T.kinds[k] : "");
      return false;
    });
  });
  return helpers(box, t, ctx, say);
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };

// ---------- The market square: a story

const OP_ICON = { plus: "➕", minus: "➖", mal: "✖️", geteilt: "➗" };

export function platzBoard(box, s, ctx) {
  const text = ctx.T.platz.stories[s.kind](s.n, ctx.num, s.stage === 4);
  const card = el("div", "story card");
  if (s.stage === 1) card.append(el("span", "story-op", OP_ICON[s.op]));
  card.append(el("p", "story-text", text));
  box.append(card);
  const quiet = s.max <= 20;
  ctx.tell(text, quiet, "");
  const t = { op: s.op, range: Math.max(20, s.max), answer: s.answer, max: s.max, gap: "c", a: 0, b: 0, c: s.answer, rest: 0 };
  const result = el("div", "equation");
  const gap = el("span", "gap", "?");
  result.append(el("span", "eq-sign", "="), gap);
  let pic = null;

  const askNumber = () => {
    box.append(result);
    answer(box, t, ctx, gap, (v) => {
      if (v === s.answer) {
        ctx.solved(ctx.T.platz.right(ctx.num(s.answer)), null);
        return true;
      }
      ctx.miss(v, null, "");
      return false;
    });
    ctx.started();
  };

  if (s.stage === 2) {
    const ops = el("div", "op-pick");
    ctx.tell(`${text} ${ctx.T.platz.whichOp}`, quiet, "");
    for (const op of ctx.ops) {
      const b = el("button", "btn op-btn", OP_ICON[op]);
      b.type = "button";
      b.setAttribute("aria-label", ctx.T.opWord[op]);
      b.addEventListener("click", () => {
        if (ctx.locked()) return;
        if (op === s.op) {
          ctx.tap();
          b.classList.add("right");
          ops.querySelectorAll("button").forEach((x) => (x.disabled = true));
          askNumber();
        } else {
          b.classList.add("shake");
          ctx.miss(null, "rechenart", ctx.T.platz.whatHappens);
        }
      });
      ops.append(b);
    }
    box.append(ops);
    ctx.started();
  } else askNumber();

  return {
    help() {
      if (pic || s.max > 20) return ctx.tell(ctx.T.platz.whatHappens, quiet);
      pic = el("div", "story-pic pop");
      const icon = ctx.T.platz.icon[s.kind] ?? "🍎";
      const n = s.n;
      const row = (k, cls = "") => el("div", `story-row ${cls}`, icon.repeat(Math.max(0, k)));
      if (s.kind === "gruppen" || s.kind === "gruppenWeg" || s.kind === "gruppenDazu") for (let i = 0; i < n.a; i++) pic.append(row(n.b));
      else if (n.a) pic.append(row(n.a));
      if (n.b && !s.kind.startsWith("gruppen") && !s.kind.startsWith("verteilen") && s.kind !== "packen" && s.kind !== "tueten") pic.append(row(n.b, "b"));
      card.after(pic);
    },
    way() {
      const list = el("ol", "way pop");
      s.way.forEach(([l, sg, rr, res], i) => list.append(el("li", "", `${ctx.num(l)} ${sg} ${ctx.num(rr)} = ${i === s.way.length - 1 ? "?" : ctx.num(res)}`)));
      (pic ?? card).after(list);
    },
  };
}
