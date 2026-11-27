// The tasks of the idea "Folge": first and then. Picture stories in order, what comes next, and who
// is first, second, third in a row (preschool). The sky on the map ("Himmel").
// One function per perspective makes one task as plain data: no DOM, no texts.
//
//   task({ p, range }, r) → one task. range = level 1, 2 or 3:
//     1  stories of three pictures; first and last in a row of three or four
//     2  also stories of four pictures and the day; first to third
//     3  stories of four pictures; first to fifth, "what was before?"
//
//   sehen     { story, shown: [step, step] }         two pictures of a story: which came first?
//   machen    { story, mixed: [steps] }              tap the pictures in the order of the story
//   forschen  { story, at, back, choices: [{ story, step }], answer }   what comes next (back: before)?
//   anwenden  { pets, ask }                          animals in a row, the flag on the left: ask = 1 … 5
//                                                    (the place, 1 = first) or 0 = the last one
//   pruefen   { story, shown: [steps], right }       the owl laid the story. Is the order right?
//   key – short text that tells tasks apart.
//
// This holds the ideas of the old games "Zuerst und dann" and "Wer ist Erster?". The days of the week
// and the clock are school things: they are in the town's weather station (ideas/zeit/).

/** Little stories, in order. The sentences are in the lang files (folge.stories, folge.ends).
 *  Every picture must make sense to children in Nepal and in Germany. */
export const STORIES = {
  flower: ["🫘", "🌱", "🌻"],
  chick: ["🥚", "🐣", "🐥"],
  rain: ["☁️", "🌧️", "🌈"],
  sleep: ["🥱", "🛌", "😴"],
  drawing: ["🖍️", "🖼️", "👵"],
  growup: ["👶", "🧒", "🧑", "🧓"],
  hen: ["🥚", "🐣", "🐥", "🐔"],
  tree: ["🫘", "🌱", "🪴", "🌳"],
  cake: ["🥚", "🥣", "🎂", "🍰"],
  soup: ["🥕", "🔪", "🍲", "😋"],
  day: ["🌅", "☀️", "🌇", "🌙"],
};
export const PETS = ["rabbit", "cat", "dog", "bear", "fox", "frog", "duck", "mouse", "pig", "panda", "lion"];
export const ICONS = { rabbit: "🐰", cat: "🐱", dog: "🐶", bear: "🐻", fox: "🦊", frog: "🐸", duck: "🦆", mouse: "🐭", pig: "🐷", panda: "🐼", lion: "🦁" };

const SHORT = Object.keys(STORIES).filter((id) => STORIES[id].length === 3);
const LONG = Object.keys(STORIES).filter((id) => STORIES[id].length === 4);
const STORIES_AT = { 1: SHORT, 2: [...SHORT, ...LONG], 3: LONG };
const levelOf = (range) => (STORIES_AT[range] ? range : 1);

/** The steps 0..n-1 in a mixed order that is not already right. */
function mixed(n, r) {
  for (;;) {
    const m = r.shuffle(Array.from({ length: n }, (_, i) => i));
    if (m.some((x, i) => x !== i)) return m;
  }
}

const makers = {
  sehen(L, r) {
    const story = r.pick(STORIES_AT[L]);
    const [a, b] = r.sample(Array.from({ length: STORIES[story].length }, (_, i) => i), 2);
    return { story, shown: [a, b], key: `${story}${a}${b}` };
  },
  machen(L, r) {
    const story = r.pick(STORIES_AT[L]);
    return { story, mixed: mixed(STORIES[story].length, r), key: story };
  },
  forschen(L, r) {
    const story = r.pick(STORIES_AT[L]);
    const n = STORIES[story].length;
    const back = L === 3 && r.chance(0.4);
    const at = back ? r.int(1, n - 1) : r.int(0, n - 2);
    const right = { story, step: back ? at - 1 : at + 1 };
    const wrong = [];
    const other = back ? at + 1 : at - 1;
    if (other >= 0 && other < n) wrong.push({ story, step: other });
    // A picture of another story that does not share a picture with this one.
    const others = Object.keys(STORIES).filter((id) => id !== story && !STORIES[id].some((x) => STORIES[story].includes(x)));
    while (wrong.length < 2) {
      const o = r.pick(others);
      const step = r.int(0, STORIES[o].length - 1);
      if (!wrong.some((w) => w.story === o)) wrong.push({ story: o, step });
    }
    const choices = r.shuffle([right, ...wrong]);
    return { story, at, back, choices, answer: choices.indexOf(right), key: `${story}${at}${back}` };
  },
  anwenden(L, r) {
    const n = L === 1 ? r.int(3, 4) : L === 2 ? 4 : 5;
    const pets = r.sample(PETS, n);
    const asks = L === 1 ? [1, 0] : L === 2 ? [1, 2, 3, 0] : [1, 2, 3, 4, 5, 0];
    const ask = r.pick(asks.filter((k) => k < n || k === 0));
    return { pets, ask, key: `${ask}${pets.join("")}` };
  },
  pruefen(L, r) {
    const story = r.pick(STORIES_AT[L]);
    const n = STORIES[story].length;
    const right = r.chance(0.4);
    const shown = Array.from({ length: n }, (_, i) => i);
    if (!right) {
      const i = r.int(0, n - 2);
      [shown[i], shown[i + 1]] = [shown[i + 1], shown[i]];
    }
    return { story, shown, right, key: `${story}${shown.join("")}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`folge: unknown perspective ${level.p}`);
  const L = levelOf(level.range);
  return { p: level.p, level: L, ...make(L, r) };
}

/** The index of the animal asked about: ask 1 … 5 = that place, 0 = the last. */
export const placeOf = (t) => (t.ask === 0 ? t.pets.length - 1 : t.ask - 1);

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const problems = [];
  const n = t.story ? STORIES[t.story].length : 0;
  if (level.p === "sehen" && (t.shown[0] === t.shown[1] || t.shown.some((s) => s < 0 || s >= n))) problems.push("shown");
  if (level.p === "machen" && t.mixed.slice().sort().join() !== Array.from({ length: n }, (_, i) => i).join()) problems.push("mixed");
  if (level.p === "forschen") {
    const want = t.back ? t.at - 1 : t.at + 1;
    const c = t.choices[t.answer];
    if (c.story !== t.story || c.step !== want || want < 0 || want >= n) problems.push("answer");
    const icons = t.choices.map((x) => STORIES[x.story][x.step]);
    if (new Set(icons).size !== icons.length) problems.push("two choices look the same");
  }
  if (level.p === "anwenden" && (placeOf(t) >= t.pets.length || new Set(t.pets).size !== t.pets.length)) problems.push("place");
  if (level.p === "pruefen" && (t.shown.every((x, i) => x === i)) !== t.right) problems.push("right");
  return problems;
}
