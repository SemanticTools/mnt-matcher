const useWip = process.argv.includes('--wip');
const srcPath = useWip ? '../src-wip/fmIndex.mjs' : '../src/fmIndex.mjs';
const fmIndex = await import(srcPath);


console.log("Testing Fuzzy Matching MNT-Match Module (Large data)" );

//load indexfile not (using fmIndex library) ./more/queryTestPf-data.fzIndex.json and parse as JSON (not using fmIndex.loadIndexFile)

let fs = await import('fs/promises');
let indexFileData = await fs.readFile( './tests-suite/more/queryTestPf-data.fzIndex.json', 'utf8' );
let indexes = JSON.parse( indexFileData );
indexFileData = null; //free memory

let gIndex = fmIndex.unserialize( indexes["gIndex"] );
delete indexes["gIndex"];//free memory
let rIndex = fmIndex.unserialize( indexes["rIndex"] );
delete indexes["rIndex"];//free memory
let catIndex = fmIndex.unserialize( indexes["catIndex"] );
delete indexes["catIndex"];//free memory
indexes = null; //free memory


//write gIndex into a file in nicified JSON format for debugging
let fileName = './.tmp.fzTestPf.gIndex.json';
await fs.writeFile( fileName, JSON.stringify( gIndex, null, 2 ), 'utf8' );
console.log("Wrote gIndex to file:", fileName, " for debugging purposes" );



let testCasesAll = [
    
    { word: "house", tests: [ "*hus", "hous", "hause", "houze", "hoose", "*hoos" ]},
    { word: "country", tests: [ "contry", "countries", "contries", "kontry"] },
    { word: "example", tests: [ "example", "exampel", "*sample", "examplo"] },
    { word: "car", tests: [ "car", "*crr", "*caa", "kar" ] },
    { word: "celestial", tests: [ "celetsil", "celestil", "selestial","celeste" ] },
    { word: "cow-boy", tests: [ "cowboy", "cow boy", "kowboy","kow-boy", "cow-bo", "cow-boj", "caw-baj" ] },

    //Crazy ones, make sure we don't match
    { word: "fierutiopreu", tests: [ "*marie curie", "*prescription", "*fiery", "*utopia" ] },
   
];


let testCases = testCasesAll; //run all tests

let trace = false;
let debug = true;

//check if any commandline option has -d or --debug to enable debug mode, or -t or --trace to enable trace mode
let args = process.argv.slice(2);
for( let arg of args ) {
    if( arg === "-d" || arg === "--debug" ) {
        debug = true;
    }
    if( arg === "-t" || arg === "--trace" ) {
        trace = true;
    }
}


let testsCount = 0;
let successes = 0;
let failures = 0;
let failureList = [];

for( let testCase of testCases ) {

    console.log("");
    console.log("");    
    console.log("#Test Cases for word:", testCase.word );


    //let keys = fmIndex.makeKeys( testCase.word,LEVEL );
    //if( trace ) console.log("Generated Keys:", keys );
    //if( trace ) console.log("Check index contents:", JSON.stringify( index, null, 2 ) );
    
    for( let testKeyDef of testCase.tests ) {

        console.log("#Test Case with phrase: ", testKeyDef );
        
        let testKey = testKeyDef;
        //if starts with * then we should fail
        let shouldFail = false;
        if( testKeyDef.startsWith("*") ) {
            shouldFail = true;
            testKey = testKeyDef.substring(1);
        }

        if( trace ) console.log("");
        if( trace ) console.log("=Testing with test word:", testKey );

        let results = fmIndex.search( gIndex, testKey );   

        if( trace ) console.log("Found " , results, " for testKey:", testKey );

        let success = false;
        let matches = false;
        let lowMatch = 0;
        let lowMatch2 = 0;
        let winnerKey = null;
        if( results && results.length > 0 ) {
            matches = true;
            if( results[0].success && results[0].key == testCase.word) {
                success=true;

            }
            else {
                //console.log( "No success, why dimmy, why?" )
                //console.log( results[0].success, results[0], testCase.word )
            }
            lowMatch = results[0].c;
            lowMatch2 = results[ 0 ].rawC;
            winnerKey = results[ 0 ].key;
        }

        if( !shouldFail ) {
            if( success ) {
                    successes++;
                    console.log(" SUCCESS: Found matches for key:", testKey, "=>", results[0].c, " (raw:", lowMatch2, ")");
            }
            else {
                    failures++;
                    failureList.push( { word: testCase.word, testKey: testKey, confidence: lowMatch,
                        rawConfidence: lowMatch2, winnerKey: winnerKey
                    } );

                    if( !matches ) {
                        console.log(" FAILURE: No matches found for key:", testKey );
                    }
                    else {
                        console.log(" FAILURE: Matches found but not successful for key:", testKey, "=>", results[0].c, " (raw:", lowMatch2, ")" );
                    }
                    
            }
        }
        else {
            if( !success ) {
                    successes++;
                    success = true;

                    if( !matches ) {
                        console.log(" SUCCESS: No matches found for key:", testKey );
                    }
                    else {
                        console.log(" SUCCESS: Expected failure, and found only low confidence matches for key:", testKey, "=>", results[0].c, " (raw:", lowMatch2, ")");
                    }
            }
            else {
                    failures++;
                    failureList.push( { word: testCase.word, testKey: testKey, confidence: lowMatch,
                        rawConfidence: lowMatch2, winnerKey: winnerKey
                    } );

                    console.log(" FAILURE: Matches found for key:", testKey, "=>", results[0].c, " (raw:", lowMatch2, ")" );
                    
            }
        }
        
        testsCount++;
    }
}

//Make summary
console.log("");
console.log("===== TEST ERRORS =====");

//dump failure list
if( failures > 0 ) {
    console.log("Failed Tests:");
    for( let failure of failureList ) {
        console.log( " Test Key:", failure.testKey, " Target-Word:", failure.word, "Found-Word:", failure.winnerKey, "Confidence:", failure.confidence.toFixed(2), " (raw:", failure.rawConfidence.toFixed(2), ")");
    }
}


//show tuning
console.log("");
console.log("===== TUNING PARAMETERS ===== ");
console.log( JSON.stringify( fmIndex.getTuning( gIndex ), null, 2 ) );

console.log("");
console.log("===== TEST SUMMARY =====");
console.log("Total Test Cases:", testsCount );
console.log("Total Successful Tests:", successes );
console.log("Total Failed Tests:", failures );
//let keywordsPerWord = fmIndex.makeKeys("dummy", LEVEL ).length;
//console.log("Average Keys per Word (expected):", keywordsPerWord );