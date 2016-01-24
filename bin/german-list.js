const columnify = require('columnify');

var verbs = require('../lib/verbs').verbs;

var app = require('commander');

app
   .option('-r, --irregularity', 'Sort by irregularity')
   .option('-a, --hilfsverb [verb]', 'Filter by hilfsverb')
   .parse(process.argv);

var data = [];
var verbs = Object.keys(verbs).map(function(infinitive){
  return verbs[infinitive];
});

var filters = [];

if (app.hilfsverb) {
  if (['sein', 'haben'].indexOf(app.hilfsverb) === -1) {
    throw new Error('hilfsverb must be sein or haben');
  }
  filters.push(function(verb){
    return verb.hilfsverb === app.hilfsverb;
  });
}

verbs = verbs.filter(function(verb){
  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    if (!filter(verb)) {
      return false;
    }
  }
  return true;
});

if (app.irregularity) {
  verbs = verbs.sort(function(a, b){
    return a.irregularity - b.irregularity || a.infinitive.localeCompare(b.infinitive);
  });
} else {
  verbs = verbs.sort(function(a, b){
    return a.infinitive.localeCompare(b.infinitive);
  });
}

verbs.forEach(function(verb){
  data.push([verb.infinitive, verb.irregularity, verb.en]);
});

console.log(columnify(data, {
  showHeaders: false,
  columnSplitter: "  "
}));