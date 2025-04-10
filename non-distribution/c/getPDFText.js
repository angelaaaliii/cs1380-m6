#!/usr/bin/env node

/*
Extract all text from an HTML page.
Usage: ./getPDFText.js [input_file] [output_file]
*/

const PDFParser = require('pdf2json');

// save original stdout function, overwrite to filter out warnings from pdf2json library
const originalStdoutWrite = process.stdout.write;
process.stdout.write = function(chunk, encoding, callback) {
  const text = chunk.toString(encoding || 'utf8');
  
  // filter out warnings
  if (text.includes('Setting up fake worker') || 
      text.includes('Unsupported: field.type of Link') ||
      text.includes('NOT valid form element')) {
    if (callback) callback();
    return true;
  }

  // otherwise use original stdout
  return originalStdoutWrite.apply(process.stdout, arguments);
};

// collect pdf from stdin
const chunks = [];
process.stdin.on('data', (chunk) => {
  chunks.push(chunk);
});

// parse pdf input
process.stdin.on('end', () => {
  const pdfBuffer = Buffer.concat(chunks);
  const pdfParser = new PDFParser();
  
  pdfParser.on("pdfParser_dataerror", (errData) => {
    // restore stdout
    process.stdout.write = originalStdoutWrite;
    console.error(errData.parserError);
    process.exit(1);
  });
  
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    // restore stdout
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
    // restore stdout
    process.stdout.write = originalStdoutWrite;
    console.error('Error parsing PDF buffer:', e);
    process.exit(1);
  }
});