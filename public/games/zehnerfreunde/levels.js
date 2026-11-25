// Levels of "zehnerfreunde". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//   range – the number range (up to 5, 10, 20). Above their age, a child plays 20 rounds in a range
//           before going into a bigger one (shared/adapt.js).
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   total – 5 (one row) or 10 (the ten-frame)
//   have  – how many animals are there: [fewest, most]. The answer is total - have.
//   show  – "frame": animals in order, first row first, the empty places are dashed
//           "scatter": animals on random places in the frame (the five-row does not help any more)
//           "flash": the frame is shown for `ms`, then covered (tap it to look again)
//           "numbers": only numbers, 7 + ? = 10 (after two wrong answers the frame helps)
//   swap  – numbers: sometimes the gap comes first: ? + 3 = 10

export const LEVELS = [
  { id: "fuenf", age: 4, range: 5, label: { de: "Bis 5: eine Reihe", en: "To 5: one row", ne: "५ सम्म: एउटा लहर" },
    total: 5, have: [1, 4], show: "frame" },
  { id: "zehn-oben-voll", age: 5, range: 10, label: { de: "Bis 10: obere Reihe voll", en: "To 10: top row full", ne: "१० सम्म: माथिको लहर भरिएको" },
    total: 10, have: [5, 9], show: "frame" },
  { id: "zehn", age: 5, range: 10, label: { de: "Bis 10", en: "To 10", ne: "१० सम्म" },
    total: 10, have: [1, 9], show: "frame" },
  { id: "zehn-durcheinander", age: 6, range: 10, label: { de: "Bis 10, durcheinander", en: "To 10, mixed up", ne: "१० सम्म, छरपस्ट" },
    total: 10, have: [1, 9], show: "scatter" },
  { id: "zehn-kurz", age: 6, range: 10, label: { de: "Bis 10, nur kurz zu sehen", en: "To 10, seen only briefly", ne: "१० सम्म, छिनभर मात्र देखिने" },
    total: 10, have: [2, 9], show: "flash", ms: 2500 },
  { id: "zahlen", age: 7, range: 10, label: { de: "Nur Zahlen: 7 + ? = 10", en: "Numbers only: 7 + ? = 10", ne: "अङ्क मात्र: ७ + ? = १०" },
    total: 10, have: [1, 9], show: "numbers" },
  { id: "zahlen-beide", age: 7, range: 10, label: { de: "Nur Zahlen, auch ? + 3 = 10", en: "Numbers only, also ? + 3 = 10", ne: "अङ्क मात्र, ? + ३ = १० पनि" },
    total: 10, have: [1, 9], show: "numbers", swap: true },
];
