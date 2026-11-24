// English texts for "Wo sind mehr?" (Where are more?). Names of the things are in /shared/lang/en.js.
// here / there = spoken amounts like "three elephants", n = the number of the tapped group.

export default {
  title: "Where are more?",
  intro: "Where are more? Press start!",
  same: "the same",
  questionMore: (thing) => `Where are more ${thing.many}?`,
  questionFewer: (thing) => `Where are fewer ${thing.many}?`,
  rightMore: (n, here, there) => `Super! ${here} are more than ${there}.`,
  rightFewer: (n, here, there) => `Super! ${here} ${n === 1 ? "is" : "are"} fewer than ${there}.`,
  rightSame: (n, here) => `Super! The same: ${here} on each side.`,
  lookAgain: "Hmm, look again!",
};
