// Deutsche Texte für "Zehnerfreunde". Names of the animals are in /shared/lang/de.js.
// a, b, c = number words ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei" -> "Drei"

export default {
  title: "Zehnerfreunde",
  intro: "Zehnerfreunde! Wie viele fehlen bis zehn? Drück auf Start!",
  // c = the total as a word: "zehn" or "fünf"
  question: (thing, c) => `Wie viele ${thing.many} fehlen bis ${c}?`,
  questionNumbers: (c) => `Wie viele fehlen bis ${c}?`,
  look: "Schau genau hin!",
  together: (a, b, c) => `${big(a)} und ${b} sind zusammen ${c}.`,
  countEmpty: "Zähl die leeren Plätze!",
  lookAgain: "Tipp auf das Bild und schau nochmal!",
  frameHelps: "Schau, die Plätze helfen dir!",
  showAgain: "Nochmal zeigen",
};
