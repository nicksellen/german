const colors = require('colors/safe');
const columnify = require('columnify');

const conjugator = require('../lib/conjugator');
const verbs = require('../lib/verbs').verbs;
const Tenses = require('../lib/data/tenses');
const pronouns = require('../lib/data/pronouns');

var app = require('commander');
app
   .option('-t, --type [type]', 'filter verb type strong or weak')
   .option('-w, --weird [n]', 'filter for weirdness n/n+/n-')
   .option('-i, --include-tense [tenses]', 'choose tenses (präsens,präteritum)')
   .option('-l, --limit [limit]', 'limit the number of questions')
   .option('--top [topn]', 'filter by topn verbs')
   .parse(process.argv);

var infinitives = Object.keys(verbs);

var filters = [];

if (app.type) {
  switch (app.type) {
    case 'strong':
      filters.push(function(verb){
        return verb.strong;
      });
      break;
    case 'weak':
      filters.push(function(verb){
        return !verb.strong;
      });
      break;
    default:
      throw new Error('invalid type, try weak or strong')
  }
}

if (app.weird) {
  var m = app.weird.match(/^([0-9]+)(\+|\-)?$/);
  if (!m) throw new Error('invalid wierd spec ' + app.weird);
  var num = parseInt(m[1], 10);
  var type = m[2];
  switch (type) {
    case '+':
      filters.push(function(verb){
        return verb.irregularity >= num;
      });
      break;
    case '-':
      filters.push(function(verb){
        return verb.irregularity <= num;
      });
      break;
    default:
      filters.push(function(verb){
        return verb.irregularity == num;
      });
      break;
  }
}

if (app.top) {
  if (!/^[0-9]+$/.test(app.top)) throw new Error('top must be a number');
  var n = parseInt(app.top, 10);
  if (n < 1 || n > 100) throw new Error('top must be between 1 and 100');
  var top100verbs = require('../lib/data/top100verbs');
  filters.push(function(verb){
    var rank = top100verbs.indexOf(verb.infinitive) + 1; // rank is 1 indexed
    return rank && rank <= n;
  });
}

infinitives = infinitives.filter(function(infinitive){
  var verb = verbs[infinitive];
  if (verb.tags.indexOf('test') !== -1) return false;
  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    if (!filter(verb)) {
      return false;
    }
  }
  return true;
});

if (infinitives.length === 0) {
  throw new Error('you filtered everything!');
}

var tenses = [];

if (app.includeTense) {
  tenses = tenses.concat(app.includeTense.split(','));
} else {
  tenses.push('präsens');
}

var positiveWords = [
  'Super!', 'Sehr gut!', 'Richtig!', 'Richtig!', 'Toll!', 
  'Hammergeil!', 'Halleluja!', 'Perfekt!', 'Du machst das sehr gut!', 
  'Deine Freunde werden beeindruckt sein!', 'Feine Sache!', 'Darauf stoßen wir an!', 
  'Total toll!', 'Total super!', 'Ganz schön clever!'
];

var negativeWords = [
  'Falsch!', 'Gaaaaaaaanz falsch!', 'Wer das liest is doof!', 'Macht nichts. Nochmal!', 
  'Nicht ganz...', 'Wenn das deine Mutter wüsste!', 'Ja ja, deine Mudder!', 
  'Iiih. Das ist doch kein Deutsch!'
];

var combinations = [];

infinitives.forEach(function(infinitive){
  var verb = verbs[infinitive];
  tenses.forEach(function(tense){
    var conjugations = conjugator(infinitive, tense);
    pronouns.forEach(function(pronoun){
      var conjugation = conjugations[pronoun];
      combinations.push({
        verb: verb,
        infinitive: infinitive,
        tense: tense,
        pronoun: pronoun,
        conjugation: conjugation
      });
    });
  });
});

shuffle(combinations);

if (app.limit) {
  combinations.splice(0, combinations.length - app.limit);
}

console.log('' + combinations.length, 'problems to complete');

var nextCombination = createRandomPool(combinations);
var nextPositiveWord = createRandomPool(positiveWords);
var nextNegativeWord = createRandomPool(negativeWords);

var errors = [];

function askQuestion() {
  var combination = nextCombination();
  var infinitive = combination.infinitive;
  var tense = combination.tense;
  var pronoun = combination.pronoun;
  var conjugation = combination.conjugation;
  ask('Conjugate ' + colors.bold(tenseName(tense)) + ' / ' + colors.bold(infinitive) +
      ' : ' + pronounName(pronoun) + ' ', function(answer) {
    if (answer === conjugation) {
      console.log(colors.green(nextPositiveWord() + ' ' + colors.bold('✓')));
    } else {
      errors.push(combination);
      nextCombination.push(combination);
      console.log(colors.red(nextNegativeWord() + ' ' + colors.bold('✕')), colors.grey('Die richtige Antwort ist:', conjugation));
      printFullConjugation(infinitive);
    }
    if (nextCombination.isEmpty()) {
      var resultText;
      if (errors.length === 0) {
        resultText = colors.bold('Perfekt score!');
      } else if (errors.length === 1) {
        resultText = colors.red('1 error');
      } else {
        resultText = colors.red(errors.length + ' errors');
      }
      console.log(colors.green('Completed ' + combinations.length + ' problems'), resultText);
    } else {
      askQuestion();
    }
  });
}
askQuestion();

function pickRandomFrom(ary) {
  return ary[getRandomInt(0, ary.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function ask(question, callback) {
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question(question, function(answer) {
    rl.close();
    callback(answer);
  });
}

function createRandomPool(items) {
  var picks = [];
  function next(){
    if (picks.length === 0) {
      picks = items.slice();
      shuffle(picks);
    }
    return picks.pop();
  };
  next.push = function(item){
    var idx = getRandomInt(0, picks.length)
    picks.splice(idx, 0, item);
  };
  next.isEmpty = function(){
    return picks.length === 0;
  };
  return next;
}

function tenseName(tense) {
  var info = Tenses.info[tense];
  return [info.mood, info.tense].join(' ');
}

function pronounName(pronoun) {
  return pronoun === 'es' ? 'er/sie/es' : pronoun;
}

function printFullConjugation(infinitive) {
  var results = conjugator(infinitive, Tenses.simple);
  var data = [];
  var partizip = conjugator.partizip(infinitive);
  if (partizip) {
    data.push(['partizip', partizip]);
  }
  var hilfsverb = conjugator.hilfsverb(infinitive);
  if (hilfsverb) {
    data.push(['hilfsverb', hilfsverb]);
  }
  Object.keys(results).forEach(function(tense){
    var words = results[tense];
    data.push([tenseName(tense), words.ich, words.du, words.es, words.wir, words.ihr]);
  });
  console.log(columnify(data, {
    showHeaders: false,
    columnSplitter: "  "
  }));
}

// http://stackoverflow.com/a/6274381
function shuffle(o){
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
}