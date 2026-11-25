// English texts for "Größen vergleichen" (Compare sizes).
const big = (text) => text[0].toUpperCase() + text.slice(1);

const WORDS = {
  lang: { more: ["longer", "the longest"], less: ["shorter", "the shortest"] },
  hoch: { more: ["higher", "the highest"], less: ["lower", "the lowest"] },
  wasser: { more: ["more", "the most"], less: ["less", "the least"] },
};
const word = (kind, dir, many) => WORDS[kind][dir][many ? 1 : 0];

export default {
  title: "Compare sizes",
  intro: "What is longer, higher, heavier? Where is more water? Press start!",

  ask: (kind, dir, many) =>
    ({
      lang: `Which pencil is ${word(kind, dir, many)}?`,
      hoch: `Which tower is ${word(kind, dir, many)}?`,
      wasser: `Which glass has ${word(kind, dir, many)} water?`,
    })[kind],
  rightSays: (kind, dir, many) =>
    ({
      lang: `This pencil is ${word(kind, dir, many)}.`,
      hoch: `This tower is ${word(kind, dir, many)}.`,
      wasser: `This glass has ${word(kind, dir, many)} water.`,
    })[kind],

  askScale: (dir) => (dir === "more" ? "What is heavier? Tap it!" : "What is lighter? Tap it!"),
  heavierThan: (a, b) => `${big(a)} is heavier than ${b}.`,
  lighterThan: (a, b) => `${big(a)} is lighter than ${b}.`,
  smallHeavy: (a) => `${big(a)} is small, but heavy!`,
  bigLight: (a) => `${big(a)} is big, but light!`,
  askChain: (dir) => (dir === "more" ? "Which parcel is the heaviest?" : "Which parcel is the lightest?"),
  heaviest: (a) => `${big(a)} is the heaviest.`,
  lightest: (a) => `${big(a)} is the lightest.`,

  askOrder: (kind, dir) =>
    ({
      lang: dir === "up" ? "Tap the pencils in order: the shortest first, then longer and longer!" : "Tap the pencils in order: the longest first, then shorter and shorter!",
      hoch: dir === "up" ? "Tap the towers in order: the lowest first, then higher and higher!" : "Tap the towers in order: the highest first, then lower and lower!",
    })[kind],
  findNext: (kind, dir) =>
    ({
      lang: dir === "up" ? "Which of the others is the shortest?" : "Which of the others is the longest?",
      hoch: dir === "up" ? "Which of the others is the lowest?" : "Which of the others is the highest?",
    })[kind],
  ordered: (kind) => (kind === "lang" ? "Now the pencils are in order." : "Now the towers are in order."),

  lookEnds: "Look closely where the pencils end!",
  lookTops: "Look closely how high the tops of the towers are!",
  lookWater: "Look closely how high the water is!",
  lookWide: "Look how wide the glasses are, too!",
  lookScale: "Look at the balance: the heavy side goes down, the light side goes up.",
  lookTrick: "Big doesn't mean heavy! Look at the balance.",
  lookChain: "Look at both balances!",
  helpLines: "Look: the lines show you.",
  helpAlign: "Look: now they all start at the same line.",
  helpGround: "Look: now all towers stand on the same ground.",
  helpPour: "Look: we pour the water into the same glasses.",

  weigh: {
    ant: "an ant", ladybird: "a ladybird", butterfly: "a butterfly", snail: "a snail",
    frog: "a frog", duck: "a duck", owl: "an owl", rabbit: "a rabbit", fox: "a fox",
    penguin: "a penguin", kangaroo: "a kangaroo", panda: "a panda", lion: "a lion",
    crocodile: "a crocodile", giraffe: "a giraffe", rhino: "a rhino", elephant: "an elephant",
    stone: "a stone", apple: "an apple", key: "a key", carrot: "a carrot",
    balloon: "a balloon", feather: "a feather", leaf: "a leaf",
  },
  parcels: { red: "the red parcel", blue: "the blue parcel", yellow: "the yellow parcel", green: "the green parcel" },
};
