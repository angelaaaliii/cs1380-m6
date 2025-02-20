#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: cat input | ./merge.js global-index > output

The inverted indices have the different structures!

Each line of a local index is formatted as:
  - `<word/ngram> | <frequency> | <url>`

Each line of a global index is be formatted as:
  - `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
  - Where pairs of `url` and `frequency` are in descending order of frequency
  - Everything after `|` is space-separated

-------------------------------------------------------------------------------------
Example:

local index:
  word1 word2 | 8 | url1
  word3 | 1 | url9
EXISTING global index:
  word1 word2 | url4 2
  word3 | url3 2

merge into the NEW global index:
  word1 word2 | url1 8 url4 2
  word3 | url3 2 url9 1

Remember to error gracefully, particularly when reading the global index file.
*/

const fs = require('fs');
const readline = require('readline');

// const baseURL = '/usr/src/app/non-distribution/';

// The `compare` function can be used for sorting.
const compare = (a, b) => {
  if (a.freq > b.freq) {
    return -1;
  } else if (a.freq < b.freq) {
    return 1;
  } else {
    return 0;
  }
};
const rl = readline.createInterface({
  input: process.stdin,
});

// 1. Read the incoming local index data from standard input (stdin) line by line.
let localIndex = '';
rl.on('line', (line) => {
  localIndex += line + '\n';
});

rl.on('close', () => {
  // 2. Read the global index name/location, using process.argv
  // and call printMerged as a callback
  fs.readFile(process.argv[2], 'utf8', printMerged);
});

const printMerged = (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');
  localIndexLines.pop();
  globalIndexLines.pop();

  const local = {};
  const global = {};
  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object where keys are terms and values contain `url` and `freq`.
  for (const line of localIndexLines) {
    const lineArr = line.split(' | ');
    if (lineArr.length == 3) {
      const term = lineArr[0];
      const freq = Number(lineArr[1]);
      const url = lineArr[2];
      if (!Number.isNaN(freq) && term.length > 0 && url.length > 0) {
        local[term] = {url, freq};
      }
    }
  }

  // 4. For each line in `globalIndexLines`, parse them and add them to the `global` object where keys are terms and values are arrays of `url` and `freq` objects.
  // Use the .trim() method to remove leading and trailing whitespace from a string.
  for (const line of globalIndexLines) {
    const lineArr = line.trim().split(' | ');

    if (lineArr.length == 2) {
      const term = lineArr[0];
      const urlFreqArr = lineArr[1].split(' ');
      if (urlFreqArr.length % 2 != 0) {
        console.error('uneven pairs of freq, url in global index');
        return;
      }
      const urlfs = [];
      for (let i = 0; i < urlFreqArr.length; i+=2) {
        const url = urlFreqArr[i];
        const freq = Number(urlFreqArr[i+1]);
        if (url.length == 0 || Number.isNaN(freq)) {
          console.error('invalid url/freq in global index line');
          return;
        }

        urlfs.push({url, freq});
      }
      global[term] = urlfs; // Array of {url, freq} objects
    }
  }

  // 5. Merge the local index into the global index:
  // - For each term in the local index, if the term exists in the global index:
  //     - Append the local index entry to the array of entries in the global index.
  //     - Sort the array by `freq` in descending order.
  // - If the term does not exist in the global index:
  //     - Add it as a new entry with the local index's data.
  for (const term in local) {
    if (term in global) {
      global[term].push(local[term]);
      global[term].sort(compare);
    } else {
      global[term] = [local[term]];
    }
  }

  // 6. Print the merged index to the console in the same format as the global index file:
  //    - Each line contains a term, followed by a pipe (`|`), followed by space-separated pairs of `url` and `freq`.
  for (const term in global) {
    let printStr = term + ' |';
    for (const urlFreqPair of global[term]) {
      printStr += ' ' + urlFreqPair.url + ' ' + urlFreqPair.freq;
    }
    console.log(printStr);
  }
  return;
};
