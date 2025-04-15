/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
jest.setTimeout(2147483647);
const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
const fetch = require('node-fetch');

const crawlGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7111};
const n2 = {ip: '127.0.0.1', port: 7112};
const n3 = {ip: '127.0.0.1', port: 7113};
const n4 = {ip: '127.0.0.1', port: 7114};
const n5 = {ip: '127.0.0.1', port: 7115};
const n6 = {ip: '127.0.0.1', port: 7116};

// const n1 = {ip: '3.144.233.59', port: 1234}; // 1
// const n2 = {ip: '3.149.2.144', port: 1234}; // 2
// const n3 = {ip: '18.188.59.235', port: 1234}; // 3



test.only('(15 pts) add support for iterative map-reduce', (done) => {
  const mapper = async (key, value) => {
    const original_url = value['original_url'];

    // get wiki page title
    const match = original_url.match(/\/wiki\/([^#?]+)/);
    if (!match) {
      return [];
    }
    const title = decodeURIComponent(match[1]);
  
    // Get plain text content
    const textRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&origin=*&titles=${title}`);
    const textData = await textRes.json();
  
    const pages = textData.query.pages;
    const pageId = Object.keys(pages)[0];
    const plainText = pages[pageId].extract || "";
  
     // Get HTML content to extract internal links
    const htmlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page=${title}&prop=text`);
    const htmlData = await htmlRes.json();

    const html = htmlData.parse.text["*"];

    // Extract internal wiki links
    const urls = [];
    const linkRegex = /href="\/wiki\/([^":#]+)"/g;
    let matchLink;
    while ((matchLink = linkRegex.exec(html)) !== null) {
      const linkTitle = matchLink[1];
      const link = `https://en.wikipedia.org/wiki/${linkTitle}`;
      const pair = {};
      pair[link] = {
        original_url: `https://en.wikipedia.org/wiki/${linkTitle}`
      };
      urls.push(pair);
    }

    const original_map = {};
    original_map[key] = {'original_url': original_url, 'page_text': plainText};
    urls.push(original_map);
    return urls;
  };
  
  const dataset = [
    {"https://en.wikipedia.org/wiki/Apple": {"original_url": "https://en.wikipedia.org/wiki/Apple"}},
    {"https://en.wikipedia.org/wiki/Strawberry": {original_url: "https://en.wikipedia.org/wiki/Strawberry"}},
    {"https://en.wikipedia.org/wiki/Honeydew_(melon)": {original_url: "https://en.wikipedia.org/wiki/Honeydew_(melon)"}},
    // {"https://en.wikipedia.org/wiki/Lime_(fruit)": {original_url: "https://en.wikipedia.org/wiki/Lime_(fruit)"}}
  ];
  
    const doMapReduce = (cb) => {
      distribution.crawl.store.get(null, (e, v) => {
        console.log("CALLING EXEC");
        distribution.crawl.mr.exec({keys: v, map: mapper, rounds: 3, out: "1_CRAWL_TEST", mapInGid: 'crawl', mapOutGid: '1_mapOut'}, (e, v) => {
          try {
            expect(e).toBe(null);
            console.log(v);
            expect(v > 10).toBe(true);
            done();
          } catch (e) {
            console.log(e);
            done(e);
          }
        });
      });
    };
  
    let cntr = 0;
  
    // Send the dataset to the cluster
    dataset.forEach((o) => {
      const key = Object.keys(o)[0];
      const value = o[key];
      distribution.crawl.store.put(value, key, (e, v) => {
        cntr++;
        // Once the dataset is in place, run the map reduce
        if (cntr === dataset.length) {
          doMapReduce();
        }
      });
    });
});


beforeAll((done) => {
    crawlGroup[id.getSID(n1)] = n1;
    crawlGroup[id.getSID(n2)] = n2;
    crawlGroup[id.getSID(n3)] = n3;
    crawlGroup[id.getSID(n4)] = n4;
    crawlGroup[id.getSID(n5)] = n5;
    crawlGroup[id.getSID(n6)] = n6;

    fs.writeFileSync("visited.txt", "\n");
    const startNodes = (cb) => {
      distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
          distribution.local.status.spawn(n3, (e, v) => {
            distribution.local.status.spawn(n4, (e, v) => {
              distribution.local.status.spawn(n5, (e, v) => {
                distribution.local.status.spawn(n6, (e, v) => {
                  cb();
                });
              });
            });
          });
        });
      });
    };
  
    distribution.node.start((server) => {
      localServer = server;
  

      startNodes(() => {
        const crawlConfig = {gid: 'crawl'};
        distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
          distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
            done();
          });
        });
      });
    });
  });
  
afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
              localServer.close();
              done();
            });
          });
        });
      });
    });
  });
});