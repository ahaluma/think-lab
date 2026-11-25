// Levels of "blitzblick". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   kind – "dice": placed like the dots on a dice, "scatter": random places, "frame": 5 + x in a 2 x 5 frame
//   Every round shows a different animal or thing (apples, flowers, pandas…).
//   min, max – the amounts
//   ms – how long the picture is shown (milliseconds)

export const LEVELS = [
  { id: "wuerfel-3", age: 3, label: { de: "Würfelbild 1–3", en: "Dice pattern 1–3", ne: "पासाको ढाँचा १–३" },
    kind: "dice", min: 1, max: 3, ms: 2000 },
  { id: "wuerfel-4", age: 3, label: { de: "Würfelbild 1–4", en: "Dice pattern 1–4", ne: "पासाको ढाँचा १–४" },
    kind: "dice", min: 1, max: 4, ms: 1500 },
  { id: "wuerfel-5", age: 4, label: { de: "Würfelbild 2–5", en: "Dice pattern 2–5", ne: "पासाको ढाँचा २–५" },
    kind: "dice", min: 2, max: 5, ms: 1200 },
  { id: "wuerfel-6", age: 5, label: { de: "Würfelbild 2–6, schnell", en: "Dice pattern 2–6, fast", ne: "पासाको ढाँचा २–६, छिटो" },
    kind: "dice", min: 2, max: 6, ms: 1000 },
  { id: "verstreut-4", age: 5, label: { de: "Verstreut 1–4", en: "Scattered 1–4", ne: "छरिएका १–४" },
    kind: "scatter", min: 1, max: 4, ms: 1500 },
  { id: "verstreut-5", age: 6, label: { de: "Verstreut 2–5", en: "Scattered 2–5", ne: "छरिएका २–५" },
    kind: "scatter", min: 2, max: 5, ms: 1200 },
  { id: "verstreut-6", age: 6, label: { de: "Verstreut 3–6, schnell", en: "Scattered 3–6, fast", ne: "छरिएका ३–६, छिटो" },
    kind: "scatter", min: 3, max: 6, ms: 1000 },
  { id: "fuenfer-8", age: 7, label: { de: "Fünferreihe + x, bis 8", en: "Row of five + x, up to 8", ne: "पाँचको लहर + x, ८ सम्म" },
    kind: "frame", min: 5, max: 8, ms: 1500 },
  { id: "fuenfer-10", age: 7, label: { de: "Fünferreihe + x, bis 10", en: "Row of five + x, up to 10", ne: "पाँचको लहर + x, १० सम्म" },
    kind: "frame", min: 5, max: 10, ms: 1200 },
];
