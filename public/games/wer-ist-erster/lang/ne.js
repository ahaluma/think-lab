// Nepali texts for "Wer ist Erster?" (को पहिलो?). The animals queue for ice cream; the cart is at the front.
// nom = the name ("सिंह"), dat = the name before "को" ("सिंह" → "सिंहको अगाडि").
const N = (name) => ({ nom: name, dat: name });

export default {
  title: "को पहिलो?",
  intro: "जनावरहरू आइसक्रिमका लागि लाइनमा छन्। आइसक्रिम गाडीको छेउमा हुने पहिलो हो। सुरु गर्न थिच!",
  cart: "आइसक्रिम गाडी",
  places: ["", "पहिलो", "दोस्रो", "तेस्रो", "चौथो", "पाँचौँ", "छैटौँ", "सातौँ", "आठौँ", "नवौँ", "दसौँ"],
  short: (n) => n,

  tapPlace: (place) => `${place} जनावरलाई थिच!`,
  tapLast: "अन्तिम जनावरलाई थिच!",
  tapBack: (place) => `पछाडिबाट ${place} जनावरलाई थिच!`,
  which: (who) => `${who.nom} लाइनमा कतिऔँ हो?`,
  front: (who) => `${who.dat}को ठीक अगाडि को छ?`,
  behind: (who) => `${who.dat}को ठीक पछाडि को छ?`,

  isPlace: (who, place) => `${who.nom} ${place} हो।`,
  isLast: (who) => `${who.nom} अन्तिम हो।`,
  isBack: (who, place) => `${who.nom} पछाडिबाट ${place} हो।`,
  isFront: (who, of) => `${who.nom} ${of.dat}को ठीक अगाडि छ।`,
  isBehind: (who, of) => `${who.nom} ${of.dat}को ठीक पछाडि छ।`,

  thatIs: (place) => `त्यो ${place} जनावर हो।`,
  thatIsLast: "त्यो अन्तिम जनावर हो।",
  thatIsBack: (place) => `त्यो पछाडिबाट ${place} जनावर हो।`,
  thatIsSelf: (who) => `त्यो त ${who.nom} आफैँ हो।`,
  thinkAgain: "फेरि राम्ररी हेर!",
  countFront: "हेर: आइसक्रिम गाडीतिर अगाडि हो। अगाडिबाट गन!",
  countBack: "हेर: सबैभन्दा पछाडि अन्तिम जनावर छ। पछाडिबाट गन!",
  lastHint: "अन्तिम जनावर सबैभन्दा पछाडि, आइसक्रिमबाट सबैभन्दा टाढा हुन्छ।",
  frontHint: (who) => `आइसक्रिमतिर अगाडि हो। ${who.dat}को अगाडि भनेको आइसक्रिमको नजिक।`,
  behindHint: (who) => `आइसक्रिमतिर अगाडि हो। ${who.dat}को पछाडि भनेको आइसक्रिमबाट टाढा।`,

  names: {
    rabbit: N("खरायो"),
    fox: N("फ्याउरो"),
    lion: N("सिंह"),
    elephant: N("हात्ती"),
    panda: N("पान्डा"),
    frog: N("भ्यागुतो"),
    penguin: N("पेंगुइन"),
    duck: N("हाँस"),
    owl: N("लाटोकोसेरो"),
    giraffe: N("जिराफ"),
    unicorn: N("युनिकर्न"),
    turtle: N("कछुवा"),
  },
};
