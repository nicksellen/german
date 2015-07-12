const colors = require('colors/safe');
const columnify = require('columnify');

const conjugator = require('./lib/conjugator');
const verbs = require('./lib/verbs');
const Tenses = require('./lib/data/tenses');
const pronouns = require('./lib/data/pronouns');

const pronounsWithoutWir = pronouns.filter(function(pronoun){
  return pronoun !== 'wir';
});

var app = require('commander');

app.option('-s, --strong', 'Only strong verbs').parse(process.argv);

const infinitives = Object.keys(verbs);

infinitives = infinitives.filter(function(infinitive){
  var verb = verbs[infinitive];
  if (verb.tags.indexOf('test') !== -1) return false;
  if (app.strong) {
    return verb.strong;
  }
  return true;
});

var tenses = ['präsens'];

var positiveWords = ['Super!', 'Sehr gut!', 'Richtig!', 'Richtig!', 'Toll!'];

var nextInfinitive = createRandomPool(infinitives);

function askQuestion() {
  var infinitive = nextInfinitive();
  var tense = pickRandomFrom(tenses);
  var pronoun = pickRandomFrom(pronounsWithoutWir);
  var conjugation = conjugator(infinitive, tense)[pronoun];
  ask('Conjugate ' + colors.bold(tenseName(tense)) + ' / ' + colors.bold(infinitive) +
      ' : ' + pronounName(pronoun) + ' ', function(answer) {
    if (answer === conjugation) {
      console.log(colors.green(pickRandomFrom(positiveWords) + ' ' + colors.bold('✓')));
    } else {
      nextInfinitive.push(infinitive);
      console.log(colors.red('Falsch ' + colors.bold('✕')), colors.grey('correct answer is', conjugation));
      printFullConjugation(infinitive);
    }
    askQuestion();
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
  var readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  readline.question(question, function(answer) {
    readline.close();
    callback(answer);
  });
}

function createRandomPool(items) {
  var picks = [];
  function next(){
    if (picks.length === 0) {
      picks = items;
    }
    var idx = getRandomInt(0, picks.length);
    var pick = picks[idx];
    picks.splice(idx, 1);
    return pick;
  };
  next.push = function(item){
    picks.push(item);
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