// The five boards of the idea "Zeit" (clock, calendar, charts, chance): one per perspective.
// Same contract as every idea (see ideas/teile/boards.js): board(host, task, ctx) → { hint() }.
// Texts are in welt/lang/<language>.js under "zeit". The clock is SVG drawn here.

import { el, button, shake } from "../../frame/parts.js";
import { numpad } from "../../../shared/numpad.js";

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

let current = null;
function pad(box, ctx, digits, onCheck) {
  current?.remove();
  current = numpad(box, ctx.T, { digits, onCheck });
  return current;
}

const ICON = { sun: "☀️", cloud: "☁️", rain: "🌧️", snow: "❄️" };
const BALL = { red: "#ff5a36", blue: "#2456b8", yellow: "#ffc83a", green: "#12a564" };

/** "3:05" in the digits of the language. */
const clockText = (ctx, h, m) => `${ctx.num(h)}:${ctx.num(Math.floor(m / 10))}${ctx.num(m % 10)}`;

/** An analogue clock. Returns { svg, set(h, m), numbers(on) }. */
function clock(ctx, h, m, size = 190) {
  const svg = svgEl("svg", { viewBox: "-100 -100 200 200", width: size, height: size, class: "clock-svg" });
  svg.append(svgEl("circle", { r: 92, fill: "#fff", stroke: "#1b2140", "stroke-width": 6 }));
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const long = i % 5 === 0;
    svg.append(svgEl("line", { x1: 84 * Math.sin(a), y1: -84 * Math.cos(a), x2: (long ? 74 : 79) * Math.sin(a), y2: -(long ? 74 : 79) * Math.cos(a), stroke: "#1b2140", "stroke-width": long ? 3 : 1.5 }));
  }
  for (let i = 1; i <= 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const t = svgEl("text", { x: 60 * Math.sin(a), y: -60 * Math.cos(a) + 7, "text-anchor": "middle", class: "clock-no" });
    t.textContent = ctx.num(i);
    svg.append(t);
  }
  const minutes = svgEl("g", { class: "clock-minutes" });
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const t = svgEl("text", { x: 104 * Math.sin(a), y: -104 * Math.cos(a) + 5, "text-anchor": "middle", class: "clock-min" });
    t.textContent = ctx.num(i * 5);
    minutes.append(t);
  }
  minutes.style.display = "none";
  svg.append(minutes);
  const hourHand = svgEl("line", { x1: 0, y1: 0, x2: 0, y2: -42, stroke: "#e8488a", "stroke-width": 9, "stroke-linecap": "round", class: "hand" });
  const minHand = svgEl("line", { x1: 0, y1: 0, x2: 0, y2: -70, stroke: "#2456b8", "stroke-width": 5, "stroke-linecap": "round", class: "hand" });
  svg.append(hourHand, minHand, svgEl("circle", { r: 6, fill: "#1b2140" }));
  const set = (hh, mm) => {
    hourHand.setAttribute("transform", `rotate(${((hh % 12) + mm / 60) * 30})`);
    minHand.setAttribute("transform", `rotate(${mm * 6})`);
  };
  set(h, m);
  return { svg, set, minutes: () => (minutes.style.display = "") };
}

/** Buttons with times. onPick(time, button). */
function timeButtons(ctx, list, onPick) {
  const row = el("div", "name-row");
  for (const t of list) {
    const b = button("btn name-btn time-btn", clockText(ctx, t.h, t.m), clockText(ctx, t.h, t.m));
    b.addEventListener("click", () => onPick(t, b));
    row.append(b);
  }
  return row;
}

const isSame = (a, b) => a.h === b.h && a.m === b.m;

// ---------- Sehen: read the clock.

export function sehen(host, t, ctx) {
  const Z = ctx.T.zeit.sehen;
  const scene = el("div", "scene card clock-scene");
  const c = clock(ctx, t.h, t.m);
  scene.append(c.svg);
  let locked = false;
  const row = timeButtons(ctx, t.choices, (x, b) => {
    if (locked) return;
    if (!isSame(x, t)) {
      shake(b);
      b.disabled = true;
      ctx.miss(x.h === (t.m === 0 ? 12 : t.m / 5) && x.m === (t.h % 12) * 5 ? Z.missSwap : Z.miss);
      return;
    }
    locked = true;
    b.classList.add("right");
    ctx.solved(Z.done(clockText(ctx, t.h, t.m)));
  });
  host.append(scene, row);
  ctx.tell(Z.ask);
  return {
    hint() {
      c.minutes();
      return Z.hint;
    },
  };
}

// ---------- Machen: set the clock.

export function machen(host, t, ctx) {
  const Z = ctx.T.zeit.machen;
  let h = t.startH;
  let m = t.startM;
  const goal = el("div", "stellen-goal");
  goal.append(el("b", "", clockText(ctx, t.h, t.m)));
  const scene = el("div", "scene card clock-scene");
  const c = clock(ctx, h, m, 170);
  scene.append(c.svg);
  let locked = false;
  const tools = el("div", "clock-tools");
  const move = (dm) => {
    if (locked) return;
    let total = ((h % 12) * 60 + m + dm + 720) % 720;
    h = Math.floor(total / 60) || 12;
    m = total % 60;
    c.set(h, m);
    ctx.tap();
  };
  const add = (label, text, dm, cls) => {
    const b = button(`btn clock-btn ${cls}`, label, text);
    b.addEventListener("click", () => move(dm));
    tools.append(b);
  };
  add(Z.hourBack, "−1 h", -60, "hour");
  add(Z.hourOn, "+1 h", 60, "hour");
  if (t.step < 60) {
    add(Z.minBack, `−${t.step} min`, -t.step, "min");
    add(Z.minOn, `+${t.step} min`, t.step, "min");
  }
  const check = button("btn ok check-btn", Z.check, "✓");
  check.addEventListener("click", () => {
    if (locked) return;
    if (h !== t.h || m !== t.m) {
      shake(check);
      ctx.miss(m !== t.m ? Z.missMin : Z.missHour);
      return;
    }
    locked = true;
    ctx.solved(Z.done(clockText(ctx, t.h, t.m)));
  });
  host.append(goal, scene, tools, check);
  ctx.tell(Z.question(clockText(ctx, t.h, t.m)));
  return {
    hint() {
      c.minutes();
      return t.m >= 30 && t.m > 0 ? Z.hintHalf : Z.hint;
    },
  };
}

// ---------- Forschen: a bag of balls. Take one out (as often as you like), then think.

export function forschen(host, t, ctx) {
  const Z = ctx.T.zeit.forschen;
  const scene = el("div", "scene card bag-scene");
  const bag = el("div", "bag");
  const all = [];
  for (const [colour, n] of Object.entries(t.bag)) for (let i = 0; i < n; i++) all.push(colour);
  for (const colour of all) {
    const b = el("span", "ball");
    b.style.background = BALL[colour];
    bag.append(b);
  }
  scene.append(el("span", "bag-icon", "👜"), bag);
  const tally = el("div", "tally");
  const counts = {};
  const draw = button("btn sun draw-btn", Z.draw, `✋ ${Z.draw}`);
  draw.addEventListener("click", () => {
    const c = all[Math.floor(Math.random() * all.length)];
    counts[c] = (counts[c] || 0) + 1;
    ctx.tap();
    tally.innerHTML = "";
    for (const [col, n] of Object.entries(counts)) {
      const chip = el("span", "chip pop");
      const dot = el("i", "ball small");
      dot.style.background = BALL[col];
      chip.append(dot, el("b", "", ctx.num(n)));
      tally.append(chip);
    }
  });
  let locked = false;
  const answers = el("div", "name-row");
  const opts = t.kind === "most" ? [...Object.keys(t.bag), "same"] : ["sure", "maybe", "never"];
  for (const o of opts) {
    const label = t.kind === "most" ? (o === "same" ? Z.same : Z.colours[o]) : Z.chance[o];
    const b = button("btn name-btn", label, "");
    if (t.kind === "most" && o !== "same") {
      const dot = el("i", "ball small");
      dot.style.background = BALL[o];
      b.append(dot);
    }
    b.append(el("span", "", label));
    b.addEventListener("click", () => {
      if (locked) return;
      if (o !== t.answer) {
        shake(b);
        b.disabled = true;
        ctx.miss(t.kind === "most" ? Z.missMost : Z.missChance[o]);
        return;
      }
      locked = true;
      b.classList.add("right");
      ctx.solved(t.kind === "most" ? (o === "same" ? Z.doneSame : Z.doneMost(Z.colours[o])) : Z.doneChance[o](Z.colours[t.colour]));
    });
    answers.append(b);
  }
  host.append(scene, draw, tally, answers);
  ctx.tell(t.kind === "most" ? Z.askMost : Z.askChance(Z.colours[t.colour]));
  return {
    hint() {
      bag.classList.add("sorted");
      [...bag.children].sort((a, b) => a.style.background.localeCompare(b.style.background)).forEach((b) => bag.append(b));
      return t.kind === "most" ? Z.hintMost : Z.hintChance;
    },
  };
}

// ---------- Anwenden: two weeks of weather as a chart; later the clock and the calendar.

function chart(ctx, days, scale) {
  const box = el("div", "chart" + (scale ? " scaled" : ""));
  for (const [w, n] of Object.entries(days)) {
    const row = el("div", "chart-row");
    row.append(el("span", "chart-key", ICON[w]));
    const bar = el("span", "chart-bar");
    if (scale) {
      const fill = el("span", "bar-fill");
      fill.style.width = `${(100 * n) / 14}%`;
      bar.append(fill);
    } else for (let i = 0; i < n; i++) bar.append(el("span", "pic", ICON[w]));
    row.append(bar);
    box.append(row);
  }
  if (scale) {
    const axis = el("div", "chart-axis");
    for (let i = 0; i <= 14; i += 2) {
      const s = el("span", "", ctx.num(i));
      s.style.left = `${(100 * i) / 14}%`;
      axis.append(s);
    }
    box.append(axis);
  }
  return box;
}

export function anwenden(host, t, ctx) {
  const Z = ctx.T.zeit.anwenden;
  let locked = false;
  const hintBox = el("div", "hint-box");
  const win = (text) => {
    locked = true;
    ctx.solved(text);
  };

  if (t.kind === "day") {
    const scene = el("div", "scene card week-scene");
    const week = el("div", "week");
    Z.days.forEach((d, i) => week.append(el("span", i === t.today ? "day today" : "day", Z.short[i])));
    scene.append(week);
    const row = el("div", "name-row days-row");
    Z.days.forEach((d, i) => {
      const b = button("btn name-btn", d, d);
      b.addEventListener("click", () => {
        if (locked) return;
        if (i !== t.answer) return void (shake(b), (b.disabled = true), ctx.miss(Z.dayMiss));
        b.classList.add("right");
        win(Z.dayDone(Z.days[t.today], ctx.word(t.add), d));
      });
      row.append(b);
    });
    host.append(scene, row, hintBox);
    ctx.tell(Z.dayAsk(Z.days[t.today], ctx.word(t.add), t.add));
    return {
      hint() {
        [...week.children].forEach((s, i) => {
          const k = (i - t.today + 7) % 7;
          if (k > 0 && k <= t.add) s.append(el("small", "pop", `+${ctx.num(k)}`));
        });
        return Z.dayHint;
      },
    };
  }

  if (t.kind === "later") {
    const scene = el("div", "scene card clock-scene");
    const c = clock(ctx, t.h, 0, 170);
    scene.append(c.svg);
    const padBox = el("div");
    const p = pad(padBox, ctx, 2, (n) => {
      if (locked) return false;
      if (n !== t.answer) {
        p.clear();
        ctx.miss(n === t.h + t.add ? Z.laterOver : Z.laterMiss);
        return false;
      }
      p.show(n);
      p.lock(true);
      c.set(t.answer, 0);
      win(Z.laterDone(ctx.word(t.answer)));
      return true;
    });
    host.append(scene, padBox);
    ctx.tell(Z.laterAsk(ctx.word(t.h), ctx.word(t.add), t.add));
    return {
      hint() {
        return Z.laterHint;
      },
    };
  }

  const scene = el("div", "scene card chart-scene");
  scene.append(el("p", "chart-title", Z.chartTitle), chart(ctx, t.days, t.range > 1));
  if (t.kind === "most") {
    const row = el("div", "name-row");
    for (const w of Object.keys(t.days)) {
      const b = button("btn name-btn weather-btn", Z.weather[w], ICON[w]);
      b.addEventListener("click", () => {
        if (locked) return;
        if (w !== t.answer) return void (shake(b), (b.disabled = true), ctx.miss(Z.mostMiss));
        b.classList.add("right");
        win(Z.mostDone(Z.weather[w], ctx.word(t.days[w])));
      });
      row.append(b);
    }
    host.append(scene, row);
    ctx.tell(Z.mostAsk);
    return { hint: () => Z.mostHint };
  }
  const padBox = el("div");
  const p = pad(padBox, ctx, 2, (n) => {
    if (locked) return false;
    if (n !== t.answer) {
      p.clear();
      ctx.miss(t.kind === "diff" ? (n === t.days[t.a] + t.days[t.b] ? Z.diffSum : Z.diffMiss) : Z.countMiss);
      return false;
    }
    p.show(n);
    p.lock(true);
    win(t.kind === "diff" ? Z.diffDone(Z.weather[t.a], Z.weather[t.b], ctx.word(n)) : Z.countDone(Z.weather[t.ask], ctx.word(n), n));
    return true;
  });
  host.append(scene, hintBox, padBox);
  ctx.tell(t.kind === "diff" ? Z.diffAsk(Z.weather[t.a], Z.weather[t.b]) : Z.countAsk(Z.weather[t.ask]));
  return {
    hint() {
      if (!hintBox.firstChild && t.range > 1) {
        const row = el("div", "count-row pop");
        for (const w of Object.keys(t.days)) if (t.kind === "count" ? w === t.ask : w === t.a || w === t.b) row.append(el("span", "chip", `${ICON[w]} ${ctx.num(t.days[w])}`));
        hintBox.append(row);
      }
      return t.kind === "diff" ? Z.diffHint : Z.countHint;
    },
  };
}

// ---------- Prüfen: the owl reads the clock.

export function pruefen(host, t, ctx) {
  const { T } = ctx;
  const Z = T.zeit.pruefen;
  let locked = false;
  const scene = el("div", "scene card owl-scene");
  const talk = el("div", "talk");
  const bubble = el("div", "bubble", clockText(ctx, t.said.h, t.said.m));
  talk.append(el("span", "owl", "🦉"), bubble);
  const c = clock(ctx, t.h, t.m, 160);
  scene.append(talk, c.svg);
  const judge = el("div", "judge");
  const yes = button("btn ok judge-btn", T.pruefen.yes, "✓");
  const no = button("btn go judge-btn", T.pruefen.no, "✗");
  judge.append(yes, no);
  const fixer = timeButtons(ctx, t.choices, (x, b) => {
    if (locked) return;
    if (!isSame(x, t)) return void (shake(b), (b.disabled = true), ctx.miss(Z.fixMiss));
    locked = true;
    b.classList.add("right");
    bubble.textContent = clockText(ctx, t.h, t.m);
    ctx.solved(Z.fixed(clockText(ctx, t.h, t.m)));
  });
  fixer.hidden = true;
  yes.addEventListener("click", () => {
    if (locked) return;
    if (!t.right) return void (shake(yes), ctx.miss(Z.lookAgain));
    locked = true;
    ctx.solved(Z.right(clockText(ctx, t.h, t.m)));
  });
  no.addEventListener("click", () => {
    if (locked) return;
    if (t.right) return void (shake(no), ctx.miss(Z.lookAgain));
    judge.hidden = true;
    fixer.hidden = false;
    bubble.classList.add("wrong");
    ctx.tap();
    ctx.tell(Z.fix);
  });
  host.append(scene, judge, fixer);
  ctx.tell(Z.question(clockText(ctx, t.said.h, t.said.m)));
  return {
    hint() {
      c.minutes();
      return Z.hint;
    },
  };
}

export const BOARDS = { sehen, machen, forschen, anwenden, pruefen };
