const distribution = require('../../config.js');
const local = distribution.local;
const id = distribution.util.id;

test('testing comm.send latency', (done) => {
  // const node = distribution.node.config;
  // const remote = {node: node, service: 'status', method: 'get'};
  // const message = ['nid'];

  // let start = performance.now();
  // let num_of_callbacks = 0;
  // for (let i = 0; i < 1000; i++) {
  //   local.comm.send(message, remote, (e, v) => {
  //     num_of_callbacks++;
  //     if (num_of_callbacks == 999) {
  //       done();
  //     }
  //   });
  // }
  // let end = performance.now();
  // console.log("average latency for comm.send = " + (end - start)/1000 + " milliseconds");
  done();
});

/* Test infrastructure */

let localServer = null;

beforeAll((done) => {
  distribution.node.start((server) => {
    localServer = server;
    done();
  });
});

afterAll((done) => {
  localServer.close();
  done();
});