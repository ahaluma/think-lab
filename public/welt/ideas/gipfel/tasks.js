// The new families of the summit (welt/berg/gipfel/): each one needs two tools from the camps below
// at once. A competition round has one of them, between tasks of the camps themselves.
//
//   zaunstall  posts with gaps of 2 m and 3 m (camp 1 posts and gaps + camp 7 assume and swap)
//   seerose    a water lily doubles (or triples) every day: when was a quarter covered? (camps 4, 5)
//   ziffern    three-digit numbers from four digits, each once: how many are even? (camps 2, 8)
//   laternen   a post every g metres, a lantern on every k-th post (camps 1, 5)
//   mauerwaage a number wall: left and right the same, the middle m times as big (camps 12, 6)
//
//   task(r) → { story, a, answer, tool, pic?, key }    check(t) → problems (each answer found by trying)

export const DIGITS = 3;
export const STORIES = ["zaunstall", "seerose", "ziffern", "laternen", "mauerwaage"];

function zaunstall(r) {
  const P = r.int(8, 30);
  const big = r.int(1, P - 2);
  const L = 2 * (P - 1) + big;
  return { story: "zaunstall", a: { P, gaps: P - 1, L, small: 2 * (P - 1), extra: big }, answer: big, tool: "stall", key: `z${P}${L}` };
}

function seerose(r) {
  const f = r.pick([2, 2, 3]);
  const D = r.int(f === 2 ? 10 : 8, 40);
  const k = r.int(1, 3);
  return { story: f === 2 ? "seerose" : "algen", a: { D, k, f, part: f ** k }, answer: D - k, tool: "rueck", key: `s${f}${D}${k}` };
}

function ziffern(r) {
  for (;;) {
    const digits = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4).sort((x, y) => x - y);
    const even = digits.filter((d) => d % 2 === 0).length;
    const odd = r.chance(0.5);
    const ends = odd ? 4 - even : even;
    if (ends === 0) continue;
    return { story: odd ? "ungerade" : "gerade", a: { digits, ends, per: 6 }, answer: ends * 6, tool: "haken", key: `d${digits.join("")}${odd}` };
  }
}

function laternen(r) {
  const g = r.int(2, 5);
  const P = r.int(12, 60);
  const k = r.int(3, 6);
  return { story: "laternen", a: { g, L: g * (P - 1), P, gaps: P - 1, k, lanterns: Math.floor((P - 1) / k) + 1 }, answer: Math.floor((P - 1) / k) + 1, tool: "zaun", key: `l${g}${P}${k}` };
}

function mauerwaage(r) {
  const x = r.int(2, 20);
  const m = r.int(2, 4);
  const T = x * (2 + 2 * m);
  return { story: "mauerwaage", a: { m, T, parts: 2 + 2 * m, mid: m * x }, pic: { wall: [[T], [null, null], ["?", null, "?"]] }, answer: x, tool: "waage", key: `w${x}${m}` };
}

const MAKERS = { zaunstall, seerose, ziffern, laternen, mauerwaage };
/** The two camps whose tools each family needs (frame/ideas.js MOUNTAIN ids). */
export const NEEDS = { zaunstall: ["zaun", "stall"], seerose: ["vorrat", "ameisen"], ziffern: ["haken", "tanz"], laternen: ["zaun", "ameisen"], mauerwaage: ["mauer", "waage"] };

export function task(r, story = r.pick(STORIES)) {
  return { p: "anwenden", range: 4, ...MAKERS[story](r), camps: NEEDS[story] };
}

/** Problems with a task (empty list = fine). Every answer is found again by trying all cases. */
export function check(t) {
  const problems = [];
  const a = t.a;
  if (!Number.isInteger(t.answer) || t.answer < 0 || String(t.answer).length > DIGITS) problems.push(`answer ${t.answer}`);
  const only = (list) => (list.length === 1 ? list[0] : NaN);
  let want;
  switch (t.story) {
    case "zaunstall": {
      const c = [];
      for (let b = 0; b <= a.P - 1; b++) if (2 * (a.P - 1 - b) + 3 * b === a.L) c.push(b);
      want = only(c);
      if (a.extra < 1 || a.extra > a.P - 2) problems.push("no mix of gaps");
      break;
    }
    case "seerose": case "algen": {
      // go back day by day from full (1) until the part is 1 / f^k
      let cover = 1;
      let day = a.D;
      while (cover > 1 / a.part + 1e-12) (cover /= a.f), day--;
      want = day;
      break;
    }
    case "gerade": case "ungerade": {
      let n = 0;
      for (const x of a.digits) for (const y of a.digits) for (const z of a.digits) {
        if (x === y || y === z || x === z) continue;
        if ((z % 2 === 0) === (t.story === "gerade")) n++;
      }
      want = n;
      break;
    }
    case "laternen": {
      let n = 0;
      for (let i = 0; i * a.g <= a.L; i++) if (i % a.k === 0) n++;
      want = n;
      break;
    }
    case "mauerwaage": {
      const c = [];
      for (let x = 1; x <= a.T; x++) {
        const b = [x, a.m * x, x];
        if (b[0] + 2 * b[1] + b[2] === a.T) c.push(x);
      }
      want = only(c);
      break;
    }
    default: problems.push(`unknown story ${t.story}`);
  }
  if (want !== t.answer) problems.push(`answer ${t.answer}, tried ${want}`);
  return problems;
}
