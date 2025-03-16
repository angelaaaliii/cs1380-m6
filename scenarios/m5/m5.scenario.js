const distribution = require('../../config.js');
const id = distribution.util.id;

const ncdcGroup = {};
const dlibGroup = {};
const tfidfGroup = {};
const crawlGroup = {};
const urlxtrGroup = {};
const strmatchGroup = {};
const ridxGroup = {};
const rlgGroup = {};


/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test('(0 pts) (scenario) all.mr:ncdc', (done) => {
/* Implement the map and reduce functions.
   The map function should parse the string value and return an object with the year as the key and the temperature as the value.
   The reduce function should return the maximum temperature for each year.

   (The implementation for this scenario is provided below.)
*/

  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    const out = {};
    out[words[1]] = parseInt(words[3]);
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const dataset = [
    {'000': '006701199099999 1950 0515070049999999N9 +0000 1+9999'},
    {'106': '004301199099999 1950 0515120049999999N9 +0022 1+9999'},
    {'212': '004301199099999 1950 0515180049999999N9 -0011 1+9999'},
    {'318': '004301265099999 1949 0324120040500001N9 +0111 1+9999'},
    {'424': '004301265099999 1949 0324180040500001N9 +0078 1+9999'},
  ];

  const expected = [{'1950': 22}, {'1949': 111}];

  const doMapReduce = (cb) => {
    distribution.ncdc.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }


      distribution.ncdc.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.ncdc.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:dlib', (done) => {
/*
   Implement the map and reduce functions.
   The map function should parse the string value and return an object with the word as the key and the value as 1.
   The reduce function should return the count of each word.
*/

  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    let res = [];
    for (let word of words) {
      const out = {};
      out[word] = 1;
      res.push(out);
    }
    return res;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a+b, 0);
    return out;
  };

  const dataset = [
    {'b1-l1': 'It was the best of times, it was the worst of times,'},
    {'b1-l2': 'it was the age of wisdom, it was the age of foolishness,'},
    {'b1-l3': 'it was the epoch of belief, it was the epoch of incredulity,'},
    {'b1-l4': 'it was the season of Light, it was the season of Darkness,'},
    {'b1-l5': 'it was the spring of hope, it was the winter of despair,'},
  ];

  const expected = [
    {It: 1}, {was: 10},
    {the: 10}, {best: 1},
    {of: 10}, {'times,': 2},
    {it: 9}, {worst: 1},
    {age: 2}, {'wisdom,': 1},
    {'foolishness,': 1}, {epoch: 2},
    {'belief,': 1}, {'incredulity,': 1},
    {season: 2}, {'Light,': 1},
    {'Darkness,': 1}, {spring: 1},
    {'hope,': 1}, {winter: 1},
    {'despair,': 1},
  ];

  const doMapReduce = (cb) => {
    distribution.dlib.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.dlib.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.dlib.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:tfidf', (done) => {
/*
    Implement the map and reduce functions.
    The map function should parse the string value and return an object with the word as the key and the document and count as the value.
    The reduce function should return the TF-IDF for each word.
*/

  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    let res = [];
    for (let word of words) {
      const out = {};
      out[word] = {};
      out[word][key] = 1;
      res.push(out);
    }
    return res;
  };

  // Reduce function: calculate TF-IDF for each word
  const reducer = (key, values) => {
    const doc_word_counts = {'doc1': 4, 'doc2': 5, 'doc3': 7};
    const out = {};
    for (let val of values) {
      const k = Object.keys(val)[0]; 
      if (k in out) {
        out[k] += 1;
      } else {
        out[k] = 1;
      }
    }

    const len = Object.values(out).length;
    for (let k of Object.keys(out)) {
      out[k] = (out[k] / doc_word_counts[k]) * Math.log10(3/len);
      out[k] = out[k].toFixed(2);
    }
    const res = {};
    res[key] = out;
    return [res];

  };

  const dataset = [
    {'doc1': 'machine learning is amazing'},
    {'doc2': 'deep learning powers amazing systems'},
    {'doc3': 'machine learning and deep learning are related'},
  ];

  const expected = [
    {'machine': {'doc1': '0.04', 'doc3': '0.03'}},
    {'learning': {'doc1': '0.00', 'doc2': '0.00', 'doc3': '0.00'}},
    {'is': {'doc1': '0.12'}},
    {'amazing': {'doc1': '0.04', 'doc2': '0.04'}},
    {'deep': {'doc2': '0.04', 'doc3': '0.03'}},
    {'powers': {'doc2': '0.10'}},
    {'systems': {'doc2': '0.10'}},
    {'and': {'doc3': '0.07'}},
    {'are': {'doc3': '0.07'}},
    {'related': {'doc3': '0.07'}},
  ];

  const doMapReduce = (cb) => {
    distribution.tfidf.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.tfidf.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.tfidf.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
  The rest of the scenarios are left as an exercise.
  For each one you'd like to implement, you'll need to:
  - Define the map and reduce functions.
  - Create a dataset.
  - Run the map reduce.
*/

// test('(10 pts) (scenario) all.mr:crawl', (done) => {
// const mapper = (key, value) => {
//     // download contents of URL (mocking this with corpus mapping)
//     const corpus = {
//       'url1': 'url 1 text LINK:url6 hello',
//       'url2': 'LINK:url1 this LINK:url7 page is on url 2 LINK:url7',
//       'url3': 'test doc with no urls',
      
//       'url6': 'this should be in a second iteration LINK:url8',
//       'url7': 'this is also a LINK:url8 second iteration url',
    
//       'url8': 'this is the 3rd & last iteration LINK:url9 but it should not download url9'
//     };

//     const content = corpus[key];
//     console.log(key);
//     console.log(content);
//     const words = content.split(/(\s+)/).filter((e) => e !== ' ');
//     let res = [];
//     const inPair = {};
//     inPair[key] = value;
//     res.push(inPair);
//     for (let word of words) {
//       const out = {};
//       if (word.substring(0, 5) == "LINK:") {
//         out[word.substring(5)] = null;
//         res.push(out);
//       }
//     }
//     return res;
//   };

//   // Reduce function: remove duplicates
//   const reducer = (key, values) => {
//     const res = {};
//     res[key] = null;
//     return [res];
//   };

//   const dataset = [
//     {'url1': null},
//     {'url2': null},
//     {'url3': null}
//   ];

//   const expected = [
//     {'url1': null},
//     {'url2': null},
//     {'url3': null},
//     {'url4': null},
//     {'url5': null},
//     {'url6': null},
//     {'url7': null},
//     {'url8': null}
//   ];

//   const doMapReduce = (cb) => {
//     distribution.crawl.store.get(null, (e, v) => {
//       try {
//         expect(v.length).toBe(dataset.length);
//       } catch (e) {
//         done(e);
//       }

//       distribution.crawl.mr.exec({keys: v, map: mapper, reduce: reducer, rounds: 3}, (e, v) => {
//         try {
//           expect(v).toEqual(expect.arrayContaining(expected));
//           done();
//         } catch (e) {
//           done(e);
//         }
//       });
//     });
//   };

//   let cntr = 0;

//   // Send the dataset to the cluster
//   dataset.forEach((o) => {
//     const key = Object.keys(o)[0];
//     const value = o[key];
//     distribution.crawl.store.put(value, key, (e, v) => {
//       cntr++;
//       // Once the dataset is in place, run the map reduce
//       if (cntr === dataset.length) {
//         doMapReduce();
//       }
//     });
//   });
// });

test('(10 pts) (scenario) all.mr:urlxtr', (done) => {
    done(new Error('Implement the map and reduce functions'));
});

test('(10 pts) (scenario) all.mr:strmatch', (done) => {
  // identify all the object IDs that match that regular expression in the dataset. 

   const mapper = (key, value) => {
    const match = /amazing/i;
    let res = [];
    const out = {};
    if (match.test(value)) {
      out[key] = {};
      res.push(out);
    }
    return res;
  };

  const reducer = (key, values) => {
    return [key];
  };

  const dataset = [
    {'doc1': 'machine learning is amazing'},
    {'doc2': 'deep learning powers amazing systems'},
    {'doc3': 'machine learning and deep learning are related'},
  ];

  const expected = [
    'doc1', 'doc2'
  ];

  const doMapReduce = (cb) => {
    distribution.strmatch.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.strmatch.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.strmatch.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });

});

test('(10 pts) (scenario) all.mr:ridx', (done) => {
  // inverted index
  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    let res = [];
    for (let word of words) {
      const out = {};
      out[word] = key;
      res.push(out);
    }
    return res;
  };

  const reducer = (key, values) => {
    const res = {};
    res[key] = [...new Set(values)];;
    return [res];
  };

  const dataset = [
    {'doc1': 'machine learning is amazing'},
    {'doc2': 'deep learning powers amazing systems'},
    {'doc3': 'machine learning and deep learning are related'},
  ];

  const expected = {
    'powers': ['doc2'], 
    'and': ['doc3'],
    'related': ['doc3'],
    'is': ['doc1'],
    'deep': ['doc2', 'doc3'],
    'systems': ['doc2'],
    'learning': ['doc1', 'doc2', 'doc3'],
    'amazing': ['doc1', 'doc2'],
    'machine': ['doc1', 'doc3'],
    'are': ['doc3']
  };

  const doMapReduce = (cb) => {
    distribution.ridx.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.ridx.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          for (let elem of v) {
            const k = Object.keys(elem)[0];
            const v = elem[k];
            expect(v.sort()).toEqual(expected[k].sort());
          }
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
    distribution.ridx.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:rlg', (done) => {
  // reverse web link graph
  const mapper = (key, value) => {
    let res = [];
    for (let url of value) {
      const out = {};
      out[url] = key;
      res.push(out);
    }
    return res;
  };

  const reducer = (key, values) => {
    const res = {};
    res[key] = [...new Set(values)];
    return [res];
  };

  const dataset = [
    {'url1': ['url2', 'url3']},
    {'url2': ['url1']},
    {'url3': ['url2']},
  ];

  const expected = {
    'url2': ['url1', 'url3'], 
    'url3': ['url1'],
    'url1': ['url2']
  };

  const doMapReduce = (cb) => {
    distribution.rlg.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.rlg.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          for (let elem of v) {
            const k = Object.keys(elem);
            const v = elem[k];
            expect(v.sort()).toEqual(expected[k].sort());
          }
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
    distribution.rlg.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
    This is the setup for the test scenario.
    Do not modify the code below.
*/

beforeAll((done) => {
  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

  dlibGroup[id.getSID(n1)] = n1;
  dlibGroup[id.getSID(n2)] = n2;
  dlibGroup[id.getSID(n3)] = n3;

  tfidfGroup[id.getSID(n1)] = n1;
  tfidfGroup[id.getSID(n2)] = n2;
  tfidfGroup[id.getSID(n3)] = n3;

  crawlGroup[id.getSID(n1)] = n1;
  crawlGroup[id.getSID(n2)] = n2;
  crawlGroup[id.getSID(n3)] = n3;

  urlxtrGroup[id.getSID(n1)] = n1;
  urlxtrGroup[id.getSID(n2)] = n2;
  urlxtrGroup[id.getSID(n3)] = n3;

  strmatchGroup[id.getSID(n1)] = n1;
  strmatchGroup[id.getSID(n2)] = n2;
  strmatchGroup[id.getSID(n3)] = n3;

  ridxGroup[id.getSID(n1)] = n1;
  ridxGroup[id.getSID(n2)] = n2;
  ridxGroup[id.getSID(n3)] = n3;

  rlgGroup[id.getSID(n1)] = n1;
  rlgGroup[id.getSID(n2)] = n2;
  rlgGroup[id.getSID(n3)] = n3;


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
          const dlibConfig = {gid: 'dlib'};
          distribution.local.groups.put(dlibConfig, dlibGroup, (e, v) => {
            distribution.dlib.groups.put(dlibConfig, dlibGroup, (e, v) => {
              const tfidfConfig = {gid: 'tfidf'};
              distribution.local.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                distribution.tfidf.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                  const strmatchConfig = {gid: 'strmatch'};
                  distribution.local.groups.put(strmatchConfig, strmatchGroup, (e, v) => {
                    distribution.strmatch.groups.put(strmatchConfig, strmatchGroup, (e, v) => {
                      const ridxConfig = {gid: 'ridx'};
                      distribution.local.groups.put(ridxConfig, ridxGroup, (e, v) => {
                        distribution.ridx.groups.put(ridxConfig, ridxGroup, (e, v) => {
                          const rlgConfig = {gid: 'rlg'};
                          distribution.local.groups.put(rlgConfig, rlgGroup, (e, v) => {
                            distribution.rlg.groups.put(rlgConfig, rlgGroup, (e, v) => {
                              const crawlConfig = {gid: 'crawl'};
                              distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
                                distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
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


