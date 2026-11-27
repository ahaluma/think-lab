// Pictures of numbers and tasks at the market: from the thing to the picture to the number.
// Up to 20: dots in ten-frames (rows of five, so 5 and 10 are seen at a glance). Above 20:
// hundreds plates, tens sticks and ones dots. Times: rows of the same size (an egg box). Divide:
// bags of the same size. Only DOM, no texts.
//
//   import { picture, material, el } from "./picture.js";
//   picture(t)                 → the picture of a task (help after the second miss, "see", …)
//   material(n, { range, add, take, cls }) → n as dots or blocks (the board "make" redraws it)

export function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Ten-frames: dots coloured by parts, e.g. [{ n: 8, cls: "a" }, { n: 5, cls: "b" }]. */
export function frames(parts, size = 20) {
  const total = Math.max(size, parts.reduce((s, p) => s + p.n, 0));
  const box = el("div", "frames");
  const dots = parts.flatMap((p) => Array.from({ length: p.n }, () => p.cls));
  for (let f = 0; f < Math.ceil(total / 10); f++) {
    const frame = el("div", "frame");
    for (let i = 0; i < 10; i++) frame.append(el("i", dots[f * 10 + i] ?? "empty"));
    box.append(frame);
  }
  return box;
}

/** Place-value blocks: hundreds plates, tens sticks, ones dots. */
export function blocks(n, cls = "") {
  const box = el("div", `blocks ${cls}`);
  const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
  const group = (count, kind) => {
    if (!count) return;
    const g = el("div", `bgroup ${kind}`);
    for (let i = 0; i < count; i++) g.append(el("i", kind));
    box.append(g);
  };
  group(h, "hundred");
  group(t, "ten");
  group(o, "one");
  if (!n) box.append(el("span", "zero", "0"));
  return box;
}

/** A number as material that fits its range. */
export function material(n, { range = 20, cls = "a" } = {}) {
  return range <= 20 && n <= 20 ? frames([{ n, cls }], range <= 10 ? 10 : 20) : blocks(n, cls);
}

/** Rows of the same size: rows × cols dots (an egg box). Optional: each row in a bag. */
export function rows(count, size, { bags = false, extra = 0 } = {}) {
  const box = el("div", `dot-rows${bags ? " bags" : ""}`);
  for (let r = 0; r < count; r++) {
    const row = el("div", "row");
    for (let i = 0; i < size; i++) row.append(el("i", "a"));
    box.append(row);
  }
  if (extra) {
    const left = el("div", "row rest");
    for (let i = 0; i < extra; i++) left.append(el("i", "b"));
    box.append(left);
  }
  return box;
}

/** Groups of the same size with blocks inside (times with bigger numbers). */
export function groups(count, size) {
  const box = el("div", "groups");
  for (let g = 0; g < count; g++) {
    const one = el("div", "group");
    one.append(blocks(size));
    box.append(one);
  }
  return box;
}

const sign = (s) => el("span", "pic-sign", s);

/** The picture of a task. */
export function picture(t) {
  const box = el("div", "picture");
  const { op, a, b, c, rest } = t;
  if (op === "plus") {
    if (t.max <= 20) box.append(frames([{ n: a, cls: "a" }, { n: b, cls: "b" }], t.range <= 10 ? 10 : 20));
    else box.append(blocks(a, "a"), sign("+"), blocks(b, "b"));
  } else if (op === "minus") {
    if (t.max <= 20) box.append(frames([{ n: a - b, cls: "a" }, { n: b, cls: "a gone" }], t.range <= 10 ? 10 : 20));
    else box.append(blocks(a, "a"), sign("−"), blocks(b, "b gone"));
  } else if (op === "mal") {
    const [n, size] = b > 10 ? [a, b] : a > 10 ? [b, a] : [a, b];
    box.append(size <= 10 ? rows(n, size) : groups(n, size));
  } else {
    if (a <= 100) box.append(rows(c, b, { bags: true, extra: rest }));
    else {
      box.append(blocks(a, "a"), sign("→"));
      const bags = el("div", "bag-row");
      for (let i = 0; i < b; i++) bags.append(el("span", "bag", "🛍️"));
      box.append(bags);
    }
  }
  return box;
}
