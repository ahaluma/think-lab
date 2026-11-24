// Think Lab kit: small helpers every game can import.
// No libraries: only what the browser already has (speech, Web Audio, localStorage).
//
//   import { say, sound, celebrate, shuffle, randInt, store, icons } from "../../shared/kit.js";

// ---------- Speech (German voice) ----------

let germanVoice = null;

function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  germanVoice =
    voices.find((v) => v.lang === "de-DE" && v.localService) ||
    voices.find((v) => v.lang === "de-DE") ||
    voices.find((v) => v.lang.startsWith("de")) ||
    null;
}

if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener("voiceschanged", pickVoice);
}

/** Read a German sentence out loud. Stops whatever was being said before. */
export function say(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  if (germanVoice) u.voice = germanVoice;
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

/** Returns a new array in random order. */
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Remember small things (like a level) on this device. Never throws. */
export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("thinklab:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("thinklab:" + key, JSON.stringify(value));
    } catch {
      /* private mode or storage full: the game still works */
    }
  },
};

/** German words for numbers, for speaking. */
export const NUMBER_WORDS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"];

/** Inline SVG icons, so there are no image files to load. */
export const icons = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  again: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
};
