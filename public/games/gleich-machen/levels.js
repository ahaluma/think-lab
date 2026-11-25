// Levels of "Gleich machen". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js).
//   label – short text for the parents' page.
//   range – the number range (5, 10, 20). Above their age, a child plays 20 rounds in a range
//           before going into a bigger one (shared/adapt.js).
//
//   max   – the most animals on one meadow
//   diff  – how many more one meadow has: [smallest, biggest]
//   way   – "weg":  the bigger meadow sends animals home (7 − 3 = 4)
//           "dazu": the smaller meadow gets animals from its house (4 + 3 = 7)
//           "mix":  either, at random
//   input – "tap":    the child taps animals (they go home) or the house (one comes out), then ✓
//           "number": the child taps or types the number (one of three, or the number pad from 8)
//   show  – "pictures": the animals on the meadows; "numbers": only a number sign on each meadow
//           (after two wrong answers the animals come, in pairs)

const L = (de, en, ne) => ({ de, en, ne });

export const LEVELS = [
  { id: "weg-5", age: 4, range: 5, label: L("Wegschicken bis 5", "Sending away up to 5", "५ सम्म पठाउने"),
    max: 5, diff: [1, 3], way: "weg", input: "tap", show: "pictures" },
  { id: "weg-10", age: 5, range: 10, label: L("Wegschicken bis 10", "Sending away up to 10", "१० सम्म पठाउने"),
    max: 10, diff: [1, 6], way: "weg", input: "tap", show: "pictures" },
  { id: "weg-zahl-10", age: 6, range: 10, label: L("Bilder, Zahl eingeben (7 − ? = 4)", "Pictures, give the number (7 − ? = 4)", "चित्र, अङ्क भन (७ − ? = ४)"),
    max: 10, diff: [1, 6], way: "weg", input: "number", show: "pictures" },
  { id: "weg-zahlen-10", age: 6, range: 10, label: L("Nur Zahlen bis 10 (7 − ? = 4)", "Numbers only to 10 (7 − ? = 4)", "अङ्क मात्र १० सम्म (७ − ? = ४)"),
    max: 10, diff: [1, 7], way: "weg", input: "number", show: "numbers" },
  { id: "dazu-10", age: 6, range: 10, label: L("Dazuholen bis 10", "Bringing more up to 10", "१० सम्म थप्ने"),
    max: 10, diff: [1, 6], way: "dazu", input: "tap", show: "pictures" },
  { id: "dazu-zahlen-10", age: 7, range: 10, label: L("Dazu, nur Zahlen (4 + ? = 7)", "More, numbers only (4 + ? = 7)", "थप्ने, अङ्क मात्र (४ + ? = ७)"),
    max: 10, diff: [1, 7], way: "dazu", input: "number", show: "numbers" },
  { id: "gemischt-10", age: 7, range: 10, label: L("Weg oder dazu bis 10", "Away or more up to 10", "१० सम्म घटाउने वा थप्ने"),
    max: 10, diff: [1, 8], way: "mix", input: "number", show: "numbers" },
  { id: "gemischt-20", age: 8, range: 20, label: L("Weg oder dazu bis 20", "Away or more up to 20", "२० सम्म घटाउने वा थप्ने"),
    max: 20, diff: [2, 12], way: "mix", input: "number", show: "numbers" },
];
