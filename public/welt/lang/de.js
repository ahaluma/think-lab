// Deutsche Texte für die neue Welt (Karte, Runde, die Idee "Teile").
// Zahlwörter und Namen der Dinge stehen in /shared/lang/de.js. a, b, c … = Zahlwörter ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei" -> "Drei"

export default {
  title: "AnkaPlay Welt",
  mapLabel: "Die Welt: such dir einen Ort aus",
  places: { zahlen: "Wiese und Bach", teile: "Bau und Teich", gruppen: "Obstbaum und Nester", regeln: "Wald", raum: "Hügel und See", daten: "Himmel" },
  whereTo: "Wohin möchtest du?",
  asleep: "Hier schläft noch alles. Bald gibt es hier etwas zu entdecken.",
  comeHere: "Komm, hier geht es weiter!",
  pickWay: "Wie möchtest du spielen?",
  allGames: "Alle Spiele",
  save: "Sichern",
  privacy: "Datenschutz",
  ideas: { teile: "Zahlen bestehen aus Zahlen" },
  perspectives: { sehen: "Sehen", machen: "Machen", forschen: "Forschen", anwenden: "Anwenden", pruefen: "Prüfen" },
  states: { new: "neu", played: "gespielt", understood: "verstanden" },
  yourCards: "Deine Denk-Tricks",

  // Die Runde
  toMap: "Zur Karte",
  hint: "Tipp",
  hear: "Vorlesen",
  progress: "Aufgaben",
  surprise: "Überraschung! Jetzt kommt etwas anderes.",
  done: "Geschafft!",
  grew: "Schau, bei deinem Bau blüht eine neue Blume!",
  cardGot: (name) => `Dein Denk-Trick: ${name}.`,
  feelQuestion: "Wie war das für dich?",
  feel: { easy: "leicht", ok: "genau richtig", hard: "schwer" },
  bigger: "Das kannst du gut. Beim nächsten Mal kommen größere Zahlen!",
  smaller: "Beim nächsten Mal nehmen wir kleinere Zahlen.",
  again: "Nochmal",
  other: "Etwas anderes",
  cards: {
    vergleichen: { name: "Vergleichen", text: "Du hast verglichen: alle zusammen und die, die du siehst." },
    ausprobieren: { name: "Ausprobieren", text: "Du hast ausprobiert und mehrere Wege gefunden." },
    vorhersagen: { name: "Vorhersagen", text: "Du hast erst nachgedacht und dann geprüft." },
    rueckwaerts: { name: "Rückwärts denken", text: "Du hast vom Ganzen zurück zum Teil gedacht." },
    nachpruefen: { name: "Nachprüfen", text: "Du hast nachgezählt, statt einfach zu glauben." },
  },
  intro: {
    sehen: "Tiere gehen in den Bau. Wie viele sind drinnen?",
    machen: "Leg alles auf die zwei Blätter. Es gibt viele Wege!",
    forschen: "Der hohle Baum hat ein Geheimnis. Probier aus, was er macht!",
    anwenden: "Schau gut hin, was passiert!",
    pruefen: "Die Eule sagt etwas. Stimmt das? Prüf es nach!",
  },
  together: (a, b, c) => `${big(a)} und ${b} sind zusammen ${c}.`,
  nut: { one: "eine Nuss", many: "Nüsse" },

  // Sehen: der Bau
  sehen: {
    // Die Geschichte in drei Schritten: alle sind da, manche gehen hinein, die Frage.
    all: (total, thing) => `Hier wohnen ${total} ${thing.many}.`,
    hide: "Husch! Manche gehen in den Bau.",
    ask: "Wie viele sind jetzt im Bau?",
    miss: (chosen, outside, sum, total) => `${big(chosen)} und ${outside} sind ${sum}. Es sind aber ${total}.`,
    hint: "Schau: So viele sind es zusammen. Wie viele fehlen noch?",
    denLabel: "Der Bau",
  },

  // Machen: zwei Blätter
  machen: {
    question: (total, thing) => `Leg ${total} ${thing.many} auf die zwei Blätter!`,
    another: "Geht es auch anders? Finde einen neuen Weg!",
    both: "Auf jedes Blatt gehört etwas.",
    had: "Das hattest du schon. Finde einen anderen Weg!",
    done: (a, b, c, d, total) => `${big(a)} und ${b}, oder ${c} und ${d}. Beides sind ${total}!`,
    hint: "Tipp auf ein Blatt, dann hüpft etwas hinüber.",
    hintMove: "Nimm eins von einem Blatt und leg es auf das andere.",
    leaf: "Blatt",
    basket: "Korb",
    check: "Fertig",
  },

  // Forschen: der hohle Baum
  forschen: {
    question: "Wie viele Nüsse steckst du in den Baum?",
    out: (x, y) => `${big(x)} hinein, ${y} heraus.`,
    more: "Probier noch eine andere Zahl!",
    know: "Ich weiß es!",
    ready: "Weißt du, was der Baum macht? Du kannst weiter probieren oder auf die Glühbirne tippen.",
    predict: (x) => `Erst denken, dann prüfen: Du steckst ${x} hinein. Wie viele kommen heraus?`,
    predictMiss: (x, y) => `Schau: Aus ${x} werden ${y}.`,
    rule: (x, y, total) => `Der Baum macht immer ${total} voll: ${big(x)} und ${y} sind ${total}.`,
    hint: "Zähl bei jedem Paar beide Zahlen zusammen.",
    tried: "Das hast du ausprobiert",
  },

  // Anwenden: kleine Szenen
  anwenden: {
    frogs: (total, n, known) =>
      [`${big(total)} Frösche sitzen im Schilf.`, `${n === 1 ? "Einer hüpft" : big(known) + " hüpfen"} auf das große Blatt.`, "Wie viele sind noch im Schilf?"],
    eggs: (total, n, known) =>
      [`Im Nest liegen ${total} Eier.`, `${n === 1 ? "Ein Küken schlüpft" : big(known) + " Küken schlüpfen"}.`, "Wie viele Eier sind noch zu?"],
    apples: (total, n, known) =>
      [`Am Baum hängen ${total} Äpfel.`, `${n === 1 ? "Einer fällt" : big(known) + " fallen"} ins Gras.`, "Wie viele hängen noch am Baum?"],
    hint: "Schau: So viele sind es zusammen. Wie viele fehlen noch?",
  },

  // Prüfen: die Eule
  pruefen: {
    question: (a, b, said) => `Die Eule sagt: ${big(a)} und ${b} sind ${said}. Stimmt das?`,
    yes: "Stimmt",
    no: "Stimmt nicht",
    countAgain: "Zähl nochmal genau nach!",
    fix: "Gut aufgepasst! Mach es richtig: Wie viele sind es zusammen?",
    fixMiss: "Noch nicht. Zähl alle zusammen!",
    right: (a, b, c) => `Ja! ${big(a)} und ${b} sind ${c}.`,
    fixed: (a, b, c) => `Jetzt stimmt es: ${big(a)} und ${b} sind ${c}.`,
    hint: "Zähl beide Gruppen zusammen.",
    less: "Eins weniger",
    more: "Eins mehr",
    check: "Fertig",
  },

  // Sichern (für Eltern)
  backup: {
    title: "Fortschritt sichern",
    note: "Alles bleibt auf diesem Gerät. Hier können Sie den Fortschritt als Datei speichern und auf einem anderen Gerät wieder laden. Die App verschickt nichts.",
    save: "Als Datei speichern",
    load: "Aus Datei laden",
    saved: "Die Datei wurde gespeichert.",
    loaded: "Der Fortschritt wurde geladen.",
    bad: "Diese Datei passt nicht. Bitte wählen Sie eine Datei, die mit AnkaPlay gespeichert wurde.",
    confirm: "Der Fortschritt auf diesem Gerät wird durch die Datei ersetzt. Fortfahren?",
    keep: "Speicher behalten",
    keepNote: "Der Browser darf Daten löschen, wenn die Seite lange nicht geöffnet wird. Fügen Sie AnkaPlay zum Home-Bildschirm hinzu, dann bleibt der Fortschritt erhalten.",
    kept: "Der Browser behält den Speicher dauerhaft.",
    notKept: "Der Browser hat das nicht zugesagt. Sichern Sie ab und zu als Datei.",
  },
};
