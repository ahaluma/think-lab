// Levels of "neues-spiel". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   max – TODO: what your parameter means

export const LEVELS = [
  { id: "bis-3", age: 3, label: { de: "Bis 3", en: "Up to 3", ne: "३ सम्म" }, max: 3 },
  { id: "bis-5", age: 4, label: { de: "Bis 5", en: "Up to 5", ne: "५ सम्म" }, max: 5 },
  { id: "bis-10", age: 6, label: { de: "Bis 10", en: "Up to 10", ne: "१० सम्म" }, max: 10 },
];
