
const columnify = require('columnify');

const conjugator = require('../lib/conjugator');
const verbs = require('../lib/verbs').verbs;

var infinitive = process.argv[2];
var results = conjugator(infinitive, ['präsens', 'präteritum', 'perfekt', 'futur1', 'k2präsens', 'k2präteritum']);
var data = [];
var verb = verbs[infinitive];

var en = conjugator.en(infinitive);
if (en) {
  data.push([infinitive, 'en', en]);
}

if (verb.seperable) {
  data.push([infinitive, 'prefix', verb.seperable.prefix]);
}

var partizip = conjugator.partizip(infinitive);
if (partizip) {
  data.push([infinitive, 'partizip', partizip]);
}

var hilfsverb = conjugator.hilfsverb(infinitive);
if (hilfsverb) {
  data.push([infinitive, 'hilfsverb', hilfsverb]);
}

Object.keys(results).forEach(function(tense){
  var words = results[tense];
  data.push([infinitive, tense, words.ich, words.du, words.es, words.wir, words.ihr]);
});
console.log(columnify(data, {
  showHeaders: false,
  columnSplitter: "  "
}));
