const distribution = require('../config.js');
const id = distribution.util.id;
const { performance } = require('node:perf_hooks');
const fs = require('fs');

const queryGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};
jest.setTimeout(100000);

test('mock query test', (done) => {
  /* 
  IMPORTANT NOTE: There can't be any spaces in the n-grams that are produced by the 
  inverted index. This is because store.put gets rid of spaces in between words to 
  create the files. We must also get rid of spaces in the user's query term.
  */

  const doQuery = (cb) => {
    const startTime = performance.now(); // Start timer
    let completed = 0;
    const totalQueries = 100;
  
    for (let i = 0; i < totalQueries; i++) {
      distribution.queryGroup.query.execQuery('./query.js brand 4', '2_reduceOut', (e, v) => {
        completed++;
  
        // Check if all queries are done
        if (completed === totalQueries) {
          const endTime = performance.now();
          const totalTime = endTime - startTime;
          console.log(`All ${totalQueries} queries completed in ${totalTime} ms`);
  
          if (cb) cb(); // optional callback after completion
        }
      });
    }
  };
  doQuery();
});

/*
    Do not modify the code below.
*/

beforeAll((done) => {
  queryGroup[id.getSID(n1)] = n1;
  queryGroup[id.getSID(n2)] = n2;
  queryGroup[id.getSID(n3)] = n3;

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

    const queryConfig = {gid: 'queryGroup'};
    const outGroupConfig = {gid: '2_reduceOut'};
    startNodes(() => {
      distribution.local.groups.put(queryConfig, queryGroup, (e, v) => {
        distribution.local.groups.put(outGroupConfig, queryGroup, (e, v) => {
          distribution.queryGroup.groups.put(queryConfig, queryGroup, (e, v) => {
            done();
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

