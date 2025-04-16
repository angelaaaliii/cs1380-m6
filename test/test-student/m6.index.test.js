/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
jest.setTimeout(1000000);
const distribution = require('../../config.js');
const invertedIndexMapper = require('../../distribution/all/invert.js').invertedIndexMapper;
const invertedIndexReducer = require('../../distribution/all/invert.js').invertedIndexReducer;
const id = distribution.util.id;
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const { deserialize, serialize } = require('../../distribution/util/util.js');

const crawlGroup = {};

// Benchmark corpus in './benchmark_corpus/3_CRAWL_TEST' The folder has files that contain JSON objects.
// We are looking for key-value pairs. The key being the name of the file and the value being the content of the file.
const dataset = [];
const dirFilepath = path.join(__dirname, 'benchmark_corpus', '3_CRAWL_TEST');
// select only the first 20 files
const files = fs.readdirSync(dirFilepath).slice(0, 10);
files.forEach((file) => {
  const filePath = path.join(dirFilepath, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const jsonContent = deserialize(fileContent);
  // console.log("jsonContent: ", jsonContent);
  const key = file;
  const text = jsonContent['page_text'];
  // select the first 20 words of the text
  const truncatedText = text.split(' ').slice(0, 20).join(' ');
  const value = {page_text: truncatedText};
  dataset.push({[key]: value});
});

console.log("dataset length: ", dataset.length);
console.log("dataset header: ", dataset[5]);

/*
    The local node will be the orchestrator.
*/
let localServer = null;

// ! change nodes so ip == identityIP == PublicIP of instance
// ! also change crawlGroup in beforeAll() if adding/removing nodes + number of status.stop calls in afterAll()
const n1 = {ip: '13.219.234.142', port: 1234, identityIP: '13.219.234.142'};
const n2 = {ip: '3.230.171.246', port: 1234, identityIP: '3.230.171.246'};
const n3 = {ip: '13.219.238.98', port: 1234, identityIP: '13.219.238.98'};
const n4 = {ip: '44.204.201.244', port: 1234, identityIP: '44.204.201.244'};
const n5 = {ip: '44.203.16.8', port: 1234, identityIP: '44.203.16.8'};
const n6 = {ip: '98.80.169.149', port: 1234, identityIP: '98.80.169.149'};


test.only('for loop', (done) => {
  const mapper = invertedIndexMapper;
  const reducer = invertedIndexReducer;

  // const dataset = [
  //   {'doc1': {page_text: "apple apple banana orange"}},
  //   {'doc2': {page_text: "banana orange"}},
  //   {'doc3': {page_text: "apple"}},
  //   {'doc4': {page_text: '1-Butanol, also known as butan-1-ol or n-butanol, is a primary alcohol with the chemical formula C4H9OH and a linear structure. Isomers of 1-butanol are isobutanol, butan-2-ol and tert-butanol. The unmodified term butanol usually refers to the straight chain isomer.' +
  //         '1-Butanol product ha of the and is present in many foods and drinks. It is also a permitted artificial flavorant in the United Stateds, and cordials. It is also used in a wide range of'
  //       }},
  // ];

  const doMapReduce = async (cb) => {
      const maxIterations = 1;
      try {
        let res;
        let mapInGid = 'crawl';
        for (let i = 1; i <= maxIterations; i++) {
          let mapOutGid = i + '_mapOut';
          let reduceOutGid = i + '_reduceOut';
          res = await new Promise((resolve, reject) => {
            distribution.crawl.mr.execIndex(
              { map: mapper, reduce: reducer, rounds: 1, out: "2_CRAWL_TEST", mapInGid: "crawl", mapOutGid: "2_mapOut", reduceOutGid: "2_reduceOut",
                fs: require('fs'),
                path: require('path'),
                natural: require('natural')
               },
              (e, v) => {
                if (e) return reject(e);
                mapInGid = v;
                resolve( v );
              }
            );
          });
        }
    
        // expect(res).toBe('2_reduceOut');
        // distribution['2_reduceOut'].store.get(null, (e, v) => {
        //   console.log(v);
        // });
        done(); // Only call done if all went well
      } catch (e) {
        done(e); // Fail the test if anything threw an error
      }
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
            cb();
          });
        });
      });
    };
  
    distribution.node.start((server) => {
      localServer = server;
  

      // startNodes(() => {
        const crawlConfig = {gid: 'crawl'};
        distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
          distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
            done();
          });
        });
      });
    });
  // });
  
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