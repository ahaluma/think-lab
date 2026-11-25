// Children on this device. Parents add them on /eltern/ (name, age, animal). Nothing leaves the phone.
// Each child has their own progress (see progress.js: key "progress:<id>").
//
//   import * as profiles from "/shared/profiles.js";
//   profiles.all()            → [{ id, name, age, ageSince, animal, created, games }, …]
//   profiles.age(kid)         → age in whole years today, or null
//   profiles.current()        → the child playing now, or null (no children yet: "guest")
//   profiles.choose(id)       → switch child
//   profiles.add({ name, age, animal }) / profiles.update(id, changes) / profiles.remove(id)
//   profiles.setGame(id, gameId, true / false / null) → parents switch a game on or off (null = by age)
//   profiles.setHarder(id, gameId, true / false) → parents open levels above the child's age (shared/fit.js)
//
// Stored shape (localStorage "thinklab:profiles", version 1):
//   { v: 1, current: "k1", kids: [{ id: "k1", name: "Mila", age: 5, ageSince: "2026-11-25", animal: "🐰",
//                                   created: "2026-11-25", games: { "wie-viele": false } }] }
//
//   age, ageSince – the age in years the parents entered, and the day they entered it. One year later
//           the child is one year older (profiles.age()). No birthday needed. shared/fit.js uses the age
//           for start levels and which games a child sees.
//   games – only games the parents switched on (true) or off (false). Missing = decided by age.
//   harder – games where the parents opened the levels above the child's age: { "plus": true }.

import { store } from "./store.js";

const KEY = "profiles";

/** Animals a child can pick. The first ones are the favourites. */
export const ANIMALS = [
  "🐰", "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐢", "🦄", "🐬", "🦒", "🐘",
  "🦘", "🐧", "🦉", "🐙", "🦖", "🐝", "🦋", "🐞", "🐳", "🦈", "🐊", "🐜",
];

function read() {
  const p = store.get(KEY, null);
  return p && p.v === 1 && Array.isArray(p.kids) ? p : { v: 1, current: null, kids: [] };
}

function write(p) {
  store.set(KEY, p);
}

function today() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export const MIN_AGE = 2;
export const MAX_AGE = 12;

/** Age in whole years today: the age entered, plus every full year since it was entered. Or null. */
export function age(kid, now = new Date()) {
  if (!kid?.age) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(kid.ageSince || "");
  if (!m) return kid.age;
  const [y, mo, d] = m.slice(1).map(Number);
  const before = now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d);
  return kid.age + Math.max(0, now.getFullYear() - y - (before ? 1 : 0));
}

function newId(kids) {
  let id;
  do id = "k" + Math.random().toString(36).slice(2, 8);
  while (kids.some((k) => k.id === id));
  return id;
}

// ---------- Older devices: progress saved before there were profiles

// Before profiles there was one progress for everybody ("thinklab:progress").
// It becomes the first child, without a name: the parents add name and age on /eltern/.
function migrate() {
  if (store.get(KEY, null)) return;
  const old = store.get("progress", null);
  if (!old || !old.games || Object.keys(old.games).length === 0) return;
  const id = newId([]);
  store.set(`progress:${id}`, old);
  write({ v: 1, current: id, kids: [{ id, name: "", age: null, ageSince: null, animal: ANIMALS[0], created: today() }] });
  store.remove("progress");
}
migrate();

// Older entries: an age without the day it was entered (counts from the day the child was added),
// or a birth month "born" (stored for a short time): it becomes the age today.
function ageSince() {
  const p = store.get(KEY, null);
  if (!p?.kids?.some((k) => "born" in k || (k.age && !k.ageSince))) return;
  for (const k of p.kids) {
    if ("born" in k) {
      const m = /^(\d{4})-(\d{2})$/.exec(k.born || "");
      if (m && !k.age) {
        const now = new Date();
        const months = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
        k.age = Math.min(MAX_AGE, Math.max(MIN_AGE, Math.floor(months / 12)));
        k.ageSince = today();
      }
      delete k.born;
    }
    if (k.age && !k.ageSince) k.ageSince = /^\d{4}-\d{2}-\d{2}$/.test(k.created || "") ? k.created : today();
  }
  write(p);
}
ageSince();

// ---------- Reading

export function all() {
  return read().kids;
}

export function get(id) {
  return all().find((k) => k.id === id) || null;
}

/** The child playing now. With children but none chosen yet: the first one. */
export function current() {
  const p = read();
  return p.kids.find((k) => k.id === p.current) || p.kids[0] || null;
}

/** A child is complete when the parents gave a name and an age. */
export function complete(kid) {
  return Boolean(kid && kid.name && kid.age);
}

// ---------- Changing

export function choose(id) {
  const p = read();
  if (!p.kids.some((k) => k.id === id)) return;
  p.current = id;
  write(p);
}

const clean = ({ name, age, animal }) => ({
  name: String(name || "").trim().slice(0, 20),
  age: Math.min(MAX_AGE, Math.max(MIN_AGE, Math.round(Number(age) || MIN_AGE))),
  animal: ANIMALS.includes(animal) ? animal : ANIMALS[0],
});

export function add(kid) {
  const p = read();
  const id = newId(p.kids);
  p.kids.push({ id, ...clean(kid), ageSince: today(), created: today() });
  if (!p.current) p.current = id;
  write(p);
  return id;
}

export function update(id, changes) {
  const p = read();
  const kid = p.kids.find((k) => k.id === id);
  if (!kid) return;
  // A new age counts from today. The same age as shown keeps its day, so the next birthday stays.
  const newAge = changes.age !== undefined && Number(changes.age) !== age(kid);
  Object.assign(kid, clean({ ...kid, ...changes, age: newAge ? changes.age : kid.age }));
  if (newAge) kid.ageSince = today();
  write(p);
}

/** Parents switch a game on (true) or off (false) for one child; null = decided by age again. */
export function setGame(id, gameId, on) {
  const p = read();
  const kid = p.kids.find((k) => k.id === id);
  if (!kid) return;
  kid.games = { ...kid.games };
  if (on === null) delete kid.games[gameId];
  else kid.games[gameId] = Boolean(on);
  write(p);
}

/** Parents open (true) or close (false) the levels above the child's age in one game. */
export function setHarder(id, gameId, on) {
  const p = read();
  const kid = p.kids.find((k) => k.id === id);
  if (!kid) return;
  kid.harder = { ...kid.harder };
  if (on) kid.harder[gameId] = true;
  else delete kid.harder[gameId];
  write(p);
}

/** Removes the child and their progress. */
export function remove(id) {
  const p = read();
  p.kids = p.kids.filter((k) => k.id !== id);
  if (p.current === id) p.current = p.kids[0]?.id ?? null;
  write(p);
  store.remove(`progress:${id}`);
}
