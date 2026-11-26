// Small building blocks every board uses: elements, a group of pictures, the sign that shows a
// number with its dots, the number buttons. No game logic here.
//
//   import { el, button, group, sign, strip, shake, wait } from "../../frame/parts.js";

export const el = (tag, className = "", text) => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

export const button = (className, label, text) => {
  const b = el("button", className, text);
  b.type = "button";
  if (label) b.setAttribute("aria-label", label);
  return b;
};

/** n pictures, at most five in a row, so 5 and 10 are easy to see. */
export function group(n, icon, className = "") {
  const g = el("span", "pics " + className);
  for (let i = 0; i < n; i++) g.append(el("span", "pic pop", icon));
  return g;
}

/** A sign that shows the whole: the number and that many dots in rows of five. */
export function sign(ctx, n) {
  const s = el("div", "sign");
  s.append(el("b", "", ctx.num(n)));
  const dots = el("span", "sign-dots");
  for (let i = 0; i < n; i++) dots.append(el("i"));
  s.append(dots);
  return s;
}

/** Number buttons from..to in rows of five. onPick(n, button). */
export function strip(ctx, from, to, onPick) {
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

export function shake(node) {
  node.classList.remove("shake");
  void node.offsetWidth; // restart the animation
  node.classList.add("shake");
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
