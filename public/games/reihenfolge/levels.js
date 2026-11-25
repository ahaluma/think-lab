// Levels of "reihenfolge". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. The level follows the child: up, down or stay after each round (shared/adapt.js).
//   kind   – what the child does (see game.js):
//            "story"   – tap the pictures of a little story in the right order (steps: 3 or 4 pictures)
//            "day"     – put morning, midday, evening and night in order
//            "seasons" – put the four seasons in order (from: "spring" or "any": the first one is given)
//            "when"    – one picture: when is that? (times: "daynight" = day or night, "day" = 4 times, "seasons")
//            "around"  – one picture of a story: what came before? what comes after?
//            "week"    – days of the week: which day is tomorrow (or yesterday)? strip: the week is shown
//            "mix"     – one of `levels` each task

export const LEVELS = [
  { id: "tag-nacht", age: 3, label: { de: "Tag oder Nacht?", en: "Day or night?", ne: "दिन कि रात?" },
    kind: "when", times: "daynight" },
  { id: "geschichte-3", age: 4, label: { de: "Bildergeschichten mit 3 Bildern", en: "Picture stories, 3 pictures", ne: "३ चित्रको कथा" },
    kind: "story", steps: 3 },
  { id: "tag-ordnen", age: 4, label: { de: "Morgen, Mittag, Abend, Nacht ordnen", en: "Order morning, midday, evening, night", ne: "बिहान, दिउँसो, बेलुका, राति क्रममा" },
    kind: "day" },
  { id: "tageszeit", age: 5, label: { de: "Wann ist das? Tageszeiten", en: "When is it? Times of day", ne: "कहिले हो? दिनको समय" },
    kind: "when", times: "day" },
  { id: "geschichte-4", age: 5, label: { de: "Bildergeschichten mit 4 Bildern", en: "Picture stories, 4 pictures", ne: "४ चित्रको कथा" },
    kind: "story", steps: 4 },
  { id: "jahreszeit", age: 5, label: { de: "Wann ist das? Jahreszeiten", en: "When is it? Seasons", ne: "कहिले हो? ऋतु" },
    kind: "when", times: "seasons" },
  { id: "jahreszeiten-ordnen", age: 6, label: { de: "Jahreszeiten ordnen", en: "Order the seasons", ne: "ऋतु क्रममा" },
    kind: "seasons", from: "any" },
  { id: "vorher-nachher", age: 6, label: { de: "Was war vorher, was kommt danach?", en: "What came before, what comes after?", ne: "अघि के थियो, पछि के हुन्छ?" },
    kind: "around" },
  { id: "wochentage", age: 6, label: { de: "Wochentage: welcher Tag ist morgen?", en: "Days of the week: what is tomorrow?", ne: "बार: भोलि कुन बार?" },
    kind: "week", back: false, strip: true },
  { id: "wochentage-gestern", age: 7, label: { de: "Wochentage: morgen und gestern, ohne Hilfe", en: "Days of the week: tomorrow and yesterday", ne: "बार: भोलि र हिजो" },
    kind: "week", back: true, strip: false },
  { id: "alles-gemischt", age: 7, label: { de: "Alles gemischt", en: "All mixed", ne: "सबै मिसाएर" },
    kind: "mix", levels: ["geschichte-4", "tageszeit", "jahreszeiten-ordnen", "vorher-nachher", "wochentage-gestern"] },
];
