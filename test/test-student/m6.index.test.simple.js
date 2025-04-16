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
const {execSync} = require('child_process');
const { deserialize, serialize } = require('../../distribution/util/util.js');

const crawlGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

// ! change nodes so ip == identityIP == PublicIP of instance
// ! also change crawlGroup in beforeAll() if adding/removing nodes + number of status.stop calls in afterAll()
const n1 = {ip: '127.0.0.1', port: 7111, identityIP: '44.204.201.244'};
// const n2 = {ip: '127.0.0.1', port: 7112};
// const n3 = {ip: '127.0.0.1', port: 7113};


test.only('for loop', (done) => {
  const mapper = invertedIndexMapper;
  const reducer = invertedIndexReducer;

  const dataset = [
    {'doc1': {page_text: "apple apple banana orange"}},
    {'doc2': {page_text: "banana orange"}},
    {'doc3': {page_text: "apple"}},
    {'doc4': {page_text: '1-Butanol, also known as butan-1-ol or n-butanol, is a primary alcohol with the chemical formula C4H9OH and a linear structure. Isomers of 1-butanol are isobutanol, butan-2-ol and tert-butanol. The unmodified term butanol usually refers to the straight chain isomer.' +
          '1-Butanol product ha of the ethanol blah fermentation two of sugars and other saccharides and is present in many foods and drinks. It is also a permitted artificial flavorant in the United Stateds, and cordials. It is also used in a wide range of'
        }},
  ];
  
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
              { map: mapper, reduce: reducer, rounds: 1, out: "2_CRAWL_TEST", mapInGid: "crawl", mapOutGid: "2_mapOut", reduceOutGid: "2_reduceOut"},
              (e, v) => {
                if (e) return reject(e);
                mapInGid = v;
                resolve( v );
              }
            );
          });
        }
    
        expect(res).toBe('2_reduceOut');
        distribution['2_reduceOut'].store.get(null, (e, v) => {
          console.log(v);
        });
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
    // crawlGroup[id.getSID(n2)] = n2;
    // crawlGroup[id.getSID(n3)] = n3;

    fs.writeFileSync("visited.txt", "\n");

  
    const startNodes = (cb) => {
      distribution.local.status.spawn(n1, (e, v) => {
        // distribution.local.status.spawn(n2, (e, v) => {
          // distribution.local.status.spawn(n3, (e, v) => {
            cb();
        //   });
        // });
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
        localServer.close();
        done();
    //   });
    // });
  });
});