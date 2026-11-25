// English texts for "Wer kommt dazu?" (Who's coming?). Names of the animals are in /shared/lang/en.js.
// amount = spoken amount like "three rabbits" / "one rabbit", n = how many.
const big = (text) => text[0].toUpperCase() + text.slice(1); // "one rabbit" -> "One rabbit"

export default {
  title: "Who's coming?",
  intro: "Who's coming? Press start!",
  here: (n, amount) => (n === 1 ? `Here is ${amount}.` : `Here are ${amount}.`),
  hide: "Whoosh, behind the bush!",
  come: (n, amount) => (n === 1 ? `${big(amount)} comes along!` : `${big(amount)} come along!`),
  go: (n, amount) => (n === 1 ? `${big(amount)} runs away!` : `${big(amount)} run away!`),
  first: (thing) => `How many ${thing.many} are on the meadow?`,
  question: (thing) => `How many ${thing.many} are there now?`,
  right: (n, amount) => (n === 1 ? `Now there is ${amount}.` : `Now there are ${amount}.`),
  thinkAgain: "Think again!",
  countNow: "Let's count!",
};
