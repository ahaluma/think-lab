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

// ---------- Forschen: stepping stones over the stream. Each stone has one more (or, when the frog hops
// back, one less). One stone is missing. Or: the stones lie mixed up, lay them in order.

/** A stone shows its number; up to 10 also that many dots. */
function fillStone(ctx, t, stone, n) {
  stone.append(el("b", "", ctx.num(n)));
  if (t.range > 10) return;
  const dots = el("span", "num-dots");
  for (let d = 0; d < n; d++) dots.append(el("i"));
  stone.append(dots);
}

export function forschen(host, t, ctx) {
  return t.kind === "order" ? order(host, t, ctx) : row(host, t, ctx);
}

function row(host, t, ctx) {
  const Z = ctx.T.zahl.forschen;
  const back = t.step < 0;
  const size = Math.abs(t.step);
  const scene = el("div", "scene card stones-scene" + (back ? " back" : ""));
  const stones_ = el("div", "stones");
  stones_.setAttribute("aria-label", Z.stones);
  const stones = [];
  for (let i = 0; i < t.len; i++) {
    const stone = el("div", i === t.gap ? "stone gap" : "stone");
    if (i === t.gap) stone.append(el("b", "", "?"));
    else fillStone(ctx, t, stone, t.from + i * t.step);
    stones.push(stone);
    stones_.append(stone);
  }
  const frog = el("span", "frog", "🐸");
  scene.append(frog, stones_);
  let locked = false;
  const before = ctx.word(t.answer - t.step);

  const answers = strip(ctx, 1, Math.max(5, t.range), (n, b) => {
    if (locked) return;
    if (n !== t.answer) {
      shake(b);
      b.disabled = true;
      ctx.miss(back ? Z.missBack(before, ctx.word(n)) : size === 1 ? Z.miss(before, ctx.word(n)) : Z.missStep);
      return;
    }
    locked = true;
    b.classList.add("right");
    const stone = stones[t.gap];
    stone.classList.remove("gap");
    stone.classList.add("pop");
    stone.innerHTML = "";
    fillStone(ctx, t, stone, n);
    ctx.solved(back ? (size === 1 ? Z.doneBack : Z.doneBackStep)(before, ctx.word(n)) : (size === 1 ? Z.done : Z.doneStep)(before, ctx.word(n)));
  });

  host.append(scene, answers);
  ctx.tell(back ? Z.questionBack : Z.question);

  return {
    hint() {
      for (const stone of stones) shake(stone);
      if (back) return size === 1 ? Z.hintBack : Z.hintBackStep;
      return size === 1 ? (t.range > 10 ? Z.hintPlain : Z.hint) : Z.hintStep;
    },
  };
}

/** The stones lie mixed up on the bank. Tap them in order, the smallest first: they make the path. */
function order(host, t, ctx) {
  const Z = ctx.T.zahl.forschen;
  const scene = el("div", "scene card stones-scene");
  const path = el("div", "stones");
  path.setAttribute("aria-label", Z.stones);
  for (let i = 0; i < t.len; i++) path.append(el("div", "stone gap", ""));
  scene.append(el("span", "frog", "🐸"), path);
  const bank = el("div", "stone-bank");
  let next = 0; // index of the stone that comes next
  let locked = false;
  const want = (i) => t.from + i * t.step;
  const loose = t.mixed.map((n) => {
    const stone = button("stone loose", ctx.word(n));
    fillStone(ctx, t, stone, n);
    stone.addEventListener("click", () => {
      if (locked || stone.disabled) return;
      if (n !== want(next)) {
        shake(stone);
        ctx.miss(next === 0 ? Z.orderFirst : Z.orderMiss(ctx.word(want(next - 1)), ctx.word(n)));
        return;
      }
      ctx.tap();
      stone.disabled = true;
      stone.classList.add("used");
      const slot = path.children[next];
      slot.classList.remove("gap");
      slot.classList.add("pop");
      fillStone(ctx, t, slot, n);
      next++;
      if (next === t.len) {
        locked = true;
        ctx.solved(Z.orderDone(t.mixed.length, ctx.word(t.from), ctx.word(want(t.len - 1))));
      }
    });
    bank.append(stone);
    return { n, stone };
  });

  host.append(scene, bank);
  ctx.tell(Z.order);

  return {
    hint() {
      loose.find((l) => l.n === want(next))?.stone.classList.add("glow-next");
      return next === 0 ? Z.orderHintFirst : Z.orderHint;
    },
  };
}

// ---------- Anwenden: use the number. Where are more (or fewer, or the same)? One comes, one goes:
// how many now? Make both sides the same.

export function anwenden(host, t, ctx) {
  if (t.kind === "dazu") return dazu(host, t, ctx);
  if (t.kind === "gleich") return gleich(host, t, ctx);
  return compare(host, t, ctx);
}

function compare(host, t, ctx) {
  const Z = ctx.T.zahl.anwenden;
  const scene = el("div", "scene card cmp-scene");
  let locked = false;
  const same = t.a === t.b;
  const target = same ? null : t.ask === "more" ? Math.max(t.a, t.b) : Math.min(t.a, t.b);
  const other = t.a + t.b - (target ?? t.a);

  const sides = [
    [t.a, t.left, Z.left],
    [t.b, t.right, Z.right],
  ].map(([n, icon, label]) => {
    const side = button("side", label);
    side.append(group(n, icon));
    side.addEventListener("click", () => {
      if (locked) return;
      if (same || n !== target) {
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
  const sameBtn = button("btn same-btn", Z.same, "=");
  sameBtn.append(el("span", "", Z.same));
  sameBtn.addEventListener("click", () => {
    if (locked) return;
    if (!same) {
      shake(sameBtn);
      ctx.miss(Z.notSame);
      return;
    }
    locked = true;
    sameBtn.classList.add("right");
    showCounts();
    ctx.solved(Z.doneSame(ctx.word(t.a)));
  });

  function showCounts() {
    for (const side of sides) if (!side.querySelector(".count")) side.append(el("b", "count pop", ctx.num(side.count)));
  }

  scene.append(...sides);
  host.append(scene, sameBtn);
  ctx.tell(t.ask === "more" ? Z.more : Z.fewer);

  return {
    hint() {
      showCounts();
      return Z.hint;
    },
  };
}

/** One more, one less: the animals are counted, then one comes (or goes) while the bush hides them. */
function dazu(host, t, ctx) {
  const Z = ctx.T.zahl.anwenden;
  const k = Math.abs(t.d);
  const scene = el("div", "scene card flower-scene dazu-scene");
  const meadow = group(t.n, t.animal);
  const bush = el("div", "bush", "🌿");
  bush.append(el("b", "unknown", "?"));
  bush.hidden = true;
  const sign_ = el("div", "dazu-sign");
  scene.append(meadow, bush, sign_);
  let locked = true;

  const answers = strip(ctx, 1, Math.max(5, t.range), (n, b) => {
    if (locked) return;
    if (n !== t.answer) {
      shake(b);
      b.disabled = true;
      ctx.miss(Z.dazuMiss(ctx.word(t.n), t.d, ctx.word(k)));
      return;
    }
    locked = true;
    b.classList.add("right");
    bush.hidden = true;
    meadow.replaceWith(group(t.answer, t.animal));
    ctx.solved(Z.dazuDone(ctx.word(t.n), t.d, ctx.word(k), ctx.word(t.answer)));
  });
  answers.classList.add("waiting");
  host.append(scene, answers);

  (async () => {
    await ctx.tell(Z.dazuStart(ctx.word(t.n), t.n));
    if (!host.isConnected) return;
    // From the second round the bush covers the meadow first: think, do not count again.
    const hide = !ctx.fresh();
    if (hide) {
      meadow.hidden = true;
      bush.hidden = false;
    }
    sign_.textContent = `${t.d > 0 ? "+" : "−"} ${t.animal.repeat(k)}`;
    sign_.classList.add("pop", t.d > 0 ? "in" : "out");
    if (!hide) {
      if (t.d > 0) for (let i = 0; i < k; i++) meadow.append(el("span", "pic pop", t.animal));
      else for (let i = 0; i < k; i++) meadow.lastChild?.classList.add("go-away");
    }
    await Promise.all([ctx.tell(t.d > 0 ? Z.dazuIn(k, ctx.word(k)) : Z.dazuOut(k, ctx.word(k))), wait(900)]);
    if (!host.isConnected) return;
    if (!hide && t.d < 0) for (let i = 0; i < k; i++) meadow.lastChild?.remove();
    answers.classList.remove("waiting");
    locked = false;
    ctx.ready();
    ctx.tell(Z.dazuAsk);
  })();

  return {
    hint() {
      bush.hidden = true;
      meadow.hidden = false;
      return t.d > 0 ? Z.dazuHintIn : Z.dazuHintOut;
    },
  };
}

/** Make both sides the same: tap animals on the fuller side so they go home (or, "dazu", tap the
 *  house of the smaller side so animals come out). Then ✓. */
function gleich(host, t, ctx) {
  const Z = ctx.T.zahl.anwenden;
  const big = t.a > t.b ? 0 : 1;
  const counts = [t.a, t.b];
  const icons = [t.left, t.right];
  const active = t.how === "weg" ? big : 1 - big; // the side the child changes
  let moved = 0; // how many went home (weg) or came out (dazu)
  let locked = false;
  const waiting = Math.abs(t.a - t.b) + 2; // "dazu": more wait in the house than are needed

  const scene = el("div", "scene card cmp-scene equal-scene");
  const sides = [0, 1].map((i) => {
    const side = el("div", "side equal-side");
    side.setAttribute("aria-label", i === 0 ? Z.left : Z.right);
    return side;
  });
  const house = button("btn house-btn", Z.house, "🏠");
  const houseCount = el("b", "house-count");
  house.append(houseCount);
  const check = button("btn ok check-btn", Z.check, "✓");

  function draw(helped = false) {
    sides.forEach((side, i) => {
      side.innerHTML = "";
      const n = i === active ? counts[i] + (t.how === "weg" ? -moved : moved) : counts[i];
      const g = group(n, icons[i]);
      [...g.children].forEach((pic, j) => {
        if (helped && j >= Math.min(...counts) && i === big) pic.classList.add("unpaired");
        if (i !== active) return;
        pic.addEventListener("click", () => {
          if (locked) return;
          if (t.how === "weg") moved++;
          else if (j >= counts[i]) moved--;
          else return;
          ctx.tap();
          draw(helped);
        });
      });
      side.append(g);
    });
    houseCount.textContent = ctx.num(t.how === "weg" ? moved : waiting - moved);
    house.disabled = t.how === "weg" ? moved === 0 : moved >= waiting;
  }

  house.addEventListener("click", () => {
    if (locked) return;
    if (t.how === "weg") moved = Math.max(0, moved - 1);
    else moved = Math.min(waiting, moved + 1);
    ctx.tap();
    draw();
  });

  check.addEventListener("click", () => {
    if (locked) return;
    const now = counts[active] + (t.how === "weg" ? -moved : moved);
    const goal = counts[1 - active];
    if (now !== goal) {
      shake(check);
      ctx.miss(now > goal ? Z.equalMore(ctx.word(now - goal), now - goal) : Z.equalFewer(ctx.word(goal - now), goal - now));
      return;
    }
    locked = true;
    const k = ctx.word(moved);
    ctx.solved((t.how === "weg" ? Z.equalDoneWeg : Z.equalDoneDazu)(k, moved, ctx.word(goal)));
  });

  const houseRow = el("div", "house-row" + (active === 0 ? "" : " right"));
  houseRow.append(house);
  scene.append(...sides);
  host.append(scene, houseRow, check);
  draw();
  ctx.tell(t.how === "weg" ? Z.equalWeg : Z.equalDazu);

  return {
    hint() {
      draw(true);
      return Z.equalHint;
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
