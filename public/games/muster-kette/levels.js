// Levels of "muster-kette". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   kind  – "pattern" (default), "grow", "numbers", "two" or "mix" (see game.js)
//   pats  – pattern: the patterns, one is picked each round. Letters stand for things: "ABB" = 🍎🍌🍌🍎🍌🍌…
//   gap   – "end": what comes next?  "middle": what is missing in the chain?
//   reps  – pattern: how many times the pattern is shown before the gap (end only)
//   steps, down, max – numbers: the step sizes, also backwards?, the biggest number
//   pairs – two: shape pattern + colour pattern, e.g. "AB+AABB" (which one is the shape is picked at random)
//   levels – mix: the ids of the levels to mix

export const LEVELS = [
  { id: "ab", age: 3, label: { de: "AB: was kommt danach?", en: "AB: what comes next?", ne: "AB: अब के आउँछ?" },
    pats: ["AB"], gap: "end", reps: 2 },
  { id: "ab-lang", age: 3, label: { de: "AB, längere Kette", en: "AB, longer chain", ne: "AB, लामो माला" },
    pats: ["AB"], gap: "end", reps: 3 },
  { id: "abb", age: 4, label: { de: "ABB", en: "ABB", ne: "ABB" },
    pats: ["ABB"], gap: "end", reps: 2 },
  { id: "abc", age: 4, label: { de: "ABC", en: "ABC", ne: "ABC" },
    pats: ["ABC"], gap: "end", reps: 2 },
  { id: "aabb", age: 5, label: { de: "AABB", en: "AABB", ne: "AABB" },
    pats: ["AABB"], gap: "end", reps: 2 },
  { id: "alle", age: 5, label: { de: "Alle Muster gemischt", en: "All patterns mixed", ne: "सबै ढाँचा मिसाएर" },
    pats: ["AB", "ABB", "ABC", "AABB"], gap: "end", reps: 2 },
  { id: "mitte-ab", age: 6, label: { de: "AB: Lücke in der Mitte", en: "AB: gap in the middle", ne: "AB: बीचमा खाली" },
    pats: ["AB"], gap: "middle" },
  { id: "mitte-abb-abc", age: 6, label: { de: "ABB, ABC: Lücke in der Mitte", en: "ABB, ABC: gap in the middle", ne: "ABB, ABC: बीचमा खाली" },
    pats: ["ABB", "ABC"], gap: "middle" },
  { id: "mitte-alle", age: 7, label: { de: "Alle Muster, Lücke in der Mitte", en: "All patterns, gap in the middle", ne: "सबै ढाँचा, बीचमा खाली" },
    pats: ["AB", "ABB", "ABC", "AABB"], gap: "middle" },
  { id: "wachsend", age: 7, label: { de: "Wachsende Muster", en: "Growing patterns", ne: "बढ्दै जाने ढाँचा" },
    kind: "grow", gap: "end" },
  { id: "zahlen-20", age: 7, label: { de: "Zahlenfolgen bis 20", en: "Number sequences to 20", ne: "२० सम्मको अङ्क क्रम" },
    kind: "numbers", steps: [1, 2], max: 20, gap: "end" },
  { id: "form-farbe", age: 8, label: { de: "Form und Farbe", en: "Shape and colour", ne: "आकार र रङ" },
    kind: "two", pairs: ["AB+AABB", "AB+ABB"], gap: "end" },
  { id: "zahlen-schritte", age: 8, label: { de: "Zahlenfolgen in Schritten, auch rückwärts", en: "Number steps, also backwards", ne: "फड्को मारेर अङ्क, उल्टो पनि" },
    kind: "numbers", steps: [2, 3, 5, 10], down: true, max: 50, gap: "end" },
  { id: "wachsend-mitte", age: 8, label: { de: "Wachsende Muster: Lücke in der Mitte", en: "Growing patterns: gap in the middle", ne: "बढ्दै जाने ढाँचा: बीचमा खाली" },
    kind: "grow", gap: "middle" },
  { id: "form-farbe-mitte", age: 9, label: { de: "Form und Farbe: Lücke in der Mitte", en: "Shape and colour: gap in the middle", ne: "आकार र रङ: बीचमा खाली" },
    kind: "two", pairs: ["AB+AABB", "AB+ABB", "AB+ABC"], gap: "middle" },
  { id: "zahlen-100", age: 10, label: { de: "Zahlenfolgen bis 100: Lücke in der Mitte", en: "Number sequences to 100: gap in the middle", ne: "१०० सम्मको अङ्क क्रम: बीचमा खाली" },
    kind: "numbers", steps: [3, 4, 6, 7, 8, 9, 11, 20], down: true, max: 100, gap: "middle" },
  { id: "knobel-mix", age: 11, label: { de: "Alles Schwere gemischt", en: "All hard ones mixed", ne: "सबै गाह्रो मिसाएर" },
    kind: "mix", levels: ["wachsend-mitte", "form-farbe-mitte", "zahlen-100", "zahlen-schritte"] },
];
