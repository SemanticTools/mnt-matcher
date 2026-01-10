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


const EXTREMELY_HIGH_CONFIDENCE = 100000;
const MAX_FUZZY_CONFIDENCE = 0.9;
const MAX_FUZZY_CONFIDENCE_LOWBOUND = 0.8;

const CONSONANT_PENALTY_FRACTION=0.15; 
const FIRST_LETTER_FACTOR=1.85;  

const exactExitEarly = true;
const startStrengthBonus = 0.8;
const endStrengthBonus = 0.7;
const amplifyPhonetic = 1.4;
const lcStrength = 0.9;

const cutOffFactor = 0.6; 
const partBonus = 2.5;

const debugData = false;
const trace  = false;
const perfTrace = false;

let penaltiesObject = {
    lengthDifferenceFactor: 0.2,
    spaceCountFactor: 0.2    
};


export const L1 = 1;  /* Sorted n-grams */
export const L2 = 2;  /* Unsorted n-grams */
export const L3 = 4;  /* Permissive full word */
export const L4 = 8;  /* Permissive n-grams */

export const L_ALL = L1 | L2 | L3 | L4;
export const L_DEFAULT =    L2 | L4;

/* Only english supported for now */
let phonMatches_en_1 = [
    {
        o: 'a',
        u: 'e',
        y: 'j',
        c: 'k',
        z: 's',
        q: 'kw',
    }
];

let phonMatches_en_multi = [
    {
        ple: 'pul',        
        ck: 'k',
        ie: 'ee',
        oo: 'ou',
        au: 'ou',        
        ou: 'o',
        th: 't',
        ph: 'f',
        gh: 'g',
        ss: 's',
        ll: 'l',
        tt: 't',
        rr: 'r',
        nn: 'n',
        mm: 'm',
        dd: 'd',
        pp: 'p',
        bb: 'b',
        gg: 'g',
        ah: 'a',
        uh: 'u',
        oh: 'o',
        eh: 'e',
        ih: 'i',        
    }
]

/* Supply your own test data for tuning if needed or non english purposes */
let englishTuningData = [
    [
        /* adding some english words here for tuning, not in the below list */
        "computer", "programming", "language", "development", "function",
        "people", "information", "system", "network", "database",
        "career", "education", "university", "science", "technology",
        "animals", "environment", "history", "culture", "society",
        "fishing", "mountain", "ocean", "weather", "climate",
        "dog", "cat", "bird", "fish", "horse",

        /* now the test data words */
        "hello", "example", "floppydisk"
    ],
    /* below is real testdata */
    /* near words should hive high confidence to the main word */
    /* far words should have low confidence to the main word */
    {
        word: "hello",
        nearWords : [ 'hallo', 'helloo', 'helo', 'hlllo', 'hollo' ],
        farWords : [ 'hxllo', 'hxlxo', 'hxlxo', 'hxllx' ]
    },
    {
        word: "example",
        nearWords : [ 'exampel', 'exampl', 'exxmple', 'exampble', 'exampple' ],
        farWords : [ 'exxmpple', 'exxampel', 'exxampl' ]
    },
    {
        word: "floppydisk",
        nearWords : [ 'flopydisk', 'floppydiskk', 'floppdisk', 'floppydisck', 'floppydisk' ],
        farWords : [ 'floffydiskk', 'floppdiskk', 'flopyiskk' ]
    },    
];

export function setPenalies( penaltiesObject0 ) {
    penaltiesObject = penaltiesObject0 || {};
}

export function serialize( index ) {
    index._____________________________signature = "FMINDEXv1";
    return JSON.stringify( index  );
}

export function unserialize( string ) {

    let index = JSON.parse( string );

    if(!index._____________________________signature || index._____________________________signature != "FMINDEXv1" ) {
        throw new Error("Index signature missing or invalid, cannot unserialize." );
    }
   
    delete index._____________________________signature;

    return index;
}

const compiledPhonMulti = phonMatches_en_multi.map(map => {
    const compiled = [];
    for (const key in map) {
        compiled.push({ regex: new RegExp(key, 'g'), val: map[key] });
    }
    return compiled;
}).flat();

const compiledPhonSingle = phonMatches_en_1.map(map => {
    const compiled = [];
    for (const key in map) {
        compiled.push({ regex: new RegExp(key, 'g'), val: map[key] });
    }
    return compiled;
}).flat();


// At module load - just flatten the maps, no regex needed
const flatPhonMulti = [];
for (const map of phonMatches_en_multi) {
    for (const key in map) {
        flatPhonMulti.push({ from: key, to: map[key] });
    }
}

const flatPhonSingle = [];
for (const map of phonMatches_en_1) {
    for (const key in map) {
        flatPhonSingle.push({ from: key, to: map[key] });
    }
}

let singleCharPhonetic = {};
for (const map of phonMatches_en_1) {
    for (const key in map) {
        singleCharPhonetic[key] = map[key];
    }
}

function phoneticify_1char( char ) {
    if( singleCharPhonetic[ char ] ) {
        return singleCharPhonetic[ char ];
    }
    return char;
}

function phoneticify(string) {
    let result = string;
    for (const { from, to } of flatPhonMulti) {
        result = result.replaceAll(from, to);
    }
    for (const { from, to } of flatPhonSingle) {
        result = result.replaceAll(from, to);
    }
    return result;
}


function phoneticify_original(string) {
    let result = string;
    for (const { regex, val } of compiledPhonMulti) {
        result = result.replace(regex, val);
    }
    for (const { regex, val } of compiledPhonSingle) {
        result = result.replace(regex, val);
    }
    return result;
}

function phoneticify_old( string ) {
    let result = string;
    /* first replace dual letters */
    for( let map of phonMatches_en_multi ) {
        for( let key in map ) {
            let val = map[ key ];
            result = result.replace( new RegExp( key, 'g' ), val );
        }
    }
    /* then single letters */
    for( let map of phonMatches_en_1 ) {
        for( let key in map ) {
            let val = map[ key ];
            result = result.replace( new RegExp( key, 'g' ), val );
        }
    }

    return result;

}

function get_3grams( wordString0 )
{
    let _3grams = [];

    let wordString = wordString0;

    /* normalize, remove non-alphanum */
    wordString = wordString.replace( /[^a-z0-9]/gi, '' );

    for( let i=0; i<wordString.length -2; i++ ) {
        _3grams.push( wordString.substr(i,3) );
    }

    return _3grams;
}


function getSorted3grams( wordString0 )
{
   let _3grams = [];

   let wordString = wordString0;

   /* normalize, remove non-alphanum */
   wordString = wordString.replace( /[^a-z0-9]/gi, '' );

   for( let i=0; i<wordString.length -2; i++ ) {
       _3grams.push( 
        wordString.substr(i,3).split('').sort().join('')
    );
   }

    return _3grams;

}


export function makeKeys( wordString, flags = L_DEFAULT)
{
    /* More lenient, mixes up celestial and tested, but less keys */

    //console.log("makeKeys for wordString:", wordString, " with flags:", flags   )
    //console.log("makeKeys L1:", (flags & L1) > 0, " L2:", (flags & L2) > 0, " L3:", (flags & L3) > 0   )

    if( wordString.length == 0 ) {
        return [];
    }

    let lc = wordString.toLowerCase();
    let lcStrip = lc.replace( /[^a-z0-9]/gi, '' );

    let _3gramStrengths = (3 / wordString.length) * 1.2;
    let sorted3gramsStrengths = _3gramStrengths *.80;
    //let permissive3gramsStrengths = _3gramStrengths *.75;

    let keys = [];

    keys.push( { 
        key: wordString + "_lit",
        c: 1.0,
    });

    if( lcStrip != wordString ) {
        keys.push( { 
            key: lcStrip + "_LClit",
            c: lcStrength,
        });    
    }

   if( (flags & L1) > 0 ) {

        //console.log("makeKeys L1")
        let sorted3grams = getSorted3grams( lc );
        
        for( let gram of sorted3grams ) {
            keys.push( { 
                key: gram + "_3gs",
                c: (sorted3gramsStrengths) * lcStrength,
            });
        }
    }

    if( (flags & L2) > 0 ) {
        /* Add unsorted 3-grams as well */
        //console.log("makeKeys L2")
        let _3grams = get_3grams( lc );

        for( let gram of _3grams ) {
            let bonus = 0.0;
            if( _3grams[0] === gram ) {
                bonus += startStrengthBonus;
            }
            else if( _3grams[ _3grams.length -1 ] === gram ) {
                bonus += endStrengthBonus;
            }
            keys.push( { 
                key: gram + "_3gu",
                c: (_3gramStrengths+bonus) * lcStrength,               
            });
        }
    }

    if( (flags & L3) > 0 ) {
        //console.log("makeKeys L3")
        let phonetic = phoneticify( lc ); /* a<>o, c<>s, etc. */
        
        keys.push( { 
                key: phonetic + "__phon",
                c: amplifyPhonetic,
        });
    }

    if( (flags & L4) > 0 ) {
        /* Add unsorted 3-grams as well */
        //console.log("makeKeys L2")
        let _3grams = get_3grams( phoneticify(lc) );

        for( let gram0 of _3grams ) {
            let gram = gram0;

            let bonus = 0.0;
            if( _3grams[0] === gram ) {
                gram = "_start_" + gram;
                bonus += startStrengthBonus;
            }
            else if( _3grams[ _3grams.length -1 ] === gram ) {
                gram = "_end_" + gram;
                bonus += endStrengthBonus;
            }
            keys.push( { 
                key: gram + "_3gup",
                c: (_3gramStrengths+bonus) * lcStrength,               
            });
        }
    }

    
    return keys;
}


function tuning( tmpIndex, exampleData0 = null, tuningDebug = false ) {

    /* Use default tuning data if not provided for reasonable out-of-the-box results */
    if( !exampleData0 ) {
        exampleData0 = englishTuningData;
    }

    let populateWords = exampleData0[0];
    for( let word of populateWords ) {
        store( tmpIndex, word, { word: word } );
    }


    /* Now prepare the tuning parameters */
    let shouldFindScore = 0;
    let shouldFindLowest = EXTREMELY_HIGH_CONFIDENCE;
    let shouldFindTop = 0;
    let shouldFindCount = 0;
    let shouldMissScore = 0;
    let shouldMissLowest = EXTREMELY_HIGH_CONFIDENCE;
    let shouldMissTop = 0;
    let shouldMissCount = 0;

    /* Test each tuning-case, and remember scores */
    let tests = exampleData0.slice(1);
    for( let testCase of tests ) {
        let word = testCase.word;
        let nearWords = testCase.nearWords;
        let farWords = testCase.farWords;

        /* Words that we want to match */
        for( let nearWord of nearWords ) {
            let results = search( tmpIndex, nearWord );
            if( results && results.length > 0 && results[0].key == word) {
                if( tuningDebug ) console.info("TUNING: Near-miss word '" + nearWord + "' correct word with score " + results[0].c+ "." );

                if( results[0].c != EXTREMELY_HIGH_CONFIDENCE ) {
                    shouldFindCount++;
                    shouldFindScore += results[0].c;
                    if( results[0].c < shouldFindLowest ) {
                        shouldFindLowest = results[0].c;
                    }
                    if( results[0].c > shouldFindTop ) {
                        shouldFindTop = results[0].c;
                    }
                }
            }
        }

        /* Words that we do not want to match */
        for( let farWord of farWords ) {
            let results = search( tmpIndex, farWord );
            if( results && results.length > 0 && results[0].key == word ) {
                if( tuningDebug ) console.info("TUNING WARNING: Far-miss word '" + farWord + "' incorrectly returned expected word '" + word + "' with score " + results[0].c+ "." );
                if( results[0].c != EXTREMELY_HIGH_CONFIDENCE ) {
                    shouldMissCount++;
                    shouldMissScore += results[0].c;
                    if( results[0].c < shouldMissLowest ) {
                        shouldMissLowest = results[0].c;
                    }
                    if( results[0].c > shouldMissTop ) {
                        shouldMissTop = results[0].c;
                    }
                }
            }
        }
    }

    /* debug summary of tuning */
    if( tuningDebug ) {
        console.log("TUNING SUMMARY:");
        if( shouldFindCount > 0 ) {
            console.log(" Match words found: " + shouldFindCount + 
                ", avg score: " + ( shouldFindScore / shouldFindCount ).toFixed(3) + 
                ", top score: " + shouldFindTop.toFixed(3) + 
                ", lowest score: " + shouldFindLowest.toFixed(3)
            );
        }
        if( shouldMissCount > 0 ) {
            console.log(" Should-miss words found: " + shouldMissCount + 
                ", avg score: " + ( shouldMissScore / shouldMissCount ).toFixed(3) + 
                ", top score: " + shouldMissTop.toFixed(3) + 
                ", lowest score: " + shouldMissLowest.toFixed(3)
            );
        }
    }

    let threshold = 
        (
         ( shouldFindScore / shouldFindCount ) + 
         ( shouldMissScore / shouldMissCount )
        ) / 2.0;

    if( tuningDebug ) console.log(" Suggested confidence threshold for matches: " + threshold.toFixed(3) );

    let normalizedFactor = 1/ shouldFindTop; 
    let normalizedThresshold = threshold * normalizedFactor;

    return {
        shouldFindTop: shouldFindTop,
        shouldFindAvg: ( shouldFindScore / shouldFindCount ),
        shouldMissAvg: ( shouldMissScore / shouldMissCount ),
        cThreshold: threshold,
        normalizedFactor: normalizedFactor,
        normalizedThresshold: normalizedThresshold
    }
}

export function construct( flags = L_DEFAULT, tuningData = null, tuningDebug = false) {
    let index = 
    {
        _____: {
            flags: flags,
            wordCount: 0,
            keyCount: 0,
            tuning: null
        }
    };

    let tmpIndex = 
    {
        _____: {
            flags: flags,
            wordCount: 0,
            keyCount: 0,
        }
    };

    index._____.tuning = tuning( tmpIndex, tuningData, tuningDebug );

    return index;
}


export function indexKeyCount( index ) {
    return index._____.keyCount;
}

export function indexWordCount( index ) {
    return index._____.wordCount;
}

export function getTuning( index ) {
    return index._____.tuning;
}

export function indexTotalPaths( index ) {
    let total = 0;
    for( let key in index ) {
        if( key != '_____' ) {
            total += index[ key ].length;
        }
    }
    return total;
}

export function store( index, keyword, data) {

    let flags = index._____.flags || L_DEFAULT;
    let keys = makeKeys( keyword, flags );
    for( let keyObj of keys ) {
        if( !index[ keyObj.key ] ) {
            index[ keyObj.key ] = [];
            index._____.keyCount++;
        }
        index[ keyObj.key ].push( 
            { 
                hardKey: keyword,  
                key: keyObj.key, 
                data: data, 
                c: keyObj.c, 
            } );
    }

    index._____.wordCount = ( index._____.wordCount || 0 ) + 1;
}


let phoneticCache = {};


// Build multiMap once at startup
const multiMap = {};
for (const map of phonMatches_en_multi) {
    for (const key in map) {
        multiMap[key] = map[key];
    }
}

function wordSimplePhoneticify(word0) {
    // Check cache first with original case
    let cached = phoneticCache[word0];
    if (cached) return cached;
    
    const word = word0.toLowerCase();
    
    // Check cache with lowercase (handles "Hello" after "hello" was cached)
    cached = phoneticCache[word];
    if (cached) {
        phoneticCache[word0] = cached;
        return cached;
    }
    
    const len = word.length;
    let out = "";
    let i = 0;
    
    while (i < len) {
        // 3-char match
        if (i <= len - 3) {
            const triMatch = multiMap[word[i] + word[i+1] + word[i+2]];
            if (triMatch !== undefined) {
                out += triMatch;
                i += 3;
                continue;
            }
        }
        
        // 2-char match
        if (i <= len - 2) {
            const diMatch = multiMap[word[i] + word[i+1]];
            if (diMatch !== undefined) {
                out += diMatch;
                i += 2;
                continue;
            }
        }
        
        // Single char
        out += singleCharPhonetic[word[i]] || word[i];
        i++;
    }
    
    phoneticCache[word] = out;
    phoneticCache[word0] = out;
    return out;
}

function wordSimplePhoneticify_orig(word0) {

    
    const word = word0.toLowerCase();

    if (phoneticCache[word]) {
        return phoneticCache[word];
    }

    let out = "";
    let i = 0;
    
    while (i < word.length) {
        // Check 3-char match first (ple)
        if (i <= word.length - 3) {
            const tri = word.substr(i, 3);
            const triMatch = multiMap[tri];
            if (triMatch !== undefined) {
                out += triMatch;
                i += 3;
                continue;
            }
        }
        // Check 2-char match
        if (i <= word.length - 2) {
            const di = word.substr(i, 2);
            const diMatch = multiMap[di];
            if (diMatch !== undefined) {
                out += diMatch;
                i += 2;
                continue;
            }
        }
        // Single char
        const c = word[i];
        out += singleCharPhonetic[c] || c;
        i++;
    }
    
    phoneticCache[word0] = out;
    return out;
}

function wordSimplePhoneticify_new( word0 ) {
    if( phoneticCache[ word0 ] ) {
        return phoneticCache[ word0 ];
    }
    let word = word0.toLowerCase();
    let out = "";
    for( let i=0; i< word.length; i++ ) {
        let c = word.charAt(i);
        let pc = phoneticify_1char( c );
        out += pc;
    }
    phoneticCache[ word0 ] = out;
    return out;
}


// Pre-compute these ONCE at module load, not per call
const CONSONANTS_PHONETIC = (() => {
    const consonants = "bcdfghjklmnpqrstvwxyz";
    const set = new Set();
    for (let i = 0; i < consonants.length; i++) {
        set.add(phoneticify(consonants[i]));
    }
    return [...set];
})();


function sameness(word1, word2) {

    const len1 = word1.length;
    const len2 = word2.length;
    const minLen = len1 < len2 ? len1 : len2;
    const maxLen = len1 > len2 ? len1 : len2;
    
    // Character matching - avoid charAt(), use direct indexing
    let score = 0;
    for (let i = 0; i < minLen; i++) {
        const char1 = word1[i];
        if (char1 === word2[i]) {
            score++;
        } else if ((i > 0 && char1 === word2[i - 1]) || 
                   (i < len2 - 1 && char1 === word2[i + 1])) {
            score += 0.5;
        }
    }
    
    const letterScore = score / minLen;
    
    // Length penalty
    const lengthScore = 1.0 - (((maxLen - minLen) / maxLen) * penaltiesObject.lengthDifferenceFactor);
    
    // Count spaces without regex
    let spaces1 = 0, spaces2 = 0;
    for (let i = 0; i < len1; i++) if (word1[i] === ' ') spaces1++;
    for (let i = 0; i < len2; i++) if (word2[i] === ' ') spaces2++;
    
    const spacesScore = 1.0 - (penaltiesObject.spaceCountFactor * Math.abs(spaces1 - spaces2));
    
    const score1 = letterScore * lengthScore * spacesScore;
    
    // Phonetic comparison - only compute once per word
    const ph_w1 = wordSimplePhoneticify(word1);
    const ph_w2 = wordSimplePhoneticify(word2);
    
    // Consonant penalty using pre-computed array
    let consonantPenaltyFactor = 1.0;
    const penaltyMultiplier = 1 - CONSONANT_PENALTY_FRACTION;
    
    for (let i = 0; i < CONSONANTS_PHONETIC.length; i++) {
        const c = CONSONANTS_PHONETIC[i];
        if ((ph_w1.indexOf(c) >= 0) !== (ph_w2.indexOf(c) >= 0)) {
            consonantPenaltyFactor *= penaltyMultiplier;
        }
    }
    
    // First letter comparison
    const firstLetterFactor = (ph_w1[0] === ph_w2[0]) ? FIRST_LETTER_FACTOR : 1.0;
    
    return score1 * firstLetterFactor * consonantPenaltyFactor;
}

function sameness_old( word1, word2 ) {
	
    let maxScore = Math.min( word1.length, word2.length );

    let score = 0;
    for(let i = 0; i < Math.min(word1.length, word2.length); i++) {
        let char1 = word1.charAt(i) || '';
        let char2a = word2.charAt(i) || '';

        let char2b = "";
        let char2c = "";


        if( char1 === char2a ) {
            score++;
        }
        else {

            if(i>0) {
                char2b = word2.charAt(i-1);
            }
            if(i<word2.length-1) {
                char2c = word2.charAt(i+1);
            }

            if( char1 === char2b || char1 === char2c ) {
                score+=.5;
            }
        }
    }

    //console.log("RawScore:", score, " MaxScore:", maxScore)
    let letterScore = score / maxScore;

    let lengthScore = 1.0;
    let lenDiff = Math.abs( word1.length - word2.length );
    let maxDiff = Math.max( word1.length, word2.length );

    let lengthPenalty = lenDiff / maxDiff;
    lengthScore = 1.0 - ( lengthPenalty * penaltiesObject.lengthDifferenceFactor );

    let word1SpacesCount = (word1.match(/ /g) || []).length;
    let word2SpacesCount = (word2.match(/ /g) || []).length;
    let spacesDiff = Math.abs( word1SpacesCount - word2SpacesCount );
    let spacesPenalty = penaltiesObject.spaceCountFactor * spacesDiff;
    let spacesScore = 1.0 - spacesPenalty;

    let score1 = ( ( letterScore * lengthScore * spacesScore ) );
    
    //now apply a penalty for constenat letter sequences that do not match
    let consonantPenaltyFactor = 1.0;
    let penaltyFraction = CONSONANT_PENALTY_FRACTION;

    let consonants = "bcdfghjklmnpqrstvwxyz";
    let consonants_arr = [];
    //loop through consonants, and phonetify them into array
    //don't add duplicates
    for( let i=0; i< consonants.length; i++ ) {
        let c = phoneticify( consonants.charAt(i) );
        if( consonants_arr.indexOf( c ) < 0 ) {
            consonants_arr.push( c );
        }
    }

    let ph_w1 = wordSimplePhoneticify( word1 );
    let ph_w2 = wordSimplePhoneticify( word2 );

 
    //loop through the consonants, and check if it appears in only one of the words
    //then apply penaly
    for( let i=0; i< consonants_arr.length; i++ ) {
        let c = consonants_arr[i];
        let inWord1 = ph_w1.indexOf( c ) >= 0;
        let inWord2 = ph_w2.indexOf( c ) >= 0;
        if( inWord1 != inWord2 ) {
            consonantPenaltyFactor *= (1-penaltyFraction);
        }
    }

    let firstLetterFactor = 1.0;
    //compare first character of ph_w1 and ph_w2
    let firstChar1 = ph_w1.charAt(0);
    let firstChar2 = ph_w2.charAt(0);
    if( firstChar1 == firstChar2 ) {
        firstLetterFactor = FIRST_LETTER_FACTOR;
    }

    return score1 * firstLetterFactor * consonantPenaltyFactor;
}

export function search( index, fuzzyKey, lowConfidenceCutoff = 0.1) {

    let flags = index._____.flags || L_DEFAULT;
    let keyCandidates = makeKeys( fuzzyKey, flags );
    let results = [];
    for( let keyObj of keyCandidates ) {

        let entries = index[ keyObj.key ];
        if( entries ) {

            for( let entry of entries ) {

                let confidence = Math.min( entry.c, keyObj.c );
                if( confidence == 1.0 && exactExitEarly) {

                    return [{
                            key: entry.hardKey, 
                            data: entry.data, 
                            c: 1.0, 
                            success: true,
                            rawC: EXTREMELY_HIGH_CONFIDENCE,

                        }];
                }


                results.push( { 
                        key: entry.key, 
                        wKey: entry.hardKey,
                        data: entry.data, 
                        c: entry.c,

                } );
            }
        }
    }

    if( results.length == 0 ) {
        return null;
    }

    if(trace) console.log("Got here with results:" , results)

    let now, elapsed;
    
    now = Date.now();
    elapsed = 0;
    results.sort( (a,b) => b.c - a.c );
    let results2 = [];
    let exitAt = 100;
    for( let result of results ) {

        results2.push( result );
        exitAt--;
        if( exitAt <= 0 ) {
            break;
        }
    }
    results = results2;
    
    elapsed = Date.now() - now; now = Date.now();
    if(perfTrace) console.log("FZMEASURE: sorting time: " + elapsed + " ms")

    now = Date.now();
    elapsed = 0;    
    let winners = sortWinners( results, fuzzyKey,  index._____.tuning, lowConfidenceCutoff );
    elapsed = Date.now() - now; now = Date.now();
    if(perfTrace) console.log("FZMEASURE: sorting winner time: " + elapsed + " ms")

    if( trace ) console.log("Winners:", winners );
    return winners;
}


function sortWinners( searchResults, fuzzyKey, tuning, lowConfidenceCutoff ) {

    let candidates = {};
    let candidatesArray = [];
    let elapsed, now;

    let list = searchResults;

    for( let result of list ) {

        let candidateKey = result.wKey;

        if(!candidates[ candidateKey ]) {

            let candidateRec = { 
                key: candidateKey, 
                c: 0.0, 
                data: result.data,
                evidenceParts: 0,
                totalSearchScore: 0 ,
                exact: false,

            };
            if( debugData ) {
                candidateRec.parts = "";
            }

            candidates[ candidateKey ] = candidateRec;
            candidatesArray.push( candidateRec );
        }
        
        if( result.c==1) {
            candidates[ candidateKey ].c = EXTREMELY_HIGH_CONFIDENCE; 
            candidates[ candidateKey ].exact = true;
            candidates[ candidateKey ].evidenceParts =  1;
        }
        else {
            if( !candidates[ candidateKey ].exact  ) {

                candidates[ candidateKey ].c += result.c;
                candidates[ candidateKey ].evidenceParts +=  1;
                if( debugData ) {
                    candidates[ candidateKey ].parts += " k(" + result.key + ")->("+result.c+")" ;
                }
            }
        }
        
    }


    now = Date.now();
    elapsed = 0;

    let keys = Object.keys( candidates );
    for( let candidateKey of keys ) { 
        let candidate = candidates[ candidateKey ];
        let w1= candidate.key;
        let w2= fuzzyKey;
        let score = sameness( w1, w2 );
        candidate.c = candidate.c * score;
        candidate.samenessScore = score;
    }

    elapsed = Date.now() - now; now = Date.now();
    if(perfTrace) console.log("FZMEASURE: saming2 time: " + elapsed + " ms")    

    if( tuning ) {
        let normalizedFactor = tuning.normalizedFactor;  
        let normalizedThresshold = tuning.normalizedThresshold;
        if( normalizedThresshold == null || normalizedThresshold < lowConfidenceCutoff ) {
            normalizedThresshold = lowConfidenceCutoff;
        }

        let candidates2Array = [];

        for( let candidate of candidatesArray ) {

            if( candidate.c == EXTREMELY_HIGH_CONFIDENCE ) {
                candidate.rawC = EXTREMELY_HIGH_CONFIDENCE;
                candidate.c = 1;
            }
            else {
                candidate.rawC = candidate.c;
                candidate.c = candidate.c * normalizedFactor;
                let partBonusValue = 1;
                let improve = (partBonus - 1);
                for(let i=0; i< candidate.evidenceParts; i++)  {
                    partBonusValue += improve;
                    improve /= 2;
                }
                candidate.prePBC = candidate.c;
                candidate.c *= partBonusValue;
                if( candidate.c > MAX_FUZZY_CONFIDENCE ) {

                    let confidencePlus = candidate.c - MAX_FUZZY_CONFIDENCE_LOWBOUND;
                    let maxPlusValue = MAX_FUZZY_CONFIDENCE - MAX_FUZZY_CONFIDENCE_LOWBOUND;
                    //scale it so that it confidencePlus can never exceed "maxPlusValue"
                    confidencePlus = ( confidencePlus / ( confidencePlus + maxPlusValue ) ) * maxPlusValue;
                    let confidence = MAX_FUZZY_CONFIDENCE_LOWBOUND + confidencePlus;

                    candidate.c = confidence;
                }
                candidate.partBonus = partBonusValue;
            }

            candidate.threshold = normalizedThresshold;

            let overThresshold = ( candidate.c >= candidate.threshold );
            candidate.success = overThresshold;  
            
            if( trace ) {
                console.log("Candidate:", candidate.key, " c:", candidate.c.toFixed(3),"cutoff:", cutOffFactor );
                console.log(" normalizedThresshold:", normalizedThresshold.toFixed(3), "cutOffValue:", 
                (normalizedThresshold * cutOffFactor).toFixed(3)  );
            }
            if( cutOffFactor ) {
                
                if( candidate.c >= ( normalizedThresshold * cutOffFactor ) ) {
                    candidates2Array.push( candidate );
                }
            }
            else {
                candidates2Array.push( candidate );
            }
        }

        if( trace ) console.log("Candidates after tuning:", candidates2Array );
        candidates2Array.sort( (a,b) => b.c - a.c );
        return candidates2Array;         
    }
    else {
        if( trace ) console.log("Candidates with no tuning:", candidatesArray );
        candidatesArray.sort( (a,b) => b.c - a.c );
        return candidatesArray; 
    }
}