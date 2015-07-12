const yaml = require('js-yaml');
const fs = require('fs');

load(__dirname + '/verbs.yaml').forEach(function(verb){
  exports[verb.infinitive] = verb;
});

function setVerbDefaults(verb) {
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

function calculateIrregularity(verb, debug) {
  
  var verb = cloneObject(verb);

  // remove anything not related to irregularity
  delete verb.tags;
  delete verb.infinitive;
  delete verb.type;
  if (verb.hilfsverb === 'haben') {
    delete verb.hilfsverb;
  }
  ['stems', 'weak'].forEach(function(key){
    if (!verb.hasOwnProperty(key)) return;
    if (Object.keys(verb[key]).length === 0) {
      delete verb[key];
    }  
  });
  return countLeafKeys(verb);
}

function countLeafKeys(obj, incBy) {
  if (incBy === undefined) incBy = 1;
  var count = 0;
  Object.keys(obj).forEach(function(key){
    var val = obj[key];
    if (val && typeof val === 'object') {
      count += countLeafKeys(val, key === 'irregular' ? 2 : incBy);
    } else {
      count += incBy;
    }
  });
  return count;
}

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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