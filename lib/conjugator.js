const Tenses = require('./data/tenses');
const Endings = require('./data/endings');
const pronouns = require('./data/pronouns');
const verbs = require('./verbs').verbs;

const STEMS = ['präteritum', 'partizip', 'k2', 'du/es präsens'];

var DEFAULT_EXPLAIN = function(){
  return true;
};

if (process.env['EXPLAIN']) {
  DEFAULT_EXPLAIN = function(){
    console.log('EXPLAIN', Array.prototype.slice.call(arguments).join(' '));
    return true;
  }
}

function printVerbs(verbs) {
  verbs.forEach(function(verb){
    console.log(verb);
  });
}

function conjugatePräsens(infinitive, explain) {
  var endings = Endings.präsens;
  var m = {};
  pronouns.forEach(function(pronoun){
    var irregular = getIrregular(infinitive, 'präsens', pronoun);
    if (irregular) {
      explain('use irregular form', quote(irregular));
      m[pronoun] = irregular;
      return;
    }
    var stem = getPräsensStem(infinitive, pronoun, explain);
    m[pronoun] = combineStemAndEnding(infinitive, 'präsens', pronoun, stem, endings[pronoun], explain);
  });
  return m;
}

function conjugatePräteritum(infinitive, explain) {
  var endings = hasStrongEndings(infinitive) ? Endings.strong.präteritum : Endings.weak.präteritum;
  var stem = getPräteritumStem(infinitive, explain);
  var m = {};
  pronouns.forEach(function(pronoun){
    var irregular = getIrregular(infinitive, 'präteritum', pronoun);
    if (irregular) {
      explain('use irregular form');
      m[pronoun] = irregular;
      return;
    }
    m[pronoun] = combineStemAndEnding(infinitive, 'präteritum', pronoun, stem, endings[pronoun], explain);
  });
  return m;
}

function conjugateK2präsens(infinitive, explain) {
  if (!explain) explain = DEFAULT_EXPLAIN;
  var stem;
  var endings;
  if (isWeak(infinitive)) {
    /*
      this needs a bit of tidy up, basically, weak verbs get their k2präsens
      stem from präteritum, but they still to have the modifications applied from
      k2 stem settings
    */
    stem = getPräteritumStem(infinitive, explain);
    var verb = getVerb(infinitive);
    if (verb.stems && verb.stems.k2präsens) {
      stem = modifyStem(stem, verb.stems.k2präsens, explain);
    }
    endings = hasStrongEndings(infinitive) ? Endings.strong.präteritum : Endings.weak.präteritum;
  } else {
    stem = getK2präsensStem(infinitive, explain);
    endings = isStrongWithWeakEndings(infinitive) ? Endings.weak.präteritum : Endings.k2präsens;
  }
  var m = {};
  pronouns.forEach(function(pronoun){
    var irregular = getIrregular(infinitive, 'k2präsens', pronoun);
    if (irregular) {
      explain('use irregular form');
      m[pronoun] = irregular;
      return;
    }
    m[pronoun] = combineStemAndEnding(infinitive, 'k2präsens', pronoun, stem, endings[pronoun], explain);
  });
  return m;
}

function conjugatePerfekt(infinitive, tenses, explain){
  var partizip = getPartizip(infinitive);
  var hilfsverb = conjugate(getHilfsverb(infinitive), 'präsens', explain);
  var m = {};
  pronouns.forEach(function(pronoun){
    m[pronoun] = hilfsverb[pronoun] + ' ' + partizip;
  });
  return m;
}

function conjugateFutur1(infinitive, tenses, explain) {
  var werden = conjugate('werden', 'präsens', explain);
  var m = {};
  pronouns.forEach(function(pronoun){
    m[pronoun] = werden[pronoun] + ' ' + infinitive;
  });
  return m;
}


function conjugateK2Präteritum(infinitive, tenses, explain) {
  var partizip = getPartizip(infinitive, explain);
  var hilfsverb = conjugate(getHilfsverb(infinitive), 'k2präsens', explain);
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

function combineStemAndEnding(infinitive, tense, pronoun, stem, ending, explain) {

  var verb = getVerb(infinitive);
  if ((pronoun === 'ich' || pronoun === 'es') &&
      tense === 'präsens' &&
      verb['drop ich/es präsens endings']) {
    explain('drop ending');
    return stem;
  }

  if (ending === '*') {

    return verb.seperable ? verb.seperable.rest : infinitive;

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

    if ((pronoun === 'du' || pronoun === 'es') && 
        tense === 'präsens' && 
        isStrong(infinitive) && 
        hasPresentVowelShift(infinitive)) {
      if (endsWith(stem, ending)) {
        explain('stem already ends in ending');
        ending = '';
      }
    } else {
      explain('kranton stem with padding -e-');
      stem += 'e';
    }
  } else {

    var sibilant = endsWith(stem, 'x', 's', 'ß', 'z') && startsWith(ending, 's');

    if (sibilant) {

     /* In the present tense, sibilant stem endings that cause a leading s from
        the ending to be dropped are -x -s -ß and -z. */

      if (tense === 'präsens') {
        explain('stem', quote(stem),'has sibilant ending, drop the leading', ending[0] + '-', 'from the ending', '-' + ending);
        ending = ending.substring(1);
      }

      /* In the past tense, the same sibilant endings and also -sch cause a padding "e" to
         inserted between the stem and the ending that has a leading s.
         (Note that the only past ending that has a leading s is the du form of a strong verb.) */

      if (tense === 'präteritum') {
        explain('stem', quote(stem), 'has sibilant ending, add padding -e-');
        stem += 'e';
      }

    }

  }
  // not sure if this is a good rule
  // it makes präteritum wir 'schrieen' not be 'schreieen'
  if (ending === 'en' && endsWith(stem, 'e')) ending = 'n';
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

function conjugate(infinitive, tenses, explain) {
  if (!explain) explain = DEFAULT_EXPLAIN;
  if (!verbs[infinitive]) throw new Error("don't know about verb " + infinitive);
  if (typeof tenses === 'string') {
    var tense = tenses;
    if (!conjuators[tense]) throw new Error("can't conjugate into " + tense);
    return conjuators[tense](infinitive, explain);
  } else {
    if (!tenses || tenses.length === 0) tenses = Tenses.simple;
    var m = {};
    tenses.forEach(function(tense){
      if (!conjuators[tense]) throw new Error("can't conjugate into " + tense);
      m[tense] = conjuators[tense](infinitive, explain);
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
  // I *think* this is the right thing to check
  var verb = getVerb(infinitive);
  var shift = verb.stems['präsens du/es']
  if (!shift) return false;
  var stem = getPräsensStem(infinitive);
  var vowel = /[aeiouäëïöü]+/.exec(stem)[0];
  return vowel !== shift;
  //return deumlaut(shift) !== deumlaut(vowel);
}

function isKrantonStem(stem) {
  if (/[dt]$/.test(stem)) return true;
  if (/[aeiouäëïöüAEIOUÄËÏÖÜ]([mn]|mm|nn|[lrh][mn])$/) return false;
  if (/[mn]$/.test(stem)) return true;
  return false;
}

function getInfinitiveStem(infinitive) {
  if (infinitive === 'knien') return 'knie';
  var verb = getVerb(infinitive);
  if (verb.seperable) infinitive = verb.seperable.rest;
  return infinitive.replace(/e?n$/, '');
}

function getInfinitiveEnding(infinitive) {
  var stem = getInfinitiveStem(infinitive);
  return infinitive.substring(stem.length);
}

function getPräsensStem(infinitive, pronoun, explain) {
  var stem = getInfinitiveStem(infinitive, explain);
  var verb = getVerb(infinitive);
  if ((pronoun === 'du' || pronoun === 'es') && 
      verb.stems && verb.stems['präsens du/es']) {
    return modifyStem(stem, verb.stems['präsens du/es'], explain);
  }
  if ((pronoun === 'ich' || pronoun === 'du' || pronoun === 'es') && 
      verb.stems && verb.stems['präsens singular']) {
    return modifyStem(stem, verb.stems['präsens singular'], explain);
  }
  if (verb.stems && verb.stems.präsens) {
    return modifyStem(stem, verb.stems.präsens, explain);
  }
  return stem;
}

const STEM_REPLACE_RES = [
  {
    modification: /^[aeiouäëïöü]+$/,
    replace:      /[aeiouäëïöü]+/
  },
  {
    modification: /^[b-df-hj-np-tv-z]+$/,
    replace:      /[b-df-hj-np-tv-z]+$/
  },
  {
    modification: /^[aeiouäëïöü]/,
    replace:      /[aeiouäëïöü].*/
  }
];

function modifyStem(stem, modification, explain) {
  
  var prefixAndRest = seperateInseperablePrefixStem(stem);
  
  if (prefixAndRest) {
    return prefixAndRest[0] + modifyStem(prefixAndRest[1], modification, explain);
  }
  
  for (var i = 0; i < STEM_REPLACE_RES.length; i++) {
    var item = STEM_REPLACE_RES[i];
    if (item.modification.test(modification)) {
      return stem.replace(item.replace, function(val){
        explain('modify stem ' + val + ' -> '+ modification);
        return modification;
      });
    }
  }
  return modification;
}

function getPräteritumStem(infinitive, explain) {
  var stem = getInfinitiveStem(infinitive, explain);
  var verb = getVerb(infinitive);
  if (verb.stems && verb.stems.präteritum) {
    return modifyStem(stem, verb.stems.präteritum, explain);
  }
  return stem;
}

function getK2präsensStem(infinitive, explain) {
  var verb = getVerb(infinitive);
  var stem = getPräteritumStem(infinitive, explain);
  if (verb.stems && verb.stems.k2präsens) {
    return modifyStem(stem, verb.stems.k2präsens, explain);
  }
  /* A completely regular strong verb will form its K2 stem by applying an
     umlaut to the vowels in past stem if the vowels are capable of taking
     an umlaut, or using the past stem unchanged otherwise (RULE2) */
  var prefixAndRest = seperateInseperablePrefixStem(stem);
  if (prefixAndRest) {
    return prefixAndRest[0] + umlautize(prefixAndRest[1], explain);
  }
  return umlautize(stem, explain);
}

function hasVerb(infinitive) {
  return verbs.hasOwnProperty(infinitive);
}

function getVerb(infinitive) {
  if (!hasVerb(infinitive)) {
    throw new Error('verb not found ' + infinitive);
  }
  return verbs[infinitive];
}

function lookupVerb(infinitive) {
  return verbs[infinitive];
}

function deumlaut(str) {
  return str.replace(/[äëïöü]/, function(c){
    var replacement = { ä: 'a', ë: 'e', ï: 'i', ö: 'o', ü: 'u' }[c];
    if (replacement) {
      return replacement;
    } else {
      return c;
    }
  });
}

function umlautize(str, explain) {
  // swap the first vowel with an umlaut version if availaile
  // ... or if there is a prefix, the first vowel after that
  return str.replace(/[aeiou]/, function(c){
    var replacement = { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü' }[c];
    if (replacement) {
      explain('add umlaut', c, '->', replacement);
      return replacement;
    } else {
      return c;
    }
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

function getPartizipStem(infinitive, explain) {
  var verb = getVerb(infinitive);
  var stem = getInfinitiveStem(infinitive); 
  if (isStrongWithWeakEndings(infinitive)) {
    stem = getPräteritumStem(infinitive, explain);
    explain('has weak endings so use präteritum stem', stem + '-');
  }
  if (verb.stems && verb.stems.partizip) {
    stem = modifyStem(stem, verb.stems.partizip, explain);
  }
  // from http://www.vocabulix.com/german/past-participle-partizip.shtml
  
  //if (infinitive === 'gebären') throw new Error('woo' + hasInseperablePrefix(infinitive) + ' ' + stem);
  // and  http://german.about.com/library/verbs/blverb_pre01.htm

  if (hasInseperablePrefix(infinitive)) {
    explain('has inseperable prefix, just use stem');
    return stem;
  }
  
  explain('add standard ge- prefix');
  return 'ge' + stem;
}

function hasInseperablePrefix(infinitive) {
  return /^(be|ge|ver|emp)/.test(infinitive) && 
         infinitive.match(/[aeiouäëïöü]+/g).length > 2;
}

function seperateInseperablePrefixStem(stem) {
  var m = /^(be|ge|ver|emp)(.*)$/.exec(stem);
  if (m && stem.match(/[aeiouäëïöü]+/g).length > 1) {
    var prefix = m[1];
    var rest = m[2];
    return [prefix, rest];
  }
  return null;
}

function getPrefix(infinitive) {
  
  if (hasInseperablePrefix(infinitive)) {
    var m = /^(be|ge|ver)(.+)$/.exec(infinitive);
    if (!m) throw new Error('verb is meant to have an inseperable, but did not match our regexp');
    return m[1];
  }
  return '';
}

function getPartizip(infinitive, explain) {
  if (!explain) explain = DEFAULT_EXPLAIN;
  var verb = getVerb(infinitive);
  if (verb.partizip) {
    explain('use fixed partizip', quote(verb.partizip));
    return verb.partizip;
  } else {
    var stem = getPartizipStem(infinitive, explain);
    var ending;
    if (hasStrongEndings(infinitive)) {
      ending = getInfinitiveEnding(infinitive);
      explain('use infinitive ending', '-' + ending, 'because we have strong endings');
    } else {
      ending = 't';
      explain('add standard -t ending');
    }
    var s = combineStemAndEnding(infinitive, 'partizip', null, stem, ending, explain);
    if (verb.seperable) s = verb.seperable.prefix + s;
    return s;
  }
}

function getHilfsverb(infinitive) {
  return getVerb(infinitive).hilfsverb;
}

function getEn(infinitive) {
  return getVerb(infinitive).en;
}

function quote(str) {
  return '\'' + str + '\'';
}

module.exports = conjugate;

module.exports.partizip = getPartizip;
module.exports.hilfsverb = getHilfsverb;
module.exports.hasVerb = hasVerb;
module.exports.en = getEn;

module.exports.präteritumStem = function(infinitive){
  return getPräteritumStem(infinitive, DEFAULT_EXPLAIN);
}