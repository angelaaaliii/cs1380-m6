#!/usr/bin/env node

/*
Extract all valid Wikipedia article URLs from a web page.
Usage: ./getURLs.js <base_url>
*/

const readline = require('readline');
const { JSDOM } = require('jsdom');

// Read base URL from the command line
let baseURL = process.argv[2];
if (baseURL.endsWith('index.html')) {
  console.log("MODIFIED BASE", baseURL);
  baseURL = baseURL.slice(0, baseURL.length - 'index.html'.length);
} else if (!baseURL.endsWith('/')) {
  baseURL += '/';
}

const rl = readline.createInterface({
  input: process.stdin,
});

let htmlStr = '';
rl.on('line', (line) => {
  htmlStr += line;
});

rl.on('close', () => {
  const dom = new JSDOM(htmlStr);
  const urlsLst = dom.window.document.querySelectorAll('a');

  const skipPrefixes = [
    '/wiki/Wikipedia:',
    '/wiki/Help:',
    '/wiki/Template:',
    '/wiki/Template_talk:',
    '/wiki/Talk:',
    '/wiki/Portal:',
    '/wiki/File:',
    '/wiki/Category:',
    '/wiki/Special:',
    '/wiki/Main_Page',
    '/wiki/ISBN_',
    '/wiki/LCCN_',
    '/wiki/PMC_',
    '/wiki/PMID_',
    '/wiki/S2CID_',
    '/wiki/DOI_',
    '/wiki/Bibcode_',
    '/wiki/OL_',
  ];

  for (const [, anchor] of urlsLst.entries()) {
    const href = anchor.href;

    // Skip protocol-relative links (like //...)
    if (href.startsWith('//')) {
      continue;
    }

    // Skip /w/index.php links (edit, login, print, cite, etc.)
    if (href.startsWith('/w/')) {
      continue;
    }

    // Filter and print /wiki/... article links
    if (href.startsWith('/wiki/')) {
      if (skipPrefixes.some(prefix => href.startsWith(prefix)) || href.includes('#')) {
        continue;
      }
      console.log(baseURL.substring(0, baseURL.length - 1) + href);
    }
  }
});
