// Deutsche Texte für "Wie viele?".
// Grammar lives here, not in game.js: every language says "one apple / two apples" differently.

export default {
  title: "Wie viele?",
  trayLabel: "Zähle die Dinge",
  intro: "Wie viele? Drück auf Start!",
  question: (thing) => `Wie viele ${thing.many} siehst du?`,
  right: (amount) => `Super! ${amount}.`,
  countAgain: "Hmm, zähl nochmal!",
};
