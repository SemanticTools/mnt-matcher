# mnt-matcher

Mint Matcher (Murray Near Text) - Node.js library for fuzzy word matching with confidence scores.

Index words, then retrieve partial/inexact matches with probabilities. Useful for NLP, search suggestions, typo correction.

## Installation
```bash
npm install @semanticlabs/mnt-matcher
```

## Usage
```javascript
import * as fmIndex from '@semanticlabs/mnt-matcher';

// Configure penalties (optional)
fmIndex.setPenalties({
    lengthDifferenceFactor: 1.0,
    spaceCountFactor: 0.2
});

// Create index
const index = fmIndex.construct(fmIndex.L_DEFAULT);

// Add words to index
const dictionary = ["hello", "world", "help", "held"];
for (const word of dictionary) {
    fmIndex.store(index, word, null);
}

// Search with fuzzy matching
const results = fmIndex.search(index, "hellow");
console.log(JSON.stringify(results));
```

## Demo

# Installation Demo files
```bash
git clone https://github.com/B2B-Integrations/mnt-demo
```

Run the interactive demo:
```bash
node demo/demo.mjs
```

Example session:
```
PROMPT> node demo/demo.mjs 

MNT-Match Fuzzy Search Demo
==========================

Building index...

Index Statistics:
  Words indexed:    550
  Total keys:       2599
  Total paths:      4308
  Keys per word:    4.73
  MNT-Match level:   10

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

```

## License

MIT
