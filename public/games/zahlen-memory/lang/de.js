// Deutsche Texte für "Zahlen-Memory". Names of the things are in /shared/lang/de.js.
// word = number word ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei" -> "Drei"

export default {
  title: "Zahlen-Memory",
  intro: "Zahlen-Memory! Finde, was zusammengehört. Drück auf Start!",
  find: "Finde die Zahl und die Bilder, die zusammengehören!",
  match: (word) => `Das passt! ${big(word)}.`,
  noMatch: "Das passt nicht.",
  boardDone: "Alle Paare gefunden!",
  wellDone: "Toll gemacht! Drei Sterne!",
  toWorld: "Zur Karte",
};
