const distribution = require('../../config.js');
const invertedIndexMapper = require('../all/invert.js').invertedIndexMapper;
const invertedIndexReducer = require('../all/invert.js').invertedIndexReducer;
const id = distribution.util.id;
const fs = require('fs');
const path = require('path');
const { deserialize } = require('../util/util.js');

const crawlGroup = {};
let localServer = null;

const n1 = { ip: '127.0.0.1', port: 7111 };
const n2 = { ip: '127.0.0.1', port: 7112 };
const n3 = { ip: '127.0.0.1', port: 7113 };

// Load the dataset
function loadDataset() {
  const dataset = [];
  const dirFilepath = path.join(__dirname, 'benchmark_corpus', '3_CRAWL_TEST');
  const files = fs.readdirSync(dirFilepath).slice(0, 10);
  files.forEach((file) => {
    const filePath = path.join(dirFilepath, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonContent = deserialize(fileContent);
    const key = file;
    const text = jsonContent['page_text'];
    const truncatedText = text.split(' ').slice(0, 20).join(' ');
    const value = { page_text: truncatedText };
    dataset.push({ [key]: value });
  });

  console.log("Dataset length:", dataset.length);
  console.log("Example entry:", dataset[5]);
  return dataset;
}

function startNodes() {
  return new Promise((resolve) => {
    distribution.local.status.spawn(n1, () => {
      distribution.local.status.spawn(n2, () => {
        distribution.local.status.spawn(n3, () => {
          resolve();
        });
      });
    });
  });
}

function stopNodes() {
  return new Promise((resolve) => {
    const remote = { service: 'status', method: 'stop' };
    remote.node = n1;
    distribution.local.comm.send([], remote, () => {
      remote.node = n2;
      distribution.local.comm.send([], remote, () => {
        remote.node = n3;
        distribution.local.comm.send([], remote, () => {
          localServer.close();
          resolve();
        });
      });
    });
  });
}

function putDataset(dataset) {
  return new Promise((resolve, reject) => {
    let cntr = 0;
    dataset.forEach((o) => {
      const key = Object.keys(o)[0];
      const value = o[key];
      distribution.crawl.store.put(value, key, (e) => {
        if (e) return reject(e);
        cntr++;
        if (cntr === dataset.length) {
          resolve();
        }
      });
    });
  });
}

function doMapReduce() {
  return new Promise((resolve, reject) => {
    distribution.crawl.mr.execIndex(
      {
        map: invertedIndexMapper,
        reduce: invertedIndexReducer,
        rounds: 1,
        out: "2_CRAWL_TEST",
        mapInGid: "crawl",
        mapOutGid: "2_mapOut",
        reduceOutGid: "2_reduceOut",
        fs: require('fs'),
        path: require('path'),
        natural: require('natural')
      },
      (err, val) => {
        if (err) return reject(err);
        resolve(val);
      }
    );
  });
}

async function main() {
  const dataset = loadDataset();

  // Set up group
  crawlGroup[id.getSID(n1)] = n1;
  crawlGroup[id.getSID(n2)] = n2;
  crawlGroup[id.getSID(n3)] = n3;

  fs.writeFileSync("visited.txt", "\n");

  // Start server and nodes
  await new Promise((resolve) => {
    distribution.node.start((server) => {
      localServer = server;
      resolve();
    });
  });

  await startNodes();

  const crawlConfig = { gid: 'crawl' };
  await new Promise((resolve) => {
    distribution.local.groups.put(crawlConfig, crawlGroup, () => {
      distribution.crawl.groups.put(crawlConfig, crawlGroup, () => {
        resolve();
      });
    });
  });

  // Put dataset and run map-reduce
  try {
    await putDataset(dataset);
    const result = await doMapReduce();
    console.log("MapReduce completed with output GID:", result);
  } catch (err) {
    console.error("Error during MapReduce:", err);
  }

  // Shut everything down
  await stopNodes();
  console.log("Shutdown complete.");
}

main();