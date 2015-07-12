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

var ALL = [];
var SIMPLE = [];
var COMPOUND = [];

Object.keys(TENSES_MAP).filter(function(tense){
  var info = TENSES_MAP[tense];
  ALL.push(tense);
  if (info.compound) {
    COMPOUND.push(tense);
  } else {
    SIMPLE.push(tense);
  }
});

exports.all = ALL;
exports.simple = SIMPLE;
exports.compound = COMPOUND;
exports.info = TENSES_MAP;