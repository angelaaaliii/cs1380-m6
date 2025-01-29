#!/usr/bin/env node

const input = process.argv[2];
const arr = input.split('\n');

const output = [];

// 3 grams
for (let i = 0; i < arr.length-2; i++) {
  output.push(arr[i] + ' ' + arr[i+1] + ' ' + arr[i+2]);
}

// 2 grams
for (let i = 0; i < arr.length-1; i++) {
  output.push(arr[i] + ' ' + arr[i+1]);
}

for (const word of arr) {
  output.push(word);
}

let outputStr = '';
for (const word of output) {
  outputStr += word + '\n';
}
console.log(outputStr.substring(0, outputStr.length-1));


