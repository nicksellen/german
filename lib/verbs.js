const yaml = require('js-yaml');
const fs = require('fs');

var inseperableRe = /^(be|ge|ver|emp|ent|er)(.*)$/;

exports.verbs = {};
exports.ignored = {};

exports.lookup = function(infinitive) {
  return exports.verbs[infinitive];
}

exports.get = function(infinitive) {
  var verb = exports.verbs[infinitive];
  if (!verb) throw new Error('verb [' + infinitive + '] is not defined');
  return verb;
}

exports.define = function(infinitive, config) {
  if (!config) config = {};
  config.infinitive = infinitive;
  // this won't do the copying bit, on purpose
  setVerbDefaults(config);
  return config;
}

load(__dirname + '/verbs.yaml').forEach(function(verb){
  if (verb.ignore) {
    exports.ignored[verb.infinitive] = verb;
  } else {
    exports.verbs[verb.infinitive] = verb;
  }
});

function setVerbDefaults(verb) {
  var idx = verb.infinitive.indexOf('|');
  if (idx > -1) {
    verb.seperable = {
      prefix  : verb.infinitive.substring(0, idx),
      rest    : verb.infinitive.substring(idx + 1)
    };
    verb.infinitive = verb.infinitive.replace('|', '');
  }
  if (!verb.hilfsverb) verb.hilfsverb = 'haben';
  if (!verb.tags) verb.tags = [];
  if (!verb.stems) verb.stems = {};
  if (verb.hasOwnProperty('strong')) {
    if (verb.hasOwnProperty('weak')) {
      throw new Error(verb.infinitive + ' cannot be both strong and weak');
    }
    verb.type = 'strong';
    if (!verb.strong) verb.strong = {};
    if (verb.strong.hasOwnProperty('du/es stem')) {
      throw new Error('deprecated config du/es stem');
    }
  } else {
    verb.type = 'weak';
    if (!verb.weak) verb.weak = {};
  }
  verb.irregularity = calculateIrregularity(verb);
}

function calculateIrregularity(originalVerb, debug) {

  var verb = cloneObject(originalVerb);

  var score = 0;

  if (verb.hilfsverb !== 'haben') {
    score++;
  }

  if (verb.type === 'strong') {
    score++;
  }

  delete verb.tags;
  delete verb.infinitive;
  delete verb.type;
  delete verb.hilfsverb;
  delete verb.en;

  ['stems', 'weak', 'strong'].forEach(function(key){
    if (!verb.hasOwnProperty(key)) return;
    if (Object.keys(verb[key]).length === 0) {
      delete verb[key];
    }  
  });

  score += countLeafKeys(verb);
  return score;
}

function countLeafKeys(obj) {
  var count = 0;
  Object.keys(obj).forEach(function(key){
    var val = obj[key];
    if (val && typeof val === 'object') {
      count += countLeafKeys(val);
    } else {
      var incBy = countChar(key, ' ') + 1; 
      if (typeof val === 'string') {
        count += (incBy * val.length);
      } else {
        count += incBy;
      }
    }
  });
  return count;
}

function countChar(str, c) {
  var count = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] === c) count++;
  }
  return count;
}

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function load(filename){
  var data = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
  
  function copyVerb(infinitive, destination) {
    var verb = data[infinitive];
    if (!verb) return;
    Object.keys(verb).forEach(function(k){
      if (!destination.hasOwnProperty(k)) {
        destination[k] = verb[k];
      }
    });
  }
  
  return normalizeIrregularity(Object.keys(data).map(function(infinitive){
    var verb = data[infinitive] || {};
    
    var isSeperable = false;
    
    // seperable
    var idx = infinitive.indexOf('|');
    if (idx > -1) {
      isSeperable = true;
      // copy config from the base verb
      copyVerb(infinitive.substring(idx + 1), verb);
    }
    
    // inseperable
    if (!isSeperable) {
      var prefixAndRest = seperateInseperablePrefix(infinitive);
      if (prefixAndRest) {
        copyVerb(prefixAndRest[1], verb);
      }
    }
    
    verb.infinitive = infinitive;
    setVerbDefaults(verb);
    return verb;
  }));
};

function normalizeIrregularity(verbs) {
  var max = Math.max.apply(null, verbs.map(function(verb){
    return verb.irregularity;
  }));
  verbs.forEach(function(verb){
    verb.irregularity = Math.floor(100 * verb.irregularity / max);
  });
  return verbs;
}

function seperateInseperablePrefix(infinitive) {
  var m = inseperableRe.exec(infinitive);
  if (m && infinitive.match(/[aeiouäëïöü]+/g).length > 2) {
    var prefix = m[1];
    var rest = m[2];
    return [prefix, rest];
  }
  return null;
}