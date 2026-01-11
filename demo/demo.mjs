/**
 * Copyright (c) 2026 Dusty Wilhem Murray  
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */


import * as fmIndex from '../src/fmIndex.mjs';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load dictionary
const dictionary = JSON.parse(
    readFileSync(join(__dirname, 'dictionary.json'), 'utf-8')
);

// Configuration
const LEVEL = fmIndex.L_DEFAULT;

fmIndex.setPenalies({
    "lengthDifferenceFactor": 1.0,
    "spaceCountFactor": 0.2
});

// Build index
console.log("MNT-Match Fuzzy Search Demo");
console.log("==========================\n");
console.log("Building index...");

const index = fmIndex.construct(LEVEL);

for (const word of dictionary) {
    fmIndex.store(index, word, { word });
}

// Print index stats
const keyCount = fmIndex.indexKeyCount(index);
const wordCount = fmIndex.indexWordCount(index);
const totalPaths = fmIndex.indexTotalPaths(index);

console.log("\nIndex Statistics:");
console.log(`  Words indexed:    ${wordCount}`);
console.log(`  Total keys:       ${keyCount}`);
console.log(`  Total paths:      ${totalPaths}`);
console.log(`  Keys per word:    ${(keyCount / wordCount).toFixed(2)}`);
console.log(`  MNT-Match level:  ${LEVEL}`);
console.log("\n------------------------------------------");
console.log("Type a word to search (or 'quit' to exit)");
console.log("Try misspellings like 'elefant', 'buterfly', 'computr'");
console.log("------------------------------------------\n");

// Interactive prompt
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt() {
    rl.question("> ", (input) => {
        const query = input.trim().toLowerCase();

        if (query === 'quit' || query === 'exit' || query === 'q') {
            console.log("Bye!");
            rl.close();
            return;
        }

        if (query === '') {
            prompt();
            return;
        }

        // Perform search
        const startTime = performance.now();
        const results = fmIndex.search(index, query);
        const elapsed = (performance.now() - startTime).toFixed(2);

        console.log(`\nSearch: "${query}"`);
        console.log(`Time: ${elapsed}ms | Results: ${results ? results.length : 0}`);

        if (results && results.length > 0) {
            console.log("\nTop matches:");
            const top = results.slice(0, 5);
            for (let i = 0; i < top.length; i++) {
                const r = top[i];
                const bar = '█'.repeat(Math.round(r.c * 20));
                console.log(`  ${i + 1}. ${r.key.padEnd(15)} confidence: ${r.c.toFixed(3)} ${bar}`);
            }
        } else {
            console.log("  No matches found.");
        }

        console.log("");
        prompt();
    });
}

prompt();
