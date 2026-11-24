// English texts for "Zahlenzug" (Number train). Number words are in /shared/lang/en.js.
export default {
  title: "Number train",
  intro: "Number train! Help the wagons with their numbers. Press start!",
  missing: "Which number is missing?",
  after: (word) => `What comes after ${word}?`,
  before: (word) => `What comes before ${word}?`,
  order: "Put the wagons on in order!",
  whichNext: "Hmm, which number comes next?",
  missingRight: (word) => `Super! ${word[0].toUpperCase() + word.slice(1)} was missing.`,
  afterRight: (a, b) => `Super! After ${a} comes ${b}.`,
  beforeRight: (a, b) => `Super! Before ${a} comes ${b}.`,
  orderRight: (list) => `Super! ${list.join(", ")}.`,
};
