// The catalog: every category, skill and game. The start page and the parents' report are built from it.
//
//   Category – a big learning area. One row on the start page.            e.g. "zahlen", "rechnen"
//   Skill    – one ability inside a category. Groups the progress report.  e.g. "zahlen/zaehlen", "rechnen/plus"
//   Game     – one folder in public/games/<id>/ with one game idea. Several games may train the same skill.
//   Levels   – the difficulty steps, in each game's levels.js: a fixed id, the age it is made for, a label.
//
// Names are written per language: { de: "…", en: "…", ne: "…" }. Add more languages next to them (see shared/i18n.js).
// Categories without games are not shown on the start page.
//
// Almost every game has moved into the worlds (public/welt/): the start page shows the world doors.
// The number memory stays a game of its own: two children play it together, at the meadow.

export const CATEGORIES = [
  {
    id: "zahlen",
    name: { de: "Zahlen", en: "Numbers", ne: "सङ्ख्या" },
    skills: [{ id: "erkennen", name: { de: "Zahlen erkennen", en: "Reading numbers", ne: "अङ्क चिन्ने" } }],
  },
];

// To add a game: copy templates/game/ to public/games/<id>/ and add one line here.
//
//   id    – the folder name inside public/games/ (lowercase, dashes, no spaces)
//   skill – "<category>/<skill>" from the list above
//   name  – short name per language, shown under the picture
//   icon  – one emoji: the picture a child recognises without reading
//   color – tile background
//   ages  – [from, to]: the ages the game is made for. Younger children don't see it; older ones still
//           see it for 2 more years (shared/fit.js). Parents can switch any game on or off per child.
//   moved – the idea of the new world (welt/frame/ideas.js) this game has moved into. A moved game is no
//           longer on the start page: the child plays its idea in the world. Parents can switch it back on.

export const GAMES = [
  { id: "zahlen-memory", moved: "zahl", ages: [3, 7], skill: "zahlen/erkennen", name: { de: "Zahlen-Memory", en: "Number memory", ne: "अङ्क जोडी" }, icon: "🃏", color: "#c9e7ff" },
];

/** Games of one category, in catalog order. */
export function gamesIn(categoryId) {
  return GAMES.filter((g) => g.skill.split("/")[0] === categoryId);
}
