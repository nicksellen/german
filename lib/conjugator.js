const yaml = require('js-yaml');
const fs = require('fs');

const Tenses = require('./data/tenses');
const Endings = require('./data/endings');
const pronouns = require('./data/pronouns');

const STEMS = ['präteritum', 'partizip', 'k2', 'du/es präsens'];

function load(filename){
  var data = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
  return Object.keys(data).map(function(infinitive){
    var verb = data[infinitive] || {};
    verb.infinitive = infinitive;
    setVerbDefaults(verb);
    return verb;
  }).filter(function(verb){
    return !verb.ignore;
  });
};

function setVerbDefaults(verb) {
  if (!verb.hilfsverb) verb.hilfsverb = 'haben';
  if (!verb.tags) verb.tags = [];
  if (!verb.config) verb.config = {};
  if (!verb.stems) verb.stems = {};
  if (verb.hasOwnProperty('strong')) {
    if (verb.hasOwnProperty('weak')) {
      throw new Error(verb.infinitive + ' cannot be both strong and weak');
    }
    verb.type = 'strong';
    if (!verb.strong) verb.strong = {};
    if (verb.strong.hasOwnProperty('du/es stem')) {
      verb.stems['du/es präsens'] = verb.strong['du/es stem'];
    }
  } else {
    verb.type = 'weak';
    if (!verb.weak) verb.weak = {};
  }
}

function printVerbs(verbs) {
  verbs.forEach(function(verb){
    console.log(verb);
  });
}

function conjugatePräsens(infinitive) {
  var endings = Endings.präsens;
  var m = {};
  pronouns.forEach(function(pronoun){
    var irregular = getIrregular(infinitive, 'präsens', pronoun);
    if (irregular) {
      m[pronoun] = irregular;
      return;
    }
    var stem = getPräsensStem(infinitive, pronoun);
    var stemIsKranton = isKrantonStem(stem);
    m[pronoun] = combineStemAndEnding(infinitive, 'präsens', pronoun, stem, endings[pronoun]);
  });
  return m;
}

function conjugatePräteritum(infinitive) {
  var endings = hasStrongEndings(infinitive) ? Endings.strong.präteritum : Endings.weak.präteritum;
  var stem = getPräteritumStem(infinitive);
  var m = {};
  pronouns.forEach(function(pronoun){
    var irregular = getIrregular(infinitive, 'präteritum', pronoun);
    if (irregular) {
      m[pronoun] = irregular;
      return;
    }
    m[pronoun] = combineStemAndEnding(infinitive, 'präteritum', pronoun, stem, endings[pronoun]);
  });
  return m;
}

function conjugateK2präsens(infinitive) {
  if (isWeak(infinitive)) return conjugatePräteritum(infinitive);
  /* A completely regular strong verb will form its K2 stem by applying an
     umlaut to the vowels in past stem if the vowels are capable of taking
     an umlaut, or using the past stem unchanged otherwise (RULE2) */
  var stem = getK2präsensStem(infinitive);
  var endings = isStrongWithWeakEnding(infinitive) ? Endings.weak.präteritum : Endings.k2präsens;
  var m = {};
  pronouns.forEach(function(pronoun){
    var irregular = getIrregular(infinitive, 'k2präsens', pronoun);
    if (irregular) {
      m[pronoun] = irregular;
      return;
    }
    m[pronoun] = combineStemAndEnding(infinitive, 'k2präsens', pronoun, stem, endings[pronoun]);
  });
  return m;
}

function getIrregular(infinitive, tense, pronoun) {
  var verb = getVerb(infinitive);
  if (verb.strong && 
      verb.strong.irregular && 
      verb.strong.irregular[tense] &&
      verb.strong.irregular[tense][pronoun]) {
    return verb.strong.irregular[tense][pronoun];
  }
}

function combineStemAndEnding(infinitive, tense, pronoun, stem, ending) {

  if (ending === '*') {

    return infinitive;

  } else if (/^[b-df-hj-np-tv-z]/.test(ending) && 
             isKrantonStem(stem) && 
             // and NOT past tense of strong verbs with weak ending
             !(tense === 'präteritum' && isStrongWithWeakEnding(infinitive)) &&
             // k2 of strong verbs with weak endings padding is inserted if the k2 stem is
             // the same as the infinitive stem
             !(tense === 'k2präsens' && stem !== getInfinitiveStem(infinitive))) {

    /* Except for the four cases ..., a padding "e" is always inserted between a
       kranton stem and any ending that starts with a consonant. */

    /* The forms of a verb where a present tense vowel shift is operative.
       This means the present du and es forms of a strong verb which has a present tense vowel shift.
       In this case, no padding is used, but the following rule is applied instead.
       If the stem already ends in the ending in question, then the ending is simply left off,
       or, in other words, becomes zero. Otherwise the ending is appended as normal. */

    if ((pronoun === 'du' || pronoun === 'es') && hasPresentVowelShift(infinitive)) {
      if (endsWith(stem, ending)) {
        return stem;
      } else {
        return stem + ending;
      }
    } else {
      return stem + 'e' + ending;
    }
  } else {
    return stem + ending;
  }
}

const conjuators = {
  präsens: conjugatePräsens,
  präteritum: conjugatePräteritum,
  k2präsens: conjugateK2präsens
};

function conjugate(infinitive, tenses) {
  if (!verbsByInfinitive[infinitive]) throw new Error("don't know about verb " + infinitive);
  if (typeof tenses === 'string') {
    var tense = tenses;
    if (!conjuators[tense]) throw new Error("can't conjugate into " + tense);
    return conjuators[tense](infinitive);
  } else {
    if (!tenses || tenses.length === 0) tenses = Tenses.simple;
    var m = {};
    tenses.forEach(function(tense){
      if (!conjuators[tense]) throw new Error("can't conjugate into " + tense);
      m[tense] = conjuators[tense](infinitive);
    });
    return m;
  }
}

function isStrong(infinitive) {
  return getVerb(infinitive).type === 'strong';
}

function isWeak(infinitive) {
  return !isStrong(infinitive);
}

function isStrongWithWeakEnding(infinitive) {
  var verb = getVerb(infinitive);
  return verb.strong && verb.strong['weak endings'];
}

function hasStrongEndings(infinitive) {
  var verb = getVerb(infinitive);
  if (verb.strong) {
    return !verb.strong['weak endings'];
  } else if (verb.weak['strong endings']) {
    console.warn('not sure about this bit these strong endings on weak verbs yet for', infinitive);
    return true;
  }
  return false;
}

/* The forms of a verb where a present tense vowel shift is operative.
   This means the present du and es forms of a strong verb which has a
   present tense vowel shift.  */
function hasPresentVowelShift(infinitive) {
  if (!isStrong(infinitive)) return false;
  // I *think* this is the right thing to check
  return getVerb(infinitive).strong.hasOwnProperty('du/es stem');
}

function isKrantonStem(stem) {
  if (/[dt]$/.test(stem)) return true;
  if (/[aeiouäëïöüAEIOUÄËÏÖÜ]([mn]|mm|nn|[lrh][mn])$/) return false;
  if (/[mn]$/.test(stem)) return true;
  return false;
}

function isVowel(c) {
  return /[aeiouäëïöüAEIOUÄËÏÖÜ]/.test(c);
}

function getInfinitiveStem(infinitive) {
  if (infinitive === 'knien') return 'knie';
  return infinitive.replace(/e?n$/, '');
}

function getPräsensStem(infinitive, pronoun) {
  var stem = getInfinitiveStem(infinitive);
  var verb = getVerb(infinitive);
  if ((pronoun === 'du' || pronoun === 'es') && 
      verb.strong && verb.strong['du/es stem']) {
    return verb.strong['du/es stem'];
  }
  return stem;
}

function getPräteritumStem(infinitive) {
  var stem = getInfinitiveStem(infinitive);
  var verb = getVerb(infinitive);
  if (verb.strong && verb.strong['stem consonants'] && verb.strong['stem consonants'].präteritum) {
    var consonants = verb.strong['stem consonants'].präteritum;
    return stem.replace(/[b-df-hj-np-tv-z]+$/, consonants);
  }
  if (verb.strong && verb.strong.stems && verb.strong.stems.präteritum) {
    return verb.strong.stems.präteritum;
  }
  return stem;
}

function getK2präsensStem(infinitive) {
  var verb = getVerb(infinitive);
  var stem = getPräteritumStem(infinitive);
  if (verb.strong && verb.strong.stems && verb.strong.stems.k2präsens) {
    return verb.strong.stems.k2präsens;
  }
  return umlautize(stem);
}

var verbs = load('verbs.yaml');
var verbsByInfinitive = {};
verbs.forEach(function(verb){
  verbsByInfinitive[verb.infinitive] = verb;
});

function getVerb(infinitive) {
  if (!verbsByInfinitive.hasOwnProperty(infinitive)) {
    throw new Error('verb not found ' + infinitive);
  }
  return verbsByInfinitive[infinitive];
}

function umlautize(str) {
  // swap the first vowel with an umlaut version if availaile
  return str.replace(/[aeiou]/, function(c){
    return { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü' }[c] || c;
  });
}

function endsWith(str) {
  for (var i = 1; i < arguments.length; i++) {
    var suffix = arguments[i];
    if (str.indexOf(suffix, str.length - suffix.length) !== -1) {
      return true;
    }
  }
  return false;
}

module.exports = conjugate;