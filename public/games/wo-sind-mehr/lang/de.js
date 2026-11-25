// Deutsche Texte für "Wo sind mehr?". Names of the things are in /shared/lang/de.js.
// here / there = spoken amounts like "drei Elefanten", n = the number of the tapped group.

export default {
  title: "Wo sind mehr?",
  intro: "Wo sind mehr? Drück auf Start!",
  same: "gleich viele",
  questionMore: (thing) => `Wo sind mehr ${thing.many}?`,
  questionFewer: (thing) => `Wo sind weniger ${thing.many}?`,
  rightMore: (n, here, there) => `${here} sind mehr als ${there}.`,
  rightFewer: (n, here, there) => `${here} ${n === 1 ? "ist" : "sind"} weniger als ${there}.`,
  rightSame: (n, here) => `Gleich viele: zweimal ${here}.`,
  lookAgain: "Schau nochmal genau!",
};
