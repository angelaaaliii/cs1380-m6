#!/usr/bin/env node

/*
Extract all URLs from a web page.
Usage: ./getURLs.js <base_url>
*/

const readline = require('readline');
const {JSDOM} = require('jsdom');

// import readline from 'readline';
// import { JSDOM } from 'jsdom';

// 1. Read the base URL from the command-line argument using `process.argv`.
let baseURL = process.argv[2];
const emptyBase = "";
if (baseURL.endsWith('index.html')) {
  console.log("MODIFIED BASE", baseURL);
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
  // console.log('htmlStr:', htmlStr);
  // 3. Parse HTML using jsdom
  const dom = new JSDOM(htmlStr);

  // ! modification from getURLs starts here
  // 4. Find all images:
  //  - select all anchor (`<a>`) elements) with an `href` attribute using `querySelectorAll`.
  // console.log("DOM");
  // console.log(dom);
  // console.log("\n");
  
  const urlsLst = dom.window.document.querySelectorAll('a');
  const imgsList = dom.window.document.querySelectorAll('img');

  const baseURL = 'https://en.wikipedia.org'
  for (const pair of urlsLst.entries()) {
    if (pair[1].href.startsWith('/')) {
      console.log(baseURL + pair[1])
    } else if ((pair[1].href).startsWith('https')) {
      // if ((pair[1].href).startsWith('htt[s://en.wikipedia.org/wiki')) {
      // console.log(pair[1].href);
      // }
    }
  }
  // console.log("URLS");
  // console.log(urlsList);

  // console.log("IMAGES");
  // console.log(imgsLst);
//   //  - extract the value of the `href` attribute for each anchor element.
//   for (const pair of urlsLst.entries()) {
//     if ((pair[1].href).startsWith('https')) {
//       console.log(emptyBase + pair[1]);
//     } 
//     else if ((pair[1].href).startsWith('//')) {
//       // console.log("DEF");
//       // console.log("html" + pair[1]);
//       continue;
//     }
//     else if ((pair[1].href).startsWith('/')) {
//       console.log(baseURL.substring(0, baseURL.length-1) + pair[1]);
//     }
//     else {
//       // console.log("GHI");
//       // console.log(baseURL + pair[1]);
//       continue;
//     }
//   }
  // 5. Print each absolute URL to the console, one per line.
});




