// English texts for the new world (map, round, the idea "Teile": numbers are made of numbers).
// Number words and names of the things are in /shared/lang/en.js. a, b, c … = number words ("three").
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "AnkaPlay World",
  mapLabel: "The world: choose a place",
  places: { zahlen: "Meadow and stream", teile: "Burrow and pond", gruppen: "Fruit tree and nests", regeln: "Forest", raum: "Hill and lake", daten: "Sky" },
  whereTo: "Where would you like to go?",
  asleep: "Everything is still asleep here.",
  comeHere: "Come, this is where we go on!",
  pickWay: "How would you like to play?",
  allGames: "All games",
  save: "Back up",
  privacy: "Privacy",
  ideas: { teile: "Numbers are made of numbers" },
  perspectives: { sehen: "See", machen: "Make", forschen: "Explore", anwenden: "Use", pruefen: "Check" },
  states: { new: "new", played: "played", understood: "understood" },
  yourCards: "Your thinking tricks",

  toMap: "Back to the map",
  hint: "Hint",
  hear: "Read aloud",
  progress: "Tasks",
  surprise: "Surprise! Now something different.",
  done: "You did it!",
  grew: "Look! A new flower grows by your burrow.",
  cardGot: (name) => `Your thinking trick: ${name}.`,
  feelQuestion: "How was that for you?",
  feel: { easy: "easy", ok: "just right", hard: "hard" },
  bigger: "You are good at this! Soon the numbers get bigger.",
  smaller: "Soon we take smaller numbers.",
  again: "Again",
  other: "Something else",
  cards: {
    vergleichen: { name: "Look closely", text: "You looked closely and counted." },
    ausprobieren: { name: "Try it out", text: "You tried it out. There are many ways." },
    vorhersagen: { name: "Think first", text: "You thought first and then looked." },
    rueckwaerts: { name: "What is missing?", text: "You found what was missing." },
    nachpruefen: { name: "Count again", text: "You counted it yourself." },
  },
  intro: {
    sehen: "Animals go into the burrow. How many are inside?",
    machen: "Put everything on the two leaves. There are many ways!",
    forschen: "The tree has a secret. What does it do?",
    anwenden: "Look closely at what happens!",
    pruefen: "The owl says something. Is that right?",
  },
  together: (a, b, c) => `${big(a)} and ${b} make ${c}.`,
  nut: { one: "one nut", many: "nuts" },

  sehen: {
    // The story in three steps: all are there, some go in, the question.
    all: (total, thing) => `${big(total)} ${thing.many} live here.`,
    hide: "Whoosh! Some go into the burrow.",
    ask: "How many are in the burrow now?",
    miss: (chosen, outside, sum, total) => `${big(chosen)} and ${outside} make ${sum}. But there are ${total}.`,
    hint: "Look: this many in all. How many are missing?",
    denLabel: "The burrow",
  },

  machen: {
    question: (total, thing) => `Put ${total} ${thing.many} on the two leaves!`,
    another: "Is there another way?",
    both: "Put something on each leaf.",
    had: "You had that one already. Do it another way!",
    done: (a, b, c, d, total) => `${big(a)} and ${b}, or ${c} and ${d}. Both make ${total}!`,
    hint: "Drag it onto a leaf with your finger.",
    hintMove: "Take one away. Put it on the other leaf.",
    leaf: "Leaf",
    basket: "Basket",
    check: "Done",
  },

  forschen: {
    question: "How many nuts do you put into the tree?",
    out: (x, y) => `${big(x)} in, ${y} out.`,
    more: "Try another number!",
    know: "I know it!",
    ready: "Do you know what the tree does? Then tap the lamp.",
    predict: (x) => `Think first: you put ${x} in. How many come out?`,
    predictMiss: (x, y) => `Look: ${x} in gives ${y} out.`,
    rule: (x, y, total) => `Together it is always ${total}: ${x} and ${y} make ${total}.`,
    hint: "Count both numbers together.",
    tried: "You tried these",
  },

  anwenden: {
    frogs: (total, n, known) =>
      [`${big(total)} frogs are sitting in the reeds.`, `${n === 1 ? "One hops" : big(known) + " hop"} onto the big leaf.`, "How many are still in the reeds?"],
    eggs: (total, n, known) =>
      [`There are ${total} eggs in the nest.`, `${n === 1 ? "One chick hatches" : big(known) + " chicks hatch"}.`, "How many eggs are still closed?"],
    apples: (total, n, known) =>
      [`There are ${total} apples on the tree.`, `${n === 1 ? "One falls" : big(known) + " fall"} into the grass.`, "How many are still on the tree?"],
    hint: "Look: this many in all. How many are missing?",
  },

  pruefen: {
    question: (a, b, said) => `The owl says: ${a} and ${b} make ${said}. Is that right?`,
    yes: "Right",
    no: "Not right",
    countAgain: "Count again!",
    fix: "Well spotted! How many are there in all?",
    fixMiss: "Not yet. Count them all together!",
    right: (a, b, c) => `Yes! ${big(a)} and ${b} make ${c}.`,
    fixed: (a, b, c) => `Now it is right: ${a} and ${b} make ${c}.`,
    hint: "Count both groups together.",
  },

  backup: {
    title: "Back up progress",
    note: "Everything stays on this device. Here you can save the progress as a file and load it again on another device. The app sends nothing.",
    save: "Save as a file",
    load: "Load from a file",
    saved: "The file has been saved.",
    loaded: "The progress has been loaded.",
    bad: "This file does not fit. Please choose a file that was saved with AnkaPlay.",
    confirm: "The progress on this device will be replaced by the file. Continue?",
    keep: "Keep storage",
    keepNote: "The browser may delete data when the page is not opened for a long time. Add AnkaPlay to the home screen and the progress stays.",
    kept: "The browser keeps the storage for good.",
    notKept: "The browser did not promise that. Save as a file from time to time.",
  },
};
