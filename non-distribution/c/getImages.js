#!/usr/bin/env node

/**
 * Extracts image URLs from HTML input via stdin.
 * 
 * This script parses the HTML and extracts:
 *   1. All <img> tags via their `src` attribute
 *   2. All <a> tags whose `href` ends in an image extension
 * 
 * Only includes images hosted on `wikipedia.org` or `wikimedia.org`.
 * 
 * USAGE:
 *   cat page.html | ./getImages.js https://en.wikipedia.org
 * 
 * OUTPUT:
 *   Prints one image URL per line to stdout.
 */

const readline = require('readline');
const { JSDOM } = require('jsdom');

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

// Get base URL from command-line argument
let baseURL = process.argv[2];
if (!baseURL.endsWith('/')) {
  baseURL += '/';
}

const rl = readline.createInterface({ input: process.stdin });
let htmlStr = '';
rl.on('line', (line) => {
  htmlStr += line;
});

rl.on('close', () => {
  const dom = new JSDOM(htmlStr);
  const document = dom.window.document;

  const seen = new Set();

  // 1. Handle <img src="...">
  for (const img of document.querySelectorAll('img')) {
    let src = img.getAttribute('src');
    if (src) {
      const fullURL = resolveURL(src, baseURL);
      if (isImage(fullURL) && isWikimediaURL(fullURL) && !seen.has(fullURL)) {
        console.log(fullURL);
        seen.add(fullURL);
      }
    }
  }

  // 2. Handle <a href="..."> pointing to images
  for (const a of document.querySelectorAll('a')) {
    let href = a.getAttribute('href');
    if (href) {
      const fullURL = resolveURL(href, baseURL);
      if (isImage(fullURL) && isWikimediaURL(fullURL) && !seen.has(fullURL)) {
        console.log(fullURL);
        seen.add(fullURL);
      }
    }
  }
});

// Normalize URLs
function resolveURL(path, base) {
  if (path.startsWith('//')) return 'https:' + path;
  if (path.startsWith('/')) return base.replace(/\/$/, '') + path;
  if (!path.startsWith('http')) return base + path;
  return path;
}

// Simple check for image file extensions
function isImage(url) {
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Only allow images hosted on Wikipedia/Wikimedia
function isWikimediaURL(url) {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname.endsWith('wikipedia.org') ||
      hostname.endsWith('wikimedia.org')
    );
  } catch {
    return false;
  }
}