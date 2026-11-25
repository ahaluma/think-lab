// A new AnkaPlay game. Start here and replace the "Hallo!" button with your game.
// Texts:     lang/de.js (one file per language)
// Progress:  progress.answer() after every answer, progress.round() after a finished round
import { say, sound, celebrate, icons, pick, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";
import { LEVELS } from "./levels.js";

const ID = "neues-spiel"; // TODO: the folder name, same as in catalog.js
const T = await texts(import.meta.url);

// Levels: see levels.js (easy to hard). The child moves up after each round.
let level = progress.level(ID, LEVELS);

const $ = (id) => document.getElementById(id);

fill(T);
document.title = `${T.title} · AnkaPlay`;
homeButton($("home"));
$("speak").innerHTML = icons.speaker;

$("speak").addEventListener("click", () => say(T.intro));

$("hello").addEventListener("click", () => {
  progress.answer(ID, true);
  level = Math.min(level + 1, LEVELS.length - 1);
  progress.round(ID, level, LEVELS);
  sound.right();
  celebrate();
  say(`${pick(T.praise)} ${T.stars(level + 1)}`);
});
