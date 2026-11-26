// The boards of camp 6, "Ersetzen" (welt/berg/). Verstehen, Regel finden (the table), Übertragen
// and Begründen are the shared camp boards (berg/camp.js). This camp's own:
//
//   picture  scales in balance: what is on the left weighs as much as what is on the right
//   machen   Ausprobieren: put small things on the scale until it is level (levels 1, 2), or put
//            the weights 1, 3, 9 kg left or right of a package until it is level (levels 3, 4)
//
// Texts: welt/lang/<language>.js under "waage".

import { el, button } from "../../frame/parts.js";
import * as kit from "../../berg/kit.js";
import { campBoards, solvedBy, args } from "../../berg/camp.js";
import { DIGITS, THINGS, WEIGHTS } from "./tasks.js";

export const TOOLS = { ersetzen: "🔄", zwei: "⚖️", abziehen: "➖", summe: "➗", drei: "🔺", kette: "⛓️", gewichte: "🏋️", rueck: "⏪", probe: "🧪", bild: "📊", tabelle: "📋" };

const SHOWN = 6;
/** One side of a scale: [[thing, count], …] as icons ("?" is the unknown), or weights in kg. */
function side(ctx, pan, items = [], weights = []) {
  pan.textContent = "";
  for (const [thing, n] of items) {
    const icon = thing === "?" ? "❓" : THINGS[thing];
    if (n > SHOWN) {
      const group = el("span", "scale-many");
      group.append(el("span", "", icon), el("b", "", `× ${ctx.num(n)}`));
      pan.append(group);
    } else for (let i = 0; i < n; i++) pan.append(el("span", "scale-thing", icon));
  }
  for (const w of weights) pan.append(el("span", "scale-weight", ctx.T.waage.kg(ctx.num(w))));
}

/** A scale: tilt < 0 left down, 0 level, > 0 right down. */
function scale(ctx) {
  const box = el("div", "scale");
  const beam = el("div", "scale-beam");
  const pans = el("div", "scale-pans");
  const left = el("div", "scale-pan");
  const right = el("div", "scale-pan");
  pans.append(left, right);
  box.append(pans, beam, el("div", "scale-foot"));
  return {
    box,
    left,
    right,
    tilt(t) {
      const s = Math.sign(t);
      box.dataset.tilt = s < 0 ? "left" : s > 0 ? "right" : "level";
    },
  };
}

function picture(ctx, pic) {
  const scene = el("div", "scene card camp-scene scales-scene");
  for (const [l, r] of pic?.scales ?? []) {
    const s = scale(ctx);
    side(ctx, s.left, l);
    side(ctx, s.right, r);
    s.tilt(0);
    scene.append(s.box);
  }
  if (pic?.weights) {
    const s = scale(ctx);
    side(ctx, s.left, [["paket", 1]], pic.weights.left);
    side(ctx, s.right, [], pic.weights.right);
    s.tilt(0);
    scene.append(s.box);
  }
  return scene;
}

function machen(host, t, ctx) {
  const W = ctx.T.waage;
  const M = W.machen;
  const win = solvedBy(ctx, "waage", TOOLS);
  const a = args(ctx, t);
  const scene = el("div", "scene card camp-scene scales-scene");
  const status = el("p", "scale-status");

  if (t.mode === "fill") {
    // The rule (1 big = k small) small at the top, then the scale to fill.
    const rule = scale(ctx);
    rule.box.classList.add("small");
    side(ctx, rule.left, [[t.a.big, 1]]);
    side(ctx, rule.right, [[t.a.small, t.a.k]]);
    rule.tilt(0);
    const s = scale(ctx);
    side(ctx, s.left, [[t.a.big, t.a.nb], [t.a.small, t.a.ns]]);
    scene.append(rule.box, s.box, status);
    let n = 0;
    let done = false;
    const heavy = t.a.nb * t.a.k + t.a.ns;
    const show = () => {
      side(ctx, s.right, [[t.a.small, n]]);
      s.tilt(n - heavy);
      status.textContent = n < heavy ? M.leftDown : n > heavy ? M.rightDown : M.level;
      if (n === heavy && !done) {
        done = true;
        win(host, t, M.filled(a));
      }
    };
    const row = el("div", "find-row");
    const add = button("btn find-btn", M.add, `+ ${THINGS[t.a.small]}`);
    const take = button("btn find-btn", M.take, `− ${THINGS[t.a.small]}`);
    add.addEventListener("click", () => {
      if (done) return;
      ctx.tap();
      n++;
      show();
    });
    take.addEventListener("click", () => {
      if (done || !n) return;
      ctx.tap();
      n--;
      show();
    });
    row.append(take, add);
    host.append(scene, row);
    show();
    kit.question(host, M.fillText(a), M.fillAsk(a));
    ctx.ready();
    ctx.tell(`${M.fillText(a)} ${M.fillAsk(a)}`, "");
    return { hint: () => M.fillHint(a) };
  }

  // Weights: each one is off, on the right, or next to the package on the left.
  const s = scale(ctx);
  scene.append(s.box, status);
  const where = Object.fromEntries(WEIGHTS.map((w) => [w, "off"]));
  const NEXT = { off: "right", right: "left", left: "off" };
  let done = false;
  const row = el("div", "find-row");
  const buttons = WEIGHTS.map((w) => {
    const b = button("btn find-btn weight-btn", M.kgLong(ctx.num(w)), "");
    b.addEventListener("click", () => {
      if (done) return;
      ctx.tap();
      where[w] = NEXT[where[w]];
      show();
    });
    row.append(b);
    return b;
  });
  const show = () => {
    const on = (p) => WEIGHTS.filter((w) => where[w] === p);
    side(ctx, s.left, [[t.a.thing, 1]], on("left"));
    side(ctx, s.right, [], on("right"));
    const diff = on("right").reduce((x, w) => x + w, 0) - on("left").reduce((x, w) => x + w, 0) - t.a.n;
    s.tilt(diff);
    buttons.forEach((b, i) => {
      b.textContent = "";
      b.append(el("b", "", W.kg(ctx.num(WEIGHTS[i]))), el("small", "", M.where[where[WEIGHTS[i]]]));
      b.classList.toggle("on", where[WEIGHTS[i]] !== "off");
    });
    status.textContent = diff < 0 ? M.leftDown : diff > 0 ? M.rightDown : M.level;
    if (diff === 0 && !done) {
      done = true;
      win(host, t, M.weighed(a));
    }
  };
  host.append(scene, row);
  show();
  kit.question(host, M.weightsText(a), M.weightsAsk);
  ctx.ready();
  ctx.tell(`${M.weightsText(a)} ${M.weightsAsk}`, "");
  return { hint: () => M.weightsHint };
}

export const BOARDS = campBoards("waage", { TOOLS, DIGITS, machen, picture });
