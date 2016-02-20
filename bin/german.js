#!/usr/bin/env node

var app = require('commander');

var command = app.command.bind(app);

command('list', 'list the verbs I know about');
command('conjugate', 'conjugate a verb');
command('quiz', 'take a quiz!');
command('foo', 'foo!');
command('foo2', 'foo2!');

app.parse(process.argv);

if (app.args.length === 0) {
  app.help();
}