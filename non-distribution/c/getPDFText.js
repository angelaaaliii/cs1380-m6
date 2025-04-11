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

// Suppress noisy output from pdf2json
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
        console.error("Error reading file:", err.message);
        process.exit(1);
      }
      handlePDFBuffer(data);
    });
  }
});

function fetchPDF(url, callback) {
  const client = url.startsWith('https') ? https : http;
  client.get(url, res => {
    if (res.statusCode !== 200) {
      console.error(`Failed to fetch PDF. HTTP status: ${res.statusCode}`);
      process.exit(1);
    }

    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      callback(Buffer.concat(chunks));
    });
  }).on('error', err => {
    console.error("Error fetching URL:", err.message);
    process.exit(1);
  });
}

function handlePDFBuffer(pdfBuffer) {
  const pdfParser = new PDFParser();

  pdfParser.on("pdfParser_dataerror", errData => {
    process.stdout.write = originalStdoutWrite;
    console.error(errData.parserError);
    process.exit(1);
  });

  pdfParser.on("pdfParser_dataReady", pdfData => {
    process.stdout.write = originalStdoutWrite;
    if (!pdfData.Pages) {
      console.error("No pages found");
      process.exit(1);
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


// const PDFParser = require('pdf2json');

// // save original stdout function, overwrite to filter out warnings from pdf2json library
// const originalStdoutWrite = process.stdout.write;
// process.stdout.write = function(chunk, encoding, callback) {
//   const text = chunk.toString(encoding || 'utf8');
  
//   // filter out warnings
//   if (text.includes('Setting up fake worker') || 
//       text.includes('Unsupported: field.type of Link') ||
//       text.includes('NOT valid form element')) {
//     if (callback) callback();
//     return true;
//   }

//   // otherwise use original stdout
//   return originalStdoutWrite.apply(process.stdout, arguments);
// };

// // collect pdf from stdin
// const chunks = [];
// process.stdin.on('data', (chunk) => {
//   chunks.push(chunk);
// });

// // parse pdf input
// process.stdin.on('end', () => {
//   const pdfBuffer = Buffer.concat(chunks);
//   const pdfParser = new PDFParser();
  
//   pdfParser.on("pdfParser_dataerror", (errData) => {
//     // restore stdout
//     process.stdout.write = originalStdoutWrite;
//     console.error(errData.parserError);
//     process.exit(1);
//   });
  
//   pdfParser.on("pdfParser_dataReady", (pdfData) => {
//     // restore stdout
//     process.stdout.write = originalStdoutWrite;
    
//     if (pdfData && pdfData.Pages) {
//       let rawText = '';
//       let lastY = null;
//       let lineHeightThreshold = 0.5; // threshold to detect line breaks
      
//       // loop through pages and extract text from each page
//       pdfData.Pages.forEach(page => {
//         if (page.Texts && Array.isArray(page.Texts)) {
//           page.Texts.forEach(textElement => {
//             if (textElement.R && textElement.R.length > 0) {
//               textElement.R.forEach(run => {
//                 if (run.T) {
//                   let text = decodeURIComponent(run.T);
//                   let currentY = textElement.y;
//                   if (lastY !== null && Math.abs(currentY - lastY) > lineHeightThreshold) {
//                     rawText += '\n';
//                   }
                  
//                   rawText += text;
//                   lastY = currentY;
//                 }
//               });
//             } else if (textElement.T) {
//               let text = decodeURIComponent(textElement.T);
//               rawText += text;
//             }
//           });
//         }
        
//         rawText += '\n\n';
//       });
      
//       process.stdout.write(rawText);
//     } else {
//       console.error('No pages found');
//       process.exit(1);
//     }
//   });
  
//   try {
//     pdfParser.parseBuffer(pdfBuffer);
//   } catch (e) {
//     // restore stdout
//     process.stdout.write = originalStdoutWrite;
//     console.error('Error parsing PDF buffer:', e);
//     process.exit(1);
//   }
// });