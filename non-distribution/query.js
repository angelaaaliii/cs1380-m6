#!/usr/bin/env node

import wordListPath from 'word-list';
import fs from 'fs';
import pkg from 'natural';
const { LevenshteinDistance } = pkg;
import readline from 'readline';
import { execSync } from 'child_process';
import Fuse from 'fuse.js';

// Retrieve list of words for spell-checking
const words = new Set(fs.readFileSync(wordListPath, 'utf8').split('\n'));
const fuse = new Fuse(words, {
  includeScore: true,  
  threshold: 0.4,      
  distance: 100,      
  minMatchCharLength: 2, 
});

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

function query(input) {
  if (!input.trim()) return;

  console.log(`Searching for: "${input}"\n`);

  let processInput;
  let grepCommand;
  const path = process.cwd();
  const pathArr = path.split('/');

  if (pathArr[pathArr.length - 1] === 't') {
    processInput = execSync(`echo "${input}" | ../c/process.sh | ../c/stem.js | tr "\r\n" "  "`, {encoding: 'utf-8'}).toString().trim();
    grepCommand = `grep -h "${processInput}" "d/global-index.txt"`;
  } else {
    processInput = execSync(`echo "${input}" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  "`, {encoding: 'utf-8'}).toString().trim();
    grepCommand = `grep -h "${processInput}" "d/global-index.txt"`;
  }

  let res = '';
  try {
    res = execSync(grepCommand, {encoding: 'utf-8'});
    const resArr = res.split('\n').filter(Boolean);

    resArr.sort((a, b) => {
      const numA = parseInt(a.match(/\d+$/)[0], 10);
      const numB = parseInt(b.match(/\d+$/)[0], 10);
      return numB - numA;
    });
    console.log('Search Results:\n', resArr.join('\n') + '\n');
  } catch (err) {
    if (!words.has(input)) {
      console.log(`No results found for "${input}". Checking for possible misspellings...`);
      const correctedTerm = spellCheck(input);
      if (correctedTerm.length > 0) {
        console.log(`Did you mean: "${correctedTerm[0]}"? Searching again...`);
        return query(correctedTerm[0]);
      } else {
        console.log('No results found.');
      }
    }
    console.log('No results found.');
  }
}

// Function to check for spelling errors
function spellCheck(query) {
  let bestMatch = null;
  let bestDistance = Infinity;
  
  words.forEach(word => {
    let distance = LevenshteinDistance(query, word);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = word;
    }
  });  
  return bestMatch ? [bestMatch] : [];
}

// REPL Setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Enter search query (or type "exit" to quit): ',
});

// Start REPL
rl.prompt();

rl.on('line', (line) => {
  if (line.trim().toLowerCase() === 'exit') {
    rl.close();
  } else {
    query(line.trim());
    rl.prompt();
  }
});

rl.on('close', () => {
  console.log('\nExiting');
  process.exit(0);
});
