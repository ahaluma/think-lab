// Levels of "wo-sind-mehr". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. After every 5 stars the child moves up one level.
//   max     – the most things in one group
//   minDiff – the smallest difference between the groups (big = easy to see)
//   same    – the "same" button is shown, and sometimes both groups are equal
//   fewer   – sometimes the question is "where are fewer?"

export const LEVELS = [
  { id: "gross-5", age: 3, label: { de: "Großer Unterschied, bis 5", en: "Big difference, up to 5", ne: "ठूलो फरक, ५ सम्म" },
    max: 5, minDiff: 3, same: false, fewer: false },
  { id: "gross-6", age: 3, label: { de: "Unterschied 2, bis 6", en: "Difference of 2, up to 6", ne: "२ को फरक, ६ सम्म" },
    max: 6, minDiff: 2, same: false, fewer: false },
  { id: "mittel-8", age: 4, label: { de: "Unterschied 2, bis 8", en: "Difference of 2, up to 8", ne: "२ को फरक, ८ सम्म" },
    max: 8, minDiff: 2, same: false, fewer: false },
  { id: "knapp-8", age: 5, label: { de: "Knapp, bis 8", en: "Close, up to 8", ne: "थोरै फरक, ८ सम्म" },
    max: 8, minDiff: 1, same: false, fewer: false },
  { id: "gleich-6", age: 5, label: { de: "Mit „gleich“, bis 6", en: "With “the same”, up to 6", ne: "„उत्तिकै“ सहित, ६ सम्म" },
    max: 6, minDiff: 1, same: true, fewer: false },
  { id: "gleich-10", age: 6, label: { de: "Mit „gleich“, bis 10", en: "With “the same”, up to 10", ne: "„उत्तिकै“ सहित, १० सम्म" },
    max: 10, minDiff: 1, same: true, fewer: false },
  { id: "weniger-8", age: 6, label: { de: "Auch „wo sind weniger?“, bis 8", en: "Also “where are fewer?”, up to 8", ne: "„कहाँ कम छन्?“ पनि, ८ सम्म" },
    max: 8, minDiff: 1, same: true, fewer: true },
  { id: "weniger-10", age: 6, label: { de: "Auch „wo sind weniger?“, bis 10", en: "Also “where are fewer?”, up to 10", ne: "„कहाँ कम छन्?“ पनि, १० सम्म" },
    max: 10, minDiff: 1, same: true, fewer: true },
];
