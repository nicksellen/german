const Tenses = require('./data/tenses');
const Endings = require('./data/endings');
const pronouns = require('./data/pronouns');
const verbs = require('./verbs');

const STEMS = ['präteritum', 'partizip', 'k2', 'du/es präsens'];

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
  var stem = getK2präsensStem(infinitive);
  var endings = isStrongWithWeakEndings(infinitive) ? Endings.weak.präteritum : Endings.k2präsens;
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

function conjugatePerfekt(infinitive, tenses){
  var partizip = getPartizip(infinitive);
  var hilfsverb = conjugate(getHilfsverb(infinitive), 'präsens');
  var m = {};
  pronouns.forEach(function(pronoun){
    m[pronoun] = hilfsverb[pronoun] + ' ' + partizip;
  });
  return m;
}

function conjugateFutur1(infinitive, tenses) {
  var werden = conjugate('werden', 'präsens');
  var m = {};
  pronouns.forEach(function(pronoun){
    m[pronoun] = werden[pronoun] + ' ' + infinitive;
  });
  return m;
}


function conjugateK2Präteritum(infinitive, tenses) {
  var partizip = getPartizip(infinitive);
  var hilfsverb = conjugate(getHilfsverb(infinitive), 'k2präsens');
  var m = {};
  pronouns.forEach(function(pronoun){
    m[pronoun] = hilfsverb[pronoun] + ' ' + partizip;
  });
  return m;
}

function getIrregular(infinitive, tense, pronoun) {
  var verb = getVerb(infinitive);
  if (verb.irregular && 
      verb.irregular[tense] &&
      verb.irregular[tense][pronoun]) {
    return verb.irregular[tense][pronoun];
  }
}

function combineStemAndEnding(infinitive, tense, pronoun, stem, ending) {

  var verb = getVerb(infinitive);
  if ((pronoun === 'ich' || pronoun === 'es') && 
      tense === 'präsens' &&
      verb['drop ich/es präsens endings']) {
    return stem;
  }

  if (ending === '*') {

    return infinitive;

  } else if (/^[b-df-hj-np-tv-z]/.test(ending) && 
             isKrantonStem(stem) && 
             // and NOT past tense of strong verbs with weak ending
             !(tense === 'präteritum' && isStrongWithWeakEndings(infinitive)) &&
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
        ending = '';
      }
    } else {
      stem += 'e';
    }
  } else {

    var sibilant = endsWith(stem, 'x', 's', 'ß', 'z') && startsWith(ending, 's');

    if (sibilant) {

     /* In the present tense, sibilant stem endings that cause a leading s from
        the ending to be dropped are -x -s -ß and -z. */

      if (tense === 'präsens') {
        ending = ending.substring(1);
      }

      /* In the past tense, the same sibilant endings and also -sch cause a padding "e" to
         inserted between the stem and the ending that has a leading s.
         (Note that the only past ending that has a leading s is the du form of a strong verb.) */

      if (tense === 'präteritum') {
        stem += 'e';
      }

    }

  }
  return stem + ending;
}

const conjuators = {
  präsens: conjugatePräsens,
  präteritum: conjugatePräteritum,
  k2präsens: conjugateK2präsens,

  // compound
  perfekt: conjugatePerfekt,
  futur1: conjugateFutur1,
  k2präteritum: conjugateK2Präteritum
};

function conjugate(infinitive, tenses) {
  if (!verbs[infinitive]) throw new Error("don't know about verb " + infinitive);
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

function isStrongWithWeakEndings(infinitive) {
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

function getInfinitiveStem(infinitive) {
  if (infinitive === 'knien') return 'knie';
  return infinitive.replace(/e?n$/, '');
}

function getInfinitiveEnding(infinitive) {
  var stem = getInfinitiveStem(infinitive);
  return infinitive.substring(stem.length);
}

function getPräsensStem(infinitive, pronoun) {
  var stem = getInfinitiveStem(infinitive);
  var verb = getVerb(infinitive);
  if ((pronoun === 'du' || pronoun === 'es') && 
      verb.stems && verb.stems['präsens du/es']) {
    return modifyStem(stem, verb.stems['präsens du/es']);
  }
  if ((pronoun === 'ich' || pronoun === 'du' || pronoun === 'es') && 
      verb.stems && verb.stems['präsens singular']) {
    return modifyStem(stem, verb.stems['präsens singular']);
  }
  if (verb.stems && verb.stems.präsens) {
    return modifyStem(stem, verb.stems.präsens);
  }
  return stem;
}

function modifyStem(stem, modification) {
  if (/^[aeiouäëïöü]+$/.test(modification)) {
    return stem.replace(/[aeiouäëïöü]+/, modification);
  } else if (/^[b-df-hj-np-tv-z]+$/.test(modification)) {
    return stem.replace(/[b-df-hj-np-tv-z]+$/, modification);
  } else if (/^[aeiouäëïöü]/.test(modification)) {
    return stem.replace(/[aeiouäëïöü].*/, modification);
  }
  return modification;
}

function getPräteritumStem(infinitive) {
  var stem = getInfinitiveStem(infinitive);
  var verb = getVerb(infinitive);
  if (verb.stems && verb.stems.präteritum) {
    return modifyStem(stem, verb.stems.präteritum);
  }
  return stem;
}

function getK2präsensStem(infinitive) {
  var verb = getVerb(infinitive);
  var stem = getPräteritumStem(infinitive);
  if (verb.stems && verb.stems.k2präsens) {
    return modifyStem(stem, verb.stems.k2präsens);
  }
  /* A completely regular strong verb will form its K2 stem by applying an
     umlaut to the vowels in past stem if the vowels are capable of taking
     an umlaut, or using the past stem unchanged otherwise (RULE2) */
  return umlautize(stem);
}

function getVerb(infinitive) {
  if (!verbs.hasOwnProperty(infinitive)) {
    throw new Error('verb not found ' + infinitive);
  }
  return verbs[infinitive];
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

function startsWith(str) {
  for (var i = 1; i < arguments.length; i++) {
    var prefix = arguments[i];
    if (str.indexOf(prefix) === 0) {
      return true;
    }
  }
  return false;
}

function getPartizipStem(infinitive) {
  var verb = getVerb(infinitive);
  var stem = getInfinitiveStem(infinitive); 
  if (isStrongWithWeakEndings(infinitive)) {
    stem = getPräteritumStem(infinitive);
  }
  if (verb.stems && verb.stems.partizip) {
    stem = modifyStem(stem, verb.stems.partizip);
  }
  // from http://www.vocabulix.com/german/past-participle-partizip.shtml
  // and  http://german.about.com/library/verbs/blverb_pre01.htm

  if (isWeak(infinitive) && hasInseperablePrefix(stem)) {
    return stem;
  }

  return 'ge' + stem;
}

function hasInseperablePrefix(str) {
  return startsWith(str, 'be', 'ge', 'ver');
}

function getPartizip(infinitive) {
  var verb = getVerb(infinitive);
  if (verb.partizip) return verb.partizip;
  var stem = getPartizipStem(infinitive);
  var ending = hasStrongEndings(infinitive) ? getInfinitiveEnding(infinitive) : 't';
  return combineStemAndEnding(infinitive, 'partizip', null, stem, ending);
}

function getHilfsverb(infinitive) {
  return getVerb(infinitive).hilfsverb;
}

module.exports = conjugate;
module.exports.partizip = getPartizip;
module.exports.hilfsverb = getHilfsverb;