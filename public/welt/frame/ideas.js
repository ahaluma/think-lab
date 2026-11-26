// The grid of the new AnkaPlay: places → ideas → perspectives. Only data.
//
//   Place       – one piece of the nature world on the map (welt/index.html).
//   Idea        – one core mathematical idea. It lives in welt/ideas/<id>/ (tasks.js, boards.js).
//   Perspective – one of five ways to play an idea. The same five everywhere, with a fixed symbol.
//   Range       – how big the numbers are: up to 5, 10 or 20. The same idea comes back with bigger
//                 numbers. Up to 10 the number buttons carry dots; up to 20 they show digits only.
//
// Four places are awake: the meadow with the idea "zahl" (a number says how many), the burrow with
// "teile" (numbers are made of numbers), the forest with "muster" (a row goes on, because one piece
// comes again and again) and the fruit tree with "gruppen" (groups of the same size, sharing fairly).
// The other places are on the map, asleep.

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
  teilen: "🤝",
  wiederholen: "🔁",
};

/** The six places. awake: false = drawn on the map, but nothing to play there yet. */
export const PLACES = [
  { id: "zahlen", awake: true, ideas: ["zahl"] },
  { id: "teile", awake: true, ideas: ["teile"] },
  { id: "gruppen", awake: true, ideas: ["gruppen"] },
  { id: "regeln", awake: true, ideas: ["muster"] },
  { id: "raum", awake: false },
  { id: "daten", awake: false },
];

/**
 * Ideas. ranges: smallest first. tasks: how many tasks a round has in each perspective (default 5).
 * cards: the thinking card of a perspective, where the usual one (PERSPECTIVES) does not fit the idea.
 */
export const IDEAS = {
  zahl: { place: "zahlen", ranges: [5, 10, 20], cards: { machen: "nachpruefen", anwenden: "vergleichen" } },
  teile: { place: "teile", ranges: [5, 10, 20], tasks: { forschen: 3 } },
  // Here the range is not the size of the numbers but the length of the piece that comes again: 2, 3 or 4 things.
  muster: {
    place: "regeln",
    ranges: [5, 10, 20],
    cards: { sehen: "wiederholen", machen: "wiederholen", forschen: "wiederholen", anwenden: "vergleichen", pruefen: "vergleichen" },
  },
  // Here the range is how many things there are to share in all: up to 6, 10 or 20.
  gruppen: { place: "gruppen", ranges: [5, 10, 20], cards: { sehen: "teilen", machen: "teilen", anwenden: "teilen" } },
};

/** The thinking card a round of this idea in this perspective gives. */
export const cardOf = (idea, p) => IDEAS[idea]?.cards?.[p] ?? perspective(p)?.card ?? null;

export const ROUND_TASKS = 5;
export function perspective(id) {
  return PERSPECTIVES.find((p) => p.id === id) || null;
}
