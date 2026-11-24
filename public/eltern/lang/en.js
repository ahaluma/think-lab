// English texts for the parents' page.
export default {
  title: "Progress",
  note: "Saved only on this device. Nothing is sent anywhere.",
  last14: "Last 14 days",
  legendRight: "right",
  legendWrong: "wrong",
  today: (right, wrong, rounds) =>
    `Today: ${right + wrong} ${right + wrong === 1 ? "answer" : "answers"}, ${right} right · ` +
    `${rounds} ${rounds === 1 ? "round" : "rounds"}`,
  notPlayed: "Not played yet",
  level: (n, of) => `Level ${n} of ${of}`,
  stats: (rounds, percent, date) =>
    `${rounds} ${rounds === 1 ? "round" : "rounds"} · ${percent} % right · last played ${date}`,
  reset: "Delete progress",
  resetConfirm: "Delete all progress on this device?",
  weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};
