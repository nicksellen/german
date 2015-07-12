# german

Commandline tool for german learning/testing/quizs.

It's very much a work in progress and it grows as I want to learn more things.

It started out as a way to explore patterns in verb conjugations and it implements most of the rules from http://www.cambridgeclarion.org/gremple/german.verb.conjugation.html.

It has a quiz feature too.

![screenshot](http://nicksellen.co.uk/upld/german-example.png)

## Example usage

### list available verbs

Only 42 verbs at the moment. You can see the list with

```
german list
```

The number in the second column is an "irregularity score". Use `-r` to sort by that.

### conjugate a verb

```
german conjugate haben
```

Will output:
```
haben  partizip      gehabt                                                                  
haben  hilfsverb     haben                                                                   
haben  präsens       habe          hast            hat           haben          habt         
haben  präteritum    hatte         hattest         hatte         hatten         hattet       
haben  perfekt       habe gehabt   hast gehabt     hat gehabt    haben gehabt   habt gehabt  
haben  futur1        werde haben   wirst haben     wird haben    werden haben   werdet haben 
haben  k2präsens     hätte         hättest         hätte         hätten         hättet       
haben  k2präteritum  hätte gehabt  hättest gehabt  hätte gehabt  hätten gehabt  hättet gehabt
```

### do a quiz

Präsens with all verbs:

```
german quiz
```

Präsens with top 20 most common verbs:

```
german quiz --top 20
```

Präsens with weak verbs (i.e simple/regular ones):

```
german quiz -t weak
```

Präsens and präteritum (past) with all verbs:

```
german quiz -i präsens,präteritum
```

Präteritum with strong verbs with irregularity score 2 or less (i.e. the easier strong verbs):

```
german quiz -t strong -i präteritum -w 2-
```

It'll keep asking you questions until you have answered them all correctly.
