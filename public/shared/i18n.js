// Languages. Every text a child hears or a parent reads lives in a language file:
//
//   shared/lang/<code>.js        words every page needs (numbers, praise, button labels)
//   games/<game>/lang/<code>.js  sentences only this game needs
//
// A page loads its texts once:   const T = await texts(import.meta.url);
// Missing in the chosen language? The German text is used instead.
//
// To add a language: add it to LANGS, then add a lang/<code>.js file next to every lang/de.js.
// As soon as LANGS has two languages, the start page shows a language switch.

import { store } from "./store.js";

export const LANGS = {
  de: { name: "Deutsch", flag: "🇩🇪", voice: "de-DE" },
  en: { name: "English", flag: "🇬🇧", voice: "en-GB" },
};

export const DEFAULT_LANG = "de";

function detect() {
  const saved = store.get("lang", null);
  if (saved && LANGS[saved]) return saved;
  for (const l of navigator.languages || [navigator.language || ""]) {
    const code = l.slice(0, 2).toLowerCase();
    if (LANGS[code]) return code;
  }
  return DEFAULT_LANG;
}

/** The language of this device, for example "de". */
export const lang = detect();
document.documentElement.lang = lang;

/** Choose a language for this device and reload the page in it. */
export function setLang(code) {
  if (!LANGS[code] || code === lang) return;
  store.set("lang", code);
  location.reload();
}

async function load(path, base) {
  try {
    return (await import(new URL(path, base).href)).default;
  } catch {
    return {}; // no file for this language: fine, German fills the gaps
  }
}

/**
 * All texts for one page: shared words plus the page's own lang/ folder,
 * in the chosen language with German as fallback.
 * `pageUrl` is the calling module's import.meta.url. Leave it out for the shared words only.
 */
export async function texts(pageUrl) {
  const codes = lang === DEFAULT_LANG ? [DEFAULT_LANG] : [DEFAULT_LANG, lang];
  const bases = pageUrl ? [import.meta.url, pageUrl] : [import.meta.url];
  const parts = await Promise.all(codes.flatMap((code) => bases.map((base) => load(`./lang/${code}.js`, base))));
  return Object.assign({}, ...parts);
}

/** Pick the right language from an object like { de: "Zählen", en: "Counting" }. */
export function local(names) {
  return names[lang] ?? names[DEFAULT_LANG];
}

/**
 * Put texts into the HTML:
 *   <h1 data-t="title"></h1>                    → text
 *   <button data-t-label="readAgain"></button>  → aria-label (for screen readers)
 */
export function fill(T, root = document) {
  for (const el of root.querySelectorAll("[data-t]")) {
    if (T[el.dataset.t] !== undefined) el.textContent = T[el.dataset.t];
  }
  for (const el of root.querySelectorAll("[data-t-label]")) {
    if (T[el.dataset.tLabel] !== undefined) el.setAttribute("aria-label", T[el.dataset.tLabel]);
  }
}
