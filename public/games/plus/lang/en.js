// English texts for "Plus". Names of the animals are in /shared/lang/en.js.
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "Plus",
  intro: "Plus! How many are there together? Press start!",
  question: (a, b) => `What is ${a} plus ${b}?`,
  together: (a, b, c) => `${big(a)} and ${b} make ${c}.`,
  countOn: (a, next) => `${big(a)} … ${next.join(", ")}!`,
  bridge: (a, toTen, rest, c) => `${big(a)} and ${toTen} make ten, and ${rest} more make ${c}.`,
  countAll: "Count them all together!",
  startAt: (a) => `There are ${a} behind the bush. Start at ${a} and count on!`,
  picturesHelp: "Look, the pictures help you!",
  fillTen: "First fill up the ten!",
};
