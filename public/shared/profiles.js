// Children on this device. Parents add them on /eltern/ (name, birth month, animal). Nothing leaves the phone.
// Each child has their own progress (see progress.js: key "progress:<id>").
//
//   import * as profiles from "/shared/profiles.js";
//   profiles.all()            → [{ id, name, born, animal, created, games }, …]
//   profiles.age(kid)         → age in whole years today, or null
//   profiles.current()        → the child playing now, or null (no children yet: "guest")
//   profiles.choose(id)       → switch child
//   profiles.add({ name, born, animal }) / profiles.update(id, changes) / profiles.remove(id)
//   profiles.setGame(id, gameId, true / false / null) → parents switch a game on or off (null = by age)
//
// Stored shape (localStorage "thinklab:profiles", version 1):
//   { v: 1, current: "k1", kids: [{ id: "k1", name: "Mila", born: "2021-05", animal: "🐰", created: "2026-11-25",
//                                   games: { "wie-viele": false } }] }
//
//   born  – birth month "YYYY-MM". The age grows by itself; shared/fit.js uses it for start levels and
//           which games a child sees. (The first version stored "age" in years: converted once below.)
//   games – only games the parents switched on (true) or off (false). Missing = decided by age.

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

/** Age in whole years today from "YYYY-MM", or null. */
export function age(kid, now = new Date()) {
  const m = /^(\d{4})-(\d{2})$/.exec(kid?.born || "");
  if (!m) return null;
  const months = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
  return Math.max(0, Math.floor(months / 12));
}

function newId(kids) {
  let id;
  do id = "k" + Math.random().toString(36).slice(2, 8);
  while (kids.some((k) => k.id === id));
  return id;
}

// ---------- Older devices: progress saved before there were profiles

// Before profiles there was one progress for everybody ("thinklab:progress").
// It becomes the first child, without a name: the parents add name and birth month on /eltern/.
function migrate() {
  if (store.get(KEY, null)) return;
  const old = store.get("progress", null);
  if (!old || !old.games || Object.keys(old.games).length === 0) return;
  const id = newId([]);
  store.set(`progress:${id}`, old);
  write({ v: 1, current: id, kids: [{ id, name: "", born: null, animal: ANIMALS[0], created: today() }] });
  store.remove("progress");
}
migrate();

// The first version stored "age" in years. It becomes a birth month: this month, that many years ago.
// The parents can correct the month on /eltern/.
function ageToBorn() {
  const p = store.get(KEY, null);
  if (!p?.kids?.some((k) => "age" in k)) return;
  const now = new Date();
  for (const k of p.kids) {
    if (!("age" in k)) continue;
    if (k.age && !k.born) k.born = `${now.getFullYear() - k.age}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    delete k.age;
  }
  write(p);
}
ageToBorn();

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

/** A child is complete when the parents gave a name and a birth month. */
export function complete(kid) {
  return Boolean(kid && kid.name && kid.born);
}

// ---------- Changing

export function choose(id) {
  const p = read();
  if (!p.kids.some((k) => k.id === id)) return;
  p.current = id;
  write(p);
}

const clean = ({ name, born, animal }) => ({
  name: String(name || "").trim().slice(0, 20),
  born: /^\d{4}-(0[1-9]|1[0-2])$/.test(born || "") ? born : null,
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

/** Removes the child and their progress. */
export function remove(id) {
  const p = read();
  p.kids = p.kids.filter((k) => k.id !== id);
  if (p.current === id) p.current = p.kids[0]?.id ?? null;
  write(p);
  store.remove(`progress:${id}`);
}
