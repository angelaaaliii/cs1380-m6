#!/usr/bin/env node

/*
Search the inverted index for a particular (set of) terms.
Usage: ./query.js your search terms

The behavior of this JavaScript file should be similar to the following shell pipeline:
grep "$(echo "$@" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  ")" d/global-index.txt

Here is one idea on how to develop it:
1. Read the command-line arguments using `process.argv`. A user can provide any string to search for.
2. Normalize, remove stopwords from and stem the query string — use already developed components
3. Search the global index using the processed query string.
4. Print the matching lines from the global index file.

Examples:
./query.js A     # Search for "A" in the global index. This should return all lines that contain "A" as part of an 1-gram, 2-gram, or 3-gram.
./query.js A B   # Search for "A B" in the global index. This should return all lines that contain "A B" as part of a 2-gram, or 3-gram.
./query.js A B C # Search for "A B C" in the global index. This should return all lines that contain "A B C" as part of a 3-gram.

Note: Since you will be removing stopwords from the search query, you will not find any matches for words in the stopwords list.

The simplest way to use existing components is to call them using execSync.
For example, `execSync(`echo "${input}" | ./c/process.sh`, {encoding: 'utf-8'});`
*/


// TODO: delete -> const fs = require('fs');
const {execSync} = require('child_process');
// TODO: delete -> const path = require('path');
// TODO: delete -> const {groupEnd} = require('console');


function query(args) {
  const input = args.join(' ');

  const path = process.cwd();
  const pathArr = path.split('/');
  let processInput = '';
  let grepCommand = '';
  if (pathArr[pathArr.length-1] == 't') {
    // for student test to run
    processInput = execSync(`echo "${input}" | ../c/process.sh | ../c/stem.js | tr "\r\n" "  "`, {encoding: 'utf-8'}).toString().trim();
    grepCommand = `grep -h "${processInput}" "d/global-index.txt"`;
  } else {
    processInput = execSync(`echo "${input}" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  "`, {encoding: 'utf-8'}).toString().trim();
    grepCommand = `grep -h "${processInput}" "d/global-index.txt"`;
  }

  // const res = execSync(`grep -h "${processInput}" "d/global-index.txt"`, {encoding: 'utf-8'}).toString();
  let res = '';
  try {
    res = execSync(grepCommand, {encoding: 'utf-8'});
  } catch (err) {
    res = '';
  }
  console.log(res.trim());
}


const args = process.argv.slice(2); // Get command-line arguments
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}

query(args);
