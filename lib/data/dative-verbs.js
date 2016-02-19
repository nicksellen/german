var fs = require('fs');

var verbs = {};

fs.readFileSync(__dirname + '/dative-verbs.txt').split("\n").forEach(function(line){
  if (/^#/.test(line)) return;
  if (!line) return;
  var parts = line.split(' ');
  var infinitive = parts[0] === 'sich' ? parts[1] : parts[0];
});

module.exports = verbs;