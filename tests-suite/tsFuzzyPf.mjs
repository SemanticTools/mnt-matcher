const useWip = process.argv.includes('--wip');
const srcPath = useWip ? '../src-wip/fmIndex.mjs' : '../src/fmIndex.mjs';
const fmIndex = await import(srcPath);

let fs = await import('fs/promises');

console.log("Testing Fuzzy Matching MNT-Match Module (Performance)" );

//load indexfile not (using fmIndex library) ./more/queryTestPf-data.fzIndex.json and parse as JSON (not using fmIndex.loadIndexFile)


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
    
    { word: "house", tests: [ "hus", "hous", "hause", "houze", "hoose", "hoos" ]},
    { word: "country", tests: [ "contry", "countries", "contries", "kontry"] },
    { word: "example", tests: [ "example", "exampel", "sample", "examplo"] },
    { word: "car", tests: [ "car", "crr", "*caa", "kar" ] },
    { word: "celestial", tests: [ "celetsil", "celestil", "selestial","celeste" ] },
    { word: "cow-boy", tests: [ "cowboy", "cow boy", "kowboy","kow-boy", "cow-bo", "cow-boj", "caw-baj" ] },
    { word: "random", tests: [ "marie curie", "*prescription", "fiery", "utopia" ] },
   
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


let performanceQuickestTime = 99999999;
let performanceSlowestTime = 0;
let performanceAllTime = 0;
let performanceRuns = 0;

let performanceQuickestTimeExact = 99999999;
let performanceSlowestTimeExact = 0;
let performanceAllTimeExact = 0;
let performanceRunsExact = 0;

let performanceQuickestTimeNonExact = 99999999;
let performanceSlowestTimeNonExact = 0;
let performanceAllTimeNonExact = 0;
let performanceRunsNonExact = 0;


let performanceQuickestTimeFail = 99999999;
let performanceSlowestTimeFail = 0;
let performanceAllTimeFail = 0;
let performanceRunsFail = 0;

let exactMatches = {};
let nonExactMatches = {};

for( let repeats=0; repeats<1000; repeats++ ) {
    for( let testCase of testCases ) {

        
        for( let testKeyDef of testCase.tests ) {

            
            let testKey = testKeyDef;

            if( trace ) console.log("");
            if( trace ) console.log("=Testing with test word:", testKey );

            let now = Date.now();
            let results = fmIndex.search( gIndex, testKey );   
            let elapsed = Date.now() - now;

            performanceAllTime += elapsed;
            performanceRuns++;
            if( elapsed < performanceQuickestTime ) performanceQuickestTime = elapsed;
            if( elapsed > performanceSlowestTime ) performanceSlowestTime = elapsed;


            if( trace ) console.log("Found " , results, " for testKey:", testKey );

            let success = false;
            if( results && results.length > 0 ) {
                    success=true;
            }

            if( success ) {
                let resultWord = results[0].key;
                if( resultWord == testKey ) {
                    
                    performanceAllTimeExact += elapsed;
                    performanceRunsExact++;
                    if( elapsed < performanceQuickestTimeExact ) performanceQuickestTimeExact = elapsed;
                    if( elapsed > performanceSlowestTimeExact ) performanceSlowestTimeExact = elapsed;

                    exactMatches[resultWord] = (true);

                }
                else {
                    //non exact
                    performanceAllTimeNonExact += elapsed;
                    performanceRunsNonExact++;
                    if( elapsed < performanceQuickestTimeNonExact ) performanceQuickestTimeNonExact = elapsed;
                    if( elapsed > performanceSlowestTimeNonExact ) performanceSlowestTimeNonExact = elapsed;

                    nonExactMatches[resultWord] = (true);
                }
            }

            if( !success ) {
                performanceAllTimeFail += elapsed;
                performanceRunsFail++;
                if( elapsed < performanceQuickestTimeFail ) performanceQuickestTimeFail = elapsed;
                if( elapsed > performanceSlowestTimeFail ) performanceSlowestTimeFail = elapsed;
            }     
            
            testsCount++;
        }
    }
}



//Show performance
console.log("");
console.log("===== TOTAL PERFORMANCE SUMMARY =====");
console.log("Search calls made:", performanceRuns );
console.log("Quickest Search Time (ms):", performanceQuickestTime );
console.log("Slowest Search Time (ms):", performanceSlowestTime );
console.log("Average Search Time (ms):", (performanceAllTime / performanceRuns).toFixed(2) );


console.log("");
console.log("===== EXACT MATCH PERFORMANCE SUMMARY =====");
console.log("Exact Match Search calls made:", performanceRunsExact );
console.log("Quickest Exact Match Search Time (ms):", performanceQuickestTimeExact );
console.log("Slowest Exact Match Search Time (ms):", performanceSlowestTimeExact );
console.log("Average Exact Match Search Time (ms):", (performanceAllTimeExact / performanceRunsExact).toFixed(2) );

console.log("");
console.log("===== NON-EXACT MATCH PERFORMANCE SUMMARY =====");
console.log("Non-Exact Match Search calls made:", performanceRunsNonExact );
console.log("Quickest Non-Exact Match Search Time (ms):", performanceQuickestTimeNonExact );
console.log("Slowest Non-Exact Match Search Time (ms):", performanceSlowestTimeNonExact );
console.log("Average Non-Exact Match Search Time (ms):", (performanceAllTimeNonExact / performanceRunsNonExact).toFixed(2) );

console.log("");
console.log("===== FAILED MATCH PERFORMANCE SUMMARY =====");
console.log("Failed Match Search calls made:", performanceRunsFail );
console.log("Quickest Failed Match Search Time (ms):", performanceQuickestTimeFail );
console.log("Slowest Failed Match Search Time (ms):", performanceSlowestTimeFail );
console.log("Average Failed Match Search Time (ms):", (performanceAllTimeFail / performanceRunsFail).toFixed(2) );

//dump exact matches
console.log("");
console.log("===== EXACT MATCHES =====");
for( let matchKey in exactMatches ) {
    console.log(" Exact Match Found for key:", matchKey );
}

//dump non exact matches
console.log("");
console.log("===== NON-EXACT MATCHES =====");
for( let matchKey in nonExactMatches ) {
    console.log(" Non-Exact Match Found for key:", matchKey );
}