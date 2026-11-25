// English texts for "Zahlenzug" (Number train). Number words are in /shared/lang/en.js.
export default {
  title: "Number train",
  intro: "Number train! Help the wagons with their numbers. Press start!",
  missing: "Which number is missing?",
  after: (word) => `What comes after ${word}?`,
  before: (word) => `What comes before ${word}?`,
  order: "Put the wagons on in order!",
  whichNext: "Which number comes next?",
  missingRight: (word) => `${word[0].toUpperCase() + word.slice(1)} was missing.`,
  afterRight: (a, b) => `After ${a} comes ${b}.`,
  beforeRight: (a, b) => `Before ${a} comes ${b}.`,
  orderRight: (list) => `${list.join(", ")}.`,
};
