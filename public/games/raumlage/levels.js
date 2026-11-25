// Levels of "Wo ist es?" (Raumlage: on, under, next to, in front of, behind, left, right, between).
// Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js).
//   label – short text for the parents' page.
//
//   scene – "table": animals around a table      (places: auf, unter, neben, links, rechts, vor, hinter)
//           "row":   animals sitting in a row on a bench (zwischen, links neben, rechts neben)
//           "shelf": a shelf with 3 × 3 compartments (oben links … unten rechts)
//           "mix":   one of the levels in `levels` for each task
//   input – "who": tap the animal the question is about ("Wer ist unter dem Tisch?")
//           "put": an animal waits at the top, tap where it goes ("Setz mich unter den Tisch!")
//   places – table: the places that can be asked. "neben" means left or right (both count).
//   ask    – row: the questions ("zwischen", "links", "rechts")
//   pets   – how many animals are in the picture

const L = (de, en, ne) => ({ de, en, ne });

export const LEVELS = [
  { id: "auf-unter", age: 3, label: L("Auf und unter", "On and under", "माथि र मुनि"),
    scene: "table", input: "who", places: ["auf", "unter"], pets: 2 },
  { id: "auf-unter-neben", age: 4, label: L("Auf, unter, neben", "On, under, next to", "माथि, मुनि, छेउमा"),
    scene: "table", input: "who", places: ["auf", "unter", "neben"], pets: 3 },
  { id: "setzen", age: 4, label: L("Selbst hinsetzen: auf, unter, neben", "Put it there: on, under, next to", "आफैँ राख: माथि, मुनि, छेउमा"),
    scene: "table", input: "put", places: ["auf", "unter", "neben"] },
  { id: "vor-hinter", age: 5, label: L("Vor und hinter", "In front of and behind", "अगाडि र पछाडि"),
    scene: "table", input: "who", places: ["vor", "hinter", "auf", "unter", "neben"], focus: ["vor", "hinter"], pets: 3 },
  { id: "zwischen", age: 5, label: L("Zwischen", "Between", "बीचमा"),
    scene: "row", input: "who", ask: ["zwischen"], pets: 4 },
  { id: "links-rechts", age: 5, label: L("Links und rechts", "Left and right", "बायाँ र दायाँ"),
    scene: "table", input: "who", places: ["links", "rechts", "auf", "unter"], focus: ["links", "rechts"], pets: 3 },
  { id: "links-rechts-setzen", age: 6, label: L("Selbst hinsetzen: links, rechts", "Put it there: left, right", "आफैँ राख: बायाँ, दायाँ"),
    scene: "table", input: "put", places: ["links", "rechts", "auf", "unter"], focus: ["links", "rechts"] },
  { id: "reihe", age: 6, label: L("In der Reihe: zwischen, links neben, rechts neben", "In a row: between, left of, right of", "लाइनमा: बीचमा, बायाँ, दायाँ"),
    scene: "row", input: "who", ask: ["zwischen", "links", "rechts"], pets: 5 },
  { id: "regal", age: 6, label: L("Regal: oben links, unten rechts …", "Shelf: top left, bottom right …", "दराज: माथि बायाँ, तल दायाँ …"),
    scene: "shelf", input: "who", pets: 5 },
  { id: "regal-setzen", age: 7, label: L("Regal: selbst einräumen", "Shelf: put it there", "दराज: आफैँ राख"),
    scene: "shelf", input: "put", pets: 3 },
  { id: "alles", age: 7, label: L("Alles gemischt", "All mixed", "सबै मिसाएर"),
    scene: "mix", levels: ["vor-hinter", "links-rechts-setzen", "reihe", "regal", "regal-setzen"] },
];
