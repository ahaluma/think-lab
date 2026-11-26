// Speaking and showing a sentence. Every sentence is always shown as a caption, so a child (or a
// parent) can read it when the phone has no voice for the language. Reading aloud by itself depends
// on the child (profiles.readAloud: off from 8 years, the parents decide); the 🔊 button always reads.
//
//   import { mount, tell, again } from "../frame/voice.js";
//   mount(captionElement);   once
//   await tell("Wie viele sind im Bau?");
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

export function tell(text) {
  last = text;
  if (caption) caption.textContent = text;
  if (aloud) return say(text);
  return new Promise((resolve) => setTimeout(resolve, Math.min(2500, 600 + text.length * 25)));
}

export function again() {
  return last ? say(last) : Promise.resolve();
}
