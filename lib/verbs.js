const yaml = require('js-yaml');
const fs = require('fs');

load(__dirname + '/verbs.yaml').forEach(function(verb){
  exports[verb.infinitive] = verb;
});

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
      throw new Error('deprecated config du/es stem');
    }
  } else {
    verb.type = 'weak';
    if (!verb.weak) verb.weak = {};
  }

  // calculate irregularity score
  // just count the number of keys :) -2 for tags/(strong|weak)

  

}

function countKeys(obj) {
  
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