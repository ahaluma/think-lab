// English texts for "Zehnerfreunde" (Ten friends). Names of the animals are in /shared/lang/en.js.
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "Ten friends",
  intro: "Ten friends! How many are missing to ten? Press start!",
  question: (thing, c) => `How many ${thing.many} are missing to ${c}?`,
  questionNumbers: (c) => `How many are missing to ${c}?`,
  look: "Look closely!",
  together: (a, b, c) => `${big(a)} and ${b} make ${c}.`,
  countEmpty: "Count the empty places!",
  lookAgain: "Tap the picture and look again!",
  frameHelps: "Look, the places help you!",
  showAgain: "Show again",
};
