// AnkaPlay kit: small helpers every game can import.
// No libraries: only what the browser already has (speech, Web Audio, localStorage).
//
//   import { say, sound, celebrate, shuffle, randInt, pick, store, icons, homeButton } from "../../shared/kit.js";
//
// Texts and languages: shared/i18n.js. Progress report: shared/progress.js.

import { LANGS, lang } from "./i18n.js";
import * as profiles from "./profiles.js";
export { store } from "./store.js";

// ---------- Speech (in the language of this device, see i18n.js) ----------

let voice = null;
const wanted = [LANGS[lang].voice, ...(LANGS[lang].fallbackVoices || [])]; // e.g. ["ne-NP", "hi-IN"]

function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  voice = null;
  for (const code of wanted) {
    voice =
      voices.find((v) => v.lang.replace("_", "-") === code && v.localService) ||
      voices.find((v) => v.lang.replace("_", "-") === code) ||
      voices.find((v) => v.lang.startsWith(code.slice(0, 2))) ||
      null;
    if (voice) return;
  }
}

if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener("voiceschanged", pickVoice);
}

/**
 * Read a sentence out loud. Stops whatever was being said before.
 * Returns a promise that resolves when the voice is done, so a game can move on
 * right after the sentence instead of waiting a fixed time.
 */
export function say(text) {
  const done = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  if (!("speechSynthesis" in window)) return done(1200);

  // Only cancel when something is playing: on Android, cancel() on an idle voice
  // adds a noticeable pause before the next sentence starts.
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice ? voice.lang : wanted[0];
  if (voice) u.voice = voice;
  u.rate = 0.9; // a little slower for small children
  u.pitch = 1.1;

  const ended = new Promise((resolve) => {
    u.onend = resolve;
    u.onerror = resolve;
  });
  speechSynthesis.speak(u);
  // Some phones never fire "end": never wait longer than the sentence could take.
  return Promise.race([ended, done(1500 + text.length * 90)]);
}

// ---------- Sounds (made with Web Audio, no sound files to download) ----------

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, duration, type = "sine", volume = 0.2) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sound = {
  /** Short pop for any tap. */
  tap() {
    tone(660, 0, 0.08, "triangle", 0.15);
  },
  /** Happy rising notes for a right answer. */
  right() {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.22, "triangle", 0.2));
  },
  /** Soft, friendly low note for a wrong answer (never scary). */
  wrong() {
    tone(220, 0, 0.25, "sine", 0.18);
    tone(196, 0.12, 0.3, "sine", 0.15);
  },
  /** Little fanfare when a round is finished. */
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, "triangle", 0.2));
  },
};

// ---------- Confetti ----------

const COLORS = ["#ff5a36", "#ffc83a", "#12a564", "#2456b8", "#e8488a"];

export function celebrate(pieces = 60) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < pieces; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = COLORS[i % COLORS.length];
    el.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    el.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.append(el);
    el.addEventListener("animationend", () => el.remove());
  }
}

// ---------- Small helpers ----------

/** Whole number from min to max, both included. */
export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** One random item of a list. */
export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// The last pick per list, so oneOf() never says the same thing twice in a row.
const lastPick = new WeakMap();

/** A random item of the list, but not the same as last time (for praise and hints). */
export function oneOf(list) {
  let item;
  do item = pick(list);
  while (list.length > 1 && item === lastPick.get(list));
  lastPick.set(list, item);
  return item;
}

/** Returns a new array in random order. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Inline SVG icons, so there are no image files to load. */
export const icons = {
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-5"/><path d="M12 16V6"/><path d="M17 16v-8"/></svg>',
  parents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8.5" cy="5.5" r="2.6"/><path d="M4 21v-7.5a4.5 4.5 0 0 1 9 0V21"/><circle cx="17.5" cy="10.5" r="2"/><path d="M14.5 21v-4a3 3 0 0 1 6 0v4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  again: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
};

/**
 * The button in the top left corner of every game: the child's animal and name.
 * Tapping it goes back to "Wer spielt?" on the start page. Without children: a house.
 */
export function homeButton(el) {
  const kid = profiles.current();
  if (!kid) {
    el.innerHTML = icons.home;
    return;
  }
  el.classList.add("who");
  el.href = "/?wer";
  el.innerHTML = "";
  const animal = document.createElement("span");
  animal.className = "who-animal";
  animal.setAttribute("aria-hidden", "true");
  animal.textContent = kid.animal;
  el.append(animal);
  if (kid.name) {
    const name = document.createElement("span");
    name.className = "who-name";
    name.textContent = kid.name;
    el.append(name);
  }
  el.setAttribute("aria-label", `${kid.name || kid.animal} · ${el.getAttribute("aria-label") || ""}`);
}
