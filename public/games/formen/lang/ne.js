// Nepali texts for "Formen" (आकार). Shared words (numbers, praise) come from /shared/lang/ne.js.
export default {
  title: "आकार",
  intro: "आकार! गोलो, त्रिभुज, वर्ग र आयत। सुरु गर्न थिच!",
  shapes: {
    circle: { one: "एउटा गोलो", many: "गोलो", the: "गोलो" },
    triangle: { one: "एउटा त्रिभुज", many: "त्रिभुज", the: "त्रिभुज" },
    square: { one: "एउटा वर्ग", many: "वर्ग", the: "वर्ग" },
    rectangle: { one: "एउटा आयत", many: "आयत", the: "आयत" },
  },
  hint: {
    circle: "गोलो गोलाकार हुन्छ, यसको कुना हुँदैन।",
    triangle: "त्रिभुजका तीनवटा कुना हुन्छन्।",
    square: "वर्गका चारवटा कुना हुन्छन्, सबै भुजा बराबर हुन्छन्।",
    rectangle: "आयतका चारवटा कुना हुन्छन्, दुईवटा भुजा लामा र दुईवटा छोटा।",
  },

  find: (s) => `${s.the} कुन हो? थिच!`,
  rightFind: (s) => `यो ${s.the} हो!`,
  wrongFind: (got, want) => `यो ${got.the} हो। ${want.the} खोज!`,

  pictures: {
    house: "घर", iceCream: "आइसक्रिम", snowman: "हिउँको मान्छे", tree: "रूख", lollipop: "ललिपप",
    fish: "माछा", boat: "डुङ्गा", car: "गाडी", rocket: "रकेट", robot: "रोबोट",
    train: "रेल", flower: "फूल",
  },
  build: "खाली ठाउँमा कुन आकार मिल्छ?",
  buildNext: "अनि यहाँ कुन आकार मिल्छ?",
  rightBuild: (s) => `${s.the}!`,
  wrongBuild: "यो मिलेन। खाली ठाउँ राम्ररी हेर!",
  built: (pic) => `सकियो! ${pic}!`,

  all: (s) => `सबै ${s.many} थिच!`,
  wrongAll: (got, want) => `यो ${got.the} हो। हामी ${want.many} खोज्दैछौँ!`,
  allFound: (s) => `तिमीले सबै ${s.many} भेट्यौ!`,

  count: (s) => `चित्रमा कतिवटा ${s.many} छन्?`,
  rightCount: (what) => `${what}!`,
  countAgain: "फेरि राम्ररी गन!",
  countHint: (s) => `हेर, अब ${s.many} मात्र चम्किरहेका छन्। गन त!`,

  riddle: {
    circle: "म गोलो छु, मेरो कुना छैन। म को हुँ?",
    triangle: "मेरा तीनवटा कुना र तीनवटा भुजा छन्। म को हुँ?",
    square: "मेरा चारवटा कुना छन्, मेरा सबै भुजा बराबर छन्। म को हुँ?",
    rectangle: "मेरा चारवटा कुना छन्, दुईवटा भुजा लामा र दुईवटा छोटा। म को हुँ?",
  },
  rightRiddle: (s) => `म ${s.the} हुँ!`,
  wrongRiddle: (got) => `यो ${got.the} हो। फेरि राम्ररी सुन!`,
  cornersHint: "हेर: थोप्लाहरू कुना हुन्। गन त!",
};
