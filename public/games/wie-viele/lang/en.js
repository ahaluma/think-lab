// English texts for "Wie viele?" (How many?).
// Grammar lives here, not in game.js: every language says "one apple / two apples" differently.

export default {
  title: "How many?",
  trayLabel: "Count the things",
  intro: "How many? Press start!",
  question: (thing) => `How many ${thing.many} can you see?`,
  right: (amount) => `${amount}.`,
  countAgain: "Count again!",
};
