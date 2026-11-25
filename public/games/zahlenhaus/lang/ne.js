// Nepali texts for "Zahlenhaus" (अङ्क घर). Names of the animals are in /shared/lang/ne.js.
// amount = spoken amount like "पाँचवटा खरायो"; a, b, c = number words ("तीन").
export default {
  title: "अङ्क घर",
  intro: "अङ्क घर! सुरु गर्न थिच!",
  first: (thing) => `कतिवटा ${thing.many} छन्?`,
  firstRight: (amount) => `${amount} छन्।`,
  countAgain: "फेरि गन त!",
  goIn: "सुटुक्क, केही घरभित्र गए!",
  question: (thing) => `घरभित्र कतिवटा ${thing.many} छन्?`,
  insideRight: (a) => `घरभित्र ${a}।`,
  outsideQuestion: (thing) => `बाहिर अझै कतिवटा ${thing.many} छन्?`,
  hiddenQuestion: (thing) => `घरभित्र कतिवटा ${thing.many} लुकेका छन्?`,
  together: (a, b, c) => `${a} र ${b} गर्दा जम्मा ${c}।`,
  thinkAgain: (amount) => `फेरि सोच: जम्मा ${amount} छन्।`,
  countNow: "घरभित्र हेर!",
};
