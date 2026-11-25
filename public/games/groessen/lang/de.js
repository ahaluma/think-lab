// Deutsche Texte für "Größen vergleichen".
// kind = "lang" (Stifte), "hoch" (Türme), "wasser" (Gläser); dir = "more" / "less" (Ordnen: "up" / "down");
// many = mehr als zwei Dinge ("am längsten" statt "länger").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "ein Stein" -> "Ein Stein"

const WORDS = {
  lang: { more: ["länger", "am längsten"], less: ["kürzer", "am kürzesten"] },
  hoch: { more: ["höher", "am höchsten"], less: ["niedriger", "am niedrigsten"] },
  wasser: { more: ["mehr", "am meisten"], less: ["weniger", "am wenigsten"] },
};
const word = (kind, dir, many) => WORDS[kind][dir][many ? 1 : 0];

export default {
  title: "Größen vergleichen",
  intro: "Was ist länger, höher, schwerer? Wo ist mehr Wasser? Drück auf Start!",

  ask: (kind, dir, many) =>
    ({
      lang: `Welcher Stift ist ${word(kind, dir, many)}?`,
      hoch: `Welcher Turm ist ${word(kind, dir, many)}?`,
      wasser: `In welchem Glas ist ${word(kind, dir, many)} Wasser?`,
    })[kind],
  rightSays: (kind, dir, many) =>
    ({
      lang: `Dieser Stift ist ${word(kind, dir, many)}.`,
      hoch: `Dieser Turm ist ${word(kind, dir, many)}.`,
      wasser: `In diesem Glas ist ${word(kind, dir, many)} Wasser.`,
    })[kind],

  // The balance. a, b = names from "weigh" below.
  askScale: (dir) => (dir === "more" ? "Was ist schwerer? Tipp darauf!" : "Was ist leichter? Tipp darauf!"),
  heavierThan: (a, b) => `${big(a)} ist schwerer als ${b}.`,
  lighterThan: (a, b) => `${big(a)} ist leichter als ${b}.`,
  smallHeavy: (a) => `${big(a)} ist klein, aber schwer!`,
  bigLight: (a) => `${big(a)} ist groß, aber leicht!`,
  // Two balances, three parcels.
  askChain: (dir) => (dir === "more" ? "Welches Paket ist am schwersten?" : "Welches Paket ist am leichtesten?"),
  heaviest: (a) => `${big(a)} ist am schwersten.`,
  lightest: (a) => `${big(a)} ist am leichtesten.`,

  // Ordering: tap them one after the other.
  askOrder: (kind, dir) =>
    ({
      lang: dir === "up" ? "Tipp die Stifte der Reihe nach an: zuerst den kürzesten, dann immer längere!" : "Tipp die Stifte der Reihe nach an: zuerst den längsten, dann immer kürzere!",
      hoch: dir === "up" ? "Tipp die Türme der Reihe nach an: zuerst den niedrigsten, dann immer höhere!" : "Tipp die Türme der Reihe nach an: zuerst den höchsten, dann immer niedrigere!",
    })[kind],
  findNext: (kind, dir) =>
    ({
      lang: dir === "up" ? "Welcher von den übrigen ist am kürzesten?" : "Welcher von den übrigen ist am längsten?",
      hoch: dir === "up" ? "Welcher von den übrigen ist am niedrigsten?" : "Welcher von den übrigen ist am höchsten?",
    })[kind],
  ordered: (kind) => (kind === "lang" ? "Jetzt liegen die Stifte der Reihe nach." : "Jetzt stehen die Türme der Reihe nach."),

  // Hints after a wrong answer, and what the help shows.
  lookEnds: "Schau genau, wo die Stifte aufhören!",
  lookTops: "Schau genau, wie hoch die Türme oben sind!",
  lookWater: "Schau genau, wie hoch das Wasser steht!",
  lookWide: "Schau auch, wie breit die Gläser sind!",
  lookScale: "Schau auf die Waage: Die schwere Seite geht nach unten, die leichte nach oben.",
  lookTrick: "Groß heißt nicht schwer! Schau auf die Waage.",
  lookChain: "Schau auf beide Waagen!",
  helpLines: "Schau: Die Linien zeigen es dir.",
  helpAlign: "Schau: Jetzt fangen alle an der gleichen Linie an.",
  helpGround: "Schau: Jetzt stehen alle Türme auf dem gleichen Boden.",
  helpPour: "Schau: Wir gießen das Wasser in gleiche Gläser.",

  // Names on the balance (with "ein / eine": "Ein Elefant ist schwerer als ein Hase.").
  weigh: {
    ant: "eine Ameise", ladybird: "ein Marienkäfer", butterfly: "ein Schmetterling", snail: "eine Schnecke",
    frog: "ein Frosch", duck: "eine Ente", owl: "eine Eule", rabbit: "ein Hase", fox: "ein Fuchs",
    penguin: "ein Pinguin", kangaroo: "ein Känguru", panda: "ein Panda", lion: "ein Löwe",
    crocodile: "ein Krokodil", giraffe: "eine Giraffe", rhino: "ein Nashorn", elephant: "ein Elefant",
    stone: "ein Stein", apple: "ein Apfel", key: "ein Schlüssel", carrot: "eine Möhre",
    balloon: "ein Luftballon", feather: "eine Feder", leaf: "ein Blatt",
  },
  parcels: { red: "das rote Paket", blue: "das blaue Paket", yellow: "das gelbe Paket", green: "das grüne Paket" },
};
