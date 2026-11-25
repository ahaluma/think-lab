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
  right: (a, b, c) => `घरभित्र ${a}, बाहिर ${b}। जम्मा ${c}।`,
  thinkAgain: (amount) => `फेरि सोच: जम्मा ${amount} छन्।`,
  countNow: "घरभित्र हेर!",
};
