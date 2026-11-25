// Nepali texts for "Wie viele?" (कतिवटा?).
// Nepali counts with "-वटा": "तीनवटा हात्ती" (three elephants). The noun does not change.

export default {
  title: "कतिवटा?",
  trayLabel: "चीजहरू गन",
  intro: "कतिवटा? सुरु गर्न थिच!",
  question: (thing) => `कतिवटा ${thing.many} देख्छौ?`,
  right: (amount) => `${amount}।`,
  countAgain: "फेरि गन त!",
};
