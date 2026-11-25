// Nepali texts for "Wo sind mehr?" (कतातिर धेरै?). Names of the things are in /shared/lang/ne.js.
// here / there = spoken amounts like "तीनवटा हात्ती", n = the number of the tapped group.

export default {
  title: "कतातिर धेरै?",
  intro: "कतातिर धेरै? सुरु गर्न थिच!",
  same: "बराबर",
  questionMore: (thing) => `कतातिर धेरै ${thing.many} छन्?`,
  questionFewer: (thing) => `कतातिर थोरै ${thing.many} छन्?`,
  rightMore: (n, here, there) => `${here} ${there} भन्दा धेरै हुन्।`,
  rightFewer: (n, here, there) => `${here} ${there} भन्दा थोरै ${n === 1 ? "हो" : "हुन्"}।`,
  rightSame: (n, here) => `दुवैतिर बराबर: ${here}।`,
  lookAgain: "फेरि राम्ररी हेर त!",
};
