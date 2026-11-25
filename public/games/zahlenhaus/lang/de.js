// Deutsche Texte für "Zahlenhaus". Names of the animals are in /shared/lang/de.js.
// amount = spoken amount like "fünf Hasen"; a, b, c = number words ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei" -> "Drei"

export default {
  title: "Zahlenhaus",
  intro: "Zahlenhaus! Drück auf Start!",
  first: (thing) => `Wie viele ${thing.many} sind da?`,
  firstRight: (amount) => `Das sind ${amount}.`,
  countAgain: "Zähl nochmal!",
  goIn: "Husch, ein paar gehen ins Haus!",
  question: (thing) => `Wie viele ${thing.many} sind im Haus?`,
  insideRight: (a) => `${big(a)} im Haus.`,
  outsideQuestion: (thing) => `Wie viele ${thing.many} sind noch draußen?`,
  hiddenQuestion: (thing) => `Wie viele ${thing.many} sind im Haus versteckt?`,
  together: (a, b, c) => `${big(a)} und ${b} sind zusammen ${c}.`,
  thinkAgain: (amount) => `Denk nochmal: Es sind ${amount}.`,
  countNow: "Schau ins Haus!",
};
