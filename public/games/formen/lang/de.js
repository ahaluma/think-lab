// Deutsche Texte für "Formen". Shared words (numbers, praise) come from /shared/lang/de.js.
// s, got, want = a shape from `shapes` below; pic = a picture from `pictures`; what = spoken amount ("drei Kreise").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "ein Haus" -> "Ein Haus"

export default {
  title: "Formen",
  intro: "Formen! Kreis, Dreieck, Quadrat und Rechteck. Drück auf Start!",
  shapes: {
    circle: { one: "ein Kreis", many: "Kreise", the: "den Kreis" },
    triangle: { one: "ein Dreieck", many: "Dreiecke", the: "das Dreieck" },
    square: { one: "ein Quadrat", many: "Quadrate", the: "das Quadrat" },
    rectangle: { one: "ein Rechteck", many: "Rechtecke", the: "das Rechteck" },
  },
  // After two wrong answers (the corners also get dots).
  hint: {
    circle: "Ein Kreis ist rund und hat keine Ecken.",
    triangle: "Ein Dreieck hat drei Ecken.",
    square: "Ein Quadrat hat vier Ecken, und alle Seiten sind gleich lang.",
    rectangle: "Ein Rechteck hat vier Ecken, zwei lange und zwei kurze Seiten.",
  },

  // Find: "Tipp auf den Kreis!"
  find: (s) => `Tipp auf ${s.the}!`,
  rightFind: (s) => `Das ist ${s.one}!`,
  wrongFind: (got, want) => `Das ist ${got.one}. Such ${want.the}!`,

  // Build a picture: one gap glows.
  pictures: {
    house: "ein Haus", iceCream: "ein Eis", snowman: "ein Schneemann", tree: "ein Baum", lollipop: "ein Lutscher",
    fish: "ein Fisch", boat: "ein Boot", car: "ein Auto", rocket: "eine Rakete", robot: "ein Roboter",
    train: "ein Zug", flower: "eine Blume",
  },
  build: "Welche Form passt in die Lücke?",
  buildNext: "Und welche Form passt hier?",
  rightBuild: (s) => `${big(s.one)}!`,
  wrongBuild: "Die passt nicht. Schau dir die Lücke genau an!",
  built: (pic) => `Fertig! ${big(pic)}!`,

  // All: "Tipp auf alle Dreiecke!"
  all: (s) => `Tipp auf alle ${s.many}!`,
  wrongAll: (got, want) => `Das ist ${got.one}. Wir suchen ${want.many}!`,
  allFound: (s) => `Du hast alle ${s.many} gefunden!`,

  // Count: "Wie viele Kreise sind im Bild?"
  count: (s) => `Wie viele ${s.many} sind im Bild?`,
  rightCount: (what) => `${big(what)}!`,
  countAgain: "Zähl nochmal genau!",
  countHint: (s) => `Schau, jetzt leuchten nur die ${s.many}. Zähl sie!`,

  // Riddles
  riddle: {
    circle: "Ich bin rund und habe keine Ecken. Wer bin ich?",
    triangle: "Ich habe drei Ecken und drei Seiten. Wer bin ich?",
    square: "Ich habe vier Ecken, und alle meine Seiten sind gleich lang. Wer bin ich?",
    rectangle: "Ich habe vier Ecken, zwei lange und zwei kurze Seiten. Wer bin ich?",
  },
  rightRiddle: (s) => `Ich bin ${s.one}!`,
  wrongRiddle: (got) => `Das ist ${got.one}. Hör nochmal genau zu!`,
  cornersHint: "Schau: Die Punkte sind die Ecken. Zähl sie!",
};
