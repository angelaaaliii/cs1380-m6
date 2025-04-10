#!/usr/bin/env node

/*
Extract all text from an HTML page.
Usage: ./getPDFText.js [input_file] [output_file]
*/

const PDFParser = require('pdf2json');

// Save original stdout write function
const originalStdoutWrite = process.stdout.write;

// Override stderr.write to filter out specific warnings
process.stdout.write = function(chunk, encoding, callback) {
  const text = chunk.toString();
  
  // Filter out the specific warnings
  if (text.includes('Setting up fake worker') || 
      text.includes('Unsupported: field.type of Link') ||
      text.includes('NOT valid form element')) {
    // Ignore these warnings
    if (callback) callback();
    return true;
  }
  
  // Let other messages pass through
  return originalStdoutWrite.apply(process.stdout, arguments);
};

// collect pdf from stdin
const chunks = [];
process.stdin.on('data', (chunk) => {
  chunks.push(chunk);
});

process.stdin.on('end', () => {
  const pdfBuffer = Buffer.concat(chunks);
  
  const pdfParser = new PDFParser();
  
  pdfParser.on("pdfParser_dataerror", (errData) => {
    // Restore stdout
    process.stdout.write = originalStdoutWrite;
    console.error(errData.parserError);
    process.exit(1);
  });
  
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    // Restore stdout
    process.stdout.write = originalStdoutWrite;
    
    if (pdfData && pdfData.Pages) {
      let rawText = '';
      let lastY = null;
      let lineHeightThreshold = 0.5; // threshold to detect line breaks
      
      // loop through pages and extract text from each page
      pdfData.Pages.forEach(page => {
        if (page.Texts && Array.isArray(page.Texts)) {
          page.Texts.forEach(textElement => {
            if (textElement.R && textElement.R.length > 0) {
              textElement.R.forEach(run => {
                if (run.T) {
                  let text = decodeURIComponent(run.T);
                  let currentY = textElement.y;
                  if (lastY !== null && Math.abs(currentY - lastY) > lineHeightThreshold) {
                    rawText += '\n';
                  }
                  
                  rawText += text;
                  lastY = currentY;
                }
              });
            } else if (textElement.T) {
              let text = decodeURIComponent(textElement.T);
              rawText += text;
            }
          });
        }
        
        rawText += '\n\n';
      });
      
      process.stdout.write(rawText);
    } else {
      console.error('No pages found');
      process.exit(1);
    }
  });
  
  try {
    pdfParser.parseBuffer(pdfBuffer);
  } catch (e) {
    // Restore stdout
    process.stdout.write = originalStdoutWrite;
    console.error('Error parsing PDF buffer:', e);
    process.exit(1);
  }
});