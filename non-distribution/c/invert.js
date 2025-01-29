#!/usr/bin/env node

const baseURL = process.argv[2];
const terms = process.argv[3].split('\n');
const tracker = {};
for (let i = 0; i < terms.length; i++) {
  const term = terms[i];
  if (term in tracker) {
    tracker[term]+= 1;
  } else {
    tracker[term] = 1;
  }
}

let outputStr = '';
for (const k in tracker) {
  outputStr += k + ' | ' + tracker[k] + ' | ' + baseURL + '\n';
}
console.log(outputStr.substring(0, outputStr.length-1));
