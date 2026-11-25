// The catalog: every category, skill and game. The start page and the parents' report are built from it.
//
//   Category – a big learning area. One row on the start page.            e.g. "zahlen", "rechnen"
//   Skill    – one ability inside a category. Groups the progress report.  e.g. "zahlen/zaehlen", "rechnen/plus"
//   Game     – one folder in public/games/<id>/ with one game idea. Several games may train the same skill.
//   Levels   – the difficulty steps, in each game's levels.js: a fixed id, the age it is made for, a label.
//
// Names are written per language: { de: "…", en: "…", ne: "…" }. Add more languages next to them (see shared/i18n.js).
// Categories without games are not shown on the start page.

export const CATEGORIES = [
  {
    id: "zahlen",
    name: { de: "Zahlen", en: "Numbers", ne: "सङ्ख्या" },
    skills: [
      { id: "zaehlen", name: { de: "Zählen", en: "Counting", ne: "गन्ती" } },
      { id: "simultan", name: { de: "Auf einen Blick", en: "At a glance", ne: "एकै नजरमा" } },
      { id: "reihe", name: { de: "Zahlenreihe", en: "Number order", ne: "अङ्कको क्रम" } },
      { id: "vergleichen", name: { de: "Vergleichen", en: "Comparing", ne: "तुलना" } },
      { id: "erkennen", name: { de: "Zahlen erkennen", en: "Reading numbers", ne: "अङ्क चिन्ने" } },
    ],
  },
  {
    id: "rechnen",
    name: { de: "Rechnen", en: "Maths", ne: "हिसाब" },
    skills: [
      { id: "dazu-weg", name: { de: "Eins mehr, eins weniger", en: "One more, one less", ne: "एक बढी, एक कम" } },
      { id: "zerlegen", name: { de: "Zahlen zerlegen", en: "Splitting numbers", ne: "सङ्ख्या छुट्याउने" } },
      { id: "plus", name: { de: "Plus", en: "Plus", ne: "जोड" } },
      { id: "minus", name: { de: "Minus", en: "Minus", ne: "घटाउ" } },
      { id: "teilen", name: { de: "Teilen", en: "Sharing", ne: "भाग" } },
    ],
  },
  {
    id: "sprache",
    name: { de: "Sprache", en: "Language", ne: "भाषा" },
    skills: [
      { id: "buchstaben", name: { de: "Buchstaben", en: "Letters", ne: "अक्षर" } },
      { id: "reime", name: { de: "Reime", en: "Rhymes", ne: "मिल्दा शब्द" } },
    ],
  },
  {
    id: "logik",
    name: { de: "Logik", en: "Logic", ne: "तर्क" },
    skills: [
      { id: "muster", name: { de: "Muster", en: "Patterns", ne: "ढाँचा" } },
      { id: "sortieren", name: { de: "Sortieren", en: "Sorting", ne: "छुट्याउने" } },
      { id: "formen", name: { de: "Formen", en: "Shapes", ne: "आकार" } },
      { id: "raumlage", name: { de: "Oben, unten, links, rechts", en: "Up, down, left, right", ne: "माथि, तल, बायाँ, दायाँ" } },
    ],
  },
  {
    id: "messen",
    name: { de: "Messen", en: "Measuring", ne: "नाप" },
    skills: [
      { id: "groessen", name: { de: "Größen vergleichen", en: "Comparing sizes", ne: "नाप तुलना" } },
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
//   ages  – [from, to]: the ages the game is made for. Younger children don't see it; older ones still
//           see it for 2 more years (shared/fit.js). Parents can switch any game on or off per child.

export const GAMES = [
  { id: "wie-viele", ages: [3, 6], skill: "zahlen/zaehlen", name: { de: "Wie viele?", en: "How many?", ne: "कतिवटा?" }, icon: "🍎", color: "#ffc83a" },
  { id: "wo-sind-mehr", ages: [3, 6], skill: "zahlen/vergleichen", name: { de: "Wo sind mehr?", en: "Where are more?", ne: "कतातिर धेरै?" }, icon: "⚖️", color: "#8fd3ff" },
  { id: "blitzblick", ages: [3, 8], skill: "zahlen/simultan", name: { de: "Blitzblick", en: "Quick look", ne: "झट्ट हेर" }, icon: "⚡", color: "#c9b6ff" },
  { id: "zahlenzug", ages: [3, 8], skill: "zahlen/reihe", name: { de: "Zahlenzug", en: "Number train", ne: "अङ्क रेल" }, icon: "🚂", color: "#ffb3c7" },
  { id: "wer-kommt-dazu", ages: [4, 6], skill: "rechnen/dazu-weg", name: { de: "Wer kommt dazu?", en: "Who's coming?", ne: "को आयो?" }, icon: "🐇", color: "#9fdc8a" },
  { id: "zahlenhaus", ages: [5, 8], skill: "rechnen/zerlegen", name: { de: "Zahlenhaus", en: "Number house", ne: "अङ्क घर" }, icon: "🏠", color: "#ffd9a8" },
  { id: "zehnerfreunde", ages: [4, 8], skill: "rechnen/zerlegen", name: { de: "Zehnerfreunde", en: "Ten friends", ne: "दसका साथी" }, icon: "🔟", color: "#b8e6d0" },
  { id: "gleich-machen", ages: [4, 8], skill: "rechnen/minus", name: { de: "Gleich machen", en: "Make it equal", ne: "बराबर बनाऊ" }, icon: "🤝", color: "#c9efb4" },
  { id: "gerecht-teilen", ages: [4, 8], skill: "rechnen/teilen", name: { de: "Gerecht teilen", en: "Fair share", ne: "बराबर बाँड" }, icon: "🍪", color: "#f6d7b0" },
  { id: "plus", ages: [5, 10], skill: "rechnen/plus", name: { de: "Plus", en: "Plus", ne: "जोड" }, icon: "➕", color: "#ffc4a3" },
  { id: "zahlen-memory", ages: [3, 7], skill: "zahlen/erkennen", name: { de: "Zahlen-Memory", en: "Number memory", ne: "अङ्क जोडी" }, icon: "🃏", color: "#c9e7ff" },
  { id: "muster-kette", ages: [3, 12], skill: "logik/muster", name: { de: "Muster-Kette", en: "Pattern chain", ne: "ढाँचा माला" }, icon: "🔁", color: "#ffe08a" },
  { id: "groessen", ages: [3, 7], skill: "messen/groessen", name: { de: "Größen vergleichen", en: "Compare sizes", ne: "नाप तुलना" }, icon: "📏", color: "#ffd2a6" },
  { id: "raumlage", ages: [3, 7], skill: "logik/raumlage", name: { de: "Wo ist es?", en: "Where is it?", ne: "कहाँ छ?" }, icon: "🧸", color: "#ffd0e8" },
  { id: "sortieren", ages: [3, 12], skill: "logik/sortieren", name: { de: "Sortieren", en: "Sorting", ne: "छुट्याऊ" }, icon: "🧺", color: "#d8c8ff" },
];

/** Games of one category, in catalog order. */
export function gamesIn(categoryId) {
  return GAMES.filter((g) => g.skill.split("/")[0] === categoryId);
}
