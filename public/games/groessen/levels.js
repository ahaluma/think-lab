// Levels of "Größen vergleichen". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js).
//   label – short text for the parents' page.
//
//   kinds  – what a task can be (one is picked per task):
//            "lang"   pencils: which is longer / shorter?
//            "hoch"   towers: which is higher / lower?
//            "wasser" glasses: where is more / less water?
//            "waage"  a balance with two animals: which is heavier / lighter? (the heavy side goes down)
//            "trick"  a balance: small but heavy against big but light (a stone and a balloon)
//            "kette"  two balances with three parcels: which is the heaviest / lightest of all?
//            "ordnen" pencils or towers: tap them in order, from small to big (or big to small)
//   n      – how many things: a number, or [fewest, most]
//   gap    – smallest difference between two sizes, in steps of 14 (4: easy to see, 1: look closely)
//   ask    – "more": only longer / higher / more / heavier; "mix": sometimes shorter / lower / less / lighter
//   offset – pencils don't start at the same line, towers stand on hills of different heights
//   widths – glasses of different widths (the wide one can have more water even when it is lower)
//   down   – ordering also goes from big to small

const L = (de, en, ne) => ({ de, en, ne });

export const LEVELS = [
  { id: "laenger-hoeher", age: 3, label: L("Länger, höher (2 Dinge)", "Longer, higher (2 things)", "लामो, अग्लो (२ वटा)"),
    kinds: ["lang", "hoch"], n: 2, gap: 4, ask: "more" },
  { id: "kuerzer-niedriger", age: 4, label: L("Auch kürzer, niedriger", "Also shorter, lower", "छोटो, होचो पनि"),
    kinds: ["lang", "hoch"], n: 2, gap: 3, ask: "mix" },
  { id: "wasser", age: 4, label: L("Mehr oder weniger Wasser", "More or less water", "धेरै वा थोरै पानी"),
    kinds: ["wasser"], n: 2, gap: 3, ask: "mix" },
  { id: "waage", age: 4, label: L("Schwerer, leichter (Waage)", "Heavier, lighter (balance)", "गह्रौं, हलुका (तराजु)"),
    kinds: ["waage"], n: 2, ask: "mix" },
  { id: "drei", age: 5, label: L("Drei Dinge: am längsten, am meisten", "Three things: longest, most", "तीनवटा: सबैभन्दा लामो, धेरै"),
    kinds: ["lang", "hoch", "wasser"], n: 3, gap: 2, ask: "mix" },
  { id: "ordnen-3", age: 5, label: L("Drei der Größe nach ordnen", "Put three in order of size", "तीनवटा सानोदेखि ठूलोसम्म"),
    kinds: ["ordnen"], n: 3, gap: 2 },
  { id: "versetzt", age: 5, label: L("Nicht an einer Linie", "Not on one line", "एउटै रेखामा छैनन्"),
    kinds: ["lang", "hoch"], n: [2, 3], gap: 2, ask: "mix", offset: true },
  { id: "klein-schwer", age: 5, label: L("Klein, aber schwer (Waage)", "Small but heavy (balance)", "सानो तर गह्रौं (तराजु)"),
    kinds: ["trick"], n: 2, ask: "mix" },
  { id: "glaeser", age: 6, label: L("Breite und schmale Gläser", "Wide and narrow glasses", "चौडा र साँघुरा गिलास"),
    kinds: ["wasser"], n: 2, gap: 2, ask: "mix", widths: true },
  { id: "ordnen-5", age: 6, label: L("Vier oder fünf ordnen", "Put four or five in order", "चार वा पाँचवटा मिलाऊ"),
    kinds: ["ordnen"], n: [4, 5], gap: 1, down: true },
  { id: "waage-kette", age: 6, label: L("Zwei Waagen: am schwersten?", "Two balances: the heaviest?", "दुई तराजु: सबैभन्दा गह्रौं?"),
    kinds: ["kette"], n: 3, ask: "mix" },
  { id: "gemischt", age: 7, label: L("Alles gemischt, knapp", "All mixed, close", "सबै मिसाएर, नजिक"),
    kinds: ["lang", "hoch", "wasser", "trick", "kette", "ordnen"], n: [3, 5], gap: 1, ask: "mix", offset: true, widths: true, down: true },
];
