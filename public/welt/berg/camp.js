// The boards every camp of the thinking mountain can use, from tasks as plain data. A camp's own
// boards.js takes these and adds what only it has (its hands-on "Ausprobieren", its own pictures):
//
//   export const BOARDS = campBoards("haken", { machen, TOOLS });
//
// The tasks (ideas/<camp>/tasks.js) look like this:
//   { story, a, answer, tool }   a story with its numbers (a), the answer, the thinking tool it needs
//   pic:    [{ icon, n }] or [{ icons: [...] }]   rows of things to see (optional)
//   table:  (forschen) { id, rows: [[x, y], …], next: [x, y] }, then the story with big numbers
//   owl:    (pruefen) said, right, reasons: [ids, the true one is `why`]
//
// Texts in welt/lang/<language>.js under the camp's id:
//   stories[story](a) → [the story, the question]     a: the numbers already in the language's digits
//   units[story]   the word after a number ("Eis", "Wege"), for the owl's bubble
//   rules[tool]    the tool in one sentence, said after a solved task
//   hints[tool]    the hint (bulb, or by itself after two misses)
//   miss[tool]     what a wrong answer gets
//   tables[id] → [left column, right column]; tableIntro[id](fixed, a) what the table is about
//   reasons[id]    why the owl can be wrong
//   ways[story or tool](a) → [[tool, text], …]         the "So geht es auch" card; tools[tool] its name
// and the words every camp shares under berg.owl and berg.table.

import { el, button, shake } from "../frame/parts.js";
import * as kit from "./kit.js";

/** The task's numbers in the language's digits (lists too); words stay as they are. */
export function args(ctx, t) {
  const d = (v) => (typeof v === "number" ? ctx.num(v) : Array.isArray(v) ? v.map(d) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, d(x)])) : v);
  return Object.fromEntries(Object.entries({ ...t.a, answer: t.answer }).map(([k, v]) => [k, d(v)]));
}

export function storyOf(ctx, camp, t) {
  return ctx.T[camp].stories[t.story](args(ctx, t));
}

/** Rows of things: [{ icon, n }] draws n icons (more than SHOWN: a few, "…", and the number). */
const SHOWN = 8;
export function picture(ctx, rows) {
  const scene = el("div", "scene card camp-scene");
  for (const row of rows ?? []) {
    const line = el("div", "camp-row");
    const icons = row.icons ?? Array(row.n).fill(row.icon);
    const many = icons.length > SHOWN;
    const shown = many ? [...icons.slice(0, SHOWN - 2), "…", icons.at(-1)] : icons;
    for (const icon of shown) line.append(el("span", icon === "…" ? "camp-dots" : "camp-thing", icon));
    if (many || row.label) line.append(el("b", "camp-count", row.label ?? `× ${ctx.num(icons.length)}`));
    scene.append(line);
  }
  return scene;
}

/** Solved: the rule of the tool, then the other ways (at least two, or none). */
export function solvedBy(ctx, camp, tools) {
  return (host, t, text) => {
    const C = ctx.T[camp];
    const a = args(ctx, t);
    if (t.choices) a.answer = choiceLabel(ctx, camp, t, t.answer);
    const list = (C.ways?.[t.story] ?? C.ways?.[t.tool])?.(a) ?? [];
    const ways = list.length < 2 ? [] : list.map(([tool, line]) => ({ icon: tools[tool] ?? "💡", name: C.tools[tool], text: line }));
    return kit.win(host, ctx, ways, `${text} ${C.rules[t.tool] ?? ""}`.trim());
  };
}

/** What an answer to tap says: the shape itself, or a word (choices.kind "days": the days of the week). */
const choiceLabel = (ctx, camp, t, id) => (t.choices.kind === "icons" ? id : ctx.T[camp].choices[t.choices.kind][id]);

export function campBoards(camp, { TOOLS = {}, DIGITS = 3, machen, picture: draw = picture } = {}) {
  /** The answer: the number pad, or buttons when the task has choices. Returns { box, open() }. */
  const typed = (ctx, host, right, on, t = null) => {
    if (!t?.choices) return kit.typed(ctx, host, right, { ...on, digits: DIGITS });
    let box = null;
    return {
      get box() {
        return box;
      },
      open() {
        box = kit.choose(host, ctx, t.choices.ids.map((id) => ({ id, text: choiceLabel(ctx, camp, t, id) })), right, { onWrong: on.onWrong, onRight: on.onRight, className: `camp-choices${t.choices.kind === "icons" ? " icons" : ""}` });
      },
    };
  };

  /** Story, picture, number pad: Verstehen and Übertragen. */
  function solve(host, t, ctx) {
    const C = ctx.T[camp];
    const win = solvedBy(ctx, camp, TOOLS);
    if (t.pic) host.append(draw(ctx, t.pic, t));
    const [text, ask] = storyOf(ctx, camp, t);
    const pad = typed(ctx, host, t.answer, {
      onWrong: () => ctx.miss(C.miss[t.tool]),
      onRight: () => win(host, t, ""),
    }, t);
    kit.story(host, ctx, text, ask, pad);
    return { hint: () => C.hints[t.tool] };
  }

  /** Regel finden: a small table first (one thing changes at a time), then the big question. */
  function forschen(host, t, ctx) {
    if (!t.table) return solve(host, t, ctx);
    const C = ctx.T[camp];
    const W = ctx.T.berg.table;
    const win = solvedBy(ctx, camp, TOOLS);
    if (t.pic) host.append(draw(ctx, t.pic, t));
    const heads = C.tables[t.table.id];
    const [left, right] = typeof heads === "function" ? heads(args(ctx, t)) : heads;
    const grid = el("table", "camp-table card");
    const head = el("tr");
    head.append(el("th", "", left), el("th", "", right));
    grid.append(head);
    const rowOf = ([x, y]) => {
      const tr = el("tr");
      tr.append(el("td", "", ctx.num(x)), el("td", "", y === null ? "?" : ctx.num(y)));
      grid.append(tr);
      return tr;
    };
    t.table.rows.forEach(rowOf);
    const [nx, ny] = t.table.next;
    const open = rowOf([nx, null]);
    open.classList.add("now");
    host.append(grid);
    const [text, ask] = storyOf(ctx, camp, t);
    const intro = C.tableIntro[t.table.id](ctx.num(t.table.fixed ?? 0), args(ctx, t));
    const q = kit.question(host, intro, W.next(ctx.num(nx)));
    let pad = typed(ctx, host, ny, {
      onWrong: () => ctx.miss(W.look),
      onRight: async () => {
        open.classList.remove("now");
        open.lastChild.textContent = ctx.num(ny);
        await ctx.tell(W.good);
        if (!host.isConnected) return;
        pad.box.remove();
        pad = typed(ctx, host, t.answer, {
          onWrong: () => ctx.miss(C.miss[t.tool]),
          onRight: () => win(host, t, ""),
        });
        host.querySelector(".task-text .task-story").textContent = text;
        host.querySelector(".task-text .task-story").hidden = false;
        q.ask(ask);
        pad.open();
        ctx.tell(`${text} ${ask}`, "");
      },
    });
    pad.open();
    ctx.tell(`${intro} ${W.next(ctx.num(nx))}`, "");
    return { hint: () => (open.isConnected && open.classList.contains("now") ? W.hint : C.hints[t.tool]) };
  }

  /** Begründen: the owl answers fast and sure. Right? If not: the right number, then why. */
  function pruefen(host, t, ctx) {
    const C = ctx.T[camp];
    const O = ctx.T.berg.owl;
    const win = solvedBy(ctx, camp, TOOLS);
    const scene = t.pic ? draw(ctx, t.pic, t) : el("div", "scene card camp-scene");
    const talk = el("div", "talk");
    const bubble = el("span", "bubble");
    const unit = C.units?.[t.story] ?? "";
    const saidText = t.choices ? choiceLabel(ctx, camp, t, t.said) : ctx.num(t.said);
    bubble.append(el("span", "", saidText), el("small", "bubble-word", unit && !t.choices ? " " + unit : ""));
    talk.append(el("span", "owl", "🦉"), bubble);
    scene.prepend(talk);
    const judge = el("div", "judge");
    const yes = button("btn ok judge-btn", ctx.T.pruefen.yes, "✓");
    const no = button("btn go judge-btn", ctx.T.pruefen.no, "✗");
    judge.append(yes, no);
    host.append(scene, judge);
    const [text, ask] = storyOf(ctx, camp, t);
    const said = t.choices ? saidText : `${ctx.num(t.said)}${unit ? " " + unit : ""}`;
    const q = kit.question(host, `${text} ${ask}`, O.ask(said));
    let locked = false;
    let fixer = null;
    yes.addEventListener("click", () => {
      if (locked) return;
      if (!t.right) return void (shake(yes), ctx.miss(O.lookAgain));
      locked = true;
      win(host, t, O.right);
    });
    no.addEventListener("click", () => {
      if (locked) return;
      if (t.right) return void (shake(no), ctx.miss(O.lookAgain));
      locked = true;
      judge.hidden = true;
      ctx.tap();
      fixer = typed(ctx, host, t.answer, {
        onWrong: () => ctx.miss(C.miss[t.tool]),
        onRight: async () => {
          await ctx.tell(O.fixed);
          if (host.isConnected) why();
        },
      }, t);
      fixer.open();
      q.ask(O.fix);
      ctx.tell(O.fix, "");
    });
    function why() {
      fixer.box.hidden = true;
      const box = kit.choose(host, ctx, t.reasons.map((id) => ({ id, text: C.reasons[id] })), t.why, {
        className: "reasons",
        onWrong: () => ctx.miss(O.reasonMiss),
        onRight: () => win(host, t, O.reasonRight),
      });
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
      q.ask(O.why);
      ctx.tell(O.why, "");
    }
    ctx.ready();
    ctx.tell(`${text} ${ask} ${O.ask(said)}`, "");
    return { hint: () => C.hints[t.tool] };
  }

  return { sehen: solve, machen: machen ?? solve, forschen, anwenden: solve, pruefen };
}
