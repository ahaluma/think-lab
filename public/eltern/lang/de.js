// Deutsche Texte für die Elternseite.
export default {
  title: "Fortschritt",
  note: "Wird nur auf diesem Gerät gespeichert. Nichts wird verschickt.",
  last14: "Letzte 14 Tage",
  legendRight: "richtig",
  legendWrong: "falsch",
  today: (right, wrong, rounds) =>
    `Heute: ${right + wrong} ${right + wrong === 1 ? "Antwort" : "Antworten"}, davon ${right} richtig · ` +
    `${rounds} ${rounds === 1 ? "Runde" : "Runden"}`,
  notPlayed: "Noch nicht gespielt",
  level: (n, of) => `Stufe ${n} von ${of}`,
  stats: (rounds, percent, date) =>
    `${rounds} ${rounds === 1 ? "Runde" : "Runden"} · ${percent} % richtig · zuletzt ${date}`,
  reset: "Fortschritt löschen",
  resetConfirm: "Den ganzen Fortschritt auf diesem Gerät löschen?",
  weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
};
