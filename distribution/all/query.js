// import wordListPath from 'word-list';
// import fs from 'fs';

// import pkg from 'natural';
// const { LevenshteinDistance } = pkg;
const readline = require('readline');
// import { execSync } from 'child_process';
// import Fuse from 'fuse.js';

/**
 * Querier used in M6. At this point, the indexer has executed MapReduce and has its results
 * distributed amongst nodes in an out group. Each result is in the following form:
 *          
 * {"dog" : [["url1" : 0.56], ["url2" : 0.44], ... ]}
 * {"cat": [["url3" : 0.71], ["url4" : 0.23], ... ]}
 * 
 * The querier will retrieve these results and then using the word provided as input, return a 
 * list of documents 
 * 
 * @param {string} input the word or phrase that the user is querying for within the corpus
 * @param {string} outGroup the group to which the indexer results is written to
 * @return a dictionary of {word: [docID, wordFrequency, docWordCount, totalDocs]}
 */

function query() {
    
    function execQuery(input, outGroup, callback) {
      if (!input.trim()) return;

      // Parse the input
      const splitInput = input.trim().split(" ");
      const numSearchResults = splitInput[2];
      const queryTerm = splitInput[1];

      // Retrieve all keys from out group
      global.distribution[outGroup].store.get(null, (e, keys) => {  
        if (e && Object.keys(e).length > 0) {
          callback(new Error("could not retrieve index results"), null);
          return;
        }
        const numKeys = keys.length;
        let valArr = [];
        keys.forEach(key => {
          global.distribution[outGroup].store.get(key, (e, v) => {
            valArr.push([key, v]);
            if (valArr.length === numKeys) {
              // Once we have the results, we want to first aggregate all entries of the n-grams that contain the search query
              let docTFIDFList = [];
              for (const [key, entries] of valArr) {
                  // Check to see if the the key/word contains the query term
                  if (key.includes(queryTerm)) {
                      docTFIDFList.push(entries);
                  }
              }
              // Flatten and sort entries in list by TF-IDF score
              docTFIDFList = docTFIDFList.flat()
              docTFIDFList.sort((a, b) => b[1] - a[1]);

              // Fetch the top numSearchResults results
              let res = [];
              for (let i = 0; i < numSearchResults; i++) {
                  res.push(docTFIDFList[i]);
              }
              console.log('\n');
              console.log("res: ", res);
              console.log('\n');
              callback(null, res);
            }
          })
        });
    });
    }
    return {execQuery};
}

module.exports = query;

// // REPL Setup
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   prompt: 'Enter search query (or type "exit" to quit): ',
// });

// // Start REPL
// rl.prompt();

// rl.on('line', (line) => {
//   if (line.trim().toLowerCase() === 'exit') {
//     rl.close();
//   } else {
//     query(line.trim());
//     rl.prompt();
//   }
// });

// rl.on('close', () => {
//   console.log('\nExiting');
//   process.exit(0);
// });