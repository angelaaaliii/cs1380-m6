#!/usr/bin/env node

/*
Extract all URLs from a PDF file or PDF URL
Usage: 
1. echo "some.pdf" | ./getPDFURLs.js > output.txt
2. echo "https://link.pdf" | ./getPDFURLs.js > output.txt
*/

async function extractLinks(pdfData) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { getDocument } = pdfjs;
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

    links.forEach(link => console.log(link));
}

function fetchPDF(url, callback) {
    const http = url.startsWith('https') ? require('https') : require('http');
    http.get(url, res => {
        if (res.statusCode !== 200) {
            console.error(`Failed to fetch PDF. HTTP ${res.statusCode}`);
            process.exit(1);
        }
        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => callback(Buffer.concat(data)));
    }).on('error', err => {
        console.error("Error fetching URL:", err.message);
        process.exit(1);
    });
}

async function main() {
    const chunks = [];

    process.stdin.on('data', chunk => chunks.push(chunk));

    process.stdin.on('end', () => {
        const inputStr = Buffer.concat(chunks).toString().trim();
        const fs = require('fs');

        if (/^https?:\/\//.test(inputStr)) {
            // URL case
            fetchPDF(inputStr, async (buf) => {
                await extractLinks(new Uint8Array(buf));
            });
        } else {
            // file path case
            fs.readFile(inputStr, async (err, buf) => {
                if (err) {
                    console.error("Error reading file:", err.message);
                    process.exit(1);
                }
                await extractLinks(new Uint8Array(buf));
            });
        }
    });

    process.stdin.on('error', err => {
        console.error("Error reading from stdin:", err.message);
        process.exit(1);
    });
}

main();