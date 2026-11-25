// Levels of "Genau hinschauen". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js).
//   label – short text for the parents' page.
//
// Every level has both kinds of task; they take turns in a round (find, copy, find, copy, find).
//
//   diff – find the differences between two pictures
//     size   – the picture is size × size places
//     items  – how many things stand in the picture
//     n      – how many differences
//     kinds  – what can be different: "gone" (missing on one picture), "swap" (another thing),
//              "flip" (looks the other way), "small" (smaller)
//     similar – a swapped thing is one that is already in the picture (harder to see)
//   copy – lay the same shapes on an empty board
//     size   – the board is size × size places
//     pieces – how many shapes the model has
//     kinds  – how many different shapes (shape + colour) are in it
//     shapes, colors – what they are made of
//     decoy  – one more shape to choose from that is not in the model
//     look   – milliseconds the model is shown, then a curtain covers it (tap to look again)
//     mirror – lay it as if mirrored in water: the top row of the model is the bottom row of yours

const L = (de, en, ne) => ({ de, en, ne });
const EASY = ["circle", "square", "triangle"];
const ALL = ["circle", "square", "triangle", "star", "heart"];
const EVEN = ["circle", "square", "diamond"]; // look the same upside down: for mirror levels

export const LEVELS = [
  { id: "zwei-mal-zwei", age: 3, label: L("1 Unterschied, 2 × 2 Felder", "1 difference, 2 × 2 places", "१ फरक, २ × २ कोठा"),
    diff: { size: 2, items: 3, n: 1, kinds: ["gone", "swap"] },
    copy: { size: 2, pieces: 2, kinds: 1, shapes: ["circle"], colors: ["red"] } },
  { id: "drei-eins", age: 4, label: L("1 Unterschied, 3 × 3 Felder", "1 difference, 3 × 3 places", "१ फरक, ३ × ३ कोठा"),
    diff: { size: 3, items: 5, n: 1, kinds: ["gone", "swap"] },
    copy: { size: 3, pieces: 3, kinds: 1, shapes: EASY, colors: ["red", "blue", "yellow"] } },
  { id: "drei-zwei", age: 4, label: L("2 Unterschiede, 2 Formen", "2 differences, 2 shapes", "२ फरक, २ आकार"),
    diff: { size: 3, items: 6, n: 2, kinds: ["gone", "swap"] },
    copy: { size: 3, pieces: 3, kinds: 2, shapes: EASY, colors: ["red", "blue", "yellow"] } },
  { id: "drei-drei", age: 5, label: L("3 Unterschiede, auch andersherum", "3 differences, also turned around", "३ फरक, उल्टो पनि"),
    diff: { size: 3, items: 7, n: 3, kinds: ["gone", "swap", "flip"] },
    copy: { size: 3, pieces: 4, kinds: 3, shapes: EASY, colors: ["red", "blue", "yellow"], decoy: true } },
  { id: "vier-drei", age: 5, label: L("4 × 4 Felder, auch kleiner", "4 × 4 places, also smaller", "४ × ४ कोठा, सानो पनि"),
    diff: { size: 4, items: 10, n: 3, kinds: ["gone", "swap", "flip", "small"] },
    copy: { size: 4, pieces: 5, kinds: 3, shapes: ALL, colors: ["red", "blue", "yellow", "green"], decoy: true } },
  { id: "merken", age: 6, label: L("Aus dem Kopf nachlegen", "Copy from memory", "सम्झेर बनाउने"),
    diff: { size: 4, items: 11, n: 4, kinds: ["gone", "swap", "flip", "small"] },
    copy: { size: 3, pieces: 4, kinds: 2, shapes: ALL, colors: ["red", "blue", "yellow", "green"], look: 5000 } },
  { id: "spiegel", age: 6, label: L("Gespiegelt nachlegen", "Copy mirrored", "ऐनामा जस्तै उल्टो बनाउने"),
    diff: { size: 4, items: 12, n: 4, kinds: ["swap", "flip", "small"], similar: true },
    copy: { size: 3, pieces: 4, kinds: 2, shapes: EVEN, colors: ["red", "blue", "yellow"], mirror: true } },
  { id: "fuenf", age: 7, label: L("5 × 5 Felder, 5 feine Unterschiede", "5 × 5 places, 5 small differences", "५ × ५ कोठा, ५ सानो फरक"),
    diff: { size: 5, items: 16, n: 5, kinds: ["swap", "flip", "small"], similar: true },
    copy: { size: 4, pieces: 6, kinds: 3, shapes: ALL, colors: ["red", "blue", "yellow", "green"], decoy: true, look: 6000 } },
  { id: "profi", age: 8, label: L("Profi: gespiegelt aus dem Kopf", "Expert: mirrored from memory", "विज्ञ: सम्झेर उल्टो"),
    diff: { size: 5, items: 18, n: 5, kinds: ["gone", "swap", "flip", "small"], similar: true },
    copy: { size: 4, pieces: 6, kinds: 3, shapes: EVEN, colors: ["red", "blue", "yellow", "green"], decoy: true, mirror: true, look: 6000 } },
];
