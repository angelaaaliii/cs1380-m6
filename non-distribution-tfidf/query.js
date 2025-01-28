#!/usr/bin/env node


const {execSync} = require('child_process');
const fs = require('fs');

let outputStr = '';


const args = process.argv.slice(2); // Get command-line arguments
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}

// TFIDF lab
// number of docs in corpus for IDF - get by counting urls in visited
let totalDocsCount = 0;
fs.readFile('d/visited.txt', 'utf8', function(err, data) {
  if (err) {
    console.log(err);
  }
  totalDocsCount = data.split('\n').length-1;
  const indexRes = queryGlobalIndex(args);

  for (let j = 0; j < indexRes.length-1; j++) {
    // # of docs the term appears in
    const lineSplit = indexRes[j].split(' | ');
    const term = lineSplit[0];
    const noTermArr = lineSplit[1].split(' ');
    const termDocsCount = (noTermArr.length)/2;

    // calculating IDF for word/doc
    const idf = Math.log10(totalDocsCount/termDocsCount).toFixed(3);

    // set up arr for tfidf per url
    const tfidfArr = [];

    for (let i = 0; i < noTermArr.length; i+= 2) {
      // calculate TFIDF for word/doc
      tfidfArr.push([noTermArr[i], (Number(noTermArr[i+1]) * idf).toFixed(3)]);
    }
    tfidfArr.sort((a, b) => b[1] - a[1]);

    let outputLine = term + ' | ';
    for (let i = 0; i < tfidfArr.length; i++) {
      outputLine += tfidfArr[i][0] + ' ' + tfidfArr[i][1] + ' ';
    }
    outputLine = outputLine.substring(0, outputLine.length-1) + '\n';
    outputStr += outputLine;
  }

  console.log(outputStr.substring(0, outputStr.length-1));
});


function queryGlobalIndex(args) {
  const input = args.join(' ');
  const processInput = execSync(`echo "${input}" | ./c/process.sh "" | ./c/stem.js | tr "\r\n" "  "`, {encoding: 'utf-8'}).toString();

  const grepCommand = `grep -h "${processInput}" "d/global-index.txt"`;
  const res = execSync(grepCommand, {encoding: 'utf-8'});
  return res.split('\n');
}
