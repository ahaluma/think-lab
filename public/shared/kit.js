// Think Lab kit: small helpers every game can import.
// No libraries: only what the browser already has (speech, Web Audio, localStorage).
//
//   import { say, sound, celebrate, shuffle, randInt, pick, store, icons } from "../../shared/kit.js";
//
// Texts and languages: shared/i18n.js. Progress report: shared/progress.js.

import { LANGS, lang } from "./i18n.js";
export { store } from "./store.js";

// ---------- Speech (in the language of this device, see i18n.js) ----------

let voice = null;
const voiceLang = LANGS[lang].voice; // e.g. "de-DE"

function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  const short = voiceLang.slice(0, 2);
  voice =
    voices.find((v) => v.lang === voiceLang && v.localService) ||
    voices.find((v) => v.lang === voiceLang) ||
    voices.find((v) => v.lang.startsWith(short)) ||
    null;
}

if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener("voiceschanged", pickVoice);
}

/** Read a sentence out loud. Stops whatever was being said before. */
export function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voiceLang;
  if (voice) u.voice = voice;
  u.rate = 0.9; // a little slower for small children
  u.pitch = 1.1;
  speechSynthesis.speak(u);
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
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  again: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
};
