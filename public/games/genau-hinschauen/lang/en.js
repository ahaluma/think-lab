// English texts for "Genau hinschauen" (Look closely). Names of the things are in /shared/lang/en.js.
const big = (text) => text[0].toUpperCase() + text.slice(1);
const SHAPES = { circle: "circle", square: "square", triangle: "triangle", star: "star", heart: "heart", diamond: "diamond" };

export default {
  title: "Look closely",
  intro: "Look closely! Find the differences and copy the shapes. Press start!",
  findOne: "The two pictures are almost the same. One thing is different. Tap it!",
  findMany: (word) => `The two pictures are almost the same. Find the ${word} differences and tap them!`,
  sameHere: "This is the same on both pictures.",
  lookHere: "Look where it glows!",
  gone: (thing) => `${big(thing.one)} is missing on one picture.`,
  swap: (a, b) => `${big(a.one)} and ${b.one}.`,
  flip: (thing) => `${big(thing.one)} looks the other way.`,
  small: (thing) => `${big(thing.one)} is smaller.`,
  left: (n, word) => (n === 1 ? "One more difference." : `${big(word)} more differences.`),
  allFound: "You found all the differences!",
  copy: "Lay the shapes just like the picture on top! First tap a shape below, then a box.",
  copyLook: "Look at the picture carefully! Soon it gets covered. Then you copy it from memory.",
  covered: "Now it is covered. Copy it! Tap the cloth to look again.",
  copyMirror: "Lay it the way it looks mirrored in water! The top row goes to the bottom.",
  peek: "Look again",
  fewer: "Some shapes are still missing.",
  more: "Those are too many shapes.",
  places: "Look closely: is every shape in the right place, with the right colour?",
  mirrorHint: "Think of the water: what is on top goes to the bottom on yours.",
  marked: "Look: where it glows, it is still different.",
  same: "Exactly the same!",
  solution: "This is how it goes. Have a look!",
  piece: (shape, color) => `${color} ${SHAPES[shape]}`,
  board: "Your board",
  model: "Model",
};
