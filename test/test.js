var fs = require('fs');
var assert = require('assert');
var ignored = require('../lib/verbs').ignored;

var all = {};

var includeUndefined = false;

//includeUndefined = true;

var testVerbs = require(__dirname + '/test-verbs');
var verbs = require(__dirname + '/../lib/verbs').verbs;

Object.keys(testVerbs).forEach(function(infinitive){
  var verb = testVerbs[infinitive];
  var tests = [];
  tests.push({ partizip: verb.partizip });
  tests.push({ hilfsverb: verb.hilfsverb });
  Object.keys(verb.tenses).forEach(function(tense){
    tests.push({
      tense: tense,
      expect: verb.tenses[tense]
    });
  });
  all[infinitive] = tests;
});

describe('conjuagtor', function(){
  var conjugator = require('../libgerman').conjugator;
  Object.keys(all).forEach(function(infinitive){
    if (ignored[infinitive]) return;
    var tests = all[infinitive];
    describe('verb: ' + infinitive, function(){
      var verb = verbs[infinitive];
      if (!verb) {
        if (includeUndefined) {
          it('is defined', function(){
            assert.fail(undefined, undefined, 'missing');
          });
        }
      } else {
        it('is defined', function(){
        });
        tests.forEach(function(test){
          if (test.partizip) {
            it('partizip: ' + conjugator.partizip(verb), function(){
              assert.equal(conjugator.partizip(verb), test.partizip);
            });
          } else if (test.hilfsverb) {
            it('hilfsverb: ' + conjugator.hilfsverb(verb).infinitive, function(){
              assert.equal(conjugator.hilfsverb(verb).infinitive, test.hilfsverb);
            });
          } else if (test.tense) {
            describe('tense: ' + test.tense, function(){
              var result = conjugator(verb, test.tense);
              Object.keys(test.expect).forEach(function(pronoun){
                it(pronoun + ' ' + result[pronoun], function(){
                  assert.equal(result[pronoun], test.expect[pronoun]);
                });
              });
            });
          }
        });
      }
    });
  });
});