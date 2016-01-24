var fs = require('fs');

var columnify = require('columnify');

var filename = __dirname + '/test/test-verbs.txt';

var data = [];
var current;
fs.readFileSync(filename, 'utf8').split("\n").forEach(function(line){
  line = line.trim()
  if (line === '') return;
  var parts = line.split(/\ +/);
  infinitive = parts[0];
  if (current && current !== infinitive) {
    data.push([]);
  }
  data.push(parts);
  current = infinitive;
});

data.push([]);

var formatted = columnify(data, {
  showHeaders: false,
  columnSplitter: "  "
});

formatted += "\n";

fs.writeFileSync(filename, formatted);