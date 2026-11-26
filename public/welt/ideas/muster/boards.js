// The five boards of the idea "Muster" (a row goes on, because one piece comes again and again).
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "muster". No numbers here: every answer is a picture.

import { el, button, shake, wait } from "../../frame/parts.js";
import { at } from "./tasks.js";

/**
 * A row of things on the forest floor: places 0..n-1 of the endless row of `unit`, then `open` empty
 * places. The things stand in their pieces; with class "split" the pieces move apart, so the child
 * sees what comes again and again (the hint, and the help of a very first round).
 *   → { box, pics: [span per thing], slots: [span per empty place], split(on) }
 */
function chain(unit, icons, n, open = 0, change = null) {
  const box = el("div", "chain");
  box.style.setProperty("--n", n + open);
  box.style.setProperty("--k", Math.ceil((n + open) / unit.length)); // pieces: they need room when they move apart
  const pics = [];
  const slots = [];
  let piece = null;
  for (let i = 0; i < n + open; i++) {
    if (i % unit.length === 0) {
      piece = el("span", "piece");
      box.append(piece);
    }
    if (i < n) {
      const letter = change && change.at === i ? change.letter : at(unit, i);
      const pic = el("span", "pic link pop", icons[letter]);
      pics.push(pic);
      piece.append(pic);
    } else {
      const slot = el("span", "pic link slot", "?");
      slots.push(slot);
      piece.append(slot);
    }
  }
  return { box, pics, slots, split: (on = true) => box.classList.toggle("split", on) };
}

/** A piece on its own, as a small card: 🍄🌰🌰 */
function pieceCard(unit, icons) {
  const card = el("span", "piece-card");
  for (const letter of unit) card.append(el("span", "pic", icons[letter]));
  return card;
}

// ---------- Sehen: the row stops. What comes next? First round: the pieces stand apart.

export function sehen(host, t, ctx) {
  const M = ctx.T.muster.sehen;
  const scene = el("div", "scene card forest-scene");
  const row = chain(t.unit, t.icons, t.shown, 1);
  if (ctx.fresh()) row.split();
  scene.append(row.box);
  let locked = false;

  const answers = el("div", "kinds");
  for (const letter of t.choices) {
    const b = button("btn kind", "", t.icons[letter]);
    b.addEventListener("click", () => {
      if (locked) return;
      if (letter !== t.answer) {
        shake(b);
        b.disabled = true;
        ctx.miss(M.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      const slot = row.slots[0];
      slot.textContent = t.icons[letter];
      slot.classList.remove("slot");
      slot.classList.add("pop");
      row.split();
      ctx.solved(M.done);
    });
    answers.append(b);
  }

  host.append(scene, answers);
  ctx.tell(M.ask);

  return {
    hint() {
      row.split();
      return M.hint;
    },
  };
}

// ---------- Machen: lay the next things yourself. A tap on a thing puts it on the next free place,
// a tap on a thing you laid takes it back.

export function machen(host, t, ctx) {
  const M = ctx.T.muster.machen;
  const scene = el("div", "scene card forest-scene");
  const row = chain(t.unit, t.icons, t.shown, t.fill);
  scene.append(row.box);
  const laid = Array(t.fill).fill(null); // the letter on each free place
  let locked = false;

  function draw() {
    row.slots.forEach((slot, i) => {
      const letter = laid[i];
      slot.textContent = letter ? t.icons[letter] : "?";
      slot.classList.toggle("slot", !letter);
      slot.classList.toggle("laid", !!letter);
    });
  }

  row.slots.forEach((slot, i) => {
    slot.addEventListener("click", () => {
      if (locked || !laid[i]) return;
      laid[i] = null;
      ctx.tap();
      draw();
    });
  });

  async function checkRow() {
    locked = true;
    await wait(350);
    const wrong = laid.map((letter, i) => letter !== at(t.unit, t.shown + i));
    if (!wrong.includes(true)) {
      row.split();
      ctx.solved(M.done);
      return;
    }
    row.slots.forEach((slot, i) => wrong[i] && shake(slot));
    await ctx.miss(M.miss);
    if (!host.isConnected) return;
    wrong.forEach((w, i) => w && (laid[i] = null)); // what was right stays
    draw();
    locked = false;
  }

  const tray = el("div", "kinds");
  for (const letter of t.kinds) {
    const b = button("btn kind thing", "", t.icons[letter]);
    b.addEventListener("click", () => {
      const free = laid.indexOf(null);
      if (locked || free < 0) return;
      laid[free] = letter;
      ctx.tap();
      draw();
      if (!laid.includes(null)) checkRow();
    });
    tray.append(b);
  }

  host.append(scene, tray);
  draw();
  ctx.tell(M.ask);

  return {
    hint() {
      row.split();
      return M.hint;
    },
  };
}

// ---------- Forschen: which piece comes again and again? Tap the piece.

export function forschen(host, t, ctx) {
  const M = ctx.T.muster.forschen;
  const scene = el("div", "scene card forest-scene");
  const row = chain(t.unit, t.icons, t.shown);
  scene.append(row.box);
  let locked = false;

  const answers = el("div", "pieces");
  t.choices.forEach((unit, i) => {
    const b = button("btn piece-btn", "");
    b.append(pieceCard(unit, t.icons));
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.answer) {
        shake(b);
        b.disabled = true;
        ctx.miss(M.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      row.split();
      ctx.solved(M.done);
    });
    answers.append(b);
  });

  host.append(scene, answers);
  ctx.tell(M.ask);

  return {
    hint() {
      // Every place where the row starts again gets a mark.
      row.pics.forEach((pic, i) => i % t.unit.length === 0 && pic.classList.add("start"));
      return M.hint;
    },
  };
}

// ---------- Anwenden: the same row with other things. Which row goes the same way?

export function anwenden(host, t, ctx) {
  const M = ctx.T.muster.anwenden;
  const scene = el("div", "scene card forest-scene");
  const model = chain(t.unit, t.icons, t.shown);
  scene.append(model.box);
  let locked = false;

  const answers = el("div", "rows");
  const rows = t.rows.map((r, i) => {
    const b = button("btn row-btn", "");
    const row = chain(r.unit, r.icons, t.shown);
    b.append(row.box);
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.answer) {
        shake(b);
        b.disabled = true;
        row.split(); // the child sees why: this piece looks different
        model.split();
        ctx.miss(M.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      row.split();
      model.split();
      ctx.solved(M.done);
    });
    answers.append(b);
    return row;
  });

  host.append(scene, answers);
  ctx.tell(M.ask);

  return {
    hint() {
      model.split();
      for (const row of rows) row.split();
      return M.hint;
    },
  };
}

// ---------- Prüfen: the owl laid a row. Is it right? If not: tap the wrong thing.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const M = T.muster.pruefen;
  const isRight = t.wrongAt < 0;
  const scene = el("div", "scene card forest-scene owl-row");
  const row = chain(t.unit, t.icons, t.shown, 0, isRight ? null : { at: t.wrongAt, letter: t.wrong });
  scene.append(el("span", "owl", "🦉"), row.box);
  let locked = false;
  let fixing = false;

  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);

  yes.addEventListener("click", () => {
    if (locked || fixing) return;
    if (!isRight) return void (shake(yes), ctx.miss(M.lookAgain));
    locked = true;
    row.split();
    ctx.solved(M.right);
  });

  no.addEventListener("click", () => {
    if (locked || fixing) return;
    if (isRight) return void (shake(no), ctx.miss(M.lookAgain));
    fixing = true;
    judge.hidden = true;
    scene.classList.add("fixing");
    ctx.tap();
    ctx.ready();
    ctx.tell(M.fix);
  });

  row.pics.forEach((pic, i) => {
    pic.addEventListener("click", () => {
      if (locked || !fixing) return;
      if (i !== t.wrongAt) {
        shake(pic);
        ctx.miss(M.fixMiss);
        return;
      }
      locked = true;
      scene.classList.remove("fixing");
      pic.textContent = t.icons[at(t.unit, i)];
      pic.classList.remove("pop");
      void pic.offsetWidth;
      pic.classList.add("pop", "mended");
      row.split();
      ctx.solved(M.fixed);
    });
  });

  host.append(scene, judge);
  ctx.tell(M.ask);

  return {
    hint() {
      row.split();
      return M.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
