// English texts for the new world (map, round, the idea "Teile": numbers are made of numbers).
// Number words and names of the things are in /shared/lang/en.js. a, b, c … = number words ("three").
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "AnkaPlay World",
  mapLabel: "The world: choose a place",
  places: { zahlen: "Meadow and stream", teile: "Burrow and pond", gruppen: "Fruit tree and nests", regeln: "Forest", raum: "Hill and lake", daten: "Sky" },
  whereTo: "Where would you like to go?",
  asleep: "Everything is still asleep here. Soon there will be something to discover.",
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
  surprise: "Surprise! Here comes a task from another side.",
  done: "You did it!",
  grew: "Look, a new flower is blooming by your burrow!",
  cardGot: (name) => `Your thinking trick: ${name}.`,
  feelQuestion: "How was that for you?",
  feel: { easy: "easy", ok: "just right", hard: "hard" },
  bigger: "You are good at this. Next time the numbers get bigger!",
  smaller: "Next time we take smaller numbers.",
  again: "Again",
  other: "Something else",
  cards: {
    vergleichen: { name: "Comparing", text: "You compared: all of them together and the ones you can see." },
    ausprobieren: { name: "Trying out", text: "You tried things out and found several ways." },
    vorhersagen: { name: "Predicting", text: "You thought first and checked afterwards." },
    rueckwaerts: { name: "Thinking backwards", text: "You thought from the whole back to the part." },
    nachpruefen: { name: "Checking", text: "You counted again instead of just believing it." },
  },
  intro: {
    sehen: "Animals live in the burrow. Some are hiding. How many are inside?",
    machen: "Put everything on the two leaves. There are many ways!",
    forschen: "The hollow tree has a secret. Try out what it does!",
    anwenden: "Now you need what you already know. Listen well!",
    pruefen: "The owl says something. Is that right? Check it!",
  },
  together: (a, b, c) => `${big(a)} and ${b} make ${c}.`,
  nut: { one: "one nut", many: "nuts" },

  sehen: {
    question: (total, thing, n, outside) =>
      `${big(total)} ${thing.many} live here. ${n === 1 ? big(thing.one) + " is" : big(outside) + " are"} outside. How many are in the burrow?`,
    miss: (chosen, outside, sum, total) => `${big(chosen)} and ${outside} make ${sum}. But there are ${total}.`,
    hint: "Look: this is how many there are in all. How many are still missing?",
    denLabel: "The burrow",
  },

  machen: {
    question: (total, thing) => `Put ${total} ${thing.many} on the two leaves!`,
    another: "Is there another way? Find a new one!",
    both: "Each leaf needs something.",
    had: "You had that one already. Find another way!",
    done: (a, b, c, d, total) => `${big(a)} and ${b}, or ${c} and ${d}. Both make ${total}!`,
    hint: "Tap a leaf and one hops over.",
    hintMove: "Take one from a leaf and put it on the other.",
    leaf: "Leaf",
    basket: "Basket",
    check: "Done",
  },

  forschen: {
    question: "How many nuts do you put into the tree?",
    out: (x, y) => `${big(x)} in, ${y} out.`,
    more: "Try another number!",
    know: "I know it!",
    ready: "Do you know what the tree does? You can keep trying or tap the light bulb.",
    predict: (x) => `Think first, then check: you put ${x} in. How many come out?`,
    predictMiss: (x, y) => `Look: ${x} in gives ${y} out.`,
    rule: (x, y, total) => `The tree always fills up to ${total}: ${x} and ${y} make ${total}.`,
    hint: "For each pair, count both numbers together.",
    tried: "You tried these",
  },

  anwenden: {
    frogs: (total, n, known) =>
      `${big(total)} frogs want to cross the pond. ${n === 1 ? "One is" : big(known) + " are"} already sitting on the big leaf. How many are still waiting in the reeds?`,
    eggs: (total, n, known) =>
      `There were ${total} eggs in the nest. ${n === 1 ? "One chick has" : big(known) + " chicks have"} already hatched. How many eggs are still closed?`,
    apples: (total, n, known) =>
      `There were ${total} apples on the tree. ${n === 1 ? "One is" : big(known) + " are"} lying in the grass. How many are still on the tree?`,
    hint: "Look: this is how many there are in all. How many are still missing?",
  },

  pruefen: {
    question: (a, b, said) => `The owl says: ${a} and ${b} make ${said}. Is that right?`,
    yes: "Right",
    no: "Not right",
    countAgain: "Count again carefully!",
    fix: "Well spotted! Make it right: how many are there in all?",
    fixMiss: "Not yet. Count them all together!",
    right: (a, b, c) => `Yes! ${big(a)} and ${b} make ${c}.`,
    fixed: (a, b, c) => `Now it is right: ${a} and ${b} make ${c}.`,
    hint: "Count both groups together.",
    less: "One less",
    more: "One more",
    check: "Done",
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
