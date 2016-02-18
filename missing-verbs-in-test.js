var testVerbs = require(__dirname + '/test/test-verbs');
var verbs = require('./lib/verbs').verbs;

Object.keys(testVerbs).filter(function(infinitive){
  return !verbs[infinitive];
}).sort().forEach(function(infinitive){
  console.log(infinitive);
});
