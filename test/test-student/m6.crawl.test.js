/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
jest.setTimeout(2147483647);
const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
const {execSync} = require('child_process');
const { deserialize, serialize } = require('../../distribution/util/util.js');
const fetch = require('node-fetch');

const invertedIndexMapper = require('../../distribution/all/invert.js').invertedIndexMapper;
const invertedIndexReducer = require('../../distribution/all/invert.js').invertedIndexReducer;

const crawlGroup = {};
const indexGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '3.235.94.103', port: 1234, identityIP: '3.235.94.103'};
// const n2 = {ip: '3.228.0.28', port: 1234, identityIP: '3.228.0.28'};
// const n3 = {ip: '54.242.195.60', port: 1234, identityIP: '54.242.195.60'};
const n4 = {ip: '3.228.0.28', port: 1234, identityIP: '3.228.0.28'};
// const n5 = {ip: '44.200.3.201', port: 1234, identityIP: '44.200.3.201'};
// const n6 = {ip: '35.170.72.152', port: 1234, identityIP: '35.170.72.152'};

// const n1 = {ip: '3.144.233.59', port: 1234}; // 1
// const n2 = {ip: '3.149.2.144', port: 1234}; // 2
// const n3 = {ip: '18.188.59.235', port: 1234}; // 3

// const n1 = {ip: '54.234.21.159', port: 1234}
// const n2 = {ip: '52.2.162.238', port: 1234}
// const n3 = {ip: '34.233.122.175', port: 1234}



test.only('(15 pts) add support for iterative map-reduce', (done) => {
  const mapper = async (key, value) => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
  
    const fetchWithTimeout = (url, timeout = 10000) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Fetch timed out")), timeout)
        )
      ]);
    };
  
    const safeFetch = async (url, label) => {
      try {
        const res = await fetchWithTimeout(url, 10000); // 10s timeout
        if (res.status === 429) {
          console.warn(`[${new Date().toISOString()}] Skipping ${label} due to 429 rate limit`);
          return null;
        }
        if (!res.ok) {
          console.error(`[${new Date().toISOString()}] ${label} fetch failed with status: ${res.status}`);
          return null;
        }
        return await res.json();
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error fetching ${label}: ${err.name} - ${err.message}`);
        return null;
      }
    };
  
    const original_url = value['original_url'];
    console.log(`[${new Date().toISOString()}] [Mapper] Processing: ${original_url}`);
  
    // get wiki page title
    const match = original_url.match(/\/wiki\/([^#?]+)/);
    if (!match) return [];
  
    const title = decodeURIComponent(match[1]);
    const encodedTitle = encodeURIComponent(title);
  
    await delay(500 + Math.random() * 300);  // 500–800ms
  
    // Fetch plain text
    let plainText = "[Error fetching or parsing plain text]";
    const textData = await safeFetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&origin=*&titles=${encodedTitle}`,
      `Text for ${title}`
    );
    if (textData) {
      try {
        const pages = textData.query.pages;
        const pageId = Object.keys(pages)[0];
        plainText = pages[pageId]?.extract || "";
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to parse text JSON for ${title}:`, err);
      }
    }
  
    // Fetch HTML for links
    let html = "<div>[Placeholder HTML]</div>";
    const htmlData = await safeFetch(
      `https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page=${encodedTitle}&prop=text`,
      `HTML for ${title}`
    );
    if (htmlData) {
      try {
        html = htmlData?.parse?.text?.["*"] || html;
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to parse HTML JSON for ${title}:`, err);
      }
    }
  
    // Extract internal wiki links
    const urls = [];
    const linkRegex = /href="\/wiki\/([^":#]+)"/g;
    let matchLink;
    while ((matchLink = linkRegex.exec(html)) !== null) {
      const linkTitle = matchLink[1];
      const link = `https://en.wikipedia.org/wiki/${linkTitle}`;
      const pair = {};
      pair[link] = {
        original_url: link
      };
      urls.push(pair);
    }
  
    const original_map = {};
    original_map[original_url] = {
      original_url: original_url,
      page_text: plainText
    };
    urls.push(original_map);
    return urls;
  };
  // const mapper = async (key, value) => {
  //   const original_url = value['original_url'];

  //   // get wiki page title
  //   const match = original_url.match(/\/wiki\/([^#?]+)/);
  //   if (!match) {
  //     return [];
  //   }
  //   const title = decodeURIComponent(match[1]);
  
  //   // Get plain text content
  //   const textRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&origin=*&titles=${title}`);
  //   const textData = await textRes.json();
  
  //   const pages = textData.query.pages;
  //   const pageId = Object.keys(pages)[0];
  //   const plainText = pages[pageId].extract || "";
  
  //    // Get HTML content to extract internal links
  //   const htmlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&page=${title}&prop=text`);
  //   const htmlData = await htmlRes.json();

  //   const html = htmlData.parse.text["*"];

  //   // Extract internal wiki links
  //   const urls = [];
  //   const linkRegex = /href="\/wiki\/([^":#]+)"/g;
  //   let matchLink;
  //   while ((matchLink = linkRegex.exec(html)) !== null) {
  //     const linkTitle = matchLink[1];
  //     const link = `https://en.wikipedia.org/wiki/${linkTitle}`;
  //     const pair = {};
  //     pair[link] = {
  //       original_url: `https://en.wikipedia.org/wiki/${linkTitle}`
  //     };
  //     urls.push(pair);
  //   }

  //   const original_map = {};
  //   original_map[key] = {'original_url': original_url, 'page_text': plainText};
  //   urls.push(original_map);
  //   return urls;
  // };
  
  const dataset = [
    {"https://en.wikipedia.org/wiki/Apple": {"original_url": "https://en.wikipedia.org/wiki/Apple"}},
    {"https://en.wikipedia.org/wiki/Strawberry": {original_url: "https://en.wikipedia.org/wiki/Strawberry"}},
    {"https://en.wikipedia.org/wiki/Honeydew_(melon)": {original_url: "https://en.wikipedia.org/wiki/Honeydew_(melon)"}}
  ];
  
    const doMapReduce = (cb) => {
      console.log("INDEX GROUP CONFIG = ", indexGroup);
      distribution.crawl.store.get(null, (e, v) => {
        const crawlConfig = {keys: v, map: mapper, rounds: 3, out: "1_CRAWL_TEST", mapInGid: 'crawl', mapOutGid: '1_mapOut', mapOutConfig: indexGroup};
        distribution.crawl.mr.exec(crawlConfig, (e, v) => {
          try {
            expect(e).toBe(null);
            console.log(v);
            done();
            const indexConfig = { map: invertedIndexMapper, reduce: invertedIndexReducer, rounds: 1, out: "1_INDEX_TEST", mapInGid: "1_mapOut", mapOutGid: "1_mapIndexOut", reduceOutGid: "1_reduceIndexOut"};
            // distribution.index.mr.execIndex(indexConfig, (e, v) => {
            //   try {
            //     expect(e).toBe(null);
            //     expect(v).toBe("1_reduceIndexOut");
            //     done();
            //   } catch (e) {
            //     console.log("INDEX ERR = ", e);
            //     done(e);
            //   }
            // });
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
    // crawlGroup[id.getSID(n2)] = n2;
    // crawlGroup[id.getSID(n3)] = n3;
    indexGroup[id.getSID(n4)] = n4;
    // indexGroup[id.getSID(n5)] = n5;
    // indexGroup[id.getSID(n6)] = n6;

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
  

      // startNodes(() => {
        const crawlConfig = {gid: 'crawl'};
        const indexConfig = {gid: 'index'};
        distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
          distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
            distribution.local.groups.put(indexConfig, indexGroup, (e, v ) => {
              distribution.index.groups.put(indexConfig, indexGroup, (e, v) => {
                distribution.crawl.groups.put(indexConfig, indexGroup, (e, v) => {
                  done();
                });
              });
            });
          });
        });
      // });
    });
  });
  
afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    // remote.node = n2;
    // distribution.local.comm.send([], remote, (e, v) => {
    //   remote.node = n3;
    //   distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          // remote.node = n5;
          // distribution.local.comm.send([], remote, (e, v) => {
          //   remote.node = n6;
          //   distribution.local.comm.send([], remote, (e, v) => {
              localServer.close();
              done();
            });
          });
        });
//       });
//     });
//   });
// });