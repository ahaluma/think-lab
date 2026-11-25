// Levels of "zahlenhaus". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js: children start
//           a bit below their age and move up quickly).
//   label – short text for the parents' page.
//
// Levels = the parameters of this game, easy to hard. After every 5 stars the child moves up one level.
//   total  – how many animals there are in all: [fewest, most]. 1 to total - 1 of them go into the house.
//   hidden – false: the house is open, the child counts inside and outside (three questions).
//            true: the house stays closed, the child knows the total and sees who is outside:
//            how many are hiding in the house?

export const LEVELS = [
  { id: "offen-3", age: 5, label: { de: "Haus offen, 3 Tiere", en: "House open, 3 animals", ne: "घर खुला, ३ जनावर" },
    total: [3, 3], hidden: false },
  { id: "offen-4", age: 5, label: { de: "Haus offen, 4 Tiere", en: "House open, 4 animals", ne: "घर खुला, ४ जनावर" },
    total: [4, 4], hidden: false },
  { id: "offen-5", age: 5, label: { de: "Haus offen, 3–5 Tiere", en: "House open, 3–5 animals", ne: "घर खुला, ३–५ जनावर" },
    total: [3, 5], hidden: false },
  { id: "zu-4", age: 6, label: { de: "Haus zu, 3–4 Tiere", en: "House closed, 3–4 animals", ne: "घर बन्द, ३–४ जनावर" },
    total: [3, 4], hidden: true },
  { id: "zu-5", age: 6, label: { de: "Haus zu, 5 Tiere", en: "House closed, 5 animals", ne: "घर बन्द, ५ जनावर" },
    total: [5, 5], hidden: true },
  { id: "zu-6", age: 6, label: { de: "Haus zu, 3–6 Tiere", en: "House closed, 3–6 animals", ne: "घर बन्द, ३–६ जनावर" },
    total: [3, 6], hidden: true },
  { id: "zu-7", age: 7, label: { de: "Haus zu, 6–7 Tiere", en: "House closed, 6–7 animals", ne: "घर बन्द, ६–७ जनावर" },
    total: [6, 7], hidden: true },
  { id: "zu-8", age: 7, label: { de: "Haus zu, 7–8 Tiere", en: "House closed, 7–8 animals", ne: "घर बन्द, ७–८ जनावर" },
    total: [7, 8], hidden: true },
  { id: "zu-10", age: 8, label: { de: "Haus zu, 8–10 Tiere", en: "House closed, 8–10 animals", ne: "घर बन्द, ८–१० जनावर" },
    total: [8, 10], hidden: true },
];
