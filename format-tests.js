var fs = require('fs');

var columnify = require('columnify');

var filename = __dirname + '/test/test-verbs.txt';

var data = [];
fs.readFileSync(filename, 'utf8').split("\n").forEach(function(line){
  data.push(line.split(/\ +/));
});

var formatted = columnify(data, {
  showHeaders: false,
  columnSplitter: "  "
});

fs.writeFileSync(filename, formatted);