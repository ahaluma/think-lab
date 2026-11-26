// Deutsche Texte für die neue Welt (Karte, Runde, die Idee "Teile").
// Zahlwörter und Namen der Dinge stehen in /shared/lang/de.js. a, b, c … = Zahlwörter ("drei").
const big = (text) => text[0].toUpperCase() + text.slice(1); // "drei" -> "Drei"

export default {
  title: "AnkaPlay Welt",
  mapLabel: "Die Welt: such dir einen Ort aus",
  places: { zahlen: "Wiese und Bach", teile: "Bau und Teich", gruppen: "Obstbaum und Nester", regeln: "Wald", raum: "Hügel und See", daten: "Himmel" },
  whereTo: "Wohin möchtest du?",
  asleep: "Hier schläft noch alles.",
  comeHere: "Komm, hier geht es weiter!",
  pickWay: "Wie möchtest du spielen?",
  allGames: "Alle Spiele",
  save: "Sichern",
  privacy: "Datenschutz",
  ideas: { zahl: "Eine Zahl sagt, wie viele", teile: "Zahlen bestehen aus Zahlen" },
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
  grew: "Schau! In der Welt wächst eine neue Blume.",
  cardGot: (name) => `Dein Denk-Trick: ${name}.`,
  feelQuestion: "Wie war das für dich?",
  feel: { easy: "leicht", ok: "genau richtig", hard: "schwer" },
  bigger: "Das kannst du gut! Bald kommen größere Zahlen.",
  smaller: "Bald nehmen wir kleinere Zahlen.",
  again: "Nochmal",
  other: "Etwas anderes",
  cards: {
    vergleichen: { name: "Genau hinschauen", text: "Du hast genau hingeschaut und gezählt." },
    ausprobieren: { name: "Ausprobieren", text: "Du hast es ausprobiert. Es gibt viele Wege." },
    vorhersagen: { name: "Erst denken", text: "Du hast erst gedacht und dann geschaut." },
    rueckwaerts: { name: "Was fehlt?", text: "Du hast gefunden, was fehlt." },
    nachpruefen: { name: "Nachzählen", text: "Du hast selbst nachgezählt." },
  },
  intro: {
    sehen: "Tiere gehen in den Bau. Wie viele sind drinnen?",
    machen: "Leg alles auf die zwei Blätter. Es gibt viele Wege!",
    forschen: "Der Baum hat ein Geheimnis. Was macht er?",
    anwenden: "Schau gut hin, was passiert!",
    pruefen: "Die Eule sagt etwas. Stimmt das?",
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
    hint: "Schau: So viele sind es zusammen. Wie viele fehlen?",
    denLabel: "Der Bau",
  },

  // Machen: zwei Blätter
  machen: {
    question: (total, thing) => `Leg ${total} ${thing.many} auf die zwei Blätter!`,
    another: "Geht es auch anders?",
    both: "Leg auf jedes Blatt etwas.",
    had: "Das hattest du schon. Mach es anders!",
    done: (a, b, c, d, total) => `${big(a)} und ${b}, oder ${c} und ${d}. Beides sind ${total}!`,
    hint: "Zieh es mit dem Finger auf ein Blatt.",
    hintMove: "Nimm eins weg. Leg es auf das andere Blatt.",
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
    ready: "Weißt du, was der Baum macht? Dann tipp auf die Lampe.",
    predict: (x) => `Erst denken: Du steckst ${x} hinein. Wie viele kommen heraus?`,
    predictMiss: (x, y) => `Schau: Aus ${x} werden ${y}.`,
    rule: (x, y, total) => `Zusammen sind es immer ${total}: ${big(x)} und ${y} sind ${total}.`,
    hint: "Zähl beide Zahlen zusammen.",
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
    hint: "Schau: So viele sind es zusammen. Wie viele fehlen?",
  },

  // Prüfen: die Eule
  pruefen: {
    question: (a, b, said) => `Die Eule sagt: ${big(a)} und ${b} sind ${said}. Stimmt das?`,
    yes: "Stimmt",
    no: "Stimmt nicht",
    countAgain: "Zähl nochmal nach!",
    fix: "Gut aufgepasst! Wie viele sind es zusammen?",
    fixMiss: "Noch nicht. Zähl alle zusammen!",
    right: (a, b, c) => `Ja! ${big(a)} und ${b} sind ${c}.`,
    fixed: (a, b, c) => `Jetzt stimmt es: ${big(a)} und ${b} sind ${c}.`,
    hint: "Zähl beide Gruppen zusammen.",
  },
  // ---------- Idee "Zahl": Eine Zahl sagt, wie viele (die Wiese)
  zahl: {
    intro: {
      sehen: "Schau genau! Wie viele Blumen sind es?",
      machen: "Pflück Blumen in den Korb.",
      forschen: "Der Frosch hüpft über die Steine. Ein Stein fehlt.",
      anwenden: "Wo sind mehr?",
      pruefen: "Die Eule zählt. Stimmt das?",
    },
    sehen: {
      look: "Schau genau!",
      ask: "Wie viele Blumen sind es?",
      askSeen: "Wie viele Blumen waren es?",
      right: (n) => `Es sind ${n}.`,
      miss: "Schau noch einmal!",
      hint: "Zähl in Ruhe. Die Blumen bleiben da.",
    },
    machen: {
      question: (n, count) => (count === 1 ? "Pflück eine Blume in den Korb!" : `Pflück ${n} Blumen in den Korb!`),
      none: "Der Korb ist noch leer. Tipp auf eine Blume!",
      miss: (have, n) => `Im Korb sind ${have}. Du brauchst ${n}.`,
      done: (n) => `Im Korb sind ${n}. Genau richtig!`,
      hint: "Tipp auf eine Blume. Sie hüpft in den Korb.",
      flower: "Blume",
      field: "Wiese",
      basket: "Korb",
      check: "Fertig",
    },
    forschen: {
      question: "Welche Zahl fehlt?",
      miss: (before, chosen) => `Nach ${before} kommt nicht ${chosen}.`,
      done: (before, n) => `Nach ${before} kommt ${n}.`,
      hint: "Zähl die Punkte. Es ist immer einer mehr.",
      stones: "Steine im Bach",
    },
    anwenden: {
      more: "Wo sind mehr? Tipp darauf!",
      fewer: "Wo sind weniger? Tipp darauf!",
      miss: "Zähl beide Seiten.",
      doneMore: (a, b) => `${big(a)} sind mehr als ${b}.`,
      doneFewer: (a, b) => `${big(a)} sind weniger als ${b}.`,
      hint: "Schau auf die Zahlen.",
      left: "Links",
      right: "Rechts",
    },
    pruefen: {
      question: (said, count, thing) => `Die Eule sagt: ${count === 1 ? "Das ist " + thing.one : "Das sind " + said + " " + thing.many}. Stimmt das?`,
      fix: "Gut aufgepasst! Wie viele sind es?",
      fixMiss: "Noch nicht. Zähl nochmal!",
      right: (n) => `Ja! Es sind ${n}.`,
      fixed: (n) => `Jetzt stimmt es: Es sind ${n}.`,
      hint: "Zähl mit: eins, zwei, drei …",
    },
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
