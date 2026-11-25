// English texts for "Where is it?". Use the same keys as lang/de.js. A missing key falls back to German.
export default {
  title: "Where is it?",
  intro: "Where is it? Press start!",

  pets: {
    rabbit: ["the rabbit", "the rabbit"],
    cat: ["the cat", "the cat"],
    dog: ["the dog", "the dog"],
    bear: ["the bear", "the bear"],
    fox: ["the fox", "the fox"],
    frog: ["the frog", "the frog"],
    duck: ["the duck", "the duck"],
    mouse: ["the mouse", "the mouse"],
    pig: ["the pig", "the pig"],
    owl: ["the owl", "the owl"],
    panda: ["the panda", "the panda"],
    lion: ["the lion", "the lion"],
  },

  where: {
    auf: "on the table",
    unter: "under the table",
    neben: "next to the table",
    links: "to the left of the table",
    rechts: "to the right of the table",
    vor: "in front of the table",
    hinter: "behind the table",
  },
  to: {
    auf: "on the table",
    unter: "under the table",
    neben: "next to the table",
    links: "to the left of the table",
    rechts: "to the right of the table",
  },
  who: (where) => `Who is ${where}?`,
  put: (where) => `Put me ${where}!`,
  isAt: (pet, where) => `${pet} is ${where}.`,
  nowAt: (where) => `Now I am ${where}!`,

  between: (a, b) => `Who is sitting between ${a} and ${b}?`,
  leftOf: (a) => `Who is sitting just left of ${a}?`,
  rightOf: (a) => `Who is sitting just right of ${a}?`,
  isBetween: (pet, a, b) => `${pet} is sitting between ${a} and ${b}.`,
  isLeftOf: (pet, a) => `${pet} is sitting just left of ${a}.`,
  isRightOf: (pet, a) => `${pet} is sitting just right of ${a}.`,

  cells: [
    "at the top left", "at the top in the middle", "at the top right",
    "in the middle on the left", "right in the middle", "in the middle on the right",
    "at the bottom left", "at the bottom in the middle", "at the bottom right",
  ],
  whoSits: (cell) => `Who is sitting ${cell}?`,
  sitsAt: (pet, cell) => `${pet} is sitting ${cell}.`,
  nowSits: (cell) => `Now I am sitting ${cell}!`,
  taken: "Someone is already sitting there.",

  lookHere: "Look, here!",
  leftHand: "Look, here! Tip: your left hand makes an L with thumb and finger.",
};
