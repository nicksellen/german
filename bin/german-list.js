const columnify = require('columnify');

var verbs = require('../lib/verbs');

var app = require('commander');
app.option('-r, --irregularity', 'Sort by irregularity').parse(process.argv);

var data = [];
var verbs = Object.keys(verbs).map(function(infinitive){
  return verbs[infinitive];
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
  data.push([verb.infinitive, verb.irregularity]);
});

console.log(columnify(data, {
  showHeaders: false,
  columnSplitter: "  "
}));