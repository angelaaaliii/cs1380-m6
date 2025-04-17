#!/usr/bin/env node

/**
 * From an image URL (read from stdin), prints:
 *   - image_metadata.txt       → extracted keywords
 *   - valid_image_urls.txt     → matching URLs with informative names
 * 
 * Usage:
 *   cat image_urls.txt | ./extractImageMetadata.js > /dev/null 2> debug_log.txt
 */

const fs = require('fs');
const readline = require('readline');
const { URL } = require('url');
const WordsNinjaPack = require('wordsninja');

const rl = readline.createInterface({
  input: process.stdin
});

const WordsNinja = new WordsNinjaPack();

const metadataStream = fs.createWriteStream('image_metadata.txt');
const validUrlsStream = fs.createWriteStream('valid_image_urls.txt');

const garbagePatterns = [
  'commons logo', 'wikimedia', 'mediawiki',
  'symbol list class', 'file:', 'file ',
  'question mark', 'wordmark', 'flag of', 
  'icon', 'logo', 'toolbar', 'wikibooks', 
  'wikiversity', 'wiktionary', 'wikinews', 'wikiquote',
  'symbol category', 'bullet', 'text document'
];

function isGarbageKeyword(keyword) {
  const lower = keyword.toLowerCase();
  return garbagePatterns.some(pattern => lower.includes(pattern));
}

function postprocess(cleanName) {
  return cleanName
    .replace(/\.(jpg|jpeg|png|svg|webp|gif)$/i, '')         // remove any lingering extension
    .replace(/%[a-zA-Z0-9]{1,3}/g, '')                      // remove leftover % encodings
    .replace(/\bfile\b/gi, '')                              // remove "File" prefix
    .replace(/[^\w\s\(\)\-\/\&]/g, '')                      // strip weird characters but keep common ones
    .replace(/\s+/g, ' ')                                   // normalize spaces again
    .trim();
}

async function extractKeywords(urlStr) {
  try {
    const url = new URL(urlStr);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];

    let cleanName = filename
      .replace(/\.(jpg|jpeg|png|svg|webp|gif)$/i, '')       // remove extension
      .replace(/^\d+px-/, '')                               // remove resolution prefix
      .replace(/\([^)]*\)/g, '')                            // remove (parentheses)
      .replace(/\d{4}/g, '')                                // remove 4-digit years
      .replace(/%[0-9A-F]{2}/gi, decodeURIComponent)        // decode URL chars
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Fallback to WordsNinja if needed
    if (!cleanName.includes(' ')) {
      await WordsNinja.loadDictionary();
      const splitName = WordsNinja.splitSentence(cleanName);
      cleanName = splitName.join(' ');
    }

    cleanName = postprocess(cleanName);
    return cleanName;
  } catch (e) {
    return '';
  }
}

(async () => {
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber += 1;
    const url = line.trim();

    if (!url) {
      console.error(`Line ${lineNumber}: [EMPTY LINE]`);
      continue;
    }

    try {
      const keywords = await extractKeywords(url);
      const wordCount = keywords.split(/\s+/).filter(w => w.length > 0).length;

      if (!keywords) {
        console.error(`Line ${lineNumber}: [NO KEYWORDS] for URL: ${url}`);
      } else if (isGarbageKeyword(keywords)) {
        console.error(`Line ${lineNumber}: [SKIPPED - Garbage] '${keywords}' ← ${url}`);
      } else if (wordCount < 2) {
        console.error(`Line ${lineNumber}: [SKIPPED - Too Short] '${keywords}' ← ${url}`);
      } else {
        metadataStream.write(keywords + '\n');
        validUrlsStream.write(url + '\n');
      }
    } catch (e) {
      console.error(`Line ${lineNumber}: [ERROR] ${e.message} for URL: ${url}`);
    }
  }

  metadataStream.end();
  validUrlsStream.end();
})();