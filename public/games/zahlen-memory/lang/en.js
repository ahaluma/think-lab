// English texts for "Zahlen-Memory" (Number memory). Names of the things are in /shared/lang/en.js.
// word = number word ("three").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "three" -> "Three"

export default {
  title: "Number memory",
  intro: "Number memory! Find what belongs together. Press start!",
  find: "Find the number and the picture that belong together!",
  match: (word) => `They match! ${big(word)}.`,
  noMatch: "That's not a pair.",
  boardDone: "You found all the pairs!",
  wellDone: "Well done! Three stars!",
  toWorld: "Back to the map",
};
