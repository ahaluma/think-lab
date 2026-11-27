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
// A place can hold more than one idea: the burrow also holds "zehn" (two numbers that fill a ten
// together: friends of ten). The map then shows a choice of ideas at that place. The other places are
// on the map, asleep.
//
// The nature world is for preschool children (3 to 6): the basic ideas with things to see and touch,
// numbers up to 10. School children (6 to 10) train skills in the town (welt/stadt/, TOWN): tens and
// ones at the flower shop, later the number line at the station, calculating at the market (welt/markt/), later shapes and measuring in the
// workshop and data and time at the weather station.
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
  { id: "teile", awake: true, ideas: ["teile", "zehn"] },
  { id: "gruppen", awake: true, ideas: ["gruppen"] },
  { id: "regeln", awake: true, ideas: ["muster"] },
  { id: "raum", awake: false },
  { id: "daten", awake: false },
];

/** The town (welt/stadt/): the world for school children. A place holds ideas played in the rounds of
 *  welt/spiel/ (like the nature world), or leads to a world of its own (href: the market). */
export const TOWN = [
  { id: "bahnhof", awake: true, ideas: ["reihe"] },
  { id: "blumen", awake: true, ideas: ["stellen"] },
  { id: "markt", awake: true, href: "/welt/markt/" },
  { id: "werkstatt", awake: true, ideas: ["formen"] },
  { id: "wetter", awake: true, ideas: ["zeit"] },
];

/** The camps of the thinking mountain, from the foot to the top, four heights of three camps each.
 *  ideas: the idea of a camp that is built (a camp without one is drawn, but still being built).
 *  needs: the camps a child must have mastered before this one opens (record.mastered: all five
 *  perspectives have their star, one round of 4 of 5 right the first time each). The summit needs every camp. Each camp only needs camps below it,
 *  and its rounds mix in tasks from the camps the child already has (the backpack, spiel/spiel.js). */
export const MOUNTAIN = [
  { id: "zaun", height: 1, ideas: ["zaun"] },
  { id: "haken", height: 1, needs: ["zaun"], ideas: ["haken"] },
  { id: "huetten", height: 1, needs: ["haken"], ideas: ["huetten"] },
  { id: "vorrat", height: 2, needs: ["huetten"], ideas: ["vorrat"] },
  { id: "ameisen", height: 2, needs: ["zaun"], ideas: ["ameisen"] },
  { id: "waage", height: 2, needs: ["vorrat"], ideas: ["waage"] },
  { id: "stall", height: 3, needs: ["huetten", "waage"], ideas: ["stall"] },
  { id: "tanz", height: 3, needs: ["ameisen"], ideas: ["tanz"] },
  { id: "fels", height: 3, needs: ["haken"], ideas: ["fels"] },
  { id: "socken", height: 4, needs: ["huetten", "tanz"], ideas: ["socken"] },
  { id: "steine", height: 4, needs: ["vorrat", "tanz"], ideas: ["steine"] },
  { id: "mauer", height: 4, needs: ["vorrat", "waage"], ideas: ["mauer"] },
];

/** The camp an idea belongs to (or undefined for an idea of the nature world). */
export const campOf = (idea) => MOUNTAIN.find((c) => c.ideas?.includes(idea));

/**
 * Ideas. world: "berg" for an idea of the thinking mountain (its map is welt/berg/, its place is a camp). ranges: smallest first. tasks: how many tasks a round has in each perspective (default 5).
 * cards: the thinking card of a perspective, where the usual one (PERSPECTIVES) does not fit the idea.
 */
export const IDEAS = {
  // The nature world is for preschool: numbers up to 5 and up to 10. Bigger numbers are school (the town).
  zahl: { place: "zahlen", ranges: [5, 10], cards: { machen: "nachpruefen", anwenden: "vergleichen" } },
  // The town, the flower shop: tens and ones. Ten flowers make a bunch, ten bunches a basket. Here the
  // range is the biggest number: the teens and 20 (one bunch and some flowers), up to 50, 100, 1000.
  // startAges: from 6 up to 20 (Klasse 1), from 7 up to 50, from 8 up to 100, from 9 up to 1000.
  stellen: { place: "blumen", world: "stadt", ranges: [20, 50, 100, 1000], startAges: [0, 7, 8, 9], cards: { anwenden: "vergleichen" } },
  // The town, the station: every number has its place. The track is the number line; order, before and
  // after, comparing with <, = and >, and (up to 20) ordinal numbers. The range is the end of the track.
  reihe: { place: "bahnhof", world: "stadt", ranges: [20, 100, 1000], startAges: [0, 7, 9], cards: { anwenden: "vergleichen", pruefen: "vergleichen" } },
  // The town, the workshop: shapes and solids, symmetry, measuring. The range is a level: 1 the plain
  // shapes, 2 more corners and turned shapes, 3 solids and comparing lengths.
  formen: { place: "werkstatt", world: "stadt", ranges: [1, 2, 3], startAges: [0, 7, 8] },
  // The town, the weather station: the clock, the calendar, reading charts, chance. The range is a
  // level: 1 full hours and pictures, 2 half and quarter hours and bars, 3 five minutes and time spans.
  zeit: { place: "wetter", world: "stadt", ranges: [1, 2, 3], startAges: [0, 7, 8] },
  teile: { place: "teile", ranges: [5, 10], tasks: { forschen: 3 } },
  // Friends of ten: friends of five (a hand) and friends of ten (the ten-frame).
  zehn: { place: "teile", ranges: [5, 10], cards: { machen: "ausprobieren", pruefen: "nachpruefen" } },
  // Here the range is not the size of the numbers but the length of the piece that comes again: 2, 3 or 4 things.
  muster: {
    place: "regeln",
    ranges: [5, 10, 20],
    cards: { sehen: "wiederholen", machen: "wiederholen", forschen: "wiederholen", anwenden: "vergleichen", pruefen: "vergleichen" },
  },
  // Here the range is how many things there are to share in all: up to 6 or 10.
  gruppen: { place: "gruppen", ranges: [5, 10], cards: { sehen: "teilen", machen: "teilen", anwenden: "teilen" } },
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
  // Camp 7: assume they are all the small kind, then swap one at a time (heads and legs, points).
  stall: { place: "stall", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 8: pairs and the rest (even and odd, groups, colours on a board, last digits).
  tanz: { place: "tanz", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 9: count in order and turn things in your head (triangles, squares, mirrors, cube nets).
  fels: { place: "fels", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 10: to be sure, think of the worst luck (socks in the dark, birthdays, boxes).
  socken: { place: "socken", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 11: games against the owl, thought from the end (heaps, counting games, chocolate).
  steine: { place: "steine", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
  // Camp 12: number walls and riddles, narrowed down clue by clue (gaps, magic squares, codes).
  mauer: { place: "mauer", world: "berg", ranges: [1, 2, 3, 4], startAt: 0 },
};

/** The map an idea lives on: "/welt/", "/welt/stadt/" or "/welt/berg/". */
export const mapOf = (idea) => (IDEAS[idea]?.world ? `/welt/${IDEAS[idea].world}/` : "/welt/");

/** The thinking card a round of this idea in this perspective gives. */
export const cardOf = (idea, p) => IDEAS[idea]?.cards?.[p] ?? perspective(p)?.card ?? null;

export const ROUND_TASKS = 5;
export function perspective(id) {
  return PERSPECTIVES.find((p) => p.id === id) || null;
}
