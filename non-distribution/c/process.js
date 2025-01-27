#!/usr/bin/env node

/*
# convert to ASCII;
# then remove stopwords (inside d/stopwords.txt)

# Commands that will be useful: tr, iconv, grep
*/
const {JSDOM} = require('jsdom');
const fs = require('fs');
// TODO: not needed? -> const {URL} = require('url');

// 1. Read the base URL from the command-line argument using `process.argv`.
let text = process.argv[2];
text = text.replace(/[0-9]/g, '');
text = text.replace(/[^a-zA-Z]/g, " "); 
text = text.toLowerCase();
text = text.replace(/\s+/g, " "); 
const arr = text.split(" ");

const stopwords = fs.readFileSync('d/stopwords.txt', 'utf8');
const stopwordsSet = new Set(stopwords.split('\n').map(item => item.trim()));

// const res = execSync(`${text} | tr -c '[:alnum:]' ' ' | tr '[:digit:]' ' ' | tr -s ' ' ' ' | tr ' ' '\n' | tr '[:upper:]' '[:lower:]' | iconv -f utf-8 -t ascii`);
// console.log(res.trim());

let outputStr = '';
for (let word of arr) {
  if (!stopwordsSet.has(word)) {
    outputStr += word + '\n';
  }
}

outputStr = outputStr.substring(0, outputStr.length-1);
console.log(outputStr);
