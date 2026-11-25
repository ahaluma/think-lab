// Deutsche Texte für "Genau hinschauen". Names of the things are in /shared/lang/de.js.
// thing = { one: "ein Elefant", many: "Elefanten" }, n = how many, word = the number word ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "ein Elefant" -> "Ein Elefant"

// The shapes, for screen readers: "roter Kreis", "blaues Dreieck".
const SHAPES = { circle: ["Kreis", "er"], square: ["Viereck", "es"], triangle: ["Dreieck", "es"], star: ["Stern", "er"],
  heart: ["Herz", "es"], diamond: ["Raute", "e"] };
const COLORS = { red: "rot", blue: "blau", yellow: "gelb", green: "grün" };

export default {
  title: "Genau hinschauen",
  intro: "Genau hinschauen! Finde die Unterschiede und leg Formen nach. Drück auf Start!",
  // Find the differences
  findOne: "Die zwei Bilder sind fast gleich. Ein Ding ist anders. Tipp darauf!",
  findMany: (word) => `Die zwei Bilder sind fast gleich. Finde die ${word} Unterschiede und tipp darauf!`,
  sameHere: "Hier ist es auf beiden Bildern gleich.",
  lookHere: "Schau mal, wo es leuchtet!",
  gone: (thing) => `${big(thing.one)} fehlt auf einem Bild.`,
  swap: (a, b) => `${big(a.one)} und ${b.one}.`,
  flip: (thing) => `${big(thing.one)} schaut in die andere Richtung.`,
  small: (thing) => `${big(thing.one)} ist kleiner.`,
  left: (n, word) => (n === 1 ? "Noch ein Unterschied." : `Noch ${word} Unterschiede.`),
  allFound: "Alle Unterschiede gefunden!",
  // Copy the shapes
  copy: "Leg die Formen genau so hin wie oben! Erst unten eine Form antippen, dann ein Feld.",
  copyLook: "Schau dir das Bild gut an! Gleich wird es zugedeckt. Dann legst du es aus dem Kopf nach.",
  covered: "Jetzt ist es zugedeckt. Leg es nach! Tipp auf das Tuch, dann darfst du nochmal schauen.",
  copyMirror: "Leg es so hin, wie es im Wasser gespiegelt aussieht! Die obere Reihe kommt nach unten.",
  peek: "Nochmal schauen",
  fewer: "Es fehlen noch Formen.",
  more: "Das sind zu viele Formen.",
  places: "Schau genau: Ist jede Form am richtigen Platz und hat sie die richtige Farbe?",
  mirrorHint: "Denk an das Wasser: Was oben ist, kommt bei dir nach unten.",
  marked: "Schau: Wo es leuchtet, ist es noch anders.",
  same: "Genau gleich!",
  solution: "So ist es richtig. Schau es dir an!",
  piece: (shape, color) => `${COLORS[color]}${SHAPES[shape][1]} ${SHAPES[shape][0]}`,
  board: "Dein Feld",
  model: "Vorbild",
};
