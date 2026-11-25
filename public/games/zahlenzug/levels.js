// Levels of "zahlenzug". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   kind – "missing": one wagon is missing, "after" / "before": the number after / before one wagon,
//          "mixed": after or before, "order": hang the wagons on from small to big
//   from – the first number of the train (or the shown number for after / before): [lowest, highest]
//   len  – how many wagons ("missing" and "order")

export const LEVELS = [
  { id: "fehlt-4", age: 3, label: { de: "Fehlender Wagen, 1–4", en: "Missing wagon, 1–4", ne: "छुटेको डिब्बा, १–४" },
    kind: "missing", from: [1, 1], len: 4 },
  { id: "ordnen-4", age: 3, label: { de: "Wagen ordnen, 1–4", en: "Put wagons in order, 1–4", ne: "डिब्बा क्रममा, १–४" },
    kind: "order", from: [1, 1], len: 4 },
  { id: "fehlt-5", age: 4, label: { de: "Fehlender Wagen, 1–5", en: "Missing wagon, 1–5", ne: "छुटेको डिब्बा, १–५" },
    kind: "missing", from: [1, 1], len: 5 },
  { id: "danach-10", age: 5, label: { de: "Was kommt danach? bis 10", en: "What comes after? up to 10", ne: "पछि के आउँछ? १० सम्म" },
    kind: "after", from: [1, 9] },
  { id: "ordnen-10", age: 5, label: { de: "Wagen ordnen, bis 10", en: "Put wagons in order, up to 10", ne: "डिब्बा क्रममा, १० सम्म" },
    kind: "order", from: [1, 5], len: 5 },
  { id: "davor-10", age: 6, label: { de: "Was kommt davor? bis 10", en: "What comes before? up to 10", ne: "अघि के आउँछ? १० सम्म" },
    kind: "before", from: [2, 10] },
  { id: "fehlt-15", age: 6, label: { de: "Fehlender Wagen, bis 15", en: "Missing wagon, up to 15", ne: "छुटेको डिब्बा, १५ सम्म" },
    kind: "missing", from: [1, 10], len: 5 },
  { id: "gemischt-20", age: 7, label: { de: "Danach und davor, bis 20", en: "After and before, up to 20", ne: "पछि र अघि, २० सम्म" },
    kind: "mixed", from: [2, 19] },
  { id: "ordnen-15", age: 7, label: { de: "Wagen ordnen, bis 15", en: "Put wagons in order, up to 15", ne: "डिब्बा क्रममा, १५ सम्म" },
    kind: "order", from: [1, 10], len: 5 },
];
