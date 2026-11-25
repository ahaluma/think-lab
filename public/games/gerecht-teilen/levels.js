// Levels of "Gerecht teilen". Only data: the game (game.js), the start page and the parents' page read it.
//
//   id    – fixed name. Progress remembers this name, never the position: levels can be added
//           or moved later without breaking saved progress. Never rename an id.
//   age   – from this age the level is a good place to start (see shared/fit.js).
//   label – short text for the parents' page.
//
//   kids  – how many friends share: [fewest, most]
//   each  – how many every friend gets: [fewest, most]
//   max   – the most things in the basket
//   rest  – true: sometimes one or two are left over that cannot be shared fairly (they stay in the basket)
//   half  – true: two friends and an odd number. The last one is cut in half (5 for 2: two and a half each)
//   input – "tap":    the child taps a plate (one thing goes from the basket onto it), then ✓
//           "number": the child taps or types how many each friend gets (one of three, or the number pad from 8)
//   show  – "pictures": the things in the basket; "numbers": only a number sign on the basket
//           (after two wrong answers the things come and are dealt out one by one)

const L = (de, en, ne) => ({ de, en, ne });

export const LEVELS = [
  { id: "zwei-6", age: 4, label: L("Zu zweit teilen, bis 6", "Two friends, up to 6", "दुई साथी, ६ सम्म"),
    kids: [2, 2], each: [1, 3], max: 6, input: "tap", show: "pictures" },
  { id: "zwei-10", age: 4, label: L("Zu zweit teilen, bis 10", "Two friends, up to 10", "दुई साथी, १० सम्म"),
    kids: [2, 2], each: [2, 5], max: 10, input: "tap", show: "pictures" },
  { id: "drei-12", age: 5, label: L("Zu dritt teilen, bis 12", "Three friends, up to 12", "तीन साथी, १२ सम्म"),
    kids: [3, 3], each: [1, 4], max: 12, input: "tap", show: "pictures" },
  { id: "vier-12", age: 5, label: L("Für 2 bis 4 Freunde, bis 12", "2 to 4 friends, up to 12", "२ देखि ४ साथी, १२ सम्म"),
    kids: [2, 4], each: [1, 4], max: 12, input: "tap", show: "pictures" },
  { id: "rest", age: 5, label: L("Einer bleibt übrig (7 für 2)", "One is left over (7 for 2)", "एउटा बाँकी रहन्छ (२ जनालाई ७)"),
    kids: [2, 3], each: [1, 3], max: 11, rest: true, input: "tap", show: "pictures" },
  { id: "halbe", age: 6, label: L("Halbieren (5 für 2: zweieinhalb)", "Halving (5 for 2: two and a half)", "आधा गर्ने (२ जनालाई ५: अढाई)"),
    kids: [2, 2], each: [1, 4], max: 9, half: true, input: "tap", show: "pictures" },
  { id: "zahl-12", age: 6, label: L("Bilder, Zahl nennen (12 : 3 = ?)", "Pictures, give the number (12 ÷ 3 = ?)", "चित्र, अङ्क भन (१२ ÷ ३ = ?)"),
    kids: [2, 4], each: [2, 4], max: 12, input: "number", show: "pictures" },
  { id: "zahlen-20", age: 7, label: L("Nur Zahlen bis 20 (15 : 3 = ?)", "Numbers only to 20 (15 ÷ 3 = ?)", "अङ्क मात्र २० सम्म (१५ ÷ ३ = ?)"),
    kids: [2, 5], each: [2, 5], max: 20, input: "number", show: "numbers" },
  { id: "zahlen-50", age: 8, label: L("Nur Zahlen bis 50 (Einmaleins)", "Numbers only to 50 (times tables)", "अङ्क मात्र ५० सम्म (गुणन तालिका)"),
    kids: [2, 5], each: [2, 10], max: 50, input: "number", show: "numbers" },
];
