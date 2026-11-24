// Deutsche Texte für "Zahlenzug". Number words are in /shared/lang/de.js.
const big = (word) => word[0].toUpperCase() + word.slice(1); // "drei" -> "Drei" (a number as a noun)

export default {
  title: "Zahlenzug",
  intro: "Zahlenzug! Hilf den Wagen mit den Zahlen. Drück auf Start!",
  missing: "Welche Zahl fehlt?",
  after: (word) => `Was kommt nach der ${big(word)}?`,
  before: (word) => `Was kommt vor der ${big(word)}?`,
  order: "Häng die Wagen der Reihe nach an!",
  whichNext: "Hmm, welche Zahl kommt jetzt?",
  missingRight: (word) => `Super! Die ${big(word)} hat gefehlt.`,
  afterRight: (a, b) => `Super! Nach der ${big(a)} kommt die ${big(b)}.`,
  beforeRight: (a, b) => `Super! Vor der ${big(a)} kommt die ${big(b)}.`,
  orderRight: (list) => `Super! ${list.join(", ")}.`,
};
