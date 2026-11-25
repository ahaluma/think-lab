// Deutsche Texte für "Plus". Names of the animals are in /shared/lang/de.js.
// a, b, c = number words ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei" -> "Drei"

export default {
  title: "Plus",
  intro: "Plus! Wie viele sind es zusammen? Drück auf Start!",
  question: (a, b) => `Wie viel ist ${a} plus ${b}?`,
  together: (a, b, c) => `${big(a)} und ${b} sind zusammen ${c}.`,
  // Counting on from the bush: "Sechs … sieben, acht!"
  countOn: (a, next) => `${big(a)} … ${next.join(", ")}!`,
  // Above 10: "Acht und zwei sind zehn, und noch drei sind dreizehn."
  bridge: (a, toTen, rest, c) => `${big(a)} und ${toTen} sind zehn, und noch ${rest} sind ${c}.`,
  countAll: "Zähl alle zusammen!",
  startAt: (a) => `Hinter dem Busch sind ${a}. Fang bei ${a} an und zähl weiter!`,
  picturesHelp: "Schau, die Bilder helfen dir!",
  fillTen: "Mach erst die Zehn voll!",
};
