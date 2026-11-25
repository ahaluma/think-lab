// English texts for "Zahlenhaus" (Number house). Names of the animals are in /shared/lang/en.js.
// amount = spoken amount like "five rabbits"; a, b, c = number words ("three").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "three" -> "Three"

export default {
  title: "Number house",
  intro: "Number house! Press start!",
  first: (thing) => `How many ${thing.many} are there?`,
  firstRight: (amount) => `That's ${amount}.`,
  countAgain: "Count again!",
  goIn: "Whoosh, some go into the house!",
  question: (thing) => `How many ${thing.many} are in the house?`,
  insideRight: (a) => `${big(a)} in the house.`,
  outsideQuestion: (thing) => `How many ${thing.many} are still outside?`,
  hiddenQuestion: (thing) => `How many ${thing.many} are hiding in the house?`,
  together: (a, b, c) => `${big(a)} and ${b} make ${c}.`,
  thinkAgain: (amount) => `Think again: there are ${amount}.`,
  countNow: "Look inside!",
};
