// Nepali texts for "Zahlenzug" (अङ्क रेल). Number words are in /shared/lang/ne.js.
export default {
  title: "अङ्क रेल",
  intro: "अङ्क रेल! डिब्बाहरूलाई अङ्क मिलाउन मद्दत गर। सुरु गर्न थिच!",
  missing: "कुन अङ्क छुटेको छ?",
  after: (word) => `${word} पछि कुन आउँछ?`,
  before: (word) => `${word} भन्दा अगाडि कुन आउँछ?`,
  order: "डिब्बाहरू क्रमैसँग जोड!",
  whichNext: "अब कुन अङ्क आउँछ?",
  missingRight: (word) => `${word} छुटेको थियो।`,
  afterRight: (a, b) => `${a} पछि ${b} आउँछ।`,
  beforeRight: (a, b) => `${a} भन्दा अगाडि ${b} आउँछ।`,
  orderRight: (list) => `${list.join(", ")}।`,
};
