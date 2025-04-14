const { io } = require('socket.io-client');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { convert } = require('html-to-text');
const lockfile = require('proper-lockfile');

const socket = io('http://localhost:3000');

// Filepaths for where to write results to
const visitedPath = path.join(__dirname, 'visited.txt');
const mappingPath = path.join(__dirname, 'mappings.txt');

async function appendToFile(filePath, data) {
  let release;
  try {
    // Acquire lock on file
    release = await lockfile.lock(filePath, { retries: 5 });

    // Read current file and store contents in a set
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
    const lines = new Set(content.split('\n').filter(Boolean));

    // Append data only if it's not already in file (to prevent duplicates)
    if (!lines.has(data)) {
      fs.appendFileSync(filePath, data + '\n');
    }
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  } finally {
    if (release) {
      await release(); 
    }
  }
}


async function crawlAndReport(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // Convert HTML to pure page text
    const text = convert(html, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' }
      ]
    });

    // Extract all links
    const $ = cheerio.load(html);
    const links = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) links.push(href);
    });

    console.log(`Crawled: ${url}`);
    // Save visited URL to visited.txt
    await appendToFile(visitedPath, url);
    
    // Store URL-to-text mapping in mappings.txt
    await appendToFile(mappingPath, `${url}:::${text}`);

    socket.emit('result', { url, html, links });
    socket.emit('ready-for-url');
  } catch (err) {
    console.error(`Error crawling ${url}:`, err.message);
    socket.emit('ready-for-url');
  }
}

socket.on('connect', () => {
  console.log(`Connected to master as worker: ${socket.id}`);
  socket.emit('ready-for-url');
});

socket.on('url', async (url) => {
  await crawlAndReport(url);
});

socket.on('no-more-work', () => {
  console.log('No more URLs to crawl. Shutting down.');
  process.exit(0);
});
