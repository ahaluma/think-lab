// A new Think Lab game. Start here and replace the "Hallo!" button with your game.
// Texts:     lang/de.js (one file per language)
// Progress:  progress.answer() after every answer, progress.round() after a finished round
import { say, sound, celebrate, icons, pick } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as progress from "../../shared/progress.js";

const ID = "neues-spiel"; // TODO: the folder name, same as in catalog.js
const T = await texts(import.meta.url);

// Levels = the parameters of this game, from easy to hard. The child moves up after each round.
const LEVELS = [{ max: 3 }, { max: 5 }, { max: 10 }];
let level = Math.min(progress.level(ID), LEVELS.length - 1);

const $ = (id) => document.getElementById(id);

fill(T);
document.title = `${T.title} · Think Lab`;
$("home").innerHTML = icons.home;
$("speak").innerHTML = icons.speaker;

$("speak").addEventListener("click", () => say(T.intro));

$("hello").addEventListener("click", () => {
  progress.answer(ID, true);
  level = Math.min(level + 1, LEVELS.length - 1);
  progress.round(ID, level, LEVELS.length);
  sound.right();
  celebrate();
  say(`${pick(T.praise)} ${T.stars(level + 1)}`);
});
