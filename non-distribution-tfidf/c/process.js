#!/usr/bin/env node

// const {JSDOM} = require('jsdom');
const fs = require('fs');

let text = process.argv[2];
text = text.replace(/[0-9]/g, '');
text = text.replace(/[^a-zA-Z]/g, ' ');
text = text.toLowerCase();
text = text.replace(/\s+/g, ' ');
const arr = text.split(' ');

const url = process.argv[3];

const stopwords = fs.readFileSync('d/stopwords.txt', 'utf8');
const stopwordsSet = new Set(stopwords.split('\n').map((item) => item.trim()));


let outputStr = '';
for (const word of arr) {
  if (!stopwordsSet.has(word)) {
    outputStr += word + '\n';
  }
}

outputStr = outputStr.substring(0, outputStr.length-1);

if (url.length > 0) {
  // not processing query terms, processing text content of a page, tracking # of words in a document
  // TFIDF LAB
  const numWords = outputStr.split('\n').length;
  fs.appendFile('d/corpus-tracker.txt', url + ' ' + numWords + '\n', function(err) {
    if (err) throw err;
  });
}

console.log(outputStr);
