/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

const ncdcGroup = {};
const avgwrdlGroup = {};
const cfreqGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};


test('(15 pts) implement compaction', (done) => {
    // Calculate the frequency of each character in a set of documents
    // testing compaction because this test has each worker node has lots of intermediate values that can be compacted
    // ex: e: [ 1, 1, 1, 1, 1, 1 ]
    // TODO? check testing
    // so here the compact func is the reducer func
  const mapper = (key, value) => {
    const chars = value.replace(/\s+/g, '').split('');
    const out = [];
    chars.forEach((char) => {
      const o = {};
      o[char] = 1;
      out.push(o);
    });
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, v) => sum + v, 0);
    return out;
  };

  const dataset = [
    {'doc1': 'hello world'},
    {'doc2': 'map reduce test'},
    {'doc3': 'character counting example'},
  ];

  const expected = [
    {'h': 2}, {'e': 7}, {'l': 4},
    {'o': 3}, {'w': 1}, {'r': 4},
    {'d': 2}, {'m': 2}, {'a': 4},
    {'p': 2}, {'u': 2}, {'c': 4},
    {'t': 4}, {'s': 1}, {'n': 2},
    {'i': 1}, {'g': 1}, {'x': 1},
  ];

  const doMapReduce = (cb) => {
    distribution.cfreq.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }
      // E1: compact field in config set
      distribution.cfreq.mr.exec({keys: v, map: mapper, reduce: reducer, compact: reducer}, (e, v) => {
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

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.cfreq.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(15 pts) add support for distributed persistence', (done) => {
  // Calculate the frequency of each character in a set of documents
  // testing compaction because this test has each worker node has lots of intermediate values that can be compacted
  // ex: e: [ 1, 1, 1, 1, 1, 1 ]
  // so here the compact func is the reducer func
  const mapper = (key, value) => {
    const chars = value.replace(/\s+/g, '').split('');
    const out = [];
    chars.forEach((char) => {
      const o = {};
      o[char] = 1;
      out.push(o);
    });
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, v) => sum + v, 0);
    return out;
  };

  const dataset = [
    {'doc1': 'hello world'},
    {'doc2': 'map reduce test'},
    {'doc3': 'character counting example'},
  ];

  const expected = [
    {'h': 2}, {'e': 7}, {'l': 4},
    {'o': 3}, {'w': 1}, {'r': 4},
    {'d': 2}, {'m': 2}, {'a': 4},
    {'p': 2}, {'u': 2}, {'c': 4},
    {'t': 4}, {'s': 1}, {'n': 2},
    {'i': 1}, {'g': 1}, {'x': 1},
  ];

  const expectedKeys = [
    'h', 'e', 'l', 'o', 'w', 'r', 'd', 'm', 'a', 'p', 'u', 'c', 't', 's', 'n', 'i', 'g', 'x'
  ];

  const doMapReduce = (cb) => {
    distribution.cfreq.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }
      // E2: out field in config set
      distribution.cfreq.mr.exec({keys: v, map: mapper, reduce: reducer, out: 'TEST_GROUP'}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          
          // E2: try to get the final output keys and values from the out group, where they should be put by the worker nodes
          distribution['TEST_GROUP'].store.get(null, (e, keys) => {
            try {
              expect(keys).toEqual(expect.arrayContaining(expectedKeys));
              
              let keyCount = 0;
              let finalRes = [];
              for (const key of keys) {
                distribution['TEST_GROUP'].store.get(key, (e, v) => {
                  const pair = {};
                  pair[key] = v;
                  finalRes.push(pair);
                  keyCount++;
                  if (keyCount == expectedKeys.length) {
                    try {
                      expect(finalRes).toEqual(expect.arrayContaining(expected));
                      done();
                    } catch (e) {
                      done(e);
                    }
                  }
                })
              }
              
            } catch (e) {
              done(e);
            }
          })
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.cfreq.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(5 pts) add support for optional in-memory operation', (done) => {
  // testing compaction because this test has each worker node has lots of intermediate values that can be compacted
  // ex: e: [ 1, 1, 1, 1, 1, 1 ]
  // so here the compact func is the reducer func
  const mapper = (key, value) => {
    const chars = value.replace(/\s+/g, '').split('');
    const out = [];
    chars.forEach((char) => {
      const o = {};
      o[char] = 1;
      out.push(o);
    });
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, v) => sum + v, 0);
    return out;
  };

  const dataset = [
    {'doc1': 'hello world'},
    {'doc2': 'map reduce test'},
    {'doc3': 'character counting example'},
  ];

  const expected = [
    {'h': 2}, {'e': 7}, {'l': 4},
    {'o': 3}, {'w': 1}, {'r': 4},
    {'d': 2}, {'m': 2}, {'a': 4},
    {'p': 2}, {'u': 2}, {'c': 4},
    {'t': 4}, {'s': 1}, {'n': 2},
    {'i': 1}, {'g': 1}, {'x': 1},
  ];

  const expectedKeys = [
    'h', 'e', 'l', 'o', 'w', 'r', 'd', 'm', 'a', 'p', 'u', 'c', 't', 's', 'n', 'i', 'g', 'x'
  ];

  const doMapReduce = (cb) => {
    distribution.cfreq.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      // E3: inMemory field set in config
      distribution.cfreq.mr.exec({keys: v, map: mapper, reduce: reducer, out: 'TEST_GROUP', inMemory: true}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          
          // E3: use MEM to get final output keys & values from the out group (keys&vals should be put by the worker nodes)
          distribution['TEST_GROUP'].mem.get(null, (e, keys) => {
            try {
              expect(keys).toEqual(expect.arrayContaining(expectedKeys));
              
              let keyCount = 0;
              let finalRes = [];
              for (const key of keys) {
                distribution['TEST_GROUP'].mem.get(key, (e, v) => {
                  const pair = {};
                  pair[key] = v;
                  finalRes.push(pair);
                  keyCount++;
                  if (keyCount == expectedKeys.length) {
                    try {
                      expect(finalRes).toEqual(expect.arrayContaining(expected));
                      done();
                    } catch (e) {
                      done(e);
                    }
                  }
                })
              }
              
            } catch (e) {
              done(e);
            }
          })
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.cfreq.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(15 pts) add support for iterative map-reduce', (done) => {
    done(new Error('Not implemented'));
});

beforeAll((done) => {
    ncdcGroup[id.getSID(n1)] = n1;
    ncdcGroup[id.getSID(n2)] = n2;
    ncdcGroup[id.getSID(n3)] = n3;
  
    avgwrdlGroup[id.getSID(n1)] = n1;
    avgwrdlGroup[id.getSID(n2)] = n2;
    avgwrdlGroup[id.getSID(n3)] = n3;
  
    cfreqGroup[id.getSID(n1)] = n1;
    cfreqGroup[id.getSID(n2)] = n2;
    cfreqGroup[id.getSID(n3)] = n3;
  
  
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
  
      const ncdcConfig = {gid: 'ncdc'};
      startNodes(() => {
        distribution.local.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
          distribution.ncdc.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
            const avgwrdlConfig = {gid: 'avgwrdl'};
            distribution.local.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
              distribution.avgwrdl.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
                const cfreqConfig = {gid: 'cfreq'};
                distribution.local.groups.put(cfreqConfig, cfreqGroup, (e, v) => {
                  distribution.cfreq.groups.put(cfreqConfig, cfreqGroup, (e, v) => {
                    done();
                  });
                });
              });
            });
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