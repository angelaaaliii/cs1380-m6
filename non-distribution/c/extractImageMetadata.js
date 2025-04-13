#!/usr/bin/env node

/**
 * From an image URL (read from stdin), prints list of keyword terms
 * 
 * Usage:
 *   cat image_urls.txt | ./extractImageMetadata.js
 */

const readline = require('readline');
const { URL } = require('url');

const rl = readline.createInterface({
  input: process.stdin
});

function extractKeywords(urlStr) {
  try {
    const url = new URL(urlStr);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    const cleanName = filename
      .replace(/\.(jpg|jpeg|png|svg|webp)$/i, '')             // remove extension
      .replace(/^\d+px-/, '')                                 // strip resolution prefix
      .replace(/_/g, ' ')                                     // underscores → spaces
      .replace(/-/g, ' ')                                     // hyphens → spaces
      .replace(/\([^)]*\)/g, '')                              // remove (parentheses)
      .replace(/\d{4}/g, '')                                  // remove 4-digit years
      .replace(/%[0-9A-F]{2}/gi, decodeURIComponent)          // decode URI parts
      .replace(/\s+/g, ' ')                                   // normalize spaces
      .trim();

    return cleanName;
  } catch (e) {
    return '';
  }
}

rl.on('line', (line) => {
  const url = line.trim();
  if (url) {
    const keywords = extractKeywords(url);
    if (keywords) {
    //   console.log(`${url}\t${keywords}`);
        console.log(keywords);
    }
  }
});
