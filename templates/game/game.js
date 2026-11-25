// A new AnkaPlay game. Start here and replace the "Hallo!" button with your game.
// Texts:     lang/de.js (one file per language)
// Progress:  play.answer() after every answer, play.solved() after a task, play.round() after a round
import { say, sound, celebrate, icons, pick, homeButton } from "../../shared/kit.js";
import { texts, fill } from "../../shared/i18n.js";
import * as adapt from "../../shared/adapt.js";
import { LEVELS } from "./levels.js";

const ID = "neues-spiel"; // TODO: the folder name, same as in catalog.js
const T = await texts(import.meta.url);

// Levels: see levels.js (easy to hard). The level follows the child (shared/adapt.js).
const play = adapt.player(ID, LEVELS);
let level = play.level;

const $ = (id) => document.getElementById(id);

fill(T);
document.title = `${T.title} · AnkaPlay`;
homeButton($("home"));
$("speak").innerHTML = icons.speaker;

$("speak").addEventListener("click", () => say(T.intro));

$("hello").addEventListener("click", () => {
  play.answer(true);
  play.solved();
  play.round();
  level = play.level;
  sound.right();
  celebrate();
  say(`${pick(T.praise)} ${T.stars(level + 1)}`);
});
