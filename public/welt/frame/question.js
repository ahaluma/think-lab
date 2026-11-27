// The whole question in sight, and no tapping while it is read aloud. Used by every round of the
// worlds (welt/spiel/ for the nature world and the town, welt/markt/stand/ for the market).
//
// What a board says before the child first touches something to tap is the question: the story and
// the ask. It goes into a box at the top that stays until the next task (the caption under it only
// carries what comes later: a miss, a hint, praise). Before, every new sentence replaced the last one
// in the caption, so the first part of a question was gone right away.
//
// While the voice reads a part of the question, the board takes no taps (body.listening, welt.css).
// A phone whose voice never says "end" or fails cannot lock a child out: say() gives up after the time
// the sentence could take, and the lock here ends after LONGEST at the latest.
//
//   const q = questionBox($("question"), $("board"));
//   q.reset()                  a new task: the box empties, the next sentences are the question again
//   q.hide()                   start and done screens
//   q.asking                   is the board still asking (no touch yet)?
//   q.stop()                   the question is over (an answer, the 💡): what follows goes to the caption
//   q.take(shown, spoken)      a part of the question: shown in the box ("" = the board shows it itself,
//                              Denk-Berg and the market square); spoken = the promise of the voice, or
//                              null when nothing is read aloud
//   q.text                     the whole question, for the 🔊 button

/** Never lock the board longer than this for one sentence. */
const LONGEST = 10000;

export function questionBox(box, board) {
  let asking = false;
  let parts = [];
  let task = 0; // a sentence of an old task must not unlock or lock the new one
  let open = 0; // sentences still being read

  const lock = (on) => document.body.classList.toggle("listening", on);
  const draw = () => {
    box.textContent = parts.join(" ");
    box.hidden = !parts.length;
  };

  // The first touch on something to tap ends the question: what the board says after it answers the
  // child (and belongs in the caption). A touch on the picture or the free space does not count.
  board.addEventListener(
    "pointerdown",
    (e) => {
      const c = e.target instanceof Element ? getComputedStyle(e.target).cursor : "";
      if (c === "pointer" || c === "grab") asking = false;
    },
    true,
  );

  return {
    get asking() {
      return asking;
    },
    get text() {
      return parts.join(" ");
    },
    reset() {
      task++;
      asking = true;
      parts = [];
      open = 0;
      lock(false);
      draw();
    },
    stop() {
      asking = false;
    },
    hide() {
      task++;
      asking = false;
      parts = [];
      open = 0;
      lock(false);
      draw();
    },
    take(shown, spoken) {
      if (shown) {
        parts.push(shown);
        draw();
      }
      if (!spoken) return;
      const mine = task;
      open++;
      lock(true);
      const free = () => {
        if (mine !== task) return;
        open = Math.max(0, open - 1);
        if (!open) lock(false);
      };
      Promise.race([spoken, new Promise((resolve) => setTimeout(resolve, LONGEST))]).then(free, free);
    },
  };
}
