// The grid of the new AnkaPlay: places → ideas → perspectives. Only data.
//
//   Place       – one piece of the nature world on the map (welt/index.html).
//   Idea        – one core mathematical idea. It lives in welt/ideas/<id>/ (tasks.js, boards.js).
//   Perspective – one of five ways to play an idea. The same five everywhere, with a fixed symbol.
//   Range       – how big the numbers are. The same idea comes back with bigger numbers.
//
// Two places are awake: the meadow with the idea "zahl" (a number says how many) and the burrow with
// "teile" (numbers are made of numbers). The other places are on the map, asleep.

/** The five perspectives, in the order a child meets them. card = the thinking card a round gives. */
export const PERSPECTIVES = [
  { id: "sehen", icon: "👁️", card: "vergleichen" },
  { id: "machen", icon: "✋", card: "ausprobieren" },
  { id: "forschen", icon: "🔍", card: "vorhersagen" },
  { id: "anwenden", icon: "🔑", card: "rueckwaerts" },
  { id: "pruefen", icon: "✅", card: "nachpruefen" },
];

/** Thinking cards: the move a child used. Names and sentences are in welt/lang/<language>.js (cards). */
export const CARDS = {
  vergleichen: "⚖️",
  ausprobieren: "🧪",
  vorhersagen: "🔮",
  rueckwaerts: "↩️",
  nachpruefen: "🧐",
};

/** The six places. awake: false = drawn on the map, but nothing to play there yet. */
export const PLACES = [
  { id: "zahlen", awake: true, ideas: ["zahl"] },
  { id: "teile", awake: true, ideas: ["teile"] },
  { id: "gruppen", awake: false },
  { id: "regeln", awake: false },
  { id: "raum", awake: false },
  { id: "daten", awake: false },
];

/**
 * Ideas. ranges: smallest first. tasks: how many tasks a round has in each perspective (default 5).
 * cards: the thinking card of a perspective, where the usual one (PERSPECTIVES) does not fit the idea.
 */
export const IDEAS = {
  zahl: { place: "zahlen", ranges: [5, 10], cards: { machen: "nachpruefen", anwenden: "vergleichen" } },
  teile: { place: "teile", ranges: [5, 10], tasks: { forschen: 3 } },
};

/** The thinking card a round of this idea in this perspective gives. */
export const cardOf = (idea, p) => IDEAS[idea]?.cards?.[p] ?? perspective(p)?.card ?? null;

export const ROUND_TASKS = 5;
export function perspective(id) {
  return PERSPECTIVES.find((p) => p.id === id) || null;
}
