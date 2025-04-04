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
import fs from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Readable } from 'stream';

async function extractLinks(pdfData) {
    const pdf = await getDocument({ data: pdfData }).promise;
    let links = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const annotations = await page.getAnnotations();
        
        annotations.forEach(annot => {
            if (annot.url) {
                links.push(annot.url);
            }
        });
    }

    if (links.length > 0) {
        links.forEach(link => console.log(link));
    }
}

// Read from stdin
async function main() {
    // If a command line argument is provided, use it as base URL (similar to your HTML script)
    const baseURL = process.argv[2] || '';
    
    // Read binary data from stdin
    const chunks = [];
    process.stdin.on('data', chunk => {
        chunks.push(chunk);
    });
    
    process.stdin.on('end', async () => {
        try {
            // Combine all chunks into a single buffer
            const buffer = Buffer.concat(chunks);
            // Convert buffer to Uint8Array for PDF.js
            const pdfData = new Uint8Array(buffer);
            
            // Process the PDF
            await extractLinks(pdfData);
        } catch (error) {
            console.error('Error processing PDF:', error);
            process.exit(1);
        }
    });
}

// Handle errors
process.stdin.on('error', (error) => {
    console.error('Error reading from stdin:', error);
    process.exit(1);
});

// Start the process
main();