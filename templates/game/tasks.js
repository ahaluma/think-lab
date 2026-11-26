// The tasks of this game: one function makes one task as plain data (see shared/gen.js).
// In game.js:  const nextTask = gen.generator(task, { avoid: { answer: 1 } });  const t = nextTask(LEVELS[play.level]);

export function task(level, r) {
  const answer = r.int(1, level.max ?? 5); // TODO: use the level's parameters from levels.js
  return { answer };
}

/** Problems with a task (empty list = fine), for: node tools/check-tasks.mjs */
export function check(t, level) {
  return t.answer >= 1 ? [] : ["answer below 1"];
}
