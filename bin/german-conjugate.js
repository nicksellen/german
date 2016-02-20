
const columnify = require('columnify');

const conjugator = require('../lib/conjugator');
const verbs = require('../lib/verbs');

var infinitive = process.argv[2];
var verb = verbs.get(infinitive)
var results = conjugator(verb, ['präsens', 'präteritum', 'perfekt', 'futur1', 'k2präsens', 'k2präteritum']);
var data = [];

var en = conjugator.en(verb);
if (en) {
  data.push([infinitive, 'en', en]);
}

if (verb.seperable) {
  data.push([infinitive, 'prefix', verb.seperable.prefix]);
}

var partizip = conjugator.partizip(verb);
if (partizip) {
  data.push([infinitive, 'partizip', partizip]);
}

var hilfsverb = conjugator.hilfsverb(verb);
if (hilfsverb) {
  data.push([infinitive, 'hilfsverb', hilfsverb.infinitive]);
}

Object.keys(results).forEach(function(tense){
  var words = results[tense];
  data.push([infinitive, tense, words.ich, words.du, words.es, words.wir, words.ihr]);
});
console.log(columnify(data, {
  showHeaders: false,
  columnSplitter: "  "
}));
