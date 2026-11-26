// Levels of "zahlen-memory". Only data: the game (game.js), the start page and the parents' page read it.
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
//   pairs – how many pairs on the board
//   max   – the biggest number (numbers are 1 to max, each number once)
//   min   – the smallest number, where it is not 1
//   open  – true: all cards lie open; false: face down, tap to turn

export const LEVELS = [
  { id: "offen-3", age: 3, range: 5, label: { de: "3 offene Paare, bis 3", en: "3 open pairs, up to 3", ne: "३ खुला जोडी, ३ सम्म" },
    pairs: 3, max: 3, open: true },
  { id: "offen-5", age: 4, range: 5, label: { de: "3 offene Paare, bis 5", en: "3 open pairs, up to 5", ne: "३ खुला जोडी, ५ सम्म" },
    pairs: 3, max: 5, open: true },
  { id: "verdeckt-3", age: 4, range: 5, label: { de: "3 verdeckte Paare, bis 3", en: "3 hidden pairs, up to 3", ne: "३ घोप्टो जोडी, ३ सम्म" },
    pairs: 3, max: 3, open: false },
  { id: "verdeckt-5", age: 5, range: 5, label: { de: "4 verdeckte Paare, bis 5", en: "4 hidden pairs, up to 5", ne: "४ घोप्टो जोडी, ५ सम्म" },
    pairs: 4, max: 5, open: false },
  { id: "verdeckt-6", age: 5, range: 10, label: { de: "4 verdeckte Paare, bis 6", en: "4 hidden pairs, up to 6", ne: "४ घोप्टो जोडी, ६ सम्म" },
    pairs: 4, max: 6, open: false },
  { id: "verdeckt-7", age: 6, range: 10, label: { de: "5 verdeckte Paare, bis 7", en: "5 hidden pairs, up to 7", ne: "५ घोप्टो जोडी, ७ सम्म" },
    pairs: 5, max: 7, open: false },
  { id: "verdeckt-8", age: 6, range: 10, label: { de: "5 verdeckte Paare, bis 8", en: "5 hidden pairs, up to 8", ne: "५ घोप्टो जोडी, ८ सम्म" },
    pairs: 5, max: 8, open: false },
  { id: "offen-10", age: 6, range: 10, label: { de: "6 offene Paare, bis 10", en: "6 open pairs, up to 10", ne: "६ खुला जोडी, १० सम्म" },
    pairs: 6, max: 10, open: true },
  { id: "verdeckt-10", age: 7, range: 10, label: { de: "6 verdeckte Paare, bis 10", en: "6 hidden pairs, up to 10", ne: "६ घोप्टो जोडी, १० सम्म" },
    pairs: 6, max: 10, open: false },
  // Beyond 10, in small steps: the numbers start higher too (min), so a board is not full of small ones.
  { id: "verdeckt-12", age: 7, range: 20, label: { de: "6 verdeckte Paare, 5 bis 12", en: "6 hidden pairs, 5 to 12", ne: "६ घोप्टो जोडी, ५ देखि १२" },
    pairs: 6, min: 5, max: 12, open: false },
  { id: "verdeckt-15", age: 8, range: 20, label: { de: "6 verdeckte Paare, 8 bis 15", en: "6 hidden pairs, 8 to 15", ne: "६ घोप्टो जोडी, ८ देखि १५" },
    pairs: 6, min: 8, max: 15, open: false },
  { id: "verdeckt-20", age: 8, range: 20, label: { de: "6 verdeckte Paare, 11 bis 20", en: "6 hidden pairs, 11 to 20", ne: "६ घोप्टो जोडी, ११ देखि २०" },
    pairs: 6, min: 11, max: 20, open: false },
];
