#!/usr/bin/env node

/*
Extract all URLs from a web page.
Usage: ./getURLs.js <base_url>
*/

const readline = require('readline');
const {JSDOM} = require('jsdom');

// 1. Read the base URL from the command-line argument using `process.argv`.
let baseURL = process.argv[2];
const emptyBase = "";
if (baseURL.endsWith('index.html')) {
  baseURL = baseURL.slice(0, baseURL.length - 'index.html'.length);
} 
else if (!baseURL.endsWith('/')) {
  baseURL += '/';
}

const rl = readline.createInterface({
  input: process.stdin,
});

let htmlStr = '';
rl.on('line', (line) => {
  // 2. Read HTML input from standard input (stdin) line by line using the `readline` module.
  htmlStr += line;
});

rl.on('close', () => {
  // 3. Parse HTML using jsdom
  const dom = new JSDOM(htmlStr);

  // 4. Find all URLs:
  //  - select all anchor (`<a>`) elements) with an `href` attribute using `querySelectorAll`.
  const urlsLst = dom.window.document.querySelectorAll('a');
  //  - extract the value of the `href` attribute for each anchor element.
  for (const pair of urlsLst.entries()) {
    if ((pair[1].href).startsWith('https://en.wikipedia.org/wiki')) {
      console.log(emptyBase + pair[1]);
    } 
    else if ((pair[1].href).startsWith('/wiki/File:')) {
      continue;
    }
    else if ((pair[1].href).startsWith('/wiki')) {
      console.log(baseURL.substring(0, baseURL.length-1) + pair[1]);
    }
    else {
      continue;
    }
  }
  // 5. Print each absolute URL to the console, one per line.
});


