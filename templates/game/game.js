// A new Think Lab game. Start here and replace the "Hallo!" button with your game.
import { say, sound, celebrate, icons } from "../../shared/kit.js";

const $ = (id) => document.getElementById(id);

$("home").innerHTML = icons.home;
$("speak").innerHTML = icons.speaker;

const prompt = "Drück auf den Knopf!";
$("speak").addEventListener("click", () => say(prompt));

$("hello").addEventListener("click", () => {
  sound.right();
  celebrate();
  say("Hallo! Super gemacht!");
});
