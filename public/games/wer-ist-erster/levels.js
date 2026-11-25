// Levels of "Wer ist Erster?" (ordinal numbers). Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js).
//   label – short text for the parents' page.
//
// The animals queue for ice cream. The ice-cream cart is at the front (left): the animal next to it is the first.
//   n     – how many animals queue: [fewest, most]
//   kinds – the tasks of this level, one is picked for every task:
//           "ends":   tap the first or the last animal
//           "tap":    tap the first, second, third … animal (up to `upTo`), sometimes the last
//           "which":  "What place is the lion in?" – one of three answers (the number pad from 8)
//           "beside": "Who is right in front of / behind the lion?" – tap that animal
//           "back":   tap the second, third … animal from the back
//   upTo  – the highest place asked for in "tap" (never more than n)

const L = (de, en, ne) => ({ de, en, ne });

export const LEVELS = [
  { id: "erster-letzter", age: 4, label: L("Erster oder Letzter (3–4 Tiere)", "First or last (3–4 animals)", "पहिलो वा अन्तिम (३–४ जनावर)"),
    n: [3, 4], kinds: ["ends"] },
  { id: "bis-3", age: 4, label: L("Erster bis Dritter", "First to third", "पहिलो देखि तेस्रो"),
    n: [4, 4], kinds: ["tap"], upTo: 3 },
  { id: "bis-5", age: 5, label: L("Erster bis Fünfter", "First to fifth", "पहिलो देखि पाँचौँ"),
    n: [5, 5], kinds: ["tap"], upTo: 5 },
  { id: "welcher-platz", age: 5, label: L("Der Wievielte ist es? (5 Tiere)", "What place is it? (5 animals)", "कतिऔँ हो? (५ जनावर)"),
    n: [5, 5], kinds: ["which"] },
  { id: "vor-hinter", age: 6, label: L("Wer steht davor, wer dahinter?", "Who is in front, who behind?", "अगाडि को, पछाडि को?"),
    n: [5, 6], kinds: ["beside"] },
  { id: "bis-8", age: 6, label: L("Bis zum Achten", "Up to the eighth", "आठौँ सम्म"),
    n: [6, 8], kinds: ["tap", "which"], upTo: 8 },
  { id: "von-hinten", age: 7, label: L("Von hinten zählen", "Counting from the back", "पछाडिबाट गन्ने"),
    n: [5, 7], kinds: ["back"] },
  { id: "gemischt", age: 7, label: L("Alles gemischt (bis 8 Tiere)", "All mixed (up to 8 animals)", "सबै मिसाएर (८ जनावर सम्म)"),
    n: [6, 8], kinds: ["tap", "which", "beside", "back"], upTo: 8 },
];
