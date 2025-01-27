#!/usr/bin/env node

// const {JSDOM} = require('jsdom');
const fs = require('fs');

let text = process.argv[2];
text = text.replace(/[0-9]/g, '');
text = text.replace(/[^a-zA-Z]/g, ' ');
text = text.toLowerCase();
text = text.replace(/\s+/g, ' ');
const arr = text.split(' ');

const stopwords = fs.readFileSync('d/stopwords.txt', 'utf8');
const stopwordsSet = new Set(stopwords.split('\n').map((item) => item.trim()));


let outputStr = '';
for (const word of arr) {
  if (!stopwordsSet.has(word)) {
    outputStr += word + '\n';
  }
}

outputStr = outputStr.substring(0, outputStr.length-1);
console.log(outputStr);
