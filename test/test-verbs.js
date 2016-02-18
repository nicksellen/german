var fs = require('fs');

var testVerbs = {};

fs.readFileSync(__dirname + '/test-verbs.txt', 'utf8').split("\n").map(function(line){
  if (/^#/.test(line)) return;
  if (!line) return;
  var parts = line.split(/\ +/);
  var infinitive = parts[0];
  if (!infinitive) return;
  
  if (!testVerbs[infinitive]) testVerbs[infinitive] = { tenses: {} };
  
  var verb = testVerbs[infinitive];

  if (parts[1] === 'partizip') {
    verb.partizip = parts[2];
  } else if (parts[1] === 'hilfsverb') {
    verb.hilfsverb = parts[2];
  } else {
    var tense = parts[1];
    verb.tenses[tense] = {
      ich: parts[2],
      du: parts[3],
      es: parts[4],
      wir: parts[5],
      ihr: parts[6]
    };
  }
});

module.exports = testVerbs;