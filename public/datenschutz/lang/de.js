// Datenschutzerklärung (deutsch). Diese Fassung ist die maßgebliche.
// c = CONTACT from ../contact.js
export default {
  title: "Datenschutz",
  updated: (date) => `Stand: ${date}`,
  sections: (c) => [
    {
      h: "Das Wichtigste in Kürze",
      list: [
        "AnkaPlay ist kostenlos und braucht kein Konto, keinen Namen und keine E-Mail-Adresse.",
        "Keine Werbung, keine Analyse- oder Tracking-Werkzeuge, keine Cookies.",
        "Keine fremden Dienste: Alle Dateien (Seiten, Bilder, Schriften, Programmcode) kommen von dieser Website selbst. Es werden keine Schriften, Bibliotheken oder Inhalte von anderen Servern geladen.",
        "Der Spielfortschritt bleibt nur auf Ihrem Gerät und wird nie an uns geschickt.",
      ],
    },
    // Shown only when contact.js has at least one detail.
    (c.name || c.address || c.email || c.phone) && {
      h: "Verantwortlicher",
      p: [
        "Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:",
        [c.name, c.address, c.email && `E-Mail: ${c.email}`, c.phone && `Telefon: ${c.phone}`].filter(Boolean).join(", "),
      ],
    },
    {
      h: "Hosting bei Cloudflare",
      p: [
        "Die Website wird von Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA, ausgeliefert. Beim Aufruf einer Seite verarbeitet Cloudflare technisch notwendige Daten, die jeder Browser automatisch sendet: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Browser- und Gerätetyp (User-Agent). Diese Daten werden benötigt, um die Seiten auszuliefern und die Website vor Angriffen zu schützen.",
        "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse ist ein sicherer und funktionierender Betrieb der Website.",
        "Wir selbst speichern keine Server-Protokolle und haben keine Analyse-Funktionen von Cloudflare eingeschaltet. Cloudflare kann Daten in den USA verarbeiten. Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert. Mit Cloudflare besteht ein Vertrag zur Auftragsverarbeitung (Data Processing Addendum) mit Standardvertragsklauseln der EU-Kommission. Weitere Informationen: Datenschutzerklärung von Cloudflare unter cloudflare.com/privacypolicy.",
      ],
    },
    {
      h: "Speicherung auf Ihrem Gerät",
      p: [
        "Damit Ihr Kind beim nächsten Mal auf der richtigen Stufe weiterspielt, speichert AnkaPlay im Speicher des Browsers (localStorage) auf Ihrem Gerät: die gewählte Sprache, die von Ihnen angelegten Kinder (Vorname oder Spitzname, Alter, gewähltes Tier), und für jedes Kind getrennt die erreichte Stufe pro Spiel, die Anzahl richtiger und falscher Antworten, gespielte Runden pro Tag und das Datum des letzten Spiels.",
        "Diese Daten verlassen Ihr Gerät nicht. Wir können sie nicht sehen. Es sind keine Cookies und sie enthalten keine Namen oder andere Angaben zur Person.",
        "Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG, weil die Speicherung für die von Ihnen gewünschte Funktion (Weiterspielen, Fortschrittsbericht) unbedingt erforderlich ist.",
        "Löschen: Auf der Elternseite (Knopf „Eltern“ auf der Startseite) mit „Fortschritt löschen“ oder ein Kind mit „Löschen“, oder indem Sie in den Browser-Einstellungen die Website-Daten löschen.",
      ],
    },
    {
      h: "Vorlesen und Töne",
      p: [
        "Die Spiele lesen Texte mit der Sprachausgabe vor, die in Ihrem Browser bzw. Betriebssystem eingebaut ist (Web Speech API). Wir übertragen dafür nichts an unseren Server. Je nach Gerät und Einstellungen kann der Anbieter Ihres Betriebssystems oder Browsers (z. B. Google oder Apple) Online-Stimmen verwenden. Darauf haben wir keinen Einfluss. AnkaPlay wählt, wenn vorhanden, eine Stimme, die auf dem Gerät selbst arbeitet. Die Töne werden direkt im Browser erzeugt.",
      ],
    },
    {
      h: "Kinder",
      p: [
        "AnkaPlay ist für Kinder gemacht und deshalb bewusst sparsam: keine Registrierung, keine Eingabe von Namen, Fotos oder anderen persönlichen Daten, keine Werbung, keine Käufe, kein Chat, keine Links zu sozialen Netzwerken. Wir erheben keine personenbezogenen Daten von Kindern. Wir empfehlen, dass Eltern ihre Kinder beim Spielen begleiten.",
      ],
    },
    {
      h: "Ihre Rechte",
      p: [
        "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Wenden Sie sich dafür an den Betreiber dieser Website. Da der Spielfortschritt nur auf Ihrem Gerät liegt, können Sie ihn jederzeit selbst einsehen und löschen.",
        "Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim Hamburgischen Beauftragten für Datenschutz und Informationsfreiheit (datenschutz-hamburg.de).",
      ],
    },
    {
      h: "Änderungen",
      p: [
        "Wenn sich AnkaPlay ändert, passen wir diese Erklärung an. Es gilt die jeweils hier veröffentlichte Fassung.",
      ],
    },
  ],
};
