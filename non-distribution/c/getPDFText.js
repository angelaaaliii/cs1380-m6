#!/usr/bin/env node

/*
Extract all text from an HTML page.
Usage: ./getPDFText.js [input_file] [output_file]
*/

import fs from 'fs';
import PDFParser from "pdf2json";

// ! version 1
// ! NOTE: getText redirects stdin and stdout, however pdf2json expects the entire PDF to be processed in bulk
// ! (this means input and output files are arguments rather than redirections of stdin and stdout)
// ! not sure yet how this affects hooking this up to crawling pipeline
// get input and output file from command line arguments
// const [inputFile, outputFile] = process.argv.slice(2);

// if (!inputFile || !outputFile) {
//   // enforce correct usage
//   console.error('Usage: ./getPDFText.js [input_file] [output_file]');
//   process.exit(1);
// }

// const pdfParser = new PDFParser();

// pdfParser.on("pdfParser_dataerror", (errData) =>
//   console.error(errData.parserError)
// );

// pdfParser.on("pdfParser_dataReady", (pdfData) => {
//   if (pdfData && pdfData.Pages) {
//     let rawText = '';
//     let lastY = null;
//     let lineHeightThreshold = 0.5; // ! threshold to detect line breaks (can tweak this value)

//     // loop through pages and extract text from each page
//     pdfData.Pages.forEach(page => {
//       page.Texts.forEach(textElement => {
//         if (textElement.R && textElement.R.length > 0) {
//           textElement.R.forEach(run => {
//             if (run.T) {
//               // get text and text element y-position
//               let text = decodeURIComponent(run.T);
//               let currentY = textElement.y;

//               // check if newline should be inserted
//               // newlines are not encoded in pdf and instead determined based on text position
//               if (lastY !== null && Math.abs(currentY - lastY) > lineHeightThreshold) {
//                 rawText += '\n';
//               }

//               // accumulate raw text
//               rawText += text;
//               lastY = currentY;
//             }
//           });
//         } else if (textElement.T) {
//           rawText += decodeURIComponent(textElement.T);
//         } else {
//           console.warn('Text element without "T" or "R":', textElement);
//         }
//       });
//     });

//     // write raw text to output file
//     fs.writeFile(
//       outputFile,
//       rawText,
//       (err) => {
//         if (err) {
//           console.error('Error writing file:', err);
//         } else {
//           console.log('Text successfully written');
//         }
//       }
//     );
//   } else {
//     console.error('No pages found in the parsed PDF data');
//   }
// });

// pdfParser.loadPDF(inputFile);


// ! version 2: redirects stdin/stdout (to match getText.js)
// ! currently running into an issue with warning messages getting logged by library functions?
const originalWarn = console.warn;
console.warn = (...args) => {};

const originalStderrWrite = process.stderr.write;
process.stderr.write = () => {};

// collect pdf from stdin
const chunks = [];
process.stdin.on('data', (chunk) => {
  chunks.push(chunk);
});

process.stdin.on('end', () => {
  const pdfBuffer = Buffer.concat(chunks);
  
  const pdfParser = new PDFParser();
  
  pdfParser.on("pdfParser_dataerror", (errData) => {
    console.error(errData.parserError);
    process.exit(1);
  });
  
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    if (pdfData && pdfData.Pages) {
      let rawText = '';
      let lastY = null;
      let lineHeightThreshold = 0.5; // threshold to detect line breaks
      
      // loop through pages and extract text from each page
      pdfData.Pages.forEach(page => {
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
            rawText += decodeURIComponent(textElement.T);
          }
        });
        
        rawText += '\n\n';
      });
      
      process.stdout.write(rawText);
    } else {
      console.error('No pages found');
      process.exit(1);
    }
  });
  
  pdfParser.parseBuffer(pdfBuffer);

  process.stderr.write = originalStderrWrite;
  console.warn = originalWarn;
});