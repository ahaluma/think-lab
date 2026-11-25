// Nepali texts for "Wer kommt dazu?" (को आयो?). Names of the animals are in /shared/lang/ne.js.
// amount = spoken amount like "तीनवटा खरायो" / "एउटा खरायो", n = how many.
export default {
  title: "को आयो?",
  intro: "को आयो? सुरु गर्न थिच!",
  here: (n, amount) => (n === 1 ? `यहाँ ${amount} छ।` : `यहाँ ${amount} छन्।`),
  hide: "सुटुक्क, झाडीपछाडि!",
  come: (n, amount) => (n === 1 ? `${amount} आयो!` : `${amount} आए!`),
  go: (n, amount) => (n === 1 ? `${amount} भाग्यो!` : `${amount} भागे!`),
  question: (thing) => `अब कतिवटा ${thing.many} छन्?`,
  right: (n, amount) => (n === 1 ? `अब ${amount} छ।` : `अब ${amount} छन्।`),
  thinkAgain: "फेरि सोच!",
  countNow: "गनेर हेर!",
};
