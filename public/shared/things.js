// Things to count and compare, shared by all number games.
// Their names (one / many, per language) are in shared/lang/<language>.js under "things".
//
//   import { things } from "../../shared/things.js";
//   const THINGS = things(T);   → [{ id: "elephant", icon: "🐘", one: "ein Elefant", many: "Elefanten" }, …]
//   THING_IDS                   → ["apple", "fish", …] (no texts needed, e.g. for tasks.js)

const ALL = [
  { id: "apple", icon: "🍎" },
  { id: "fish", icon: "🐟" },
  { id: "ship", icon: "🚢" },
  { id: "ladybird", icon: "🐞" },
  { id: "flower", icon: "🌼" },
  { id: "duck", icon: "🦆" },
  { id: "star", icon: "⭐" },
  { id: "balloon", icon: "🎈" },
  { id: "snail", icon: "🐌" },
  { id: "strawberry", icon: "🍓" },
  { id: "elephant", icon: "🐘" },
  { id: "rhino", icon: "🦏" },
  { id: "unicorn", icon: "🦄" },
  { id: "giraffe", icon: "🦒" },
  { id: "lion", icon: "🦁" },
  { id: "dinosaur", icon: "🦕" },
  { id: "turtle", icon: "🐢" },
  { id: "penguin", icon: "🐧" },
  { id: "octopus", icon: "🐙" },
  { id: "butterfly", icon: "🦋" },
  { id: "frog", icon: "🐸" },
  { id: "owl", icon: "🦉" },
  { id: "crab", icon: "🦀" },
  { id: "car", icon: "🚗" },
  { id: "banana", icon: "🍌" },
  { id: "carrot", icon: "🥕" },
  { id: "kangaroo", icon: "🦘" },
  { id: "whale", icon: "🐳" },
  { id: "crocodile", icon: "🐊" },
  { id: "ant", icon: "🐜" },
  { id: "rabbit", icon: "🐰" },
  { id: "fox", icon: "🦊" },
  { id: "shark", icon: "🦈" },
  { id: "panda", icon: "🐼" },
];

export const THING_IDS = ALL.map((t) => t.id);

/** All things that have a name in the loaded texts T, with their names added. */
export function things(T) {
  return ALL.filter((t) => T.things?.[t.id]).map((t) => ({ ...t, ...T.things[t.id] }));
}
