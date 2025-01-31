#!/usr/bin/env node

const {exec} = require('child_process');
const {performance} = require('perf_hooks');

// crawler
const crawl = './crawl.sh';
const urls = './d/urls.txt';

let start = performance.now();

exec(`${crawl} ${urls}`, (error, stdout, stderr) => {
  const end = performance.now();
  console.log(`Execution time crawl: ${(end - start).toFixed(2)} ms`);
});


// indexer
const index = './index.sh';
const content = './d/content.txt';
const url = 'https://cs.brown.edu/courses/csci1380/sandbox/1';

start = performance.now();

exec(`${index} ${content} ${url}`, (error, stdout, stderr) => {
  const end = performance.now();
  console.log(`Execution time index: ${(end - start).toFixed(2)} ms`);
});


// query
const query = './query.js';
const term = 'challeng';

start = performance.now();
exec(`${query} ${term}`, (error, stdout, stderr) => {
  exec(`${query} ${term}`, (error, stdout, stderr) => {
    const end = performance.now();
    console.log(`Execution time query: ${(end - start).toFixed(2)} ms`);
  });
});
