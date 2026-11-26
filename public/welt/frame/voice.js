// Speaking and showing a sentence. Every sentence is always shown as a caption, so a child (or a
// parent) can read it when the phone has no voice for the language. Reading aloud by itself depends
// on the child (profiles.readAloud: off from 8 years, the parents decide); the 🔊 button always reads.
//
//   import { mount, tell, again } from "../frame/voice.js";
//   mount(captionElement);   once
//   await tell("Wie viele sind im Bau?");
//   tell(text, "");          speak only: the board shows the text itself (Denk-Berg: the question box)
//   again();                 the 🔊 button

import { say } from "../../shared/kit.js";
import * as profiles from "../../shared/profiles.js";

const aloud = profiles.readAloud(profiles.current());
let caption = null;
let last = "";

export function mount(el) {
  caption = el;
  caption.classList.toggle("quiet", aloud); // smaller when the voice reads anyway
}

export function tell(text, shown = text) {
  last = text;
  if (caption) caption.textContent = shown;
  // Time to read or look, also when the phone has no voice and say() comes back at once.
  const pause = new Promise((resolve) => setTimeout(resolve, Math.min(2500, 600 + text.length * 25)));
  return aloud ? Promise.all([say(text), pause]) : pause;
}

export function again() {
  return last ? say(last) : Promise.resolve();
}
