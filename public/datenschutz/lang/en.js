// Privacy policy (English translation). The German version is the binding one.
// c = CONTACT from ../contact.js
export default {
  title: "Privacy",
  updated: (date) => `Last updated: ${date}`,
  note: "This is a translation. The German version is the binding one.",
  sections: (c) => [
    {
      h: "In short",
      list: [
        "AnkaPlay is free and needs no account, no name and no e-mail address.",
        "No advertising, no analytics or tracking tools, no cookies.",
        "No third-party services: all files (pages, images, fonts, program code) come from this website itself. No fonts, libraries or content are loaded from other servers.",
        "Game progress stays on your device only and is never sent to us.",
      ],
    },
    {
      h: "1. Controller",
      p: [
        "The controller responsible for data processing on this website under the General Data Protection Regulation (GDPR) is:",
        `${c.name}, ${c.address}, e-mail: ${c.email}`,
      ],
    },
    {
      h: "2. Hosting by Cloudflare",
      p: [
        "The website is delivered by Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA. When a page is opened, Cloudflare processes technically necessary data that every browser sends automatically: IP address, date and time, the address requested, browser and device type (user agent). This data is needed to deliver the pages and to protect the website against attacks.",
        "The legal basis is Art. 6(1)(f) GDPR. Our legitimate interest is a secure and working website.",
        "We do not store any server logs ourselves and have not switched on any Cloudflare analytics. Cloudflare may process data in the USA. Cloudflare is certified under the EU-US Data Privacy Framework. A data processing agreement (Data Processing Addendum) with the EU Commission's standard contractual clauses is in place with Cloudflare. More information: Cloudflare's privacy policy at cloudflare.com/privacypolicy.",
      ],
    },
    {
      h: "3. Storage on your device",
      p: [
        "So that your child continues at the right level next time, AnkaPlay stores in the browser's storage (localStorage) on your device: the chosen language, the level reached in each game, the number of right and wrong answers, rounds played per day and the date last played.",
        "This data never leaves your device. We cannot see it. These are not cookies and they contain no names or other personal details.",
        "The legal basis is Section 25(2) no. 2 TDDDG (German Telecommunications Digital Services Data Protection Act), because the storage is strictly necessary for the function you asked for (continuing the game, progress report).",
        "To delete it: on the parents' page (chart button on the start page) tap “Delete progress”, or delete the website data in your browser settings.",
      ],
    },
    {
      h: "4. Reading aloud and sounds",
      p: [
        "The games read text aloud with the speech output built into your browser or operating system (Web Speech API). Nothing is sent to our server for this. Depending on your device and settings, the provider of your operating system or browser (e.g. Google or Apple) may use online voices. We have no influence on this. Where available, AnkaPlay chooses a voice that works on the device itself. Sounds are generated directly in the browser.",
      ],
    },
    {
      h: "5. Children",
      p: [
        "AnkaPlay is made for children and is therefore deliberately minimal: no registration, no entering of names, photos or other personal data, no advertising, no purchases, no chat, no links to social networks. We do not collect personal data from children. We recommend that parents accompany their children while playing.",
      ],
    },
    {
      h: "6. Your rights",
      p: [
        "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on legitimate interests (Art. 21). Please contact the e-mail address above. As game progress is only on your device, you can view and delete it yourself at any time.",
        "You can also complain to a data protection supervisory authority, for example the Hamburg Commissioner for Data Protection and Freedom of Information (datenschutz-hamburg.de).",
      ],
    },
    {
      h: "7. Changes",
      p: ["If AnkaPlay changes, we will update this policy. The version published here applies."],
    },
  ],
};
