// Deutsche Texte für "Gerecht teilen".
// thing = was geteilt wird ({ one: "ein Keks", many: "Kekse", acc: "einen Keks", half: "einen halben Keks" }),
// n = wie viele, what = gesprochene Menge ("zwölf Kekse"), a, b, c, k = Zahlwörter ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "zwölf Kekse" -> "Zwölf Kekse"

export default {
  title: "Gerecht teilen",
  intro: "Gerecht teilen! Jeder Freund soll gleich viel bekommen. Drück auf Start!",
  basket: "Korb",
  plate: "Teller",
  divide: ":",
  // Tapping: "Teil die Kekse gerecht! Alle drei Freunde sollen gleich viele bekommen. Tipp auf einen Teller."
  tapAsk: (thing, k) => `Teil die ${thing.many} gerecht! Alle ${k} Freunde sollen gleich viele bekommen. Tipp auf einen Teller.`,
  restTip: "Wenn es nicht für alle reicht, bleibt der Rest im Korb.",
  // Giving the number: "Zwölf Kekse für drei Freunde. Wie viele bekommt jeder?"
  ask: (what, k) => `${big(what)} für ${k} Freunde. Wie viele bekommt jeder?`,
  // Hints
  basketEmpty: "Der Korb ist leer. Tipp auf etwas auf einem Teller, dann kommt es zurück in den Korb.",
  stillInBasket: "Im Korb ist noch etwas. Teil weiter!",
  notFair: "Das ist noch nicht gerecht. Einer hat mehr als die anderen.",
  cutHint: "Jetzt ist nur noch eins übrig. Tipp drauf, dann schneiden wir es in der Mitte durch!",
  cut: "Zwei Hälften! Jetzt kann jeder eine bekommen.",
  helpLook: "Schau, wie viele jeder hat. Gib reihum jedem einen!",
  helpDeal: "Schau: Reihum bekommt jeder einen. Wie viele hat jetzt jeder?",
  thinkAgain: "Schau nochmal genau!",
  // Right
  eachGets: (n, thing, word) => `Jeder bekommt ${n === 1 ? thing.acc : `${word} ${thing.many}`}.`,
  eachGetsHalf: (n, thing, word) => `Jeder bekommt ${n === 1 ? thing.acc : `${word} ${thing.many}`} und ${thing.half}.`,
  left: (n, word) => (n === 1 ? "Eins bleibt im Korb. Das kann man nicht gerecht teilen." : `${big(word)} bleiben im Korb. Die kann man nicht gerecht teilen.`),
  divideSays: (a, b, c) => `${big(a)} geteilt durch ${b} ist ${c}.`,

  // What is shared. The keys match TREATS in game.js.
  treats: {
    cookie: { one: "ein Keks", many: "Kekse", acc: "einen Keks", half: "einen halben Keks" },
    apple: { one: "ein Apfel", many: "Äpfel", acc: "einen Apfel", half: "einen halben Apfel" },
    strawberry: { one: "eine Erdbeere", many: "Erdbeeren", acc: "eine Erdbeere", half: "eine halbe Erdbeere" },
    candy: { one: "ein Bonbon", many: "Bonbons", acc: "ein Bonbon", half: "ein halbes Bonbon" },
    carrot: { one: "eine Möhre", many: "Möhren", acc: "eine Möhre", half: "eine halbe Möhre" },
    banana: { one: "eine Banane", many: "Bananen", acc: "eine Banane", half: "eine halbe Banane" },
    donut: { one: "ein Donut", many: "Donuts", acc: "einen Donut", half: "einen halben Donut" },
  },
};
