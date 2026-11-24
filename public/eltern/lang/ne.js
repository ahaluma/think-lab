// Nepali texts for the parents' page.
export default {
  title: "प्रगति",
  note: "यो यही फोनमा मात्र सुरक्षित हुन्छ। कतै पठाइँदैन।",
  last14: "पछिल्ला १४ दिन",
  legendRight: "सही",
  legendWrong: "गलत",
  today: (right, wrong, rounds) => `आज: ${right + wrong} उत्तर, ${right} सही · ${rounds} राउन्ड`,
  notPlayed: "अहिलेसम्म खेलिएको छैन",
  level: (n, of) => `तह ${n} / ${of}`,
  stats: (rounds, percent, date) => `${rounds} राउन्ड · ${percent}% सही · अन्तिम पटक ${date}`,
  reset: "प्रगति मेटाउनुहोस्",
  resetConfirm: "यो फोनको सबै प्रगति मेटाउने?",
  weekdays: ["आ", "सो", "मं", "बु", "बि", "शु", "श"],
};
