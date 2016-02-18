var top100verbs = require('./lib/data/top100verbs');
var verbs = require('./lib/verbs').verbs;

top100verbs.filter(function(infinitive){
  return !verbs[infinitive];
}).sort().forEach(function(infinitive){
  console.log(infinitive);
});