
const columnify = require('columnify');

const conjuator = require('./lib/conjugator');

var infinitive = process.argv[2];
var results = conjuator(infinitive, ['präsens', 'präteritum', 'k2präsens']);
var data = [];
var partizip = conjuator.partizip(infinitive);
if (partizip) {
  data.push([infinitive, 'partizip', partizip]);
}
var hilfsverb = conjuator.hilfsverb(infinitive);
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
