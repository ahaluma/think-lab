// A number pad for typed answers (older children: profiles.typeAnswers). No phone keyboard pops up:
// big buttons 1–9, 0, delete and check, and the digits of this language (Nepali: ०–९). A real keyboard
// works too (digits, Backspace, Enter).
//
//   import { numpad } from "/shared/numpad.js";
//   const pad = numpad(container, T, { digits: 3, onCheck: (n) => right?, display });
//   display: optional element that shows the typed number, e.g. the "?" box in "38 + 27 = ?".
//            Without it the pad shows its own box above the keys.
//   pad.clear()      → empty again (after a wrong answer)
//   pad.lock(true)   → no input while the voice speaks or the task changes
//   pad.show(n)      → shows n (the right answer, in green)
//   pad.remove()     → removes the keyboard listener (before a new pad)

import { num } from "./i18n.js";
import { icons } from "./kit.js";

export function numpad(container, T, { digits = 2, onCheck, display = null }) {
  let typed = "";
  let locked = false;
  container.innerHTML = "";
  container.className = "numpad-box";

  const own = !display;
  if (own) {
    display = document.createElement("output");
    display.className = "numpad-display";
    container.append(display);
  }
  display.setAttribute("aria-label", T.yourAnswer);
  display.setAttribute("aria-live", "polite");
  const baseClass = display.className;

  const keys = document.createElement("div");
  keys.className = "numpad";
  const key = (label, cls, aria, action) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn key " + cls;
    b.innerHTML = label;
    if (aria) b.setAttribute("aria-label", aria);
    b.addEventListener("click", action);
    keys.append(b);
    return b;
  };
  // Two rows, so the task above stays in view: 1 2 3 4 5 ⌫ / 6 7 8 9 0 ✓
  for (const d of [1, 2, 3, 4, 5]) key(num(d), "digit", null, () => press(String(d)));
  const erase = key("⌫", "erase", T.erase, () => press("back"));
  for (const d of [6, 7, 8, 9, 0]) key(num(d), "digit", null, () => press(String(d)));
  const check = key(icons.check, "check ok", T.check, () => press("enter"));

  function draw(state = "") {
    display.textContent = typed ? num(Number(typed)) : "?";
    display.className = `${baseClass} ${typed ? "typed" : ""} ${state}`;
    check.disabled = !typed || locked;
    erase.disabled = !typed || locked;
  }

  function press(k) {
    if (locked) return;
    if (k === "back") typed = typed.slice(0, -1);
    else if (k === "enter") {
      if (!typed) return;
      const n = Number(typed);
      if (onCheck(n) === false) {
        display.classList.remove("shake");
        void display.offsetWidth; // restart the animation
        display.classList.add("shake");
      }
      return;
    } else if (typed.length < digits) typed = typed === "0" ? k : typed + k;
    draw();
  }

  function onKey(e) {
    if (e.key >= "0" && e.key <= "9") press(e.key);
    else if (e.key === "Backspace") press("back");
    else if (e.key === "Enter") press("enter");
    else return;
    e.preventDefault();
  }
  document.addEventListener("keydown", onKey);

  container.append(keys);
  draw();

  return {
    clear() {
      typed = "";
      draw();
    },
    lock(on) {
      locked = on;
      draw();
    },
    show(n) {
      typed = String(n);
      draw("right");
    },
    remove() {
      document.removeEventListener("keydown", onKey);
    },
  };
}
