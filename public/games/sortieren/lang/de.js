// Deutsche Texte für "Sortieren".
export default {
  title: "Sortieren",
  intro: "Sortieren! Drück auf Start!",
  // Said at the start of a sorting round, and again with "Hmm." after a wrong basket.
  ask: {
    kind: "Tier oder Obst? Tipp auf den richtigen Korb!",
    vehicle: "Tier oder Fahrzeug? Tipp auf den richtigen Korb!",
    color: "Welche Farbe hat es? Tipp auf den richtigen Korb!",
    size: "Ist das Tier groß oder klein?",
    kind3: "Tier, Obst oder Fahrzeug? Tipp auf den richtigen Korb!",
    kind4: "Tier, Obst, Fahrzeug oder Blume? Tipp auf den richtigen Korb!",
  },
  hint: {
    kind: "Ist es ein Tier oder Obst?",
    vehicle: "Ist es ein Tier oder ein Fahrzeug?",
    color: "Schau auf die Farbe!",
    size: "Ist es groß oder klein?",
    kind3: "Ist es ein Tier, Obst oder ein Fahrzeug?",
    kind4: "Ist es ein Tier, Obst, ein Fahrzeug oder eine Blume?",
  },
  allSorted: "Alles sortiert!",
  // Tricky things and the rule switch: said before the hint after a wrong basket. k = sorting by kind, c = by colour.
  trick: { k: "Die Farbe ist egal!", c: "Nur die Farbe zählt!" },
  newRule: "Neue Regel!",
  odd: "Was passt nicht dazu?",
  oddHint: "Schau genau. Drei sind gleich.",
  // Said after the right odd one: what the other three have in common.
  why: {
    animal: "Die anderen sind alle Tiere.",
    fruit: "Die anderen sind alle Obst.",
    vehicle: "Die anderen sind alle Fahrzeuge.",
    red: "Die anderen sind alle rot.",
    yellow: "Die anderen sind alle gelb.",
    green: "Die anderen sind alle grün.",
    big: "Die anderen sind alle groß.",
    small: "Die anderen sind alle klein.",
    flower: "Die anderen sind alle Blumen.",
    blue: "Die anderen sind alle blau.",
  },
  // Names of the baskets (for screen readers).
  groups: {
    animal: "Tiere", fruit: "Obst", vehicle: "Fahrzeuge",
    red: "rot", yellow: "gelb", green: "grün", big: "groß", small: "klein",
    flower: "Blumen", blue: "blau",
  },
};
