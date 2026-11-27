// Speaking and showing a sentence. Every sentence is always shown as a caption, so a child (or a
// parent) can read it when the phone has no voice for the language. Reading aloud by itself depends
// on the child (profiles.readAloud: off from 8 years, the parents decide); the 🔊 button always reads.
//
//   import { mount, tell, again } from "../frame/voice.js";
//   mount(captionElement);   once
//   await tell("Wie viele sind im Bau?");
//   tell(text, "");          speak only: the board shows the text itself (Denk-Berg: the question box)
//   ask(q, text, shown)      a part of the question: into the question box q (frame/question.js),
//                            the board takes no taps while it is read
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

/** Reads text aloud (if on). said: the voice alone, or null; done: also the time to read or look,
 *  when the phone has no voice and say() comes back at once. */
function voice(text) {
  const pause = new Promise((resolve) => setTimeout(resolve, Math.min(2500, 600 + text.length * 25)));
  const said = aloud ? say(text) : null;
  return { said, done: said ? Promise.all([said, pause]) : pause };
}

export function tell(text, shown = text) {
  last = text;
  if (caption) caption.textContent = shown;
  return voice(text).done;
}

/** A part of the question: shown in the question box, the caption is free for what comes after. */
export function ask(q, text, shown = text) {
  if (caption) caption.textContent = "";
  const { said, done } = voice(text);
  q.take(shown, said);
  last = q.text || text; // 🔊 reads the whole question
  return done;
}

export function again() {
  return last ? say(last) : Promise.resolve();
}
