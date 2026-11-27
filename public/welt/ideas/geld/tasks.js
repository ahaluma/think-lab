// The tasks of the idea "Geld": money (euro coins and notes). The money stand at the market.
// One function per perspective makes one task as plain data: no DOM, no texts. Whole euros only.
//
//   task({ p, range }, r) → one task. range = 10, 20 or 100 (the most money in a task):
//     10   coins of 1 € and 2 €, the 5 € note
//     20   also the 10 € note
//     100  also 20 € and 50 € notes
//
//   sehen     { range, money: [values], answer }          coins and notes on the counter: how much?
//   machen    { range, price }                            pay exactly `price` with coins and notes
//   forschen  { range, price, ways }                      pay `price` in `ways` different ways
//   anwenden  { range, kind, … }
//               "total"  { items: [{ thing, price }], answer }          two things: together?
//               "change" { thing, price, paid, answer }                  pay with a note: back?
//               "enough" { thing, price, money: [values], answer: bool } is it enough?
//   pruefen   { range, money: [values], said, right, kind }  the owl counted: "these are `said` €".
//                                                           kind "pieces": she counted coins, not euros
//   key – short text that tells tasks apart, for "not the same task again".

export const RANGES = [10, 20, 100];
/** The coins and notes of each range, biggest first. */
export const MONEY = { 10: [5, 2, 1], 20: [10, 5, 2, 1], 100: [50, 20, 10, 5, 2, 1] };
export const THINGS = ["bread", "cheese", "honey", "melon", "pumpkin", "cake", "ball", "book"];

const rangeOf = (range) => (RANGES.includes(range) ? range : 10);
const sum = (list) => list.reduce((a, b) => a + b, 0);

/** Some coins and notes worth between lo and hi, a few of each, biggest first. */
function purse(R, r, lo, hi) {
  for (;;) {
    const kinds = MONEY[R];
    const money = [];
    const n = r.int(2, R === 10 ? 5 : 6);
    for (let i = 0; i < n; i++) money.push(r.pick(kinds));
    const s = sum(money);
    if (s >= lo && s <= hi) return money.sort((a, b) => b - a);
  }
}

/** The fewest pieces that make n (greedy works for euro values). */
export function fewest(n, R) {
  const out = [];
  for (const v of MONEY[R]) while (n >= v) (out.push(v), (n -= v));
  return out;
}

const makers = {
  sehen(R, r) {
    const money = purse(R, r, R === 10 ? 3 : R === 20 ? 8 : 25, R);
    return { range: R, money, answer: sum(money), key: money.join("+") };
  },
  machen(R, r) {
    const price = R === 10 ? r.int(3, 10) : R === 20 ? r.int(8, 20) : r.int(23, 99);
    return { range: R, price, key: `${price}` };
  },
  forschen(R, r) {
    const price = R === 10 ? r.int(4, 9) : R === 20 ? r.int(7, 18) : r.int(15, 60);
    return { range: R, price, ways: 2, key: `${price}` };
  },
  anwenden(R, r) {
    const kind = R === 10 ? r.pick(["total", "total", "enough"]) : r.pick(["total", "change", "change", "enough"]);
    const things = r.shuffle(THINGS);
    if (kind === "total") {
      const top = R === 10 ? 10 : R === 20 ? 20 : 100;
      const a = r.int(1, Math.floor(top / 2) - (R === 100 ? 5 : 0));
      const b = r.int(1, top - a);
      return { range: R, kind, items: [{ thing: things[0], price: a }, { thing: things[1], price: b }], answer: a + b, key: `t${a}+${b}` };
    }
    if (kind === "change") {
      const paid = R === 20 ? r.pick([10, 20]) : r.pick([20, 50, 100]);
      const price = r.int(Math.max(1, Math.floor(paid / 4)), paid - 1);
      return { range: R, kind, thing: things[0], price, paid, answer: paid - price, key: `c${price}/${paid}` };
    }
    const money = purse(R, r, 3, R);
    const have = sum(money);
    const price = Math.max(1, Math.min(R, have + r.pick([-3, -2, -1, 0, 1, 2, 3])));
    return { range: R, kind, thing: things[0], price, money, answer: have >= price, key: `e${money.join("+")}:${price}` };
  },
  pruefen(R, r) {
    let money;
    do money = purse(R, r, R === 10 ? 3 : 8, R);
    while (new Set(money).size < 2);
    const total = sum(money);
    const right = r.chance(0.4);
    if (right) return { range: R, money, said: total, right, kind: null, key: `${money.join("+")}=` };
    // Her mistakes: she counts the pieces, not the euros; or she misses one coin.
    const options = [[money.length, "pieces"], [total - money[money.length - 1], "missed"], [total + money[money.length - 1], "twice"]];
    const [said, kind] = r.pick(options.filter(([x]) => x !== total && x > 0));
    return { range: R, money, said, right, kind, key: `${money.join("+")}=${said}` };
  },
};

export function task(level, r) {
  const make = makers[level.p];
  if (!make) throw new Error(`geld: unknown perspective ${level.p}`);
  return { p: level.p, ...make(rangeOf(level.range), r) };
}

/** Problems with a task (empty list = fine), for tools/check-welt.mjs. */
export function check(t, level) {
  const R = rangeOf(level.range);
  const problems = [];
  const legal = (list) => list.every((v) => MONEY[R].includes(v));
  if (level.p === "sehen") {
    if (!legal(t.money) || sum(t.money) !== t.answer || t.answer > R) problems.push("money");
  } else if (level.p === "machen" || level.p === "forschen") {
    if (t.price < 1 || t.price > R) problems.push(`price ${t.price}`);
    if (level.p === "forschen" && t.price < 3) problems.push("only one way");
  } else if (level.p === "anwenden") {
    if (t.kind === "total" && (sum(t.items.map((i) => i.price)) !== t.answer || t.answer > R)) problems.push("total");
    if (t.kind === "change" && (t.answer !== t.paid - t.price || t.answer < 1 || t.paid > R)) problems.push("change");
    if (t.kind === "enough" && (!legal(t.money) || t.answer !== sum(t.money) >= t.price)) problems.push("enough");
  } else if (level.p === "pruefen") {
    if (!legal(t.money) || (t.said === sum(t.money)) !== t.right || t.said < 1) problems.push("pruefen");
  }
  return problems;
}
