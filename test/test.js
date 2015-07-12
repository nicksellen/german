var fs = require('fs');
var assert = require('assert');

var all = {};

fs.readFileSync(__dirname + '/test-verbs.txt', 'utf8').split("\n").map(function(line){
  if (/^#/.test(line)) return;
  if (!line) return;
  var parts = line.split(/\ +/);
  var infinitive = parts[0];

  if (!all[infinitive]) all[infinitive] = [];
  var tests = all[infinitive];

  if (parts[1] === 'partizip') {
    tests.push({
      partizip: parts[2]
    });
  } else if (parts[1] === 'hilfsverb') {
    tests.push({
      hilfsverb: parts[2]
    });
  } else {
    tests.push({
      tense: parts[1],
      expect: {
        ich: parts[2],
        du: parts[3],
        es: parts[4],
        wir: parts[5],
        ihr: parts[6]
      }
    });
  }
});

describe('conjuagtor', function(){
  var conjugator = require('../libgerman').conjugator;
  Object.keys(all).forEach(function(infinitive){
    var tests = all[infinitive];
    describe('verb: ' + infinitive, function(){
      tests.forEach(function(test){
        if (test.partizip) {
          it('partizip', function(){
            assert.equal(conjugator.partizip(infinitive), test.partizip);
          });
        } else if (test.hilfsverb) {
          it('hilfsverb', function(){
            assert.equal(conjugator.hilfsverb(infinitive), test.hilfsverb);
          });
        } else if (test.tense) {
          describe('tense: ' + test.tense, function(){
            var result = conjugator(infinitive, test.tense);
            Object.keys(test.expect).forEach(function(pronoun){
              it(pronoun + ' ' + result[pronoun], function(){
                assert.equal(result[pronoun], test.expect[pronoun]);
              });
            });
          });
        }
      });
    });
  });
});