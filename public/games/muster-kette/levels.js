// Levels of "muster-kette". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. After every 5 stars the child moves up one level.
//   pats – the patterns, one is picked each round. Letters stand for things: "ABB" = 🍎🍌🍌🍎🍌🍌…
//   gap  – "end": what comes next?  "middle": what is missing in the chain?
//   reps – how many times the pattern is shown before the gap (end only)

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
];
