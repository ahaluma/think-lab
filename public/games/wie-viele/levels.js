// Levels of "wie-viele". Only data: the game (game.js), the start page and the parents' page read it.
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
//   max – the most things to count

export const LEVELS = [
  { id: "bis-3", age: 3, range: 5, label: { de: "Zählen bis 3", en: "Counting to 3", ne: "३ सम्म गन्ती" },
    max: 3 },
  { id: "bis-4", age: 3, range: 5, label: { de: "Zählen bis 4", en: "Counting to 4", ne: "४ सम्म गन्ती" },
    max: 4 },
  { id: "bis-5", age: 4, range: 5, label: { de: "Zählen bis 5", en: "Counting to 5", ne: "५ सम्म गन्ती" },
    max: 5 },
  { id: "bis-6", age: 5, range: 10, label: { de: "Zählen bis 6", en: "Counting to 6", ne: "६ सम्म गन्ती" },
    max: 6 },
  { id: "bis-7", age: 5, range: 10, label: { de: "Zählen bis 7", en: "Counting to 7", ne: "७ सम्म गन्ती" },
    max: 7 },
  { id: "bis-8", age: 6, range: 10, label: { de: "Zählen bis 8", en: "Counting to 8", ne: "८ सम्म गन्ती" },
    max: 8 },
  { id: "bis-9", age: 6, range: 10, label: { de: "Zählen bis 9", en: "Counting to 9", ne: "९ सम्म गन्ती" },
    max: 9 },
  { id: "bis-10", age: 6, range: 10, label: { de: "Zählen bis 10", en: "Counting to 10", ne: "१० सम्म गन्ती" },
    max: 10 },
];
