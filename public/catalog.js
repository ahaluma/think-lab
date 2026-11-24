// The catalog: every category, skill and game. The start page and the parents' report are built from it.
//
//   Category – a big learning area. One row on the start page.            e.g. "zahlen", "rechnen"
//   Skill    – one ability inside a category. Groups the progress report.  e.g. "zahlen/zaehlen", "rechnen/plus"
//   Game     – one folder in public/games/<id>/ with one game idea. Several games may train the same skill.
//   Levels   – the difficulty parameters, defined inside each game's game.js (LEVELS). Not here.
//
// Names are written per language: { de: "…" }. Add more languages next to "de" (see shared/i18n.js).
// Categories without games are not shown on the start page.

export const CATEGORIES = [
  {
    id: "zahlen",
    name: { de: "Zahlen" },
    skills: [
      { id: "zaehlen", name: { de: "Zählen" } },
      { id: "erkennen", name: { de: "Zahlen erkennen" } },
    ],
  },
  {
    id: "rechnen",
    name: { de: "Rechnen" },
    skills: [
      { id: "plus", name: { de: "Plus" } },
      { id: "minus", name: { de: "Minus" } },
    ],
  },
  {
    id: "sprache",
    name: { de: "Sprache" },
    skills: [
      { id: "buchstaben", name: { de: "Buchstaben" } },
      { id: "reime", name: { de: "Reime" } },
    ],
  },
  {
    id: "logik",
    name: { de: "Logik" },
    skills: [
      { id: "muster", name: { de: "Muster" } },
      { id: "formen", name: { de: "Formen" } },
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
  { id: "wie-viele", skill: "zahlen/zaehlen", name: { de: "Wie viele?" }, icon: "🍎", color: "#ffc83a" },
];

/** Games of one category, in catalog order. */
export function gamesIn(categoryId) {
  return GAMES.filter((g) => g.skill.split("/")[0] === categoryId);
}
