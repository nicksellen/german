var TENSES_MAP = {
  präsens: {
    mood: 'Indikativ',
    tense: 'Präsens'
  },
  präteritum: {
    mood: 'Indikativ',
    tense: 'Präteritum'
  },
  futur1: {
    mood: 'Indikativ',
    tense: 'Futur I',
    compound: true
  },
  perfekt: {
    mood: 'Indikativ',
    tense: 'Perfekt',
    compound: true
  },
  k2präsens: {
    mood: 'Konjunktiv II',
    tense: 'Präsens'
  },
  k2präteritum: {
    mood: 'Konjunktiv II',
    tense: 'Präteritum',
    compound: true
  }
};

var SIMPLE_TENSES = [];
var COMPOUND_TENSES = [];

Object.keys(TENSES_MAP).filter(function(tense){
  var info = TENSES_MAP[tense];
  if (info.compound) {
    COMPOUND_TENSES.push(tense);
  } else {
    SIMPLE_TENSES.push(tense);
  }
});

exports.simple = SIMPLE_TENSES;
exports.compound = COMPOUND_TENSES;