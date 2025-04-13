#!/usr/bin/env node

/*
Extract all text from a PDF file or PDF URL (from stdin).
Usage: 
1. echo "some.pdf" | ./getPDFText.js > output.txt
2. echo "https://link.pdf" | ./getPDFText.js > output.txt
*/

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const PDFParser = require('pdf2json');

// ! NOTE: not all pdf links will still point to valid URL/pdf, in that case this script fails silently -- not sure if that needs to change

// suppress noisy output from pdf2json
const originalStdoutWrite = process.stdout.write;
process.stdout.write = function(chunk, encoding, callback) {
  const text = chunk.toString(encoding || 'utf8');
  if (
    text.includes('Setting up fake worker') || 
    text.includes('Unsupported: field.type of Link') ||
    text.includes('NOT valid form element')
  ) {
    if (callback) callback();
    return true;
  }
  return originalStdoutWrite.apply(process.stdout, arguments);
};

// Read a single line from stdin (URL or filepath)
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const trimmedInput = input.trim();

  const isURL = /^https?:\/\//i.test(trimmedInput);
  if (isURL) {
    fetchPDF(trimmedInput, handlePDFBuffer);
  } else {
    fs.readFile(trimmedInput, (err, data) => {
      if (err) {
        // console.error("Error reading file:", err.message);
        // process.exit(1);
        return;
      }
      handlePDFBuffer(data);
    });
  }
});

function fetchPDF(url, callback) {
  const client = url.startsWith('https') ? https : http;
  client.get(url, res => {
    if (res.statusCode !== 200) {
      // console.error(`Failed to fetch PDF. HTTP status: ${res.statusCode}`);
      // process.exit(1);
      return;
    }

    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      callback(Buffer.concat(chunks));
    });
  }).on('error', err => {
    // console.error("Error fetching URL:", err.message);
    // process.exit(1);
    return;
  });
}

function handlePDFBuffer(pdfBuffer) {
  const pdfParser = new PDFParser();

  pdfParser.on("pdfParser_dataerror", errData => {
    process.stdout.write = originalStdoutWrite;
    // console.error(errData.parserError);
    // process.exit(1);
    return;
  });

  pdfParser.on("pdfParser_dataReady", pdfData => {
    process.stdout.write = originalStdoutWrite;
    if (!pdfData.Pages) {
      // console.error("No pages found");
      // process.exit(1);
      return;
    }

    let rawText = '';
    let lastY = null;
    const lineHeightThreshold = 0.5;

    pdfData.Pages.forEach(page => {
      page.Texts.forEach(textElement => {
        if (textElement.R) {
          textElement.R.forEach(run => {
            const text = decodeURIComponent(run.T);
            const currentY = textElement.y;
            if (lastY !== null && Math.abs(currentY - lastY) > lineHeightThreshold) {
              rawText += '\n';
            }
            rawText += text;
            lastY = currentY;
          });
        }
      });
      rawText += '\n\n';
    });

    process.stdout.write(rawText);
  });

  try {
    pdfParser.parseBuffer(pdfBuffer);
  } catch (e) {
    process.stdout.write = originalStdoutWrite;
    console.error("Error parsing PDF buffer:", e);
    process.exit(1);
  }
}