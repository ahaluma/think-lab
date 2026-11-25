// English texts for "Gerecht teilen" (Fair share).
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "Fair share",
  intro: "Fair share! Every friend should get the same. Press start!",
  basket: "Basket",
  plate: "Plate",
  divide: "÷",
  tapAsk: (thing, k) => `Share the ${thing.many} fairly! All ${k} friends should get the same. Tap a plate.`,
  restTip: "If there is not enough for everyone, the rest stays in the basket.",
  ask: (what, k) => `${big(what)} for ${k} friends. How many does each one get?`,
  basketEmpty: "The basket is empty. Tap something on a plate and it goes back into the basket.",
  stillInBasket: "There is still something in the basket. Keep sharing!",
  notFair: "That is not fair yet. One friend has more than the others.",
  cutHint: "Only one is left. Tap it and we cut it in half!",
  cut: "Two halves! Now each friend can get one.",
  helpLook: "Look how many each friend has. Give everyone one, one after the other!",
  helpDeal: "Look: one for each, one after the other. How many does each friend have now?",
  thinkAgain: "Look again carefully!",
  eachGets: (n, thing, word) => `Each friend gets ${n === 1 ? thing.one : `${word} ${thing.many}`}.`,
  eachGetsHalf: (n, thing, word) => `Each friend gets ${word} and a half ${thing.many}.`,
  left: (n, word) => (n === 1 ? "One stays in the basket. It cannot be shared fairly." : `${big(word)} stay in the basket. They cannot be shared fairly.`),
  divideSays: (a, b, c) => `${big(a)} divided by ${b} is ${c}.`,
  treats: {
    cookie: { one: "one cookie", many: "cookies" },
    apple: { one: "one apple", many: "apples" },
    strawberry: { one: "one strawberry", many: "strawberries" },
    candy: { one: "one sweet", many: "sweets" },
    carrot: { one: "one carrot", many: "carrots" },
    banana: { one: "one banana", many: "bananas" },
    donut: { one: "one doughnut", many: "doughnuts" },
  },
};
