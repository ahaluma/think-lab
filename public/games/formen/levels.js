// Levels of "Formen". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
//   kind  – "find":   "Tipp auf den Kreis!" one of 3 or 4 big shapes
//           "build":  a picture made of shapes (house, rocket …); one gap glows: which shape fits?
//           "all":    eight shapes on a board: tap all the triangles
//           "count":  a picture made of shapes: how many circles are in it?
//           "riddle": "Ich habe drei Ecken. Wer bin ich?"
//           "mix":    one of `levels` for every task
//   shapes  – find: the shapes that can come (circle, triangle, square, rectangle)
//   look    – find: "same": one colour and size, upright; "size": colours and sizes change;
//             "turn": also turned, long or flat (a triangle standing on its tip is still a triangle)
//   choices – find, build: how many shapes to pick from
//   pics    – build: "small" pictures (2–3 parts) or "big" ones (4–6 parts), see PICTURES in game.js
//   levels  – mix: the ids of the levels to mix

const L = (de, en, ne) => ({ de, en, ne });
const ALL = ["circle", "triangle", "square", "rectangle"];

export const LEVELS = [
  { id: "finden-3", age: 3, label: L("Kreis, Dreieck, Quadrat finden", "Find circle, triangle, square", "गोलो, त्रिभुज, वर्ग खोज"),
    kind: "find", shapes: ["circle", "triangle", "square"], look: "same", choices: 3 },
  { id: "finden-4", age: 4, label: L("Auch Rechteck, bunt und groß/klein", "Also rectangle, colours and sizes", "आयत पनि, रङ र आकार फरक"),
    kind: "find", shapes: ALL, look: "size", choices: 4 },
  { id: "bild-klein", age: 4, label: L("Bilder legen (2–3 Formen)", "Build pictures (2–3 shapes)", "चित्र बनाऊ (२–३ आकार)"),
    kind: "build", pics: "small", choices: 3 },
  { id: "gedreht", age: 5, label: L("Gedrehte Formen erkennen", "Turned shapes", "घुमेका आकार चिन"),
    kind: "find", shapes: ALL, look: "turn", choices: 4 },
  { id: "alle-finden", age: 5, label: L("Alle Dreiecke finden", "Find all the triangles", "सबै त्रिभुज खोज"),
    kind: "all" },
  { id: "bild-gross", age: 5, label: L("Große Bilder legen (4–6 Formen)", "Build big pictures (4–6 shapes)", "ठूलो चित्र बनाऊ (४–६ आकार)"),
    kind: "build", pics: "big", choices: 4 },
  { id: "zaehlen", age: 6, label: L("Formen im Bild zählen", "Count the shapes in a picture", "चित्रमा आकार गन"),
    kind: "count" },
  { id: "raetsel", age: 6, label: L("Rätsel: Ecken und Seiten", "Riddles: corners and sides", "पहेली: कुना र भुजा"),
    kind: "riddle" },
  { id: "gemischt", age: 7, label: L("Alles gemischt", "Everything mixed", "सबै मिसाएर"),
    kind: "mix", levels: ["gedreht", "alle-finden", "bild-gross", "zaehlen", "raetsel"] },
];
