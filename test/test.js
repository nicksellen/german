var fs = require('fs');
var assert = require('assert');

var tests = [];

fs.readFileSync(__dirname + '/test-verbs.txt', 'utf8').split("\n").map(function(line){
  if (/^#/.test(line)) return;
  if (!line) return;
  var parts = line.split(/\ +/);
  tests.push({
    infinitive: parts[0],
    tense: parts[1],
    expect: {
      ich: parts[2],
      du: parts[3],
      es: parts[4],
      wir: parts[5],
      ihr: parts[6]
    }
  });
});

describe('verb conjugation', function(){
  var conjuagtor = require('../lib/conjugator');
  tests.forEach(function(test){
    it('can conjugate ' + test.infinitive + ' into ' + test.tense, function(){
      var result = conjuagtor(test.infinitive, test.tense);
      Object.keys(test.expect).forEach(function(pronoun){
        assert.equal(result[pronoun], test.expect[pronoun]);
      });
    });
  });
});