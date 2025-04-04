/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
jest.setTimeout(1000000);
const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
// const {execSync} = require('child_process');

const crawlGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test('(15 pts) add support for iterative map-reduce', (done) => {
  const mapper = (key, value, execArg) => {
    const original_url = value['original_url'];
    try {
      if ('page_text' in value) {
        return [];
      }

      const rawPgContent = execArg(`curl -skL --compressed "${original_url}"`, {encoding: 'utf-8'}).toString().trim();
      let urls = execArg(`echo ${JSON.stringify(rawPgContent)} | ./non-distribution/c/getURLs.js "https://en.wikipedia.org"`, { encoding: 'utf-8' }).toString();
      urls = urls.split('\n');
      pageText = execArg(`echo ${JSON.stringify(rawPgContent)} | ./non-distribution/c/getText.js`, {encoding: 'utf-8'}).toString().trim();
      value['page_text'] = pageText;
    

      let res = [];

      const inputKV = {};
      inputKV[original_url] = value;
      res.push(inputKV);
      for (let url of urls) {
        if (url == '') {
          continue;
        }
        const out = {};
        out[url] = {'original_url': url}; 
        res.push(out);
      }
      return res;
    }
    catch (e) {
      return [];
    }
  };
  

  const reducer = (key, values) => {
    const res = {};
    for (const item of values) {
      if (Object.keys(item).length == 2) {
        res[key] = item;
        return res;
      }
    }
    res[key] = values[0];
    return res;
  };

  
  const dataset = [
    {"https://en.wikipedia.org/wiki/Wikipedia:April_Fools": {"original_url": "https://en.wikipedia.org/wiki/Wikipedia:April_Fools"}}
    // {"https://en.wikipedia.org/wiki/Wikipedia:April_Fools/April_Fools%27_Day_2022": {"original_url": "https://en.wikipedia.org/wiki/Wikipedia:April_Fools/April_Fools%27_Day_2022"}}
  ];
  
    const expected = [
      {'url1': null},
      {'url2': null},
      {'url3': null},
      {'url6': null},
      {'url7': null},
      {'url8': null},
      {'url9': null}
    ];
  
    const doMapReduce = (cb) => {
      distribution.crawl.store.get(null, (e, v) => {
  
        distribution.crawl.mr.exec({keys: v, map: mapper, reduce: reducer, rounds: 2, out: "CRAWL_TEST"}, (e, v) => {
          try {
            // const url = "httpscommonswikimediaorgwikiWikipediaAprilFools";
            const url = "httpsenwikipediaorgwikiWikipediaAprilFoolsAprilFools27Day2004";
            distribution["CRAWL_TEST"].store.get(url, (e, v) => {
              console.log(v);
              expect(e).toBe(null);
              expect(v.original_url).toBeDefined();
              expect(v.page_text).toBeDefined();
              done();
            });
            done();
          } catch (e) {
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
  
  
    const startNodes = (cb) => {
      distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
          distribution.local.status.spawn(n3, (e, v) => {
            cb();
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
        localServer.close();
        done();
      });
    });
  });
});