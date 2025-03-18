/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

const test1Group = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test('performance measurement', (done) => {
  // web crawler workflow but with mock url downloads
  const mapper = (key, value) => {
    // download contents of URL (mocking this with corpus mapping)
    const corpus = {
      'url1': 'url 1 text LINK:url6 hello',
      'url2': 'LINK:url1 this LINK:url7 page is on url 2 LINK:url7',
      'url3': 'test doc with no urls',
      
      'url6': 'something other things blah iteration LINK:url8',
      'url7': 'this is also a LINK:url8 iteration url',
    
      'url8': 'this is part of the second last iteration LINK:url9',
      'url9': 'dup url LINK:url10',

      'url10': 'this should appear because of bounded iterations'
    };

    const content = corpus[key];
    const words = content.split(/(\s+)/).filter((e) => e !== ' ');
    let res = [];
    const inPair = {};
    inPair[key] = value;
    res.push(inPair);
    for (let word of words) {
      const out = {};
      if (word.substring(0, 5) == "LINK:") {
        out[word.substring(5)] = null;
        res.push(out);
      }
    }
    return res;
  };

  // Reduce function: remove duplicates
  const reducer = (key, values) => {
    const res = {};
    res[key] = null;
    return res;
  };

  const dataset = [
    {'url1': null},
    {'url2': null},
    {'url3': null}
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
    distribution.test1.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }
      const start = performance.now();
      distribution.test1.mr.exec({keys: v, map: mapper, reduce: reducer, rounds: 3}, (e, v) => {
        const end = performance.now();
        console.log("Total time for 3 rounds of map reduce = " + (end-start) + " milliseconds");
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
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
    distribution.test1.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

beforeAll((done) => {
  test1Group[id.getSID(n1)] = n1;
  test1Group[id.getSID(n2)] = n2;
  test1Group[id.getSID(n3)] = n3;


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

    const test1Config = {gid: 'test1'};
    startNodes(() => {
      distribution.local.groups.put(test1Config, test1Group, (e, v) => {
        distribution.test1.groups.put(test1Config,test1Group, (e, v) => {
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
