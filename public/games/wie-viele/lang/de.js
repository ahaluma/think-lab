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
    elephant: { many: "Elefanten", one: "ein Elefant" },
    rhino: { many: "Nashörner", one: "ein Nashorn" },
    unicorn: { many: "Einhörner", one: "ein Einhorn" },
    giraffe: { many: "Giraffen", one: "eine Giraffe" },
    lion: { many: "Löwen", one: "ein Löwe" },
    dinosaur: { many: "Dinosaurier", one: "ein Dinosaurier" },
    turtle: { many: "Schildkröten", one: "eine Schildkröte" },
    penguin: { many: "Pinguine", one: "ein Pinguin" },
    octopus: { many: "Kraken", one: "ein Krake" },
    butterfly: { many: "Schmetterlinge", one: "ein Schmetterling" },
    frog: { many: "Frösche", one: "ein Frosch" },
    owl: { many: "Eulen", one: "eine Eule" },
    crab: { many: "Krebse", one: "ein Krebs" },
    car: { many: "Autos", one: "ein Auto" },
    banana: { many: "Bananen", one: "eine Banane" },
    carrot: { many: "Möhren", one: "eine Möhre" },
  },
};
