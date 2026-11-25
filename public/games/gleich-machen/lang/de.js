// Deutsche Texte für "Gleich machen". Names of the animals are in /shared/lang/de.js.
// thing = the animal ({ one: "ein Hase", many: "Hasen" }), n = how many, what = spoken amount ("drei Hasen"),
// a, b, c = number words ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei Hasen" -> "Drei Hasen"

export default {
  title: "Gleich machen",
  intro: "Gleich machen! Auf beiden Wiesen sollen gleich viele sein. Drück auf Start!",
  house: "Haus",
  // Tapping: send animals home, or bring them out of the house.
  tapAway: (thing) => `Schick so viele ${thing.many} nach Hause, dass auf beiden Wiesen gleich viele sind!`,
  tapMore: (thing) => `Hol so viele ${thing.many} aus dem Haus, dass auf beiden Wiesen gleich viele sind!`,
  // Giving the number, with pictures.
  askAway: (thing) => `Wie viele ${thing.many} müssen nach Hause, damit auf beiden Wiesen gleich viele sind?`,
  askMore: (thing) => `Wie viele ${thing.many} müssen dazu, damit auf beiden Wiesen gleich viele sind?`,
  // Numbers only: "Sieben und vier. Wie viele müssen weg, damit es gleich viele sind?"
  numbersAway: (a, c) => `${big(a)} und ${c}. Wie viele müssen weg, damit es gleich viele sind?`,
  numbersMore: (a, c) => `${big(a)} und ${c}. Wie viele müssen dazu, damit es gleich viele sind?`,
  // Hints
  wrongSideAway: "Auf dieser Wiese sind weniger. Schick von der anderen Wiese welche nach Hause!",
  wrongSideMore: "Auf dieser Wiese sind schon mehr. Hol auf der anderen Wiese welche dazu!",
  staysHere: "Die bleiben hier. Hol welche aus dem Haus dazu!",
  stillMore: "Noch nicht gleich. Auf einer Wiese sind noch mehr.",
  stillFewer: "Noch nicht gleich. Auf einer Wiese sind noch weniger.",
  tooManyAway: "Zu viele! Tipp auf das Haus, dann kommt einer zurück.",
  tooManyMore: "Zu viele! Tipp auf einen, dann geht er zurück ins Haus.",
  thinkAgain: "Schau nochmal genau!",
  pairsAway: "Schau: Immer zwei sind ein Paar. Wer keinen Partner hat, geht nach Hause.",
  pairsMore: "Schau: Immer zwei sind ein Paar. Wer keinen Partner hat, braucht einen aus dem Haus.",
  pairsCount: "Schau: Immer zwei sind ein Paar. Wie viele haben keinen Partner?",
  // Right: "Drei Hasen gehen nach Hause. Jetzt sind auf beiden Wiesen vier."
  wentHome: (n, what) => `${big(what)} ${n === 1 ? "geht" : "gehen"} nach Hause.`,
  cameOut: (n, what) => `${big(what)} ${n === 1 ? "kommt" : "kommen"} dazu.`,
  nowBoth: (a) => `Jetzt sind auf beiden Wiesen ${a}.`,
  minusSays: (a, b, c) => `${big(a)} minus ${b} ist ${c}.`,
  plusSays: (a, b, c) => `${big(a)} plus ${b} ist ${c}.`,
};
