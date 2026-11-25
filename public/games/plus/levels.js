// Levels of "plus". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   sum  – the result: [smallest, biggest]. Both numbers are at least 1.
//   show – "pictures": both groups as animals under the sum
//          "bush":     the first group hides behind a bush that shows its number: count on from it
//          "numbers":  only the sum; after two wrong answers the pictures help
//          "frames":   above 10: two ten-frames, the second group first fills the ten (8 + 2 + 3)
//   help – numbers: what helps after two wrong answers ("pictures" or "frames")

export const LEVELS = [
  { id: "bilder-5", age: 5, label: { de: "Mit Bildern bis 5", en: "With pictures to 5", ne: "चित्रसहित ५ सम्म" },
    sum: [2, 5], show: "pictures" },
  { id: "bilder-10", age: 5, label: { de: "Mit Bildern bis 10", en: "With pictures to 10", ne: "चित्रसहित १० सम्म" },
    sum: [4, 10], show: "pictures" },
  { id: "weiterzaehlen", age: 6, label: { de: "Weiterzählen: die ersten hinter dem Busch", en: "Counting on: the first ones behind a bush", ne: "अघि गन्ने: पहिलाका झाडीपछाडि" },
    sum: [4, 10], show: "bush" },
  { id: "zahlen-10", age: 6, label: { de: "Nur Zahlen bis 10", en: "Numbers only to 10", ne: "अङ्क मात्र १० सम्म" },
    sum: [3, 10], show: "numbers", help: "pictures" },
  { id: "ueber-10", age: 7, label: { de: "Über 10 mit dem Zehnerfeld", en: "Above 10 with the ten-frame", ne: "दस-खानासँग १० भन्दा माथि" },
    sum: [11, 18], show: "frames" },
  { id: "ueber-10-zahlen", age: 8, label: { de: "Über 10, nur Zahlen", en: "Above 10, numbers only", ne: "१० भन्दा माथि, अङ्क मात्र" },
    sum: [11, 18], show: "numbers", help: "frames" },
];
