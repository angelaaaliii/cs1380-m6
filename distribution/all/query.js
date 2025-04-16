/**
 * Querier used in M6. At this point, the indexer has executed MapReduce and has its results
 * distributed amongst nodes in an out group. Each result is in the following form:
 *          
 * {"dog" : [["url1" : 0.56 (TF)], ["url2" : 0.44], ... ]}
 * {"cat": [["url3" : 0.71], ["url4" : 0.23], ... ]}
 * 
 * {"cat": [6, 10], "dog": [5, 10]}
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
      let numSearchResults = splitInput[2];
      const queryTerm = splitInput[1];

      // Retrieve all keys from out group
      global.distribution[outGroup].store.get(null, (e, keys) => { 
        if (keys.length === 0) {
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
                    if (entries != null) {
                      docTFIDFList.push(entries);
                    }  
                  }
              }
              if (docTFIDFList.length === 0) {
                callback(null, []);
                return;
              }
              // Flatten and sort entries in list by TF-IDF score
              docTFIDFList = docTFIDFList.flat()
              docTFIDFList.sort((a, b) => b[1] - a[1]);
              // Fetch the top numSearchResults results
              let res = [];
              numSearchResults = Math.min(numSearchResults, docTFIDFList.length);
              for (let i = 0; i < numSearchResults; i++) {
                  res.push(docTFIDFList[i]);
              }
              callback(null, res);
            }
          })
        });
    });
  }
    return {execQuery};
}

module.exports = query;