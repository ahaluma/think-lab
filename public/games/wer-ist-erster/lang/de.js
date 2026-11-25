// Deutsche Texte für "Wer ist Erster?". The animals queue for ice cream; the cart is at the front.
// place = the ordinal word for "das … Tier" ("dritte"), who/what = an animal: { nom: "der Löwe", dat: "dem Löwen" }.
const big = (text) => text[0].toUpperCase() + text.slice(1); // "der Löwe" -> "Der Löwe"

export default {
  title: "Wer ist Erster?",
  intro: "Die Tiere stehen für ein Eis an. Wer beim Eiswagen steht, ist der Erste. Drück auf Start!",
  cart: "Eiswagen",
  // Ordinals, as in "das dritte Tier". Index = place.
  places: ["", "erste", "zweite", "dritte", "vierte", "fünfte", "sechste", "siebte", "achte", "neunte", "zehnte"],
  short: (n) => `${n}.`, // on the answer buttons: "3."

  // Tasks
  tapPlace: (place) => `Tippe auf das ${place} Tier!`,
  tapLast: "Tippe auf das letzte Tier!",
  tapBack: (place) => `Tippe auf das ${place} Tier von hinten!`,
  which: (who) => `Das wievielte Tier ist ${who.nom}?`,
  front: (who) => `Wer steht direkt vor ${who.dat}?`,
  behind: (who) => `Wer steht direkt hinter ${who.dat}?`,

  // Right: what the child found
  isPlace: (who, place) => `${big(who.nom)} ist das ${place} Tier.`,
  isLast: (who) => `${big(who.nom)} ist das letzte Tier.`,
  isBack: (who, place) => `${big(who.nom)} ist das ${place} Tier von hinten.`,
  isFront: (who, of) => `${big(who.nom)} steht direkt vor ${of.dat}.`,
  isBehind: (who, of) => `${big(who.nom)} steht direkt hinter ${of.dat}.`,

  // Wrong: what was tapped instead, then a hint
  thatIs: (place) => `Das ist das ${place} Tier.`,
  thatIsLast: "Das ist das letzte Tier.",
  thatIsBack: (place) => `Das ist das ${place} Tier von hinten.`,
  thatIsSelf: (who) => `Das ist ${who.nom} selbst.`,
  thinkAgain: "Schau nochmal genau!",
  // After two wrong answers the places appear under the animals.
  countFront: "Schau: Beim Eiswagen ist vorne. Zähl von vorne mit!",
  countBack: "Schau: Ganz hinten ist das letzte Tier. Zähl von hinten mit!",
  lastHint: "Das letzte Tier ist ganz hinten, am weitesten weg vom Eis.",
  frontHint: (who) => `Vorne ist beim Eis. Wer vor ${who.dat} steht, ist näher am Eis.`,
  behindHint: (who) => `Vorne ist beim Eis. Wer hinter ${who.dat} steht, ist weiter weg vom Eis.`,

  // The animals in the queue (the keys match shared/things.js).
  names: {
    rabbit: { nom: "der Hase", dat: "dem Hasen" },
    fox: { nom: "der Fuchs", dat: "dem Fuchs" },
    lion: { nom: "der Löwe", dat: "dem Löwen" },
    elephant: { nom: "der Elefant", dat: "dem Elefanten" },
    panda: { nom: "der Panda", dat: "dem Panda" },
    frog: { nom: "der Frosch", dat: "dem Frosch" },
    penguin: { nom: "der Pinguin", dat: "dem Pinguin" },
    duck: { nom: "die Ente", dat: "der Ente" },
    owl: { nom: "die Eule", dat: "der Eule" },
    giraffe: { nom: "die Giraffe", dat: "der Giraffe" },
    unicorn: { nom: "das Einhorn", dat: "dem Einhorn" },
    turtle: { nom: "die Schildkröte", dat: "der Schildkröte" },
  },
};
