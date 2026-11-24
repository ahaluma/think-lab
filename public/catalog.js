// The catalog: every category, skill and game. The start page and the parents' report are built from it.
//
//   Category – a big learning area. One row on the start page.            e.g. "zahlen", "rechnen"
//   Skill    – one ability inside a category. Groups the progress report.  e.g. "zahlen/zaehlen", "rechnen/plus"
//   Game     – one folder in public/games/<id>/ with one game idea. Several games may train the same skill.
//   Levels   – the difficulty parameters, defined inside each game's game.js (LEVELS). Not here.
//
// Names are written per language: { de: "…", en: "…" }. Add more languages next to them (see shared/i18n.js).
// Categories without games are not shown on the start page.

export const CATEGORIES = [
  {
    id: "zahlen",
    name: { de: "Zahlen", en: "Numbers" },
    skills: [
      { id: "zaehlen", name: { de: "Zählen", en: "Counting" } },
      { id: "erkennen", name: { de: "Zahlen erkennen", en: "Reading numbers" } },
    ],
  },
  {
    id: "rechnen",
    name: { de: "Rechnen", en: "Maths" },
    skills: [
      { id: "plus", name: { de: "Plus", en: "Plus" } },
      { id: "minus", name: { de: "Minus", en: "Minus" } },
    ],
  },
  {
    id: "sprache",
    name: { de: "Sprache", en: "Language" },
    skills: [
      { id: "buchstaben", name: { de: "Buchstaben", en: "Letters" } },
      { id: "reime", name: { de: "Reime", en: "Rhymes" } },
    ],
  },
  {
    id: "logik",
    name: { de: "Logik", en: "Logic" },
    skills: [
      { id: "muster", name: { de: "Muster", en: "Patterns" } },
      { id: "formen", name: { de: "Formen", en: "Shapes" } },
    ],
  },
];

// To add a game: copy templates/game/ to public/games/<id>/ and add one line here.
//
//   id    – the folder name inside public/games/ (lowercase, dashes, no spaces)
//   skill – "<category>/<skill>" from the list above
//   name  – short name per language, shown under the picture
//   icon  – one emoji: the picture a child recognises without reading
//   color – tile background

export const GAMES = [
  { id: "wie-viele", skill: "zahlen/zaehlen", name: { de: "Wie viele?", en: "How many?" }, icon: "🍎", color: "#ffc83a" },
];

/** Games of one category, in catalog order. */
export function gamesIn(categoryId) {
  return GAMES.filter((g) => g.skill.split("/")[0] === categoryId);
}
