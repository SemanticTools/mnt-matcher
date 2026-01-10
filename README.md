# fm-indexer
Fuzzy Murray Indexer - Node JS Library - Index words, partial match retrieval - NLP.  
  
This is a NodeJS library that can be used to map human written inexact text to words (with match probabilities)  
  
Example:  
---------------------------------------------------------------  
```  
import * as fmIndex from '../src/fmIndex.mjs';  
  
fmIndex.setPenalies(  
    {  
        "lengthDifferenceFactor": 1.0,  
        "spaceCountFactor": 0.2  
    }  
 );  
  
//create index  
let index = fmIndex.construct( fmIndex.L_DEFAULT );  
  
//Read your dictionary, add to your index  
for( let i=0; i<dictionary.length; i++ ) {  
    let word = dictionary[ i ];  
    fmIndex.store( index, word, null );  
}  
  
let results = fmIndex.search( index, "hellow" );  
  
console.log( JSON.stringify( result ) );  
```  
---------------------------------------------------------------  
  
# Get Started  
To get started, run the demo program as below:  

( Use the commandline to run the command: node demo/demo.mjs )

```
PROMPT> node demo/demo.mjs 

FM-Index Fuzzy Search Demo
==========================

Building index...

Index Statistics:
  Words indexed:    550
  Total keys:       2599
  Total paths:      4308
  Keys per word:    4.73
  FM-Index level:   10

------------------------------------------
Type a word to search (or 'quit' to exit)
Try misspellings like 'elefant', 'buterfly', 'computr'
------------------------------------------

> hi

Search: "hi"
Time: 0.20ms | Results: 0
  No matches found.

> home

Search: "home"
Time: 0.69ms | Results: 1

Top matches:
  1. come            confidence: 0.457 █████████

> drive

Search: "drive"
Time: 0.12ms | Results: 1

Top matches:
  1. drive           confidence: 1.000 ████████████████████

> cool

Search: "cool"
Time: 0.16ms | Results: 1

Top matches:
  1. cool            confidence: 1.000 ████████████████████

> kool

Search: "kool"
Time: 0.56ms | Results: 1

Top matches:
  1. cool            confidence: 0.880 ██████████████████

> 
```
