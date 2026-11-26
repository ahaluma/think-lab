// The five boards of the idea "Teile" (numbers are made of numbers): one per perspective.
// A board draws one task (plain data from tasks.js) into `host` and takes the child's answer.
// It never counts or saves anything: it tells the round (welt/spiel/spiel.js) through ctx.
//
//   board(host, task, ctx) → { hint() }
//
//   ctx.T              texts of the world (welt/lang) plus the shared words
//   ctx.num(n)         a number in the digits of the language
//   ctx.word(n)        a number word ("drei")
//   ctx.thing(id)      { icon, one, many } of a shared thing (shared/things.js)
//   ctx.tell(text)     show and read a sentence
//   ctx.miss(text)     a wrong answer: soft sound, the sentence; after the second one the hint shows
//   ctx.solved(text)   the task is done: praise, the sentence, then the next task
//   ctx.tap()          the small tap sound
//   ctx.ready()        the story of the task was shown, the child can answer now (optional)
//
// A wrong answer first says what the child did ("Fünf und vier sind neun. Es sind aber sieben."),
// the hint shows the structure, never just the answer.

const el = (tag, className = "", text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

const button = (className, label, text) => {
  const b = el("button", className, text);
  b.type = "button";
  if (label) b.setAttribute("aria-label", label);
  return b;
};

/** n pictures, at most five in a row, so 5 and 10 are easy to see. */
function group(n, icon, className = "") {
  const g = el("span", "pics " + className);
  for (let i = 0; i < n; i++) g.append(el("span", "pic pop", icon));
  return g;
}

/** A sign that shows the whole: the number and that many dots in rows of five. */
function sign(ctx, n) {
  const s = el("div", "sign");
  s.append(el("b", "", ctx.num(n)));
  const dots = el("span", "sign-dots");
  for (let i = 0; i < n; i++) dots.append(el("i"));
  s.append(dots);
  return s;
}

/** Number buttons from..to in rows of five. onPick(n, button). */
function strip(ctx, from, to, onPick) {
  const box = el("div", "strip");
  for (let n = from; n <= to; n++) {
    const b = button("btn num-btn", ctx.word(n));
    // The digit and that many dots: a child who cannot read digits yet counts the dots.
    const dots = el("span", "num-dots");
    for (let i = 0; i < n; i++) dots.append(el("i"));
    b.append(el("b", "", ctx.num(n)), dots);
    b.addEventListener("click", () => onPick(n, b));
    box.append(b);
  }
  return box;
}

function shake(node) {
  node.classList.remove("shake");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The hint of the "missing part" boards: the whole as a row of places, the known part filled in. */
function partsHint(total, known, icon) {
  const row = el("div", "parts-hint pop");
  for (let i = 0; i < total; i++) row.append(el("span", i < known ? "place full" : "place", i < known ? icon : ""));
  return row;
}

// ---------- Sehen: the burrow. Some animals are outside, the others hide: how many?

export function sehen(host, t, ctx) {
  const { T } = ctx;
  const animal = ctx.thing(t.animal);
  const scene = el("div", "scene card burrow-scene");
  const meadow = el("div", "meadow");
  const all = group(t.total, animal.icon);
  meadow.append(all);
  const burrow = el("div", "burrow");
  const den = el("div", "den");
  den.setAttribute("aria-label", T.sehen.denLabel);
  burrow.append(den);
  scene.append(sign(ctx, t.total), meadow, burrow);
  const hintBox = el("div", "hint-box");
  let locked = true; // until the story was shown

  const answers = strip(ctx, 1, Math.max(5, t.range), (n, b) => {
    if (locked) return;
    if (n !== t.inside) {
      shake(b);
      b.disabled = true;
      ctx.miss(T.sehen.miss(ctx.word(n), ctx.word(t.outside), ctx.word(n + t.outside), ctx.word(t.total)));
      return;
    }
    locked = true;
    b.classList.add("right");
    den.textContent = "";
    den.classList.add("open");
    den.append(group(t.inside, animal.icon));
    ctx.solved(T.together(ctx.word(t.outside), ctx.word(t.inside), ctx.word(t.total)));
  });

  host.append(scene, hintBox, answers);
  answers.classList.add("waiting");

  // Show the story instead of telling it: all animals are outside, then some walk into the burrow.
  (async () => {
    await ctx.tell(T.sehen.all(ctx.word(t.total), animal));
    if (!host.isConnected) return;
    const goers = [...all.children].slice(t.outside);
    for (const pic of goers) pic.classList.add("go-in");
    den.classList.add("open");
    await Promise.all([ctx.tell(T.sehen.hide), wait(1100)]);
    if (!host.isConnected) return;
    for (const pic of goers) pic.remove();
    den.classList.remove("open");
    den.textContent = "?";
    answers.classList.remove("waiting");
    locked = false;
    ctx.ready();
    ctx.tell(T.sehen.ask);
  })();

  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(partsHint(t.total, t.outside, animal.icon));
      return T.sehen.hint;
    },
  };
}

// ---------- Machen: put the things on two leaves, in two different ways.

export function machen(host, t, ctx) {
  const { T } = ctx;
  const thing = ctx.thing(t.thing);
  const sides = [0, 0];
  let basket = t.total;
  const found = []; // "3+4"
  let locked = false;

  const scene = el("div", "scene card pond-scene");
  const leaves = [0, 1].map((side) => {
    const leaf = button("leaf", `${T.machen.leaf} ${ctx.num(side + 1)}`);
    leaf.addEventListener("click", () => {
      if (locked || basket === 0) return;
      basket--;
      sides[side]++;
      ctx.tap();
      draw();
    });
    return leaf;
  });
  scene.append(...leaves);
  const basketBox = el("div", "basket");
  basketBox.setAttribute("aria-label", T.machen.basket);
  const ways = el("div", "ways");
  const check = button("btn ok check-btn", T.machen.check, "✓");

  function draw() {
    leaves.forEach((leaf, side) => {
      leaf.innerHTML = "";
      for (let i = 0; i < sides[side]; i++) {
        const pic = el("span", "pic", thing.icon);
        pic.addEventListener("click", (e) => {
          e.stopPropagation(); // tapping a thing takes it back, tapping the leaf adds one
          if (locked) return;
          sides[side]--;
          basket++;
          ctx.tap();
          draw();
        });
        leaf.append(pic);
      }
    });
    basketBox.innerHTML = "";
    basketBox.append(el("span", "basket-icon", "🧺"), group(basket, thing.icon));
    check.disabled = basket > 0;
  }

  check.addEventListener("click", () => {
    if (locked) return;
    const way = `${sides[0]}+${sides[1]}`;
    if (sides[0] === 0 || sides[1] === 0) return void ctx.miss(T.machen.both);
    if (found.includes(way)) return void ctx.miss(T.machen.had);
    found.push(way);
    ways.append(el("span", "chip pop", `${ctx.num(sides[0])} + ${ctx.num(sides[1])}`));
    if (found.length === 2) {
      locked = true;
      const [a, b, c, d] = found.flatMap((w) => w.split("+")).map((n) => ctx.word(+n));
      ctx.solved(T.machen.done(a, b, c, d, ctx.word(t.total)));
      return;
    }
    ctx.tap();
    sides[0] = sides[1] = 0;
    basket = t.total;
    draw();
    ctx.tell(T.machen.another);
  });

  host.append(sign(ctx, t.total), scene, basketBox, ways, check);
  draw();
  ctx.tell(T.machen.question(ctx.word(t.total), thing));

  return {
    hint() {
      leaves.forEach((leaf) => shake(leaf));
      return found.length ? T.machen.hintMove : T.machen.hint;
    },
  };
}

// ---------- Forschen: the hollow tree. x nuts in, total − x nuts out. Try, then predict.

export function forschen(host, t, ctx) {
  const { T } = ctx;
  const NUT = "🌰";
  const tried = []; // inputs the child tested, in order
  let mode = "test"; // "test" | "predict"
  let ask = 0;
  let locked = false;
  let sums = false;

  const scene = el("div", "scene card tree-scene");
  const inBox = el("div", "io");
  const tree = el("div", "tree");
  tree.append(el("span", "tree-top", "🌳"), el("span", "tree-hole"));
  const outBox = el("div", "io");
  scene.append(inBox, el("span", "flow", "➜"), tree, el("span", "flow", "➜"), outBox);
  const log = el("div", "ways");
  log.setAttribute("aria-label", T.forschen.tried);
  const know = button("btn sun know-btn", T.forschen.know, "💡");
  know.hidden = true;

  function show(x, y) {
    inBox.innerHTML = "";
    outBox.innerHTML = "";
    inBox.append(x === null ? el("b", "unknown", "?") : group(x, NUT));
    outBox.append(y === null ? el("b", "unknown", "?") : group(y, NUT));
  }

  function addPair(x) {
    const chip = el("span", "chip pop", `${ctx.num(x)} ➜ ${ctx.num(t.total - x)}`);
    if (sums) chip.append(el("small", "", ` = ${ctx.num(t.total)}`));
    chip.dataset.x = x;
    log.append(chip);
  }

  function predict() {
    mode = "predict";
    know.hidden = true;
    const all = Array.from({ length: t.total - 1 }, (_, i) => i + 1);
    const fresh = all.filter((x) => !tried.includes(x));
    const pool = fresh.length ? fresh : all.filter((x) => x !== ask);
    ask = pool[Math.floor(pool.length / 2)];
    for (const b of answers.children) b.disabled = false;
    answers.classList.add("predict");
    show(ask, null);
    ctx.tell(T.forschen.predict(ctx.word(ask)));
  }

  const answers = strip(ctx, 1, t.total - 1, async (n, b) => {
    if (locked) return;
    if (mode === "test") {
      ctx.tap();
      tree.classList.remove("working");
      void tree.offsetWidth;
      tree.classList.add("working");
      show(n, t.total - n);
      if (!tried.includes(n)) {
        tried.push(n);
        addPair(n);
      }
      if (tried.length >= 2) know.hidden = false;
      ctx.tell(`${T.forschen.out(ctx.word(n), ctx.word(t.total - n))} ${tried.length === 1 ? T.forschen.more : tried.length === 2 ? T.forschen.ready : ""}`.trim());
      return;
    }
    // Predict: one committed answer, then the tree shows what really comes out.
    const out = t.total - ask;
    show(ask, out);
    if (n === out) {
      locked = true;
      b.classList.add("right");
      ctx.solved(T.forschen.rule(ctx.word(ask), ctx.word(out), ctx.word(t.total)));
      return;
    }
    shake(b);
    if (!tried.includes(ask)) {
      tried.push(ask);
      addPair(ask);
    }
    locked = true; // wait for the sentence, then ask about another number
    await ctx.miss(T.forschen.predictMiss(ctx.word(ask), ctx.word(out)));
    locked = false;
    predict();
  });

  know.addEventListener("click", () => {
    if (!locked && mode === "test") predict();
  });

  host.append(scene, log, answers, know);
  show(null, null);
  ctx.tell(T.forschen.question);

  return {
    hint() {
      if (!sums) {
        sums = true;
        for (const chip of log.children) chip.append(el("small", "", ` = ${ctx.num(t.total)}`));
      }
      return T.forschen.hint;
    },
  };
}

// ---------- Anwenden: a little scene. The whole and one part are known, the other part is hidden.

const SCENE_ART = {
  frogs: { known: "🐸", hidden: "🐸", cover: "🌾" },
  eggs: { known: "🐥", hidden: "🥚", cover: "🍃" },
  apples: { known: "🍎", hidden: "🍎", cover: "🌳" },
};

export function anwenden(host, t, ctx) {
  const { T } = ctx;
  const art = SCENE_ART[t.scene];
  const scene = el("div", `scene card use-scene use-${t.scene}`);
  const known = el("div", "zone known");
  const hidden = el("div", "zone hidden");
  const whole = group(t.total, art.hidden);
  hidden.append(whole);
  const cover = el("span", "cover");
  cover.append(el("span", "cover-icon", art.cover), el("b", "unknown", "?"));
  scene.append(sign(ctx, t.total), known, hidden);
  const hintBox = el("div", "hint-box");
  let locked = true; // until the story was shown

  const answers = strip(ctx, 1, Math.max(5, t.range), (n, b) => {
    if (locked) return;
    if (n !== t.answer) {
      shake(b);
      b.disabled = true;
      ctx.miss(T.sehen.miss(ctx.word(n), ctx.word(t.known), ctx.word(n + t.known), ctx.word(t.total)));
      return;
    }
    locked = true;
    b.classList.add("right");
    hidden.innerHTML = "";
    hidden.append(group(t.answer, art.hidden));
    ctx.solved(T.together(ctx.word(t.known), ctx.word(t.answer), ctx.word(t.total)));
  });

  host.append(scene, hintBox, answers);
  answers.classList.add("waiting");

  // Show the story: first the whole is there, then one part moves away, then the rest is covered.
  const [start, then, ask] = T.anwenden[t.scene](ctx.word(t.total), t.known, ctx.word(t.known));
  (async () => {
    await ctx.tell(start);
    if (!host.isConnected) return;
    const movers = [...whole.children].slice(0, t.known);
    for (const pic of movers) pic.classList.add("go-away");
    await wait(500);
    for (const pic of movers) pic.remove();
    known.append(group(t.known, art.known));
    await Promise.all([ctx.tell(then), wait(900)]);
    if (!host.isConnected) return;
    hidden.innerHTML = "";
    hidden.append(cover);
    answers.classList.remove("waiting");
    locked = false;
    ctx.ready();
    ctx.tell(ask);
  })();

  return {
    hint() {
      if (!hintBox.firstChild) hintBox.append(partsHint(t.total, t.known, art.known));
      return T.anwenden.hint;
    },
  };
}

// ---------- Prüfen: the owl says "a and b are …". Is that right? If not: make it right.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const thing = ctx.thing(t.thing);
  const sum = t.a + t.b;
  let said = t.said;
  let locked = false;

  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const saidBox = el("b", "said", ctx.num(said));
  const bubble = el("div", "bubble");
  // The owl's number with that many dots, so the claim can be checked by counting. No equation:
  // a child who cannot read "2 + 1 = 4" yet can still compare the dots with the things.
  const saidDots = el("span", "sign-dots");
  const drawSaid = () => {
    saidDots.innerHTML = "";
    for (let i = 0; i < said; i++) saidDots.append(el("i"));
  };
  drawSaid();
  bubble.append(saidBox, saidDots);
  talk.append(el("span", "owl", "🦉"), bubble);
  const groups = el("div", "groups");
  const parts = [t.a, t.b].map((n) => {
    const box = el("div", "part");
    box.append(group(n, thing.icon));
    return box;
  });
  groups.append(...parts);
  scene.append(talk, groups);

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);

  const fixer = el("div", "fixer");
  fixer.hidden = true;
  const less = button("btn num-btn", T.pruefen.less, "−");
  const more = button("btn num-btn", T.pruefen.more, "+");
  const fixed = el("b", "fixed-num", ctx.num(said));
  const done = button("btn ok check-btn", T.pruefen.check, "✓");
  fixer.append(less, fixed, more, done);

  const change = (d) => {
    if (locked) return;
    said = Math.max(1, Math.min(20, said + d));
    fixed.textContent = saidBox.textContent = ctx.num(said);
    drawSaid();
    ctx.tap();
  };
  less.addEventListener("click", () => change(-1));
  more.addEventListener("click", () => change(1));

  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(T.pruefen.countAgain));
    locked = true;
    saidBox.classList.add("right");
    ctx.solved(T.pruefen.right(ctx.word(t.a), ctx.word(t.b), ctx.word(sum)));
  });

  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(T.pruefen.countAgain));
    judge.hidden = true;
    fixer.hidden = false;
    saidBox.classList.add("wrong");
    ctx.tap();
    ctx.tell(T.pruefen.fix);
  });

  done.addEventListener("click", () => {
    if (locked) return;
    if (said !== sum) return void (shake(fixed), ctx.miss(T.pruefen.fixMiss));
    locked = true;
    saidBox.classList.remove("wrong");
    saidBox.classList.add("right");
    ctx.solved(T.pruefen.fixed(ctx.word(t.a), ctx.word(t.b), ctx.word(sum)));
  });

  host.append(scene, judge, fixer);
  ctx.tell(T.pruefen.question(ctx.word(t.a), ctx.word(t.b), ctx.word(t.said)));

  return {
    hint() {
      parts.forEach((box, i) => {
        if (!box.querySelector(".count")) box.append(el("b", "count pop", ctx.num([t.a, t.b][i])));
      });
      return T.pruefen.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
