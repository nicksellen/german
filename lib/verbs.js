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
      if (typeof val === 'string') {
        count += val.length;
      } else {
        count += 1;
      }
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