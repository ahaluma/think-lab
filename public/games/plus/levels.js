// Levels of "plus". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//   range – the number range (up to 5, 10, 20, 100, 1000). Above their age, a child plays 20 rounds in a range
//           before going into a bigger one (shared/adapt.js).
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
// The numbers come from the shared block shared/rechnen.js (Minus will use it too).
//   sum  – the result: [smallest, biggest]. Both numbers are at least 1.
//   show – "pictures": both groups as animals under the sum
//          "bush":     the first group hides behind a bush that shows its number: count on from it
//          "numbers":  only the sum; after two wrong answers the pictures help
//          "frames":   above 10: two ten-frames, the second group first fills the ten (8 + 2 + 3)
//   help – numbers: what helps after two wrong answers ("pictures", "frames" or "blocks": a place-value
//          chart with hundreds plates, tens sticks and ones cubes)
//   gap  – true: the missing number is asked (3 + ? = 7) instead of the sum
//   big  – up to 100 or 1000 (instead of sum): { digits: 2 or 3, kind }
//          kind "round": whole tens or hundreds (30 + 40, 300 + 400)
//               "plain": no column goes over 9 (34 + 25, 345 + 230)
//               "carry": ten ones make a ten, or ten tens a hundred (38 + 27, 368 + 257)

export const LEVELS = [
  { id: "bilder-5", age: 5, range: 5, label: { de: "Mit Bildern bis 5", en: "With pictures to 5", ne: "चित्रसहित ५ सम्म" },
    sum: [2, 5], show: "pictures" },
  { id: "bilder-10", age: 5, range: 10, label: { de: "Mit Bildern bis 10", en: "With pictures to 10", ne: "चित्रसहित १० सम्म" },
    sum: [4, 10], show: "pictures" },
  { id: "weiterzaehlen", age: 6, range: 10, label: { de: "Weiterzählen: die ersten hinter dem Busch", en: "Counting on: the first ones behind a bush", ne: "अघि गन्ने: पहिलाका झाडीपछाडि" },
    sum: [4, 10], show: "bush" },
  { id: "zahlen-10", age: 6, range: 10, label: { de: "Nur Zahlen bis 10", en: "Numbers only to 10", ne: "अङ्क मात्र १० सम्म" },
    sum: [3, 10], show: "numbers", help: "pictures" },
  { id: "luecke-10", age: 6, range: 10, label: { de: "Lücke bis 10 (3 + ? = 7)", en: "Gap to 10 (3 + ? = 7)", ne: "१० सम्म खाली ठाउँ (३ + ? = ७)" },
    sum: [3, 10], gap: true, show: "numbers", help: "pictures" },
  { id: "ueber-10", age: 7, range: 20, label: { de: "Über 10 mit dem Zehnerfeld", en: "Above 10 with the ten-frame", ne: "दस-खानासँग १० भन्दा माथि" },
    sum: [11, 18], show: "frames" },
  { id: "ueber-10-zahlen", age: 7, range: 20, label: { de: "Über 10, nur Zahlen", en: "Above 10, numbers only", ne: "१० भन्दा माथि, अङ्क मात्र" },
    sum: [11, 18], show: "numbers", help: "frames" },
  { id: "luecke-20", age: 7, range: 20, label: { de: "Lücke über 10 (8 + ? = 13)", en: "Gap above 10 (8 + ? = 13)", ne: "१० भन्दा माथि खाली ठाउँ (८ + ? = १३)" },
    sum: [11, 18], gap: true, show: "numbers", help: "frames" },
  { id: "zehner-100", age: 7, range: 100, label: { de: "Ganze Zehner bis 100 (30 + 40)", en: "Whole tens to 100 (30 + 40)", ne: "पूरा दशहरू १०० सम्म (३० + ४०)" },
    big: { digits: 2, kind: "round" }, show: "numbers", help: "blocks" },
  { id: "luecke-100", age: 8, range: 100, label: { de: "Lücke mit Zehnern (30 + ? = 70)", en: "Gap with tens (30 + ? = 70)", ne: "दशसँग खाली ठाउँ (३० + ? = ७०)" },
    big: { digits: 2, kind: "round" }, gap: true, show: "numbers", help: "blocks" },
  { id: "bis-100", age: 8, range: 100, label: { de: "Bis 100 ohne Übergang (34 + 25)", en: "To 100 without carrying (34 + 25)", ne: "१०० सम्म, हातलागी बिना (३४ + २५)" },
    big: { digits: 2, kind: "plain" }, show: "numbers", help: "blocks" },
  { id: "bis-100-uebergang", age: 8, range: 100, label: { de: "Bis 100 mit Übergang (38 + 27)", en: "To 100 with carrying (38 + 27)", ne: "१०० सम्म, हातलागीसहित (३८ + २७)" },
    big: { digits: 2, kind: "carry" }, show: "numbers", help: "blocks" },
  { id: "hunderter-1000", age: 9, range: 1000, label: { de: "Ganze Hunderter bis 1000 (300 + 400)", en: "Whole hundreds to 1000 (300 + 400)", ne: "पूरा सयहरू १००० सम्म (३०० + ४००)" },
    big: { digits: 3, kind: "round" }, show: "numbers", help: "blocks" },
  { id: "bis-1000", age: 9, range: 1000, label: { de: "Bis 1000 ohne Übergang (345 + 230)", en: "To 1000 without carrying (345 + 230)", ne: "१००० सम्म, हातलागी बिना (३४५ + २३०)" },
    big: { digits: 3, kind: "plain" }, show: "numbers", help: "blocks" },
  { id: "bis-1000-uebergang", age: 10, range: 1000, label: { de: "Bis 1000 mit Übergang (368 + 257)", en: "To 1000 with carrying (368 + 257)", ne: "१००० सम्म, हातलागीसहित (३६८ + २५७)" },
    big: { digits: 3, kind: "carry" }, show: "numbers", help: "blocks" },
];
