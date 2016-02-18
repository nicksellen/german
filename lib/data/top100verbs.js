var fs = require('fs');

var verbs = [];
fs.readFileSync(__dirname + '/top100verbs.txt', 'utf8').split("\n").forEach(function(line){
  var parts = line.split(' ');
  var infinitive = parts[0].replace('·', '');
  verbs.push(infinitive);
});
module.exports = verbs;