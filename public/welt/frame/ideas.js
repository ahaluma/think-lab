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
//
// A second world grows next to it: the thinking mountain (welt/berg/), for Mathe-Olympiade training.
// Its places are camps on the way up (MOUNTAIN). Each camp gives one thinking tool, and the camps
// higher up need the tools from below. A camp opens when the camps it needs are mastered.

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
  luecken: "🪵",
};

/** The six places. awake: false = drawn on the map, but nothing to play there yet.
 *  games: games from catalog.js that live at this place as they are (their own page, their own levels):
 *  games to play together, like the memory game. The map shows them below the five perspectives. */
export const PLACES = [
  { id: "zahlen", awake: true, ideas: ["zahl"], games: ["zahlen-memory"] },
  { id: "teile", awake: true, ideas: ["teile"] },
  { id: "gruppen", awake: true, ideas: ["gruppen"] },
  { id: "regeln", awake: true, ideas: ["muster"] },
  { id: "raum", awake: false },
  { id: "daten", awake: false },
];

/** The camps of the thinking mountain, from the foot to the top, four heights of three camps each.
 *  ideas: the idea of a camp that is built (a camp without one is drawn, but still being built).
 *  needs: the camps a child must have mastered before this one opens (record.mastered: three of the
 *  five perspectives understood). The summit needs every camp. Each camp only needs camps below it,
 *  and its rounds mix in tasks from the camps the child already has (the backpack, spiel/spiel.js). */
export const MOUNTAIN = [
  { id: "zaun", height: 1, ideas: ["zaun"] },
  { id: "haken", height: 1, needs: ["zaun"], ideas: ["haken"] },
  { id: "huetten", height: 1, needs: ["haken"], ideas: ["huetten"] },
  { id: "vorrat", height: 2, needs: ["huetten"], ideas: ["vorrat"] },
  { id: "ameisen", height: 2, needs: ["zaun"], ideas: ["ameisen"] },
  { id: "waage", height: 2, needs: ["vorrat"], ideas: ["waage"] },
  { id: "stall", height: 3, needs: ["huetten", "waage"] },
  { id: "tanz", height: 3, needs: ["ameisen"] },
  { id: "fels", height: 3, needs: ["haken"] },
  { id: "socken", height: 4, needs: ["huetten", "tanz"] },
  { id: "steine", height: 4, needs: ["vorrat", "tanz"] },
  { id: "mauer", height: 4, needs: ["vorrat", "waage"] },
];

/** The camp an idea belongs to (or undefined for an idea of the nature world). */
export const campOf = (idea) => MOUNTAIN.find((c) => c.ideas?.includes(idea));

/**
 * Ideas. world: "berg" for an idea of the thinking mountain (its map is welt/berg/, its place is a camp). ranges: smallest first. tasks: how many tasks a round has in each perspective (default 5).
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
  // The thinking mountain (for 9 to 12), camp 1: posts and gaps. Here the range is a level:
  // 1 long fences, 2 with metres (and bells, towers), 3 backwards and with time, 4 masters (a field
  // with corners, time backwards). Level 4 is the hardest this family gets for 12-year-olds.
  // startAt: every child starts at this level, whatever the age (the mountain is climbed from below).
  zaun: { place: "zaun", world: "berg", ranges: [1, 2, 3, 4], startAt: 0, cards: { sehen: "luecken", anwenden: "luecken" } },
  // Camp 2: count every possibility, in order (combinations, tournaments, ways in a grid).
  haken: { place: "haken", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 3: logic puzzles, solved by ruling out (each one checked by a solver: exactly one solution).
  huetten: { place: "huetten", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 4: think backwards (undo every step, the last one first).
  vorrat: { place: "vorrat", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 5: find the rule of a row and jump far ahead (sequences, matches, days of the week, sums).
  ameisen: { place: "ameisen", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 6: what weighs the same can take the other's place (scales, sums and differences, weights).
  waage: { place: "waage", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
};

/** The map an idea lives on: "/welt/" or "/welt/berg/". */
export const mapOf = (idea) => (IDEAS[idea]?.world ? `/welt/${IDEAS[idea].world}/` : "/welt/");

/** The thinking card a round of this idea in this perspective gives. */
export const cardOf = (idea, p) => IDEAS[idea]?.cards?.[p] ?? perspective(p)?.card ?? null;

export const ROUND_TASKS = 5;
export function perspective(id) {
  return PERSPECTIVES.find((p) => p.id === id) || null;
}
