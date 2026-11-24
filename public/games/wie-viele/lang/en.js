// English texts for "Wie viele?" (How many?).
// Grammar lives here, not in game.js: every language says "one apple / two apples" differently.

export default {
  title: "How many?",
  trayLabel: "Count the things",
  intro: "How many? Press start!",
  question: (thing) => `How many ${thing.many} can you see?`,
  // n = how many, word = the number word ("three")
  amount: (n, thing, word) => (n === 1 ? thing.one : `${word} ${thing.many}`),
  right: (amount) => `Super! ${amount}.`,
  countAgain: "Hmm, count again!",

  // Names of the things to count. The keys match THINGS in game.js.
  things: {
    apple: { many: "apples", one: "one apple" },
    fish: { many: "fish", one: "one fish" },
    ship: { many: "ships", one: "one ship" },
    ladybird: { many: "ladybirds", one: "one ladybird" },
    flower: { many: "flowers", one: "one flower" },
    duck: { many: "ducks", one: "one duck" },
    star: { many: "stars", one: "one star" },
    balloon: { many: "balloons", one: "one balloon" },
    snail: { many: "snails", one: "one snail" },
    strawberry: { many: "strawberries", one: "one strawberry" },
    elephant: { many: "elephants", one: "one elephant" },
    rhino: { many: "rhinos", one: "one rhino" },
    unicorn: { many: "unicorns", one: "one unicorn" },
    giraffe: { many: "giraffes", one: "one giraffe" },
    lion: { many: "lions", one: "one lion" },
    dinosaur: { many: "dinosaurs", one: "one dinosaur" },
    turtle: { many: "turtles", one: "one turtle" },
    penguin: { many: "penguins", one: "one penguin" },
    octopus: { many: "octopuses", one: "one octopus" },
    butterfly: { many: "butterflies", one: "one butterfly" },
    frog: { many: "frogs", one: "one frog" },
    owl: { many: "owls", one: "one owl" },
    crab: { many: "crabs", one: "one crab" },
    car: { many: "cars", one: "one car" },
    banana: { many: "bananas", one: "one banana" },
    carrot: { many: "carrots", one: "one carrot" },
  },
};
