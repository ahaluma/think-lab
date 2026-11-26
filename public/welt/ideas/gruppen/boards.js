// The five boards of the idea "Gruppen" (groups of the same size, sharing fairly).
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "gruppen".

import { el, button, group, strip, shake, wait } from "../../frame/parts.js";
import { PAIRS, MAX_EACH } from "./tasks.js";

/** One animal with the place for its share: 🐰 above, its things below. → { box, pile, set(n, icon), count } */
function eaterBox(icon, label) {
  const box = button("eater", label);
  const pile = el("span", "share");
  box.append(el("span", "eater-icon", icon), pile);
  return { box, pile };
}

/** A small number badge on a box: how many are in it. */
function badge(ctx, box, n) {
  box.querySelector(".count")?.remove();
  box.append(el("b", "count pop", ctx.num(n)));
}

// ---------- Sehen: nests with the same number of eggs. A hen sits on one: how many are under her?

export function sehen(host, t, ctx) {
  const G = ctx.T.gruppen.sehen;
  const scene = el("div", "scene card nest-scene");
  const hidden = t.groups - 1; // the hen sits on the last nest
  const nests = Array.from({ length: t.groups }, () => {
    const nest = el("div", "nest");
    const eggs = el("span", "pics eggs");
    for (let i = 0; i < t.each; i++) eggs.append(el("i", "egg pop"));
    nest.append(eggs);
    return nest;
  });
  scene.append(...nests);
  const hen = el("span", "hen", "🐔");
  let locked = true;

  const answers = strip(ctx, 1, MAX_EACH, (n, b) => {
    if (locked) return;
    if (n !== t.each) {
      shake(b);
      b.disabled = true;
      ctx.miss(G.miss);
      return;
    }
    locked = true;
    b.classList.add("right");
    hen.classList.add("up"); // she stands up: there they are
    nests[hidden].classList.remove("covered");
    ctx.solved(G.done(ctx.word(t.each)));
  });
  answers.classList.add("waiting");
  host.append(scene, answers);

  // The story: every nest has the same number, then the hen sits down on one. In a child's very
  // first round the story is told slowly; later the hen comes at once.
  (async () => {
    await Promise.all([ctx.tell(G.all), wait(ctx.fresh() ? 1800 : 900)]);
    if (!host.isConnected) return;
    nests[hidden].append(hen);
    nests[hidden].classList.add("covered");
    await ctx.tell(G.sit);
    if (!host.isConnected) return;
    answers.classList.remove("waiting");
    locked = false;
    ctx.ready();
    ctx.tell(G.ask);
  })();

  return {
    hint() {
      nests.forEach((nest, i) => i !== hidden && shake(nest));
      return G.hint;
    },
  };
}

// ---------- Machen: share the things among the animals. Children move the things themselves:
// drag a thing to an animal, or tap a thing (it lifts) and then an animal. A tap on an animal alone
// gives it one thing from the pile. A tap on a thing an animal has takes it back.

export function machen(host, t, ctx) {
  const G = ctx.T.gruppen.machen;
  const pair = PAIRS[t.pair];
  const have = Array(t.groups).fill(0);
  let pile = t.total;
  let held = false;
  let locked = false;

  const scene = el("div", "scene card share-scene");
  const eaters = have.map((_, i) => {
    const e = eaterBox(pair.eater, `${G.animal} ${ctx.num(i + 1)}`);
    e.box.addEventListener("click", () => move("pile", i));
    return e;
  });
  scene.append(...eaters.map((e) => e.box));
  const pileBox = el("div", "basket");
  pileBox.setAttribute("aria-label", G.pile);
  const check = button("btn ok check-btn", G.check, "✓");

  const count = (where) => (where === "pile" ? pile : have[where]);
  const add = (where, d) => (where === "pile" ? (pile += d) : (have[where] += d));

  function move(from, to) {
    if (locked || from === to || count(from) === 0) return;
    add(from, -1);
    add(to, 1);
    held = false;
    ctx.tap();
    draw();
  }

  function thingPic(where, lifted) {
    const pic = el("span", "pic thing" + (lifted ? " held" : ""), pair.food);
    let start = null;
    let dragging = false;
    pic.addEventListener("pointerdown", (e) => {
      if (locked) return;
      start = { x: e.clientX, y: e.clientY };
      dragging = false;
      try {
        pic.setPointerCapture(e.pointerId);
      } catch {
        /* no such pointer (a tap made by a script): the tap still works */
      }
    });
    pic.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) > 8) {
        dragging = true;
        pic.classList.add("dragging");
      }
      if (dragging) pic.style.transform = `translate(${dx}px, ${dy}px) scale(1.25)`;
    });
    const end = (e) => {
      if (!start) return;
      const dragged = dragging;
      start = null;
      dragging = false;
      pic.style.transform = "";
      pic.classList.remove("dragging");
      if (e.type === "pointercancel") return;
      if (!dragged) {
        if (where === "pile") {
          held = !held;
          ctx.tap();
          draw();
        } else move(where, "pile");
        return;
      }
      const under = document.elementsFromPoint(e.clientX, e.clientY);
      const to = eaters.findIndex((eater) => under.includes(eater.box));
      if (to >= 0) move(where, to);
      else if (under.includes(pileBox)) move(where, "pile");
    };
    pic.addEventListener("pointerup", end);
    pic.addEventListener("pointercancel", end);
    pic.addEventListener("click", (e) => e.stopPropagation()); // the animal below must not take it as its own tap
    return pic;
  }

  function draw() {
    eaters.forEach((eater, i) => {
      eater.pile.innerHTML = "";
      for (let k = 0; k < have[i]; k++) eater.pile.append(thingPic(i, false));
      eater.box.querySelector(".count")?.remove();
    });
    pileBox.innerHTML = "";
    const pics = el("span", "pics" + (pile > 10 ? " many" : ""));
    for (let k = 0; k < pile; k++) pics.append(thingPic("pile", held && k === pile - 1));
    pileBox.append(pics);
    scene.classList.toggle("picking", held && pile > 0);
    check.disabled = pile > 0;
  }

  check.addEventListener("click", async () => {
    if (locked) return;
    if (have.every((n) => n === t.each)) {
      locked = true;
      eaters.forEach((eater) => badge(ctx, eater.box, t.each));
      ctx.solved(G.done(ctx.word(t.each)));
      return;
    }
    // Explain, do not punish: the numbers show who has more.
    eaters.forEach((eater, i) => {
      badge(ctx, eater.box, have[i]);
      if (have[i] > t.each) shake(eater.box);
    });
    ctx.miss(G.miss);
  });

  host.append(scene, pileBox, check);
  draw();
  ctx.tell(G.ask);

  return {
    hint() {
      return G.hint;
    },
  };
}

// ---------- Forschen: think first. Does everyone get the same? Then the things are dealt out, one
// to each in turn, and the child sees whether something is left over.

export function forschen(host, t, ctx) {
  const G = ctx.T.gruppen.forschen;
  const pair = PAIRS[t.pair];
  const scene = el("div", "scene card share-scene");
  const eaters = Array.from({ length: t.groups }, () => eaterBox(pair.eater, ""));
  for (const e of eaters) e.box.disabled = true;
  scene.append(...eaters.map((e) => e.box));
  const pileBox = el("div", "basket");
  const pile = group(t.total, pair.food);
  pileBox.append(pile);
  let locked = false;
  let dealt = false;

  /** One to each in turn, as long as there is one for everyone. What is left stays in the pile. */
  async function deal(fast) {
    if (dealt) return;
    dealt = true;
    for (let round = 0; round < t.each; round++) {
      for (const eater of eaters) {
        pile.lastChild?.remove();
        eater.pile.append(el("span", "pic pop", pair.food));
        await wait(fast ? 60 : 220);
        if (!host.isConnected) return;
      }
    }
    eaters.forEach((eater) => badge(ctx, eater.box, t.each));
    if (t.rest) pileBox.classList.add("left-over");
  }

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", G.yes, "✓");
  const no = button("btn go judge-btn", G.no, "✗");
  judge.append(yes, no);
  const outcome = () => (t.fair ? G.fair(ctx.word(t.each)) : G.unfair(t.rest, ctx.word(t.rest)));

  for (const [b, says] of [[yes, true], [no, false]]) {
    b.addEventListener("click", async () => {
      if (locked) return;
      locked = true;
      ctx.tap();
      const first = !dealt; // after a wrong guess the things are dealt out already
      await Promise.all([deal(false), first ? ctx.tell(G.watch) : null]);
      if (!host.isConnected) return;
      if (says === t.fair) return void ctx.solved(outcome());
      shake(b);
      b.disabled = true;
      await ctx.miss(outcome());
      locked = false;
    });
  }

  host.append(scene, pileBox, judge);
  ctx.tell(G.ask);

  return {
    hint() {
      return G.hint;
    },
  };
}

// ---------- Anwenden: cherries for the birds. Every bird gets the same number: for how many birds
// is it enough? The answer is the number of groups.

export function anwenden(host, t, ctx) {
  const G = ctx.T.gruppen.anwenden;
  const scene = el("div", "scene card cherry-scene");
  const table = el("div", "cherries");
  table.append(group(t.total, "🍒")); // rows of five, like everywhere
  // What one bird gets, shown as a picture: 🐦 = 🍒🍒
  const rule = el("div", "rule");
  rule.append(el("span", "eater-icon", "🐦"), el("b", "", "="), group(t.each, "🍒"));
  rule.hidden = true;
  scene.append(rule, table);
  let locked = true;

  /** The cherries move into groups, one group per bird. */
  function bundle(withBirds) {
    table.innerHTML = "";
    table.classList.add("bundled");
    for (let g = 0; g < t.groups; g++) {
      const part = el("span", "bundle pop");
      if (withBirds) part.append(el("span", "eater-icon", "🐦"));
      part.append(group(t.each, "🍒"));
      table.append(part);
    }
  }

  const answers = strip(ctx, 1, MAX_EACH, (n, b) => {
    if (locked) return;
    if (n !== t.groups) {
      shake(b);
      b.disabled = true;
      ctx.miss(G.miss);
      return;
    }
    locked = true;
    b.classList.add("right");
    bundle(true);
    ctx.solved(G.done(ctx.word(t.groups), ctx.word(t.each)));
  });
  answers.classList.add("waiting");
  host.append(scene, answers);

  (async () => {
    const [first, second, question] = G.story(ctx.word(t.total), ctx.word(t.each));
    await ctx.tell(first);
    if (!host.isConnected) return;
    rule.hidden = false;
    await ctx.tell(second);
    if (!host.isConnected) return;
    answers.classList.remove("waiting");
    locked = false;
    ctx.ready();
    ctx.tell(question);
  })();

  return {
    hint() {
      if (!locked) bundle(false);
      return G.hint;
    },
  };
}

// ---------- Prüfen: the owl shared. Does everyone have the same? If not: who has too many?
// A tap on that animal and one thing goes to the animal with too few.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const G = T.gruppen.pruefen;
  const pair = PAIRS[t.pair];
  const fair = t.from < 0;
  const have = Array.from({ length: t.groups }, (_, i) => t.each + (i === t.from ? 1 : i === t.to ? -1 : 0));
  let locked = false;
  let fixing = false;

  const scene = el("div", "scene card share-scene owl-share");
  const eaters = have.map((n, i) => {
    const e = eaterBox(pair.eater, "");
    e.pile.append(...Array.from({ length: n }, () => el("span", "pic pop", pair.food)));
    e.box.addEventListener("click", async () => {
      if (locked || !fixing) return;
      if (i !== t.from) {
        shake(e.box);
        ctx.miss(G.fixMiss);
        return;
      }
      locked = true;
      scene.classList.remove("fixing");
      e.pile.lastChild.remove();
      eaters[t.to].pile.append(el("span", "pic pop", pair.food));
      eaters.forEach((eater) => badge(ctx, eater.box, t.each));
      ctx.solved(G.fixed(ctx.word(t.each)));
    });
    return e;
  });
  const row = el("div", "eaters");
  row.append(...eaters.map((e) => e.box));
  scene.append(el("span", "owl", "🦉"), row);

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);

  yes.addEventListener("click", () => {
    if (locked || fixing) return;
    if (!fair) return void (shake(yes), ctx.miss(G.lookAgain));
    locked = true;
    eaters.forEach((eater) => badge(ctx, eater.box, t.each));
    ctx.solved(G.right(ctx.word(t.each)));
  });

  no.addEventListener("click", () => {
    if (locked || fixing) return;
    if (fair) return void (shake(no), ctx.miss(G.lookAgain));
    fixing = true;
    judge.hidden = true;
    scene.classList.add("fixing");
    ctx.tap();
    ctx.ready();
    ctx.tell(G.fix);
  });

  host.append(scene, judge);
  ctx.tell(G.ask);

  return {
    hint() {
      eaters.forEach((eater, i) => !eater.box.querySelector(".count") && badge(ctx, eater.box, have[i]));
      return G.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
