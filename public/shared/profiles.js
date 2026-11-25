// Children on this device. Parents add them on /eltern/ (name, age, animal). Nothing leaves the phone.
// Each child has their own progress (see progress.js: key "progress:<id>").
//
//   import * as profiles from "/shared/profiles.js";
//   profiles.all()            → [{ id, name, age, animal, created }, …]
//   profiles.current()        → the child playing now, or null (no children yet: "guest")
//   profiles.choose(id)       → switch child
//   profiles.add({ name, age, animal }) / profiles.update(id, changes) / profiles.remove(id)
//
// Stored shape (localStorage "thinklab:profiles", version 1):
//   { v: 1, current: "k1", kids: [{ id: "k1", name: "Mila", age: 5, animal: "🐰", created: "2026-11-25" }] }
//
//   age – a whole number of years (3…12). Later the catalog maps ages to games and start levels,
//         and progress.js adapts the level per child. Both read only this list and "progress:<id>".

import { store } from "./store.js";

const KEY = "profiles";

/** Animals a child can pick. The first ones are the favourites. */
export const ANIMALS = [
  "🐰", "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐢", "🦄", "🐬", "🦒", "🐘",
  "🦘", "🐧", "🦉", "🐙", "🦖", "🐝", "🦋", "🐞", "🐳", "🦈", "🐊", "🐜",
];

export const MIN_AGE = 3;
export const MAX_AGE = 12;

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
  write({ v: 1, current: id, kids: [{ id, name: "", age: null, animal: ANIMALS[0], created: today() }] });
  store.remove("progress");
}
migrate();

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
  p.kids.push({ id, ...clean(kid), created: today() });
  if (!p.current) p.current = id;
  write(p);
  return id;
}

export function update(id, changes) {
  const p = read();
  const kid = p.kids.find((k) => k.id === id);
  if (!kid) return;
  Object.assign(kid, clean({ ...kid, ...changes }));
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
