#!/usr/bin/env node

/*
Extract all text from an HTML page.
Usage: ./getText.js <input > output
*/

// const {convert} = require('html-to-text');
// const readline = require('readline');
// const {options} = require('yargs');

import { convert } from 'html-to-text';
import readline from 'readline';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const options = yargs(hideBin(process.argv)).argv;


const rl = readline.createInterface({
  input: process.stdin,
});

let htmlInput = '';

rl.on('line', (line) => {
  // 1. Read HTML input from standard input, line by line using the `readline` module.
  htmlInput += line;
});

// 2. after all input is received, use convert to output plain text.
rl.on('close', () => {
  const text = convert(htmlInput, options);
  console.log(text);
});


