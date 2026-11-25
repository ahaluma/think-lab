// Deutsche Texte für "Wer kommt dazu?". Names of the animals are in /shared/lang/de.js.
// amount = spoken amount like "drei Hasen" / "ein Hase", n = how many.
const big = (text) => text[0].toUpperCase() + text.slice(1); // "ein Hase" -> "Ein Hase"

export default {
  title: "Wer kommt dazu?",
  intro: "Wer kommt dazu? Drück auf Start!",
  here: (n, amount) => (n === 1 ? `Hier ist ${amount}.` : `Hier sind ${amount}.`),
  hide: "Husch, hinter den Busch!",
  come: (n, amount) => (n === 1 ? `${big(amount)} kommt dazu!` : `${big(amount)} kommen dazu!`),
  go: (n, amount) => (n === 1 ? `${big(amount)} läuft weg!` : `${big(amount)} laufen weg!`),
  question: (thing) => `Wie viele ${thing.many} sind jetzt da?`,
  right: (n, amount) => (n === 1 ? `Jetzt ist da ${amount}.` : `Jetzt sind da ${amount}.`),
  thinkAgain: "Denk nochmal!",
  countNow: "Zähl mal nach!",
};
