// Nepali texts for "Wie viele?" (कतिवटा?).
// Nepali counts with "-वटा": "तीनवटा हात्ती" (three elephants). The noun does not change.

export default {
  title: "कतिवटा?",
  trayLabel: "चीजहरू गन",
  intro: "कतिवटा? सुरु गर्न थिच!",
  question: (thing) => `कतिवटा ${thing.many} देख्छौ?`,
  // n = how many, word = the number word ("तीन")
  amount: (n, thing, word) => (n === 1 ? thing.one : `${word}वटा ${thing.many}`),
  right: (amount) => `स्याबास! ${amount}।`,
  countAgain: "फेरि गन त!",

  // Names of the things to count. The keys match THINGS in game.js.
  things: {
    apple: { many: "स्याउ", one: "एउटा स्याउ" },
    fish: { many: "माछा", one: "एउटा माछा" },
    ship: { many: "पानीजहाज", one: "एउटा पानीजहाज" },
    ladybird: { many: "रातो कीरा", one: "एउटा रातो कीरा" },
    flower: { many: "फूल", one: "एउटा फूल" },
    duck: { many: "हाँस", one: "एउटा हाँस" },
    star: { many: "तारा", one: "एउटा तारा" },
    balloon: { many: "बेलुन", one: "एउटा बेलुन" },
    snail: { many: "शंखेकीरा", one: "एउटा शंखेकीरा" },
    strawberry: { many: "स्ट्रबेरी", one: "एउटा स्ट्रबेरी" },
    elephant: { many: "हात्ती", one: "एउटा हात्ती" },
    rhino: { many: "गैँडा", one: "एउटा गैँडा" },
    unicorn: { many: "एकसिङ्गे घोडा", one: "एउटा एकसिङ्गे घोडा" },
    giraffe: { many: "जिराफ", one: "एउटा जिराफ" },
    lion: { many: "सिंह", one: "एउटा सिंह" },
    dinosaur: { many: "डाइनोसर", one: "एउटा डाइनोसर" },
    turtle: { many: "कछुवा", one: "एउटा कछुवा" },
    penguin: { many: "पेंगुइन", one: "एउटा पेंगुइन" },
    octopus: { many: "अक्टोपस", one: "एउटा अक्टोपस" },
    butterfly: { many: "पुतली", one: "एउटा पुतली" },
    frog: { many: "भ्यागुतो", one: "एउटा भ्यागुतो" },
    owl: { many: "लाटोकोसेरो", one: "एउटा लाटोकोसेरो" },
    crab: { many: "गँगटो", one: "एउटा गँगटो" },
    car: { many: "कार", one: "एउटा कार" },
    banana: { many: "केरा", one: "एउटा केरा" },
    carrot: { many: "गाजर", one: "एउटा गाजर" },
  },
};
