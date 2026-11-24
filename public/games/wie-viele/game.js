// "Wie viele?" – a counting game for about 4 to 6 years.
// The child sees some things, can tap each one to count out loud, then taps the right number.
// It starts with 1 to 3 things and allows one more after every 5 stars (up to 10).

import { say, sound, celebrate, shuffle, randInt, store, icons, NUMBER_WORDS } from "../../shared/kit.js";

const STARS_PER_GAME = 5;
const START_MAX = 3;
const TOP_MAX = 10;
const SLOTS = 12; // 4 x 3 places in the tray

// Things to count. "many" is the plural, "one" is how to say a single one.
const THINGS = [
  { icon: "🍎", many: "Äpfel", one: "ein Apfel" },
  { icon: "🐟", many: "Fische", one: "ein Fisch" },
  { icon: "🚢", many: "Schiffe", one: "ein Schiff" },
  { icon: "🐞", many: "Marienkäfer", one: "ein Marienkäfer" },
  { icon: "🌼", many: "Blumen", one: "eine Blume" },
  { icon: "🦆", many: "Enten", one: "eine Ente" },
  { icon: "⭐", many: "Sterne", one: "ein Stern" },
  { icon: "🎈", many: "Luftballons", one: "ein Luftballon" },
  { icon: "🐌", many: "Schnecken", one: "eine Schnecke" },
  { icon: "🍓", many: "Erdbeeren", one: "eine Erdbeere" },
];

const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), round: $("round"), done: $("done") };

let max = store.get("wie-viele:max", START_MAX);
let stars = 0;
let answer = 0;
let thing = null;
let lastThing = null;
let tapped = 0;
let locked = false;

// ---------- Screens

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
}

function drawStars() {
  $("stars").innerHTML = "";
  for (let i = 0; i < STARS_PER_GAME; i++) {
    const li = document.createElement("li");
    li.textContent = "⭐";
    if (i < stars) li.className = "on";
    $("stars").append(li);
  }
}

// ---------- One round

function question() {
  return `Wie viele ${thing.many} siehst du?`;
}

function amount(n) {
  return n === 1 ? thing.one : `${NUMBER_WORDS[n]} ${thing.many}`;
}

function newRound() {
  locked = false;
  tapped = 0;
  answer = randInt(1, max);
  thing = shuffle(THINGS.filter((t) => t !== lastThing))[0];
  lastThing = thing;

  // Put the things in random places of the tray.
  const places = new Set(shuffle([...Array(SLOTS).keys()]).slice(0, answer));
  const tray = $("tray");
  tray.innerHTML = "";
  for (let i = 0; i < SLOTS; i++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (places.has(i)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thing pop";
      b.style.animationDelay = i * 0.04 + "s";
      b.textContent = thing.icon;
      b.setAttribute("aria-label", thing.one);
      b.addEventListener("click", () => countThing(b));
      slot.append(b);
    }
    tray.append(slot);
  }

  // Three choices: the right one and two others, smallest first.
  const choices = new Set([answer]);
  const top = Math.max(max, 3);
  while (choices.size < 3) {
    const near = answer + randInt(-2, 2);
    const n = near >= 1 && near <= top ? near : randInt(1, top);
    choices.add(n);
  }
  const answers = $("answers");
  answers.innerHTML = "";
  for (const n of [...choices].sort((a, b) => a - b)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn answer";
    b.setAttribute("aria-label", NUMBER_WORDS[n]);
    b.innerHTML = `<span class="num">${n}</span><span class="dots">${"<i></i>".repeat(n)}</span>`;
    b.addEventListener("click", () => choose(b, n));
    answers.append(b);
  }

  show("round");
  say(question());
}

// Tapping a thing counts it out loud: "eins", "zwei", ...
function countThing(b) {
  if (locked || b.classList.contains("counted")) return;
  tapped++;
  b.classList.add("counted");
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = tapped;
  b.append(badge);
  sound.tap();
  say(NUMBER_WORDS[tapped]);
}

function choose(b, n) {
  if (locked) return;

  if (n !== answer) {
    sound.wrong();
    say("Hmm, zähl nochmal!");
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
    b.disabled = true;
    return;
  }

  locked = true;
  b.classList.add("right", "bounce");
  sound.right();
  stars++;
  drawStars();
  say(`Super! ${amount(answer)}.`);

  setTimeout(stars >= STARS_PER_GAME ? finish : newRound, 1800);
}

function finish() {
  max = Math.min(max + 1, TOP_MAX);
  store.set("wie-viele:max", max);
  show("done");
  sound.win();
  celebrate();
  say("Toll gemacht! Fünf Sterne!");
}

function startGame() {
  stars = 0;
  drawStars();
  newRound();
}

// ---------- Wire up buttons

$("home").innerHTML = icons.home;
$("speak").innerHTML = icons.speaker;
$("play").innerHTML = icons.play;
$("again").innerHTML = icons.again;

$("play").addEventListener("click", startGame);
$("again").addEventListener("click", startGame);
$("speak").addEventListener("click", () => {
  if (!screens.round.hidden) say(question());
  else if (!screens.done.hidden) say("Nochmal spielen?");
  else say("Wie viele? Drück auf Start!");
});

drawStars();
show("start");
