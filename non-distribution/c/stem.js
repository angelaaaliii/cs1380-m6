#!/usr/bin/env node

/*
Convert each term to its stem
Usage: ./stem.js <input >output
*/

import readline from 'readline';
import natural from 'natural';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', function(line) {
  const stem = natural.PorterStemmer.stem(line);
  console.log(stem);
  // Print the Porter stem from `natural` for each element of the stream.
});
