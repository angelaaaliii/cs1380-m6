#!/usr/bin/env node

// ! version 1: takes in pdf/input file via command line
// import fs from 'fs';
// import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';


// async function extractLinks(pdfPath) {
//     const data = new Uint8Array(fs.readFileSync(pdfPath));
//     const pdf = await getDocument({ data }).promise;
//     let links = [];

//     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//         const page = await pdf.getPage(pageNum);
//         const annotations = await page.getAnnotations();
        
//         annotations.forEach(annot => {
//             if (annot.url) {
//                 links.push(annot.url);
//             }
//         });
//     }

//     if (links.length > 0) {
//         links.forEach(link => console.log(link));
//     }
// }

// const pdfPath = process.argv[2];
// if (!pdfPath) {
//     console.error('Usage: ./getPDFURLs.js [input_file]');
//     process.exit(1);
// }

// extractLinks(pdfPath);

// ! version 2: takes in pdf/input via stdin
// import fs from 'fs';
// import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
// import { Readable } from 'stream';

// const fs = require('fs');
// // const { getDocument } = require('pdfjs-dist');
// const { Readable } = require('stream');

// async function extractLinks(pdfData) {
//     const { getDocument } = await import('pdfjs-dist');
//     const pdf = await getDocument({ data: pdfData }).promise;
//     let links = [];

//     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//         const page = await pdf.getPage(pageNum);
//         const annotations = await page.getAnnotations();
        
//         annotations.forEach(annot => {
//             if (annot.url) {
//                 links.push(annot.url);
//             }
//         });
//     }

//     if (links.length > 0) {
//         links.forEach(link => console.log(link));
//     }
// }

// // Read from stdin
// async function main() {
//     // If a command line argument is provided, use it as base URL (similar to your HTML script)
//     const baseURL = process.argv[2] || '';
    
//     // Read binary data from stdin
//     const chunks = [];
//     process.stdin.on('data', chunk => {
//         chunks.push(chunk);
//     });
    
//     process.stdin.on('end', async () => {
//         try {
//             // Combine all chunks into a single buffer
//             const buffer = Buffer.concat(chunks);
//             // Convert buffer to Uint8Array for PDF.js
//             const pdfData = new Uint8Array(buffer);
            
//             // Process the PDF
//             await extractLinks(pdfData);
//         } catch (error) {
//             console.error('Error processing PDF:', error);
//             process.exit(1);
//         }
//     });
// }

// // Handle errors
// process.stdin.on('error', (error) => {
//     console.error('Error reading from stdin:', error);
//     process.exit(1);
// });

// // Start the process
// main();

// ! version 3 (using a different library because pdfjs-dist annoys me)

// const readline = require('readline');
// const pdf2json = require('pdf2json');

// // Initialize the command line interface to read from stdin
// const rl = readline.createInterface({
//   input: process.stdin,
// });

// let pdfData = '';
// rl.on('line', (line) => {
//   // Collect the binary data from stdin
//   pdfData += line;
// });

// rl.on('close', () => {
//   // Convert the string data into a buffer, which is needed for pdf2json
//   const pdfBuffer = Buffer.from(pdfData, 'base64');
  
//   // Use pdf2json to parse the PDF data
//   const pdfParser = new pdf2json();

//   // Listen for the data to be ready after parsing
//   pdfParser.on('pdfParser_dataReady', (pdfData) => {
//     let links = [];

//     // Iterate through each page and check for annotations with URLs
//     pdfData.formImage.Pages.forEach(page => {
//       if (page.Annotations) {
//         page.Annotations.forEach(annot => {
//           if (annot.Url) {
//             links.push(annot.Url);
//           }
//         });
//       }
//     });

//     // Output the URLs to stdout
//     if (links.length > 0) {
//       links.forEach(link => console.log(link));
//     } else {
//       console.log('No URLs found.');
//     }
//   });

//   // Load the PDF buffer into pdf2json
//   pdfParser.parseBuffer(pdfBuffer);
// });

/*
Extract all URLs from a PDF by searching for `/URI` keys.
Usage: ./getPDFURLs.js [input_file]
*/

const PDFParser = require('pdf2json');

// Collect PDF data from stdin
const chunks = [];
process.stdin.on('data', (chunk) => {
  chunks.push(chunk);
});

// Parse PDF input
process.stdin.on('end', () => {
  const pdfBuffer = Buffer.concat(chunks);
  const pdfParser = new PDFParser();
  
  pdfParser.on("pdfParser_dataerror", (errData) => {
    console.error('Error parsing PDF:', errData.parserError);
    process.exit(1);
  });
  
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    if (pdfData && pdfData.Pages) {
      let urls = [];

      // Function to recursively search for /URI keys in PDF data
      function findURI(data) {
        if (Array.isArray(data)) {
          data.forEach(item => findURI(item));
        } else if (typeof data === 'object' && data !== null) {
          Object.keys(data).forEach(key => {
            console.error(key)
            if (key === 'URI' && typeof data[key] === 'string') {
              const uri = data[key];
              if (uri.startsWith('http') || uri.startsWith('https')) {
                urls.push(uri);
              }
            } else {
              findURI(data[key]);
            }
          });
        }
      }

      // Start recursive search for /URI across all PDF data
      findURI(pdfData);

      // Output the unique URLs found
      urls = [...new Set(urls)]; // Remove duplicates
      urls.forEach(url => console.log(url));
    } else {
      console.error('No pages found');
      process.exit(1);
    }
  });

  try {
    pdfParser.parseBuffer(pdfBuffer);
  } catch (e) {
    console.error('Error parsing PDF buffer:', e);
    process.exit(1);
  }
});

