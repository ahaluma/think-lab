// English texts for "Wer ist Erster?" (Who's first?). The animals queue for ice cream; the cart is at the front.
const big = (text) => text[0].toUpperCase() + text.slice(1);

export default {
  title: "Who's first?",
  intro: "The animals are queueing for ice cream. Whoever is at the ice-cream cart is first. Press start!",
  cart: "Ice-cream cart",
  places: ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"],
  short: (n, i) => n + (i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th"),

  tapPlace: (place) => `Tap the ${place} animal!`,
  tapLast: "Tap the last animal!",
  tapBack: (place) => `Tap the ${place} animal from the back!`,
  which: (who) => `What place in the line is ${who.nom}?`,
  front: (who) => `Who is right in front of ${who.dat}?`,
  behind: (who) => `Who is right behind ${who.dat}?`,

  isPlace: (who, place) => `${big(who.nom)} is ${place}.`,
  isLast: (who) => `${big(who.nom)} is last.`,
  isBack: (who, place) => `${big(who.nom)} is ${place} from the back.`,
  isFront: (who, of) => `${big(who.nom)} is right in front of ${of.dat}.`,
  isBehind: (who, of) => `${big(who.nom)} is right behind ${of.dat}.`,

  thatIs: (place) => `That is the ${place} animal.`,
  thatIsLast: "That is the last animal.",
  thatIsBack: (place) => `That is the ${place} animal from the back.`,
  thatIsSelf: (who) => `That is ${who.nom} itself.`,
  thinkAgain: "Look again carefully!",
  countFront: "Look: the front is at the ice-cream cart. Count from the front!",
  countBack: "Look: the last animal is at the very back. Count from the back!",
  lastHint: "The last animal is at the very back, furthest from the ice cream.",
  frontHint: (who) => `The front is at the ice cream. In front of ${who.dat} means closer to the ice cream.`,
  behindHint: (who) => `The front is at the ice cream. Behind ${who.dat} means further from the ice cream.`,

  names: {
    rabbit: { nom: "the rabbit", dat: "the rabbit" },
    fox: { nom: "the fox", dat: "the fox" },
    lion: { nom: "the lion", dat: "the lion" },
    elephant: { nom: "the elephant", dat: "the elephant" },
    panda: { nom: "the panda", dat: "the panda" },
    frog: { nom: "the frog", dat: "the frog" },
    penguin: { nom: "the penguin", dat: "the penguin" },
    duck: { nom: "the duck", dat: "the duck" },
    owl: { nom: "the owl", dat: "the owl" },
    giraffe: { nom: "the giraffe", dat: "the giraffe" },
    unicorn: { nom: "the unicorn", dat: "the unicorn" },
    turtle: { nom: "the turtle", dat: "the turtle" },
  },
};
