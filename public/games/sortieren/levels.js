// Levels of "sortieren". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   mode   – "sort": things into baskets, "odd": which one does not belong?,
//            "switch": sort by colour, then the same things by kind, "mix": a round of one of `levels`
//   rules  – one is picked each round (see RULES)
//   n      – how many things to sort for one star
//   tricky – the things look like the other basket (a yellow animal when the fruit basket shows a banana)

// The three pairs of colours (see RULES in game.js).
export const COLOR_PAIRS = ["redYellow", "redGreen", "yellowGreen"];

export const LEVELS = [
  { id: "tier-obst", age: 3, label: { de: "Tier oder Obst", en: "Animal or fruit", ne: "जनावर वा फलफूल" },
    mode: "sort", rules: ["kind"], n: 3 },
  { id: "tier-fahrzeug", age: 3, label: { de: "Tier oder Fahrzeug", en: "Animal or vehicle", ne: "जनावर वा सवारी" },
    mode: "sort", rules: ["vehicle"], n: 3 },
  { id: "rot-gelb", age: 4, label: { de: "Rot oder Gelb", en: "Red or yellow", ne: "रातो वा पहेँलो" },
    mode: "sort", rules: ["redYellow"], n: 3 },
  { id: "gruen", age: 4, label: { de: "Rot oder Gelb gegen Grün", en: "Red or yellow against green", ne: "रातो वा पहेँलो, हरियोसँग" },
    mode: "sort", rules: ["redGreen", "yellowGreen"], n: 3 },
  { id: "gross-klein", age: 5, label: { de: "Großes oder kleines Tier", en: "Big or small animal", ne: "ठूलो वा सानो जनावर" },
    mode: "sort", rules: ["size"], n: 3 },
  { id: "zwei-gemischt", age: 5, label: { de: "2 Körbe, alles gemischt", en: "2 baskets, all mixed", ne: "२ टोकरी, सबै मिसाएर" },
    mode: "sort", rules: ["kind", "vehicle", "redYellow", "redGreen", "yellowGreen", "size"], n: 4 },
  { id: "passt-nicht-art", age: 5, label: { de: "Was passt nicht? (Art)", en: "Odd one out (kind)", ne: "कुन मिल्दैन? (किसिम)" },
    mode: "odd", rules: ["kind", "vehicle"] },
  { id: "passt-nicht-farbe", age: 6, label: { de: "Was passt nicht? (Farbe)", en: "Odd one out (colour)", ne: "कुन मिल्दैन? (रङ)" },
    mode: "odd", rules: ["redYellow", "redGreen", "yellowGreen"] },
  { id: "passt-nicht-alle", age: 6, label: { de: "Was passt nicht? (alles)", en: "Odd one out (all rules)", ne: "कुन मिल्दैन? (सबै)" },
    mode: "odd", rules: ["kind", "vehicle", "redYellow", "redGreen", "yellowGreen", "size"] },
  { id: "drei-art", age: 6, label: { de: "3 Körbe: Tier, Obst, Fahrzeug", en: "3 baskets: animal, fruit, vehicle", ne: "३ टोकरी: जनावर, फलफूल, सवारी" },
    mode: "sort", rules: ["kind3"], n: 4 },
  { id: "drei-farbe", age: 6, label: { de: "3 Körbe: Rot, Gelb, Grün", en: "3 baskets: red, yellow, green", ne: "३ टोकरी: रातो, पहेँलो, हरियो" },
    mode: "sort", rules: ["color3"], n: 4 },
  { id: "knifflig-art", age: 7, label: { de: "Knifflig: die Farbe ist egal", en: "Tricky: colour does not matter", ne: "कठिन: रङले फरक पर्दैन" },
    mode: "sort", rules: ["kind", "vehicle"], n: 4, tricky: true },
  { id: "knifflig-farbe", age: 7, label: { de: "Knifflig: nur die Farbe zählt", en: "Tricky: only colour counts", ne: "कठिन: रङ मात्र" },
    mode: "sort", rules: COLOR_PAIRS, n: 4, tricky: true },
  { id: "vier", age: 7, label: { de: "4 Körbe", en: "4 baskets", ne: "४ टोकरी" },
    mode: "sort", rules: ["kind4", "color4"], n: 5 },
  { id: "neue-regel", age: 8, label: { de: "Neue Regel: erst Farbe, dann Art", en: "New rule: colour first, then kind", ne: "नयाँ नियम: पहिले रङ, अनि किसिम" },
    mode: "switch" },
  { id: "alles", age: 8, label: { de: "Alles gemischt (3–4 Körbe, knifflig, neue Regel)", en: "All mixed (3–4 baskets, tricky, new rule)", ne: "सबै मिसाएर" },
    mode: "mix", levels: ["drei-art", "drei-farbe", "knifflig-art", "knifflig-farbe", "vier", "neue-regel"] },
];
