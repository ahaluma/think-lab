// Many ways to one answer (一题多解): after a task of the camp "Zaun" is solved, the child sees the
// thinking tools that crack the same task, each with the task's own numbers. Only tools that really
// work for this task are listed, and only when there are at least two.
//
//   waysFor(ctx, t, extra?) → [{ tool, icon, name, text }]   (empty: nothing to show)
//   extra – what only the board knows (machen: how many posts the child set).
//
// The sentences are in welt/lang/<language>.js under zaun.ways (one function per kind of task,
// numbers already written in the language's digits).

/** The thinking tools, with a fixed symbol. Their names are in zaun.ways.tools. */
export const TOOLS = {
  luecken: "🪵",
  klein: "🔬",
  zuordnen: "🔗",
  aufschneiden: "✂️",
  umbauen: "🧩",
  zerlegen: "🪓",
  tabelle: "📋",
  lineal: "📏",
  teil: "➖",
};

export function waysFor(ctx, t, extra = {}) {
  const W = ctx.T.zaun.ways;
  const d = ctx.num;
  let list = [];
  const fence = (kind, b) => {
    const p = kind === "line" ? b + 1 : kind === "trees" ? b - 1 : kind === "sides" ? 2 * (b + 1) : b;
    if (kind === "sides") return W.sides(d(b), d(b + 1), d(p));
    return W[kind](d(b), d(p));
  };

  if (t.p === "sehen") {
    list = W.see[t.kind](d(t.posts), d(t.answer));
  } else if (t.p === "machen") {
    if (t.mode === "boards") list = W.line(d(t.boards), d(t.boards + 1));
    else {
      const len = (t.spots - 1) * t.step;
      const gaps = len / t.every;
      list = W.every[t.ends ? "ends" : "between"](d(len), d(t.every), d(gaps), d(t.answer.length));
    }
  } else if (t.kind === "rect") {
    list = W.rect(d(t.a / t.every), d(t.b / t.every), d(t.answer));
  } else if (t.ask === "length") {
    const gaps = t.kind === "line" ? t.posts - 1 : t.kind === "trees" ? t.posts + 1 : t.posts;
    list = W.back[t.kind](d(t.posts), d(gaps), d(t.every), d(t.answer));
  } else if ("kind" in t) {
    list = fence(t.kind, t.boards);
  } else if ("from" in t) {
    const args = [d(t.from), d(t.to)];
    list = t.story === "trip" ? W.trip[t.ask](...args, d(t.answer)) : W.pages(...args, d(t.to - t.from), d(t.answer));
  } else if ("n" in t) {
    list = W[t.story](d(t.n), d(t.answer));
  } else if (t.story === "sawback") {
    list = W.sawback(d(t.unit), d(t.given), d(t.answer - 1), d(t.answer));
  } else if (t.story === "towerpart") {
    list = W.towerpart(d(t.a), d(t.given), d(t.unit), d(t.c), d(t.d), d(t.answer), d((t.d - 1) * t.unit), d((t.c - 1) * t.unit));
  } else if ("given" in t) {
    const unit = ctx.T.zaun.anwenden.unit[t.story];
    list = W.time(d(t.a), d(t.given), d(t.a - 1), d(t.unit), d(t.b), d(t.b - 1), d(t.answer), unit);
  }
  if (!list || list.length < 2) return [];
  return list.map(([tool, text]) => ({ tool, icon: TOOLS[tool], name: W.tools[tool], text }));
}
