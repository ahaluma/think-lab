// Deutsche Texte für "Wie viele?".
// Grammar lives here, not in game.js: every language says "one apple / two apples" differently.

export default {
  title: "Wie viele?",
  trayLabel: "Zähle die Dinge",
  intro: "Wie viele? Drück auf Start!",
  question: (thing) => `Wie viele ${thing.many} siehst du?`,
  // n = how many, word = the number word ("drei")
  amount: (n, thing, word) => (n === 1 ? thing.one : `${word} ${thing.many}`),
  right: (amount) => `Super! ${amount}.`,
  countAgain: "Hmm, zähl nochmal!",

  // Names of the things to count. The keys match THINGS in game.js.
  things: {
    apple: { many: "Äpfel", one: "ein Apfel" },
    fish: { many: "Fische", one: "ein Fisch" },
    ship: { many: "Schiffe", one: "ein Schiff" },
    ladybird: { many: "Marienkäfer", one: "ein Marienkäfer" },
    flower: { many: "Blumen", one: "eine Blume" },
    duck: { many: "Enten", one: "eine Ente" },
    star: { many: "Sterne", one: "ein Stern" },
    balloon: { many: "Luftballons", one: "ein Luftballon" },
    snail: { many: "Schnecken", one: "eine Schnecke" },
    strawberry: { many: "Erdbeeren", one: "eine Erdbeere" },
  },
};
