// The five boards of the idea "Zahl" (a number says how many): one per perspective.
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "zahl".

import { el, button, group, sign, strip, shake, wait } from "../../frame/parts.js";

/** A row of n places, the first `filled` with the icon: shows "how many are still missing". */
function places(n, filled, icon) {
  const row = el("div", "parts-hint pop");
  for (let i = 0; i < n; i++) row.append(el("span", i < filled ? "place full" : "place", i < filled ? icon : ""));
  return row;
}

// ---------- Sehen: flowers on the meadow, seen at a glance. First round: they stay. Later: a short look.

export function sehen(host, t, ctx) {
  const Z = ctx.T.zahl.sehen;
  const scene = el("div", "scene card flower-scene");
  const flowers = group(t.n, t.flower);
  const bush = el("div", "bush", "🌿");
  bush.append(el("b", "unknown", "?"));
  bush.hidden = true;
  scene.append(flowers, bush);
  const stay = ctx.fresh(); // the very first round: nothing hides, the child may count in peace
  let locked = true;
  let helped = false;

  const show = (on) => {
    flowers.hidden = !on;
    bush.hidden = on;
  };
  const lookTime = () => Math.min(4500, 1200 + t.n * 250); // many flowers stand in rows of five: no time to count one by one

  const answers = strip(ctx, 1, Math.max(5, t.range), async (n, b) => {
    if (locked) return;
    if (n !== t.n) {
      shake(b);
      b.disabled = true;
      locked = true;
      show(true); // a second look, the same length
      await Promise.all([ctx.miss(Z.miss), wait(lookTime())]);
      if (!host.isConnected) return;
      if (!stay && !helped) show(false);
      locked = false;
      return;
    }
    locked = true;
    b.classList.add("right");
    show(true);
    ctx.solved(Z.right(ctx.word(t.n)));
  });

  host.append(scene, answers);
  answers.classList.add("waiting");

  (async () => {
    await Promise.all([ctx.tell(Z.look), wait(stay ? 0 : lookTime())]);
    if (!host.isConnected) return;
    if (!stay) show(false);
    answers.classList.remove("waiting");
    locked = false;
    ctx.ready();
    ctx.tell(stay ? Z.ask : Z.askSeen);
  })();

  return {
    hint() {
      helped = true; // the flowers stay now, so they can be counted
      show(true);
      return Z.hint;
    },
  };
}

// ---------- Machen: pick n flowers into the basket. A tap on a flower moves it, a tap in the basket puts it back.

export function machen(host, t, ctx) {
  const Z = ctx.T.zahl.machen;
  let picked = 0;
  let locked = false;

  const scene = el("div", "scene card pick-scene");
  const field = el("div", "field");
  field.setAttribute("aria-label", Z.field);
  const basket = el("div", "basket");
  basket.setAttribute("aria-label", Z.basket);
  const hintBox = el("div", "hint-box");
  const check = button("btn ok check-btn", Z.check, "✓");

  const move = (d) => {
    if (locked) return;
    picked += d;
    ctx.tap();
    draw();
  };

  function draw() {
    field.innerHTML = "";
    const left = el("span", "pics");
    for (let i = 0; i < t.field - picked; i++) {
      const pic = button("pic thing", Z.flower, t.flower);
      pic.addEventListener("click", () => move(1));
      left.append(pic);
    }
    field.append(left);
    basket.innerHTML = "";
    const inside = el("span", "pics");
    for (let i = 0; i < picked; i++) {
      const pic = button("pic thing", Z.flower, t.flower);
      pic.addEventListener("click", () => move(-1));
      inside.append(pic);
    }
    basket.append(el("span", "basket-icon", "🧺"), inside);
    if (hintBox.firstChild) hintBox.replaceChildren(places(t.n, Math.min(picked, t.n), t.flower));
  }

  check.addEventListener("click", () => {
    if (locked) return;
    if (picked === 0) return void ctx.miss(Z.none);
    if (picked !== t.n) return void ctx.miss(Z.miss(ctx.word(picked), ctx.word(t.n)));
    locked = true;
    ctx.solved(Z.done(ctx.word(t.n)));
  });

  scene.append(sign(ctx, t.n), field);
  host.append(scene, basket, hintBox, check);
  draw();
  ctx.tell(Z.question(ctx.word(t.n), t.n));

  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(places(t.n, Math.min(picked, t.n), t.flower));
      return Z.hint;
    },
  };
}

// ---------- Forschen: stepping stones over the stream. Each stone has one more. One stone is missing.

export function forschen(host, t, ctx) {
  const Z = ctx.T.zahl.forschen;
  const scene = el("div", "scene card stones-scene");
  const row = el("div", "stones");
  row.setAttribute("aria-label", Z.stones);
  const stones = [];
  for (let i = 0; i < t.len; i++) {
    const stone = el("div", i === t.gap ? "stone gap" : "stone");
    if (i === t.gap) stone.append(el("b", "", "?"));
    else fill(stone, t.from + i * t.step);
    stones.push(stone);
    row.append(stone);
  }
  /** A stone shows its number; up to 10 also that many dots. */
  function fill(stone, n) {
    stone.append(el("b", "", ctx.num(n)));
    if (t.range > 10) return;
    const dots = el("span", "num-dots");
    for (let d = 0; d < n; d++) dots.append(el("i"));
    stone.append(dots);
  }
  const frog = el("span", "frog", "🐸");
  scene.append(frog, row);
  let locked = false;
  const before = ctx.word(t.answer - t.step);

  const answers = strip(ctx, 1, Math.max(5, t.range), (n, b) => {
    if (locked) return;
    if (n !== t.answer) {
      shake(b);
      b.disabled = true;
      ctx.miss(t.step === 1 ? Z.miss(before, ctx.word(n)) : Z.missStep);
      return;
    }
    locked = true;
    b.classList.add("right");
    const stone = stones[t.gap];
    stone.classList.remove("gap");
    stone.classList.add("pop");
    stone.innerHTML = "";
    fill(stone, n);
    ctx.solved((t.step === 1 ? Z.done : Z.doneStep)(before, ctx.word(n)));
  });

  host.append(scene, answers);
  ctx.tell(Z.question);

  return {
    hint() {
      for (const stone of stones) shake(stone);
      return t.step === 1 ? (t.range > 10 ? Z.hintPlain : Z.hint) : Z.hintStep;
    },
  };
}

// ---------- Anwenden: two groups on the meadow. Where are more (or fewer)? Tap that side.

export function anwenden(host, t, ctx) {
  const Z = ctx.T.zahl.anwenden;
  const scene = el("div", "scene card cmp-scene");
  let locked = false;
  const target = t.ask === "more" ? Math.max(t.a, t.b) : Math.min(t.a, t.b);
  const other = t.a + t.b - target;

  const sides = [
    [t.a, t.left, Z.left],
    [t.b, t.right, Z.right],
  ].map(([n, icon, label]) => {
    const side = button("side", label);
    side.append(group(n, icon));
    side.addEventListener("click", () => {
      if (locked) return;
      if (n !== target) {
        shake(side);
        ctx.miss(Z.miss);
        return;
      }
      locked = true;
      side.classList.add("right");
      showCounts();
      ctx.solved((t.ask === "more" ? Z.doneMore : Z.doneFewer)(ctx.word(target), ctx.word(other)));
    });
    side.count = n;
    return side;
  });

  function showCounts() {
    for (const side of sides) if (!side.querySelector(".count")) side.append(el("b", "count pop", ctx.num(side.count)));
  }

  scene.append(...sides);
  host.append(scene);
  ctx.tell(t.ask === "more" ? Z.more : Z.fewer);

  return {
    hint() {
      showCounts();
      return Z.hint;
    },
  };
}

// ---------- Prüfen: the owl has counted. Is that right? If not: how many are there?

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const Z = T.zahl.pruefen;
  const thing = ctx.thing(t.thing);
  let locked = false;

  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const saidBox = el("b", "said", ctx.num(t.said));
  const saidDots = el("span", "sign-dots");
  const drawSaid = (n) => {
    saidBox.textContent = ctx.num(n);
    saidDots.innerHTML = "";
    for (let i = 0; i < n; i++) saidDots.append(el("i"));
  };
  drawSaid(t.said);
  const bubble = el("div", "bubble");
  bubble.append(saidBox, saidDots);
  talk.append(el("span", "owl", "🦉"), bubble);
  const groups = el("div", "groups");
  const part = el("div", "part");
  part.append(group(t.n, thing.icon));
  groups.append(part);
  scene.append(talk, groups);

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);

  const fixer = strip(ctx, 1, Math.max(5, t.range), (n, b) => {
    if (locked) return;
    drawSaid(n);
    if (n !== t.n) {
      shake(b);
      b.disabled = true;
      ctx.miss(Z.fixMiss);
      return;
    }
    locked = true;
    b.classList.add("right");
    saidBox.classList.remove("wrong");
    saidBox.classList.add("right");
    ctx.solved(Z.fixed(ctx.word(t.n)));
  });
  fixer.hidden = true;

  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(T.pruefen.countAgain));
    locked = true;
    saidBox.classList.add("right");
    ctx.solved(Z.right(ctx.word(t.n)));
  });

  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(T.pruefen.countAgain));
    judge.hidden = true;
    fixer.hidden = false;
    saidBox.classList.add("wrong");
    ctx.tap();
    ctx.tell(Z.fix);
  });

  host.append(scene, judge, fixer);
  ctx.tell(Z.question(ctx.word(t.said), t.said, thing));

  return {
    hint() {
      // Counting with the finger: every thing gets its number.
      [...part.querySelectorAll(".pic")].forEach((pic, i) => {
        if (!pic.dataset.n) {
          pic.dataset.n = ctx.num(i + 1);
          pic.classList.add("numbered");
        }
      });
      return Z.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
