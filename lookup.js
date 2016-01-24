var request = require('request');
var cheerio = require('cheerio');
var columnify = require('columnify');
var colors = require('colors');
var fs = require('fs');

var infinitive = process.argv[2];

var force = process.argv.indexOf('-f') > -1;

if (!force && hasTestFor(infinitive)) {
  console.error('already got entry for', infinitive);
  process.exit(1);
}

var url = 'http://www.verbformen.net/conjugation/' + 
  infinitive.replace(/ß/g,'s:').replace(/ö/g,'o:').replace(/ü/g, 'u:') + 
  '.htm';

var cachefilename = '/tmp/de.' + new Buffer(infinitive).toString('base64') + '.html';

if (fs.existsSync(cachefilename)) {
  fs.readFile(cachefilename, 'utf8', function(err, html){
    if (err) return console.error(err);
    output2(extract(html));
  });
} else {
  request(url, function(err, res, html){
    if (err) return console.error(err);
    fs.writeFileSync(cachefilename, html);
    output2(extract(html));
  });
}

function transformWord(type, word, pronoun) {
  
  // turn "(e)+" into "e"
  word = word.replace( /\(([e])\)\+/, '$1');
  
  // replace "(e)*" with "e" for present tense ich
  if (type === 'präsens' && pronoun === 'ich') {
    word = word.replace(/\(e\)\*$/, 'e');
  }
  
  // replace "(e)*n" with "en"
  word = word.replace(/\(e\)\*n$/, 'en');
  
  // replace "(s)*t" with "st"
  word = word.replace(/\((e?s)\)\*t$/, '$1t');
  
  // replace "(e)t" with "t"
  word = word.replace(/\(e\)t$/, 't');
  
  if (/[\(\/]/.test(word)) {
    throw new Error('must deal with () or / thing [' + word + '] in ' + type + ' ' + pronoun);
  }
  
  return word;
}

function extract(html) {

  var types = {
    'Simple Present' : 'präsens',
    'Simple Past' : 'präteritum',
    'Subjunctive ii' : 'k2präsens'
  };

  var $ = cheerio.load(html);
  var things = ['Simple Present', 'Simple Past'];

  var verb = {};
  verb.infinitive = infinitive;

  var m = html.match(/The auxiliary verb of [^\.]+ is ([^\.]+)./);
  if (m) {
    verb.hilfsverb = m[1];
  }

  $('#ueberblickaufzu').find('div.v').each(function(_, div){
    div = $(div);
    var type = $('h4 a', div).text().trim();

    if (type === 'InfinitiveParticiple') {
      var tds = div.find('td');
      var pp = $(tds[tds.length - 1]).text();
      verb.pp = transformWord('pp', pp);
      return;
    }

    if (!types[type]) return;
    type = types[type];
    div.find('table tr').each(function(_, tr){
      var tds = $(tr).find('td');
      var pronoun = $(tds[0]).text().trim();
      if (pronoun === 'er') pronoun = 'es';
      if (pronoun === 'sie') return;
      var word = $(tds[1]).text().trim();
      if (!verb[type]) verb[type] = {};
      verb[type][pronoun] = transformWord(type, word, pronoun);
    });
  });
  
  return verb;
}

function output2(verb) {
  var data = [];

  data.push([verb.infinitive, 'partizip', verb.pp]);
  data.push([verb.infinitive, 'hilfsverb', verb.hilfsverb]);

  ['präsens', 'präteritum', 'k2präsens'].forEach(function(tense){
    var words = verb[tense];
    data.push([verb.infinitive, tense, words.ich, words.du, words.es, words.wir, words.ihr]);
  });
  console.log(columnify(data, {
    showHeaders: false,
    columnSplitter: "  "
  }));
}

function output(verb) {

  var data = [];

  data.push(['infinitive', verb.infinitive]);
  data.push(['pp', verb.pp]);
  data.push(['hilfsverb', verb.hilfsverb]);

  data.push([]);

  ['ich', 'du', 'es', 'wir', 'ihr'].forEach(function(pronoun){
    var row = [];
    row.push(pronoun);
    row.push(verb.präsens[pronoun]);
    row.push(verb.präteritum[pronoun]);
    row.push(verb.k2präsens[pronoun]);
    data.push(row);
  });

  console.log(columnify(data, {
    showHeaders: false,
    columnSplitter: "  "
  }));

  console.log();
  console.log(url);

}

function hasTestFor(infinitive) {
  var lines = fs.readFileSync(__dirname + '/test/test-verbs.txt', 'utf8').split("\n");
  for (var i = 0; i < lines.length; i++) {
    var word = lines[i].split(/ +/)[0];
    if (word === infinitive) {
      return true;
    }
  }
  return false;
}

function loadTestVerbs(){
  var m = {};
  fs.readFileSync(__dirname + '/test/test-verbs.txt', 'utf8').split("\n").forEach(function(line){
    var word = line.split(/ +/)[0];
    if (word) {
      m[word] = true;
    }
  });
  var infinitives = Object.keys(m).sort();
  return infinitives;
}