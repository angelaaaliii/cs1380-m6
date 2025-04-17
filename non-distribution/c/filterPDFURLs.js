#!/usr/bin/env node

const https = require('https');
const http = require('http');
const url = require('url');

const targetUrl = "https://www.hort.purdue.edu/newcrop/pri/chapter.pdf";

const parsedUrl = url.parse(targetUrl);
const protocol = parsedUrl.protocol === 'https:' ? https : http;

// Function to check if URL points to a PDF
function checkIfPDF(urlToCheck) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'HEAD'
    };

    const req = protocol.request(urlToCheck, options, (res) => {
      const contentType = res.headers['content-type'];
      
      if (contentType && contentType.includes('application/pdf')) {
        resolve({
          isPDF: true,
          contentType: contentType
        });
      } else {
        resolve({
          isPDF: false,
          contentType: contentType || 'No content type header found'
        });
      }
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Execute the check
checkIfPDF(targetUrl)
  .then(result => {
    if (result.isPDF) {
      console.log(`URL points to a PDF file`);
      console.log(`Content-Type: ${result.contentType}`);
    } else {
      console.log(`URL does not point to a PDF file`);
      console.log(`Content-Type: ${result.contentType}`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error(`Error checking URL: ${error.message}`);
    process.exit(1);
  });