// Nepali texts for "Plus" (जोड). Names of the animals are in /shared/lang/ne.js.
export default {
  title: "जोड",
  intro: "जोड! जम्मा कति हुन्छ? सुरु गर्न थिच!",
  question: (a, b) => `${a} जोड ${b} कति हुन्छ?`,
  together: (a, b, c) => `${a} र ${b} मिलेर ${c} हुन्छ।`,
  countOn: (a, next) => `${a} … ${next.join(", ")}!`,
  bridge: (a, toTen, rest, c) => `${a} र ${toTen} मिलेर दस, अनि ${rest} थप्दा ${c} हुन्छ।`,
  countAll: "सबैलाई सँगै गन!",
  startAt: (a) => `झाडीपछाडि ${a} वटा छन्। ${a} बाट सुरु गरेर अघि गन!`,
  picturesHelp: "हेर, चित्रले मद्दत गर्छ!",
  fillTen: "पहिला दस पुर्‍याऊ!",
};
