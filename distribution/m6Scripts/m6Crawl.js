const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
const fetch = require('node-fetch');
const { invertedIndexMapper, invertedIndexReducer } = require('../all/invert.js');

const crawlGroup = {};
const indexGroup = {};

// change based on deployed nodes public IPs, needed to be modified deployment
const n1 = {ip: '3.138.179.141', port: 1234, identityIP: '3.138.179.141'}
const n2 = {ip: '3.149.240.222', port: 1234, identityIP: '3.149.240.222'}
const n3 = {ip: '18.223.156.250', port: 1234, identityIP: '18.223.156.250'}
const n4 = {ip: '3.137.218.196', port: 1234, identityIP: '3.137.218.196'}
const n5 = {ip: '44.203.16.8', port: 1234, identityIP: '44.203.16.8'}
const n6 = {ip: '98.80.169.149', port: 1234, identityIP: '98.80.169.149'}

let localServer = null;

const mapper = async (key, value) => {
  const original_url = value['original_url'];

  const match = original_url.match(/\/wiki\/([^#?]+)/);
  if (!match) return [];

  const title = decodeURIComponent(match[1]);

  const textRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&origin=*&titles=${title}`);
  const textData = await textRes.json();
  const pages = textData.query.pages;
  const pageId = Object.keys(pages)[0];
  const plainText = pages[pageId].extract || "";

  const htmlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page=${title}&prop=text`);
  const htmlData = await htmlRes.json();
  const html = htmlData.parse.text["*"];

  const urls = [];
  const linkRegex = /href="\/wiki\/([^":#]+)"/g;
  let matchLink;
  while ((matchLink = linkRegex.exec(html)) !== null) {
    const linkTitle = matchLink[1];
    const link = `https://en.wikipedia.org/wiki/${linkTitle}`;
    const pair = {};
    pair[link] = { original_url: link };
    urls.push(pair);
  }

  const original_map = {};
  original_map[key] = { original_url, page_text: plainText };
  urls.push(original_map);
  return urls;
};

// SEED URLS, CONFIGURABLE
const dataset = [
  { "https://en.wikipedia.org/wiki/Apple": { original_url: "https://en.wikipedia.org/wiki/Apple" } },
  { "https://en.wikipedia.org/wiki/Strawberry": { original_url: "https://en.wikipedia.org/wiki/Strawberry" } },
  { "https://en.wikipedia.org/wiki/Honeydew_(melon)": { original_url: "https://en.wikipedia.org/wiki/Honeydew_(melon)" } }
];

async function doMapReduce() {
  return new Promise((resolve, reject) => {
    distribution.crawl.store.get(null, (e, v) => {
      const crawlConfig = {
        keys: v,
        map: mapper,
        rounds: 10,
        out: "1_CRAWL_TEST",
        mapInGid: 'crawl',
        mapOutGid: '1_mapOut',
        mapOutConfig: indexGroup,
        indexMapper: invertedIndexMapper,
        indexReducer: invertedIndexReducer
      };

      distribution.crawl.mr.exec(crawlConfig, (err, result) => {
        if (err) return reject(err);
        console.log("MapReduce Result:", result);
        resolve();
      });
    });
  });
}

async function storeDataset() {
  return new Promise((resolve) => {
    let cntr = 0;
    dataset.forEach((entry) => {
      const key = Object.keys(entry)[0];
      const value = entry[key];
      distribution.crawl.store.put(value, key, () => {
        cntr++;
        if (cntr === dataset.length) resolve();
      });
    });
  });
}

async function setupGroups() {
  return new Promise((resolve) => {
    crawlGroup[id.getSID(n1)] = n1;
    crawlGroup[id.getSID(n2)] = n2;
    crawlGroup[id.getSID(n3)] = n3;
    indexGroup[id.getSID(n4)] = n4;
    indexGroup[id.getSID(n5)] = n5;
    indexGroup[id.getSID(n6)] = n6;

    const crawlConfig = { gid: 'crawl' };
    const indexConfig = { gid: 'index' };

    distribution.local.groups.put(crawlConfig, crawlGroup, () => {
      distribution.crawl.groups.put(crawlConfig, crawlGroup, () => {
        distribution.local.groups.put(indexConfig, indexGroup, () => {
          distribution.index.groups.put(indexConfig, indexGroup, () => {
            distribution.crawl.groups.put(indexConfig, indexGroup, resolve);
          });
        });
      });
    });
  });
}

async function stopNodes() {
  return new Promise((resolve) => {
    const nodes = [n1, n2, n3, n4, n5, n6];
    const remote = { service: 'status', method: 'stop' };
    const stopAll = (i) => {
      if (i >= nodes.length) {
        localServer.close();
        return resolve();
      }
      remote.node = nodes[i];
      distribution.local.comm.send([], remote, () => stopAll(i + 1));
    };
    stopAll(0);
  });
}

async function main() {
  try {
    await new Promise((resolve) => {
      distribution.node.start((server) => {
        localServer = server;
        resolve();
      });
    });

    await setupGroups();
    await storeDataset();
    await doMapReduce();
  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await stopNodes();
    console.log("Finished execution and cleaned up.");
  }
}

main();
