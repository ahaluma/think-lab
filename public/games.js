// The list of games on the start page.
// To add a game: create public/games/<id>/ (copy templates/game/) and add one line here.
//
//   id    – the folder name inside public/games/ (lowercase, dashes, no spaces)
//   name  – short German name, shown under the picture and read out loud
//   icon  – one emoji: the picture a child recognises without reading
//   color – tile background

export const GAMES = [
  { id: "wie-viele", name: "Wie viele?", icon: "🍎", color: "#ffc83a" },
];
