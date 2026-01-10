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
  
