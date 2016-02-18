var fs = require('fs');
var assert = require('assert');
var ignored = require('../lib/verbs').ignored;

var all = {};

var includeUndefined = false;

//includeUndefined = true;

var testVerbs = require(__dirname + '/test-verbs');

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
      if (!conjugator.hasVerb(infinitive)) {
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
            it('partizip: ' + conjugator.partizip(infinitive), function(){
              assert.equal(conjugator.partizip(infinitive), test.partizip);
            });
          } else if (test.hilfsverb) {
            it('hilfsverb: ' + conjugator.hilfsverb(infinitive), function(){
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
      }
    });
  });
});