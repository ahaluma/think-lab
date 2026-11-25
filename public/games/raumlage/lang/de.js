// Deutsche Texte für "Wo ist es?" (Raumlage). Shared words (praise, buttons) come from /shared/lang/de.js.
export default {
  title: "Wo ist es?",
  intro: "Wo ist es? Drück auf Start!",

  // The animals: [wer?, wem?] ("der Hase", "dem Hasen")
  pets: {
    rabbit: ["der Hase", "dem Hasen"],
    cat: ["die Katze", "der Katze"],
    dog: ["der Hund", "dem Hund"],
    bear: ["der Bär", "dem Bären"],
    fox: ["der Fuchs", "dem Fuchs"],
    frog: ["der Frosch", "dem Frosch"],
    duck: ["die Ente", "der Ente"],
    mouse: ["die Maus", "der Maus"],
    pig: ["das Schwein", "dem Schwein"],
    owl: ["die Eule", "der Eule"],
    panda: ["der Panda", "dem Panda"],
    lion: ["der Löwe", "dem Löwen"],
  },

  // Table: where something is, and where to put it.
  where: {
    auf: "auf dem Tisch",
    unter: "unter dem Tisch",
    neben: "neben dem Tisch",
    links: "links neben dem Tisch",
    rechts: "rechts neben dem Tisch",
    vor: "vor dem Tisch",
    hinter: "hinter dem Tisch",
  },
  to: {
    auf: "auf den Tisch",
    unter: "unter den Tisch",
    neben: "neben den Tisch",
    links: "links neben den Tisch",
    rechts: "rechts neben den Tisch",
  },
  who: (where) => `Wer ist ${where}?`,
  put: (where) => `Setz mich ${where}!`,
  isAt: (pet, where) => `${pet} ist ${where}.`,
  nowAt: (where) => `Jetzt bin ich ${where}!`,

  // A row on a bench
  between: (a, b) => `Wer sitzt zwischen ${a} und ${b}?`,
  leftOf: (a) => `Wer sitzt links neben ${a}?`,
  rightOf: (a) => `Wer sitzt rechts neben ${a}?`,
  isBetween: (pet, a, b) => `${pet} sitzt zwischen ${a} und ${b}.`,
  isLeftOf: (pet, a) => `${pet} sitzt links neben ${a}.`,
  isRightOf: (pet, a) => `${pet} sitzt rechts neben ${a}.`,

  // The shelf, compartments row by row from top left
  cells: [
    "oben links", "oben in der Mitte", "oben rechts",
    "in der Mitte links", "genau in der Mitte", "in der Mitte rechts",
    "unten links", "unten in der Mitte", "unten rechts",
  ],
  whoSits: (cell) => `Wer sitzt ${cell}?`,
  sitsAt: (pet, cell) => `${pet} sitzt ${cell}.`,
  nowSits: (cell) => `Jetzt sitze ich ${cell}!`,
  taken: "Da sitzt schon jemand.",

  // Help after two wrong answers
  lookHere: "Schau, hier!",
  leftHand: "Schau, hier! Tipp: Deine linke Hand macht mit Daumen und Zeigefinger ein L.",
};
