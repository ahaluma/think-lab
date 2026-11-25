// Nepali texts for "Genau hinschauen" (ध्यान दिएर हेर). Names of the things are in /shared/lang/ne.js.
const SHAPES = { circle: "गोलो", square: "चारकुने", triangle: "त्रिकोण", star: "तारा", heart: "मुटु", diamond: "हीरा आकार" };
const COLORS = { red: "रातो", blue: "निलो", yellow: "पहेँलो", green: "हरियो" };

export default {
  title: "ध्यान दिएर हेर",
  intro: "ध्यान दिएर हेर! फरक खोज र आकार मिलाएर राख। सुरु गर्न थिच!",
  findOne: "दुईवटा चित्र लगभग उस्तै छन्। एउटा कुरा फरक छ। त्यसमा थिच!",
  findMany: (word) => `दुईवटा चित्र लगभग उस्तै छन्। ${word}वटा फरक खोज र थिच!`,
  sameHere: "यहाँ दुवै चित्रमा उस्तै छ।",
  lookHere: "हेर, जहाँ चम्किरहेको छ!",
  gone: (thing) => `एउटा चित्रमा ${thing.one} छैन।`,
  swap: (a, b) => `${a.one} र ${b.one}।`,
  flip: (thing) => `${thing.one} अर्को दिशातिर हेरिरहेको छ।`,
  small: (thing) => `${thing.one} सानो छ।`,
  left: (n, word) => (n === 1 ? "अझै एउटा फरक।" : `अझै ${word}वटा फरक।`),
  allFound: "सबै फरक भेट्टायौ!",
  copy: "माथिको चित्र जस्तै आकार राख! पहिले तल एउटा आकार थिच, अनि एउटा कोठा।",
  copyLook: "चित्र राम्ररी हेर! अब यो छोपिन्छ। अनि सम्झेर बनाऊ।",
  covered: "अब छोपियो। सम्झेर बनाऊ! फेरि हेर्न कपडामा थिच।",
  copyMirror: "पानीमा देखिने जस्तै उल्टो राख! माथिको पङ्क्ति तल जान्छ।",
  peek: "फेरि हेर",
  fewer: "अझै केही आकार चाहिन्छ।",
  more: "आकार धेरै भयो।",
  places: "राम्ररी हेर: हरेक आकार ठिक ठाउँमा र ठिक रङमा छ?",
  mirrorHint: "पानी सम्झ: माथि भएको तिम्रोमा तल जान्छ।",
  marked: "हेर: जहाँ चम्किरहेको छ, त्यहाँ अझै फरक छ।",
  same: "ठ्याक्कै उस्तै!",
  solution: "यस्तो हुन्छ। हेर!",
  piece: (shape, color) => `${COLORS[color]} ${SHAPES[shape]}`,
  board: "तिम्रो कोठा",
  model: "नमुना",
};
