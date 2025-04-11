#!/usr/bin/env node

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

    if (links.length > 0) {
        links.forEach(link => console.log(link));
    }
}

// Read from stdin
async function main() {
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

    // Handle errors
    process.stdin.on('error', (error) => {
        console.error('Error reading from stdin:', error);
        process.exit(1);
    });
}

main();