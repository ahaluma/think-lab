// The tasks of "Wo ist es?" (Raumlage): one function makes one task (see shared/gen.js).
//
//   task(level, r, petIds?) → one task as plain data, no texts:
//     level – the id of the level the task is from (in "mix" levels one of the others)
//     scene – "table", "row" or "shelf"; input – "who" or "put" (from the level)
//     table who: asked (the word: "auf", "neben" …), target (the spot of the right animal),
//                pets [{ pet, spot }] – the first one sits at the target
//     table put: asked, pet (the waiting one), spots (all empty places), target (the first one that fits)
//     row:       ask ("zwischen", "links", "rechts"), pets (ids, left to right), target (index of the right one)
//     shelf:     pets [{ pet, cell }] (cells 0 … 8, top left to bottom right), target (cell),
//                put: newcomer (the waiting animal; the target cell is empty)
//     key   – the question and the right animal, for "not the same question again"
//     look  – the animals in the picture, for "other animals than last time"
//   petIds: the animals that have a name in the child's language (default: all).

import { LEVELS } from "./levels.js";

// The animals of this game. Their names (who / to whom) are in lang/<language>.js under "pets".
export const PETS = [
  { id: "rabbit", icon: "🐰" },
  { id: "cat", icon: "🐱" },
  { id: "dog", icon: "🐶" },
  { id: "bear", icon: "🐻" },
  { id: "fox", icon: "🦊" },
  { id: "frog", icon: "🐸" },
  { id: "duck", icon: "🦆" },
  { id: "mouse", icon: "🐭" },
  { id: "pig", icon: "🐷" },
  { id: "owl", icon: "🦉" },
  { id: "panda", icon: "🐼" },
  { id: "lion", icon: "🦁" },
];
const PET_IDS = PETS.map((p) => p.id);

// Places around the table (where they are drawn: game.js).
// Places that would cover each other: never both in one picture.
const CLASH = { auf: ["hinter"], hinter: ["auf"], unter: ["vor"], vor: ["unter"] };
export const SIDES = ["links", "rechts"];

/** Which word is asked: mostly one of the level's new words (focus), sometimes any. */
const askPlace = (l, r) => r.pick(l.focus && r.chance(0.7) ? l.focus : l.places);

/** Where an animal can sit for these words ("neben" = left or right). */
export const spotsFor = (places) => [...new Set(places.flatMap((p) => (p === "neben" ? SIDES : [p])))];

/** Does the animal at `spot` fit the word `place`? */
export const fits = (spot, place) => spot === place || (place === "neben" && SIDES.includes(spot));

function tableWho(l, r, petIds) {
  const asked = askPlace(l, r);
  const target = asked === "neben" ? r.pick(SIDES) : asked;
  const taken = [target];
  for (const spot of r.shuffle(spotsFor(l.places))) {
    if (taken.length >= l.pets) break;
    if (taken.includes(spot) || taken.some((t) => CLASH[t]?.includes(spot))) continue;
    if (asked === "neben" && SIDES.includes(spot)) continue; // only one animal next to the table
    taken.push(spot);
  }
  const pets = r.sample(petIds, taken.length);
  return { asked, target, pets: taken.map((spot, i) => ({ pet: pets[i], spot })), key: `${asked} ${pets[0]}` };
}

function tablePut(l, r, petIds) {
  const asked = askPlace(l, r);
  const pet = r.pick(petIds);
  const spots = spotsFor(l.places);
  return { asked, pet, spots, target: spots.find((s) => fits(s, asked)), key: `${asked} ${pet}` };
}

function row(l, r, petIds) {
  const n = l.pets;
  const pets = r.sample(petIds, n);
  const ask = r.pick(l.ask);
  const target = ask === "zwischen" ? r.int(1, n - 2) : ask === "links" ? r.int(0, n - 2) : r.int(1, n - 1);
  return { ask, pets, target, key: `${ask} ${pets[target]}` };
}

function shelf(l, r, petIds) {
  const cells = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const pets = r.sample(petIds, l.pets + 1);
  const put = l.input === "put";
  const t = {
    pets: cells.slice(0, l.pets).map((cell, k) => ({ pet: pets[k], cell })),
    target: put ? cells[l.pets] : cells[0],
  };
  if (put) t.newcomer = pets[l.pets];
  return { ...t, key: `${t.target} ${put ? t.newcomer : pets[0]}` };
}

export function task(level, r, petIds = PET_IDS) {
  const id = level.scene === "mix" ? r.pick(level.levels) : level.id;
  const l = LEVELS.find((x) => x.id === id);
  const make = l.scene === "row" ? row : l.scene === "shelf" ? shelf : l.input === "put" ? tablePut : tableWho;
  const t = make(l, r, petIds);
  const look = [t.pet ?? t.newcomer, ...t.pets?.map((p) => p.pet ?? p) ?? []].filter(Boolean).sort().join();
  return { level: l.id, scene: l.scene, input: l.input, ...t, answer: t.asked ?? t.ask ?? t.target, key: `${l.id} ${t.key}`, look };
}

/** Problems with a task (empty list = fine), for tools/check-tasks.mjs. */
export function check(t, level) {
  const problems = [];
  const l = LEVELS.find((x) => x.id === t.level);
  if (level.scene === "mix" ? !level.levels.includes(t.level) : t.level !== level.id) problems.push("wrong level");
  const ids = t.scene === "row" ? t.pets : [...(t.pets ?? []).map((p) => p.pet), t.pet, t.newcomer].filter(Boolean);
  if (new Set(ids).size !== ids.length) problems.push("the same animal twice");
  if (t.scene === "table" && t.input === "who") {
    const spots = t.pets.map((p) => p.spot);
    if (new Set(spots).size !== spots.length) problems.push("two animals on one spot");
    if (spots.filter((s) => fits(s, t.asked)).length !== 1) problems.push("not one right animal");
    if (spots.some((s) => spots.some((o) => CLASH[s]?.includes(o)))) problems.push("animals cover each other");
    if (spots.length !== l.pets) problems.push("wrong number of animals");
  }
  if (t.scene === "table" && t.input === "put" && !t.target) problems.push("no place fits");
  if (t.scene === "row") {
    const ok = t.ask === "zwischen" ? t.target > 0 && t.target < t.pets.length - 1
      : t.ask === "links" ? t.target < t.pets.length - 1 : t.target > 0;
    if (!ok) problems.push("no animal for the question");
  }
  if (t.scene === "shelf") {
    const cells = t.pets.map((p) => p.cell);
    if (new Set(cells).size !== cells.length) problems.push("two animals in one cell");
    if (t.input === "put" ? cells.includes(t.target) : cells[0] !== t.target) problems.push("target wrong");
  }
  return problems;
}
