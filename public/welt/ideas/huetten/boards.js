// The boards of camp 3, "Wer wohnt wo?" (welt/berg/): logic puzzles. Every board shows the clues as
// a numbered list under the question. Answers are chosen (a person) or typed (how many are left).
//
//   sehen, anwenden  the puzzle: who has the dog? who broke the window? (or: how many are still possible?)
//   machen           Ausprobieren: the grid of people and things. Tap a square: ✗, again: ✓, again: empty.
//                    "Fertig" checks that every row has its one ✓ in the right place.
//   forschen         clue after clue: how many arrangements are still possible? Then the question.
//   pruefen          the owl answers; right? If not: the right answer, then why she was wrong.
//
// Texts: welt/lang/<language>.js under "huetten".

import { el, button, shake } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { KINDS, PEOPLE, DIGITS } from "./tasks.js";

export const TOOLS = { tabelle: "▦", rest: "☝️", kette: "🔗", reihe: "🪑", luege: "🤥", zaehlen: "🔢", probieren: "🧪" };

/** Words of a puzzle in the child's language. */
function words(ctx, t) {
  const C = ctx.T.huetten;
  const name = (p) => C.names[p];
  const who = (p) => `${PEOPLE[p]} ${C.names[p]}`;
  const kind = (d) => C.kinds[t.kinds[d]];
  const thing = (d, v) => kind(d).things[v];
  const clue = (c) => {
    if (t.kind === "seats") return C.seat[c.type](name(c.p), c.q !== undefined ? name(c.q) : c.side);
    if (c.type === "is" || c.type === "not") return kind(c.d)[c.type](name(c.p), thing(c.d, c.v));
    return C[c.type](kind(0).ref[c.v], thing(1, c.w));
  };
  const intro = () => (t.kind === "liar" ? C.liar.story[t.story](ctx.num(t.n), t.truth) : t.kind === "seats" ? C.seat.intro(ctx.num(t.n)) : t.kinds.length === 2 ? C.two(ctx.num(t.n), kind(0).one) : kind(0).intro(ctx.num(t.n)));
  const ask = () => (t.count ? C.countAsk : t.kind === "liar" ? C.liar.ask[t.story] : t.kind === "seats" ? C.seat.who(thing(0, t.ask.v)) : kind(t.ask.d).who(thing(t.ask.d, t.ask.v)));
  const lines = () =>
    t.kind === "liar"
      ? t.statements.map((s) => `${who(s.who)}: „${s.whom === s.who ? C.liar.self[s.says] : C.liar.other[s.says](name(s.whom))}“`)
      : t.clues.map(clue);
  return { C, name, who, kind, thing, clue, intro, ask, lines };
}

/** The clues as a numbered list (and the people who take part). */
function clueCard(ctx, t, W, upTo = Infinity) {
  const card = el("div", "card clue-card");
  const people = el("div", "clue-people");
  for (let p = 0; p < t.n; p++) people.append(el("span", "clue-person", W.who(p)));
  if (t.kind !== "liar" && t.kinds.length) {
    for (let d = 0; d < t.kinds.length; d++) {
      const row = el("div", "clue-things");
      KINDS[t.kinds[d]].slice(0, t.n).forEach((icon, v) => row.append(el("span", "clue-thing", t.kinds[d] === "sitz" ? `🪑${ctx.num(v + 1)}` : icon)));
      card.append(row);
    }
  }
  card.prepend(people);
  const list = el("ol", "clue-list");
  W.lines().forEach((line, i) => {
    const li = el("li", "", line);
    li.hidden = i >= upTo;
    list.append(li);
  });
  card.append(list);
  return { card, list };
}

/** The "So geht es auch" card for this puzzle. */
function finish(host, ctx, t, W, text) {
  const list = W.C.ways[t.tool]?.({ n: ctx.num(t.n), answer: t.count ? ctx.num(t.answer) : W.name(t.answer), all: ctx.num(t.all ?? 0) }) ?? [];
  const ways = list.length < 2 ? [] : list.map(([tool, line]) => ({ icon: TOOLS[tool] ?? "💡", name: W.C.tools[tool], text: line }));
  return kit.win(host, ctx, ways, `${text} ${W.C.rules[t.tool]}`.trim());
}

/** The answer: choose a person, or type a number. */
function answer(host, ctx, t, W, { right, onRight, onWrong }) {
  if (t.count) {
    const pad = kit.typed(ctx, host, right, { digits: DIGITS, onWrong, onRight });
    pad.open();
    return pad;
  }
  const box = kit.choose(host, ctx, t.options.map((p) => ({ id: p, text: W.who(p) })), right, { onWrong, onRight, className: "people-choices" });
  return { box };
}

function solve(host, t, ctx) {
  const W = words(ctx, t);
  const { card } = clueCard(ctx, t, W);
  host.append(card);
  kit.question(host, W.intro(), W.ask());
  answer(host, ctx, t, W, {
    right: t.answer,
    onWrong: () => ctx.miss(W.C.miss[t.tool]),
    onRight: () => finish(host, ctx, t, W, ""),
  });
  ctx.tell(`${W.intro()} ${W.ask()}`, "");
  return { hint: () => W.C.hints[t.tool] };
}

// ---------- Ausprobieren: the grid

function machen(host, t, ctx) {
  const W = words(ctx, t);
  const M = W.C.machen;
  const { card } = clueCard(ctx, t, W);
  const dims = t.kinds.length;
  const marks = t.kinds.map(() => Array.from({ length: t.n }, () => Array(t.n).fill(0))); // 0 empty, 1 ✗, 2 ✓
  const grid = el("table", "logic-grid card");
  const head = el("tr");
  head.append(el("th"));
  for (let d = 0; d < dims; d++) KINDS[t.kinds[d]].slice(0, t.n).forEach((icon, v) => head.append(el("th", d && !v ? "group" : "", t.kinds[d] === "sitz" ? ctx.num(v + 1) : icon)));
  grid.append(head);
  const cells = [];
  for (let p = 0; p < t.n; p++) {
    const tr = el("tr");
    tr.append(el("th", "who", W.who(p)));
    for (let d = 0; d < dims; d++) {
      for (let v = 0; v < t.n; v++) {
        const td = el("td", d && !v ? "group" : "");
        const b = button("logic-cell", `${W.name(p)} · ${v + 1}`, "");
        b.addEventListener("click", () => {
          if (locked) return;
          ctx.tap();
          marks[d][p][v] = (marks[d][p][v] + 1) % 3;
          draw();
        });
        td.append(b);
        tr.append(td);
        cells.push({ d, p, v, b });
      }
    }
    grid.append(tr);
  }
  const draw = () => {
    for (const { d, p, v, b } of cells) {
      const m = marks[d][p][v];
      b.textContent = m === 1 ? "✗" : m === 2 ? "✓" : "";
      b.className = `logic-cell${m === 1 ? " no" : m === 2 ? " yes" : ""}`;
    }
  };
  let locked = false;
  const done = button("btn ok find-done", M.done, M.done);
  done.addEventListener("click", () => {
    if (locked) return;
    const ticks = marks.map((rows) => rows.map((row) => row.flatMap((m, v) => (m === 2 ? [v] : []))));
    if (ticks.some((rows) => rows.some((row) => row.length !== 1))) return void (shake(done), ctx.miss(M.oneEach));
    const wrong = ticks.some((rows, d) => rows.some((row, p) => row[0] !== t.solution[d][p]));
    if (wrong) return void (shake(done), ctx.miss(M.wrong));
    locked = true;
    done.classList.add("right");
    finish(host, ctx, { ...t, tool: "tabelle" }, W, M.solved);
  });
  const tools = el("div", "fence-tools");
  tools.append(done);
  host.append(card, grid, tools);
  draw();
  kit.question(host, W.intro(), M.ask);
  ctx.ready();
  ctx.tell(`${W.intro()} ${M.ask}`, "");
  return { hint: () => M.hint };
}

// ---------- Regel finden: clue after clue, how many are left?

function forschen(host, t, ctx) {
  const W = words(ctx, t);
  const F = W.C.forschen;
  const { card, list } = clueCard(ctx, t, W, 0);
  host.append(card);
  const q = kit.question(host, W.intro(), F.start);
  // Step 0: no clue yet, all arrangements. Then one more clue each step.
  const want = [t.all, ...t.steps];
  let at = 0;
  let pad = null;
  const step = () => {
    pad?.box.remove();
    const text = at === 0 ? F.start : F.after(ctx.num(at));
    q.ask(text);
    pad = kit.typed(ctx, host, want[at], {
      digits: DIGITS,
      onWrong: () => ctx.miss(at === 0 ? F.allMiss : F.miss),
      onRight: async () => {
        await ctx.tell(at === 0 ? F.allGood(ctx.num(t.all)) : want[at] === 1 ? F.one : F.left(ctx.num(want[at])));
        if (!host.isConnected) return;
        at++;
        if (at < want.length) {
          list.children[at - 1].hidden = false;
          list.children[at - 1].classList.add("pop");
          step();
        } else {
          pad.box.remove();
          q.ask(W.ask());
          answer(host, ctx, t, W, {
            right: t.answer,
            onWrong: () => ctx.miss(W.C.miss.tabelle),
            onRight: () => finish(host, ctx, t, W, ""),
          });
          ctx.tell(W.ask(), "");
        }
      },
    });
    pad.open();
    if (at) ctx.tell(`${W.lines()[at - 1]} ${text}`, "");
  };
  step();
  ctx.tell(`${W.intro()} ${F.start}`, "");
  return { hint: () => (at === 0 ? F.allHint : W.C.hints.zaehlen) };
}

// ---------- Begründen: the owl

function pruefen(host, t, ctx) {
  const W = words(ctx, t);
  const O = ctx.T.berg.owl;
  const { card } = clueCard(ctx, t, W);
  const saidText = t.count ? ctx.num(t.said) : W.who(t.said);
  const talk = el("div", "talk card owl-talk");
  const bubble = el("span", "bubble");
  bubble.append(el("span", "", saidText));
  talk.append(el("span", "owl", "🦉"), bubble);
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", ctx.T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", ctx.T.pruefen.no, "✗");
  judge.append(yes, no);
  host.append(card, talk, judge);
  const q = kit.question(host, `${W.intro()} ${W.ask()}`, O.ask(saidText));
  let locked = false;
  let fix = null;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(O.lookAgain));
    locked = true;
    finish(host, ctx, t, W, O.right);
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(O.lookAgain));
    locked = true;
    judge.hidden = true;
    ctx.tap();
    fix = answer(host, ctx, t, W, {
      right: t.answer,
      onWrong: () => ctx.miss(W.C.miss[t.tool]),
      onRight: async () => {
        await ctx.tell(O.fixed);
        if (host.isConnected) why();
      },
    });
    q.ask(O.fix);
    ctx.tell(O.fix, "");
  });
  function why() {
    fix.box.hidden = true;
    const box = kit.choose(host, ctx, t.reasons.map((id) => ({ id, text: W.C.reasons[id] })), t.why, {
      className: "reasons",
      onWrong: () => ctx.miss(O.reasonMiss),
      onRight: () => finish(host, ctx, t, W, O.reasonRight),
    });
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    q.ask(O.why);
    ctx.tell(O.why, "");
  }
  ctx.ready();
  ctx.tell(`${W.intro()} ${W.ask()} ${O.ask(saidText)}`, "");
  return { hint: () => W.C.hints[t.tool] };
}

export const BOARDS = { sehen: solve, machen, forschen, anwenden: solve, pruefen };
