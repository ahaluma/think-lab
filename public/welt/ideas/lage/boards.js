// The five boards of the idea "Lage" (where is it? on, under, next to, in front of, behind, left,
// right, between). Same contract as every idea (see ideas/teile/boards.js): board(host, t, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "lage". Left and right are seen from the child.

import { el, button, shake } from "../../frame/parts.js";
import { ICONS, fits, wordOf } from "./tasks.js";

const name = (ctx, pet) => ctx.T.lage.pets[pet][0];
const dat = (ctx, pet) => ctx.T.lage.pets[pet][1];

/** The room: a wall, the floor and a table. Things placed at a spot get the class "at-<spot>". */
function room() {
  const box = el("div", "scene card lage-scene");
  const table = el("div", "lage-table");
  table.append(el("span", "leg l"), el("span", "leg r"), el("span", "cloth"), el("span", "top"));
  box.append(table);
  return box;
}

function petButton(ctx, pet, spot) {
  const b = button(`lage-pet at-${spot}`, name(ctx, pet), ICONS[pet]);
  return b;
}

/** A small picture of a word: a table with a dot where "it" is. */
function wordButton(ctx, word) {
  const b = button("btn lage-word", ctx.T.lage.words[word]);
  const mini = el("span", `mini mini-${word}`);
  mini.append(el("span", "mt"), el("span", "ml"), el("span", "mr"), el("i", "dot"));
  if (word === "neben") mini.append(el("i", "dot two"));
  b.append(mini, el("span", "w", ctx.T.lage.words[word]));
  return b;
}

function wordRow(ctx, words, onPick) {
  const row = el("div", "kinds lage-words");
  for (const w of words) {
    const b = wordButton(ctx, w);
    b.addEventListener("click", () => onPick(w, b));
    row.append(b);
  }
  return row;
}

// ---------- Sehen: who is under the table? Tap the animal.

export function sehen(host, t, ctx) {
  const L = ctx.T.lage;
  const S = L.sehen;
  const scene = room();
  let locked = false;
  let right = null;
  for (const { pet, spot } of t.pets) {
    const b = petButton(ctx, pet, spot);
    if (pet === t.pets[0].pet) right = b;
    b.addEventListener("click", () => {
      if (locked) return;
      if (b !== right) {
        shake(b);
        ctx.miss(S.miss(name(ctx, pet), L.where[wordOf(spot, t.level)]));
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(S.done(name(ctx, pet), L.where[t.asked]));
    });
    scene.append(b);
  }
  host.append(scene);
  ctx.tell(S.ask(L.where[t.asked]));
  return {
    hint() {
      scene.classList.add("show-" + (t.asked === "neben" ? "sides" : t.asked));
      return S.hint(L.where[t.asked]);
    },
  };
}

// ---------- Machen: an animal waits. Tap the place where it goes.

export function machen(host, t, ctx) {
  const L = ctx.T.lage;
  const M = L.machen;
  const scene = room();
  const waiting = el("div", "lage-waiting pop", ICONS[t.pet]);
  let locked = false;
  for (const spot of t.spots) {
    const b = button(`lage-slot at-${spot}`, L.where[spot] ?? L.where.neben);
    b.addEventListener("click", () => {
      if (locked) return;
      if (!fits(spot, t.asked)) {
        shake(b);
        ctx.miss(M.miss(L.where[wordOf(spot, t.level)]));
        return;
      }
      locked = true;
      b.classList.add("filled");
      b.textContent = ICONS[t.pet];
      waiting.classList.add("gone");
      ctx.solved(M.done(name(ctx, t.pet), L.where[t.asked]));
    });
    scene.append(b);
  }
  host.append(waiting, scene);
  ctx.tell(M.ask(name(ctx, t.pet), L.to[t.asked]));
  return {
    hint() {
      scene.classList.add("show-" + (t.asked === "neben" ? "sides" : t.asked));
      return M.hint(L.where[t.asked]);
    },
  };
}

// ---------- Forschen: where is the rabbit? Pick the word.

export function forschen(host, t, ctx) {
  const L = ctx.T.lage;
  const F = L.forschen;
  const scene = room();
  for (const { pet, spot } of t.pets) {
    const b = petButton(ctx, pet, spot);
    b.tabIndex = -1;
    if (pet !== t.pets[0].pet) b.classList.add("quiet");
    else b.classList.add("asked");
    scene.append(b);
  }
  let locked = false;
  const words = wordRow(ctx, t.choices, (w, b) => {
    if (locked) return;
    if (w !== t.answer) {
      shake(b);
      b.disabled = true;
      ctx.miss(F.miss(name(ctx, t.pets[0].pet), L.where[w]));
      return;
    }
    locked = true;
    b.classList.add("right");
    ctx.solved(F.done(name(ctx, t.pets[0].pet), L.where[t.answer]));
  });
  host.append(scene, words);
  ctx.tell(F.ask(name(ctx, t.pets[0].pet)));
  return {
    hint() {
      shake(scene.querySelector(".asked"));
      return F.hint;
    },
  };
}

// ---------- Anwenden: the bench. Who sits between the cat and the dog?

export function anwenden(host, t, ctx) {
  const L = ctx.T.lage;
  const A = L.anwenden;
  const scene = el("div", "scene card bench-scene");
  const row = el("div", "bench-row");
  const plank = el("div", "bench-plank");
  let locked = false;
  const names = t.of.map((i) => dat(ctx, t.pets[i]));
  const question = t.ask === "zwischen" ? A.between(names[0], names[1]) : t.ask === "links" ? A.leftOf(names[0]) : A.rightOf(names[0]);
  const buttons = t.pets.map((pet, i) => {
    const b = button("lage-pet on-bench", name(ctx, pet), ICONS[pet]);
    b.addEventListener("click", () => {
      if (locked) return;
      if (i !== t.target) {
        shake(b);
        ctx.miss(t.of.includes(i) ? A.missNamed(name(ctx, pet)) : A.miss);
        return;
      }
      locked = true;
      b.classList.add("right");
      const nm = name(ctx, pet);
      ctx.solved(t.ask === "zwischen" ? A.isBetween(nm, names[0], names[1]) : t.ask === "links" ? A.isLeftOf(nm, names[0]) : A.isRightOf(nm, names[0]));
    });
    row.append(b);
    return b;
  });
  scene.append(row, plank);
  host.append(scene);
  ctx.tell(question);
  return {
    hint() {
      for (const i of t.of) buttons[i].classList.add("named");
      return t.ask === "zwischen" ? A.hintBetween : A.hintSide;
    },
  };
}

// ---------- Prüfen: the owl says where the animal is. Is it right? If not: where is it really?

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const L = T.lage;
  const P = L.pruefen;
  const scene = room();
  scene.classList.add("owl-room");
  const talk = el("div", "talk");
  const bubble = el("div", "bubble", `${ICONS[t.pets[0].pet]} ${L.words[t.said]}`);
  talk.append(el("span", "owl", "🦉"), bubble);
  for (const { pet, spot } of t.pets) {
    const b = petButton(ctx, pet, spot);
    b.tabIndex = -1;
    if (pet !== t.pets[0].pet) b.classList.add("quiet");
    else b.classList.add("asked");
    scene.append(b);
  }
  let locked = false;
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  const pet = name(ctx, t.pets[0].pet);
  const fixer = wordRow(ctx, t.choices, (w, b) => {
    if (locked) return;
    if (w !== t.answer) return void (shake(b), (b.disabled = true), ctx.miss(P.fixMiss(pet, L.where[w])));
    locked = true;
    b.classList.add("right");
    bubble.textContent = `${ICONS[t.pets[0].pet]} ${L.words[t.answer]}`;
    bubble.classList.remove("wrong");
    ctx.solved(P.fixed(pet, L.where[t.answer]));
  });
  fixer.hidden = true;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(P.lookAgain));
    locked = true;
    ctx.solved(P.right(pet, L.where[t.answer]));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(P.lookAgain));
    judge.hidden = true;
    fixer.hidden = false;
    bubble.classList.add("wrong");
    ctx.tap();
    ctx.tell(P.fix(pet));
  });
  host.append(talk, scene, judge, fixer);
  ctx.tell(P.question(pet, L.where[t.said]));
  return {
    hint() {
      shake(scene.querySelector(".asked"));
      return P.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
