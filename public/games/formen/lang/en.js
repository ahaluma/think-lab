// English texts for "Formen" (Shapes). Shared words (numbers, praise) come from /shared/lang/en.js.
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "Shapes",
  intro: "Shapes! Circle, triangle, square and rectangle. Press start!",
  shapes: {
    circle: { one: "a circle", many: "circles", the: "the circle" },
    triangle: { one: "a triangle", many: "triangles", the: "the triangle" },
    square: { one: "a square", many: "squares", the: "the square" },
    rectangle: { one: "a rectangle", many: "rectangles", the: "the rectangle" },
  },
  hint: {
    circle: "A circle is round and has no corners.",
    triangle: "A triangle has three corners.",
    square: "A square has four corners, and all its sides are the same length.",
    rectangle: "A rectangle has four corners, two long sides and two short sides.",
  },

  find: (s) => `Tap ${s.the}!`,
  rightFind: (s) => `That is ${s.one}!`,
  wrongFind: (got, want) => `That is ${got.one}. Find ${want.the}!`,

  pictures: {
    house: "a house", iceCream: "an ice cream", snowman: "a snowman", tree: "a tree", lollipop: "a lollipop",
    fish: "a fish", boat: "a boat", car: "a car", rocket: "a rocket", robot: "a robot",
    train: "a train", flower: "a flower",
  },
  build: "Which shape fits in the gap?",
  buildNext: "And which shape fits here?",
  rightBuild: (s) => `${big(s.one)}!`,
  wrongBuild: "That one doesn't fit. Look closely at the gap!",
  built: (pic) => `Done! ${big(pic)}!`,

  all: (s) => `Tap all the ${s.many}!`,
  wrongAll: (got, want) => `That is ${got.one}. We are looking for ${want.many}!`,
  allFound: (s) => `You found all the ${s.many}!`,

  count: (s) => `How many ${s.many} are in the picture?`,
  rightCount: (what) => `${big(what)}!`,
  countAgain: "Count again carefully!",
  countHint: (s) => `Look, now only the ${s.many} are shining. Count them!`,

  riddle: {
    circle: "I am round and have no corners. Who am I?",
    triangle: "I have three corners and three sides. Who am I?",
    square: "I have four corners, and all my sides are the same length. Who am I?",
    rectangle: "I have four corners, two long sides and two short sides. Who am I?",
  },
  rightRiddle: (s) => `I am ${s.one}!`,
  wrongRiddle: (got) => `That is ${got.one}. Listen again carefully!`,
  cornersHint: "Look: the dots are the corners. Count them!",
};
