// Levels of "wer-kommt-dazu". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   change – "come": animals hop in, "go": animals run away, "mixed": either
//   step   – how many come or go: [fewest, most]
//   from   – how many are there at the start: [fewest, most]
//   bush   – true: the animals hide behind a bush before the change, so the child has to think, not count

export const LEVELS = [
  { id: "eins-dazu", age: 4, label: { de: "Eins kommt dazu", en: "One comes", ne: "एउटा आउँछ" },
    change: "come", step: [1, 1], from: [1, 4], bush: false },
  { id: "eins-weg", age: 4, label: { de: "Eins geht weg", en: "One goes away", ne: "एउटा जान्छ" },
    change: "go", step: [1, 1], from: [2, 5], bush: false },
  { id: "eins-gemischt", age: 4, label: { de: "Eins kommt oder geht", en: "One comes or goes", ne: "एउटा आउँछ वा जान्छ" },
    change: "mixed", step: [1, 1], from: [1, 5], bush: false },
  { id: "busch-dazu", age: 5, label: { de: "Hinter dem Busch: eins dazu", en: "Behind the bush: one comes", ne: "झाडीपछाडि: एउटा आउँछ" },
    change: "come", step: [1, 1], from: [1, 5], bush: true },
  { id: "busch-weg", age: 5, label: { de: "Hinter dem Busch: eins weg", en: "Behind the bush: one goes", ne: "झाडीपछाडि: एउटा जान्छ" },
    change: "go", step: [1, 1], from: [2, 6], bush: true },
  { id: "busch-gemischt", age: 5, label: { de: "Hinter dem Busch, bis 9", en: "Behind the bush, up to 9", ne: "झाडीपछाडि, ९ सम्म" },
    change: "mixed", step: [1, 1], from: [2, 8], bush: true },
  { id: "zwei", age: 6, label: { de: "Zwei auf einmal", en: "Two at once", ne: "एकैचोटि दुई" },
    change: "mixed", step: [2, 2], from: [2, 6], bush: false },
  { id: "zwei-busch", age: 6, label: { de: "Zwei auf einmal, hinter dem Busch", en: "Two at once, behind the bush", ne: "एकैचोटि दुई, झाडीपछाडि" },
    change: "mixed", step: [2, 2], from: [3, 8], bush: true },
  { id: "bis-10", age: 6, label: { de: "Eins oder zwei, bis 10", en: "One or two, up to 10", ne: "एक वा दुई, १० सम्म" },
    change: "mixed", step: [1, 2], from: [3, 9], bush: true },
];
