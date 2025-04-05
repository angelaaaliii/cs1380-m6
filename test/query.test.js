const distribution = require('../config.js');
const id = distribution.util.id;

const queryGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test('mock query test', (done) => {
  /* 
  IMPORTANT NOTE: There can't be any spaces in the n-grams that are produced by the 
  inverted index. This is because store.put gets rid of spaces in between words to 
  create the files. We must also get rid of spaces in the user's query term.
  */
  const dataset = [
    {"dog" : [["url1", 0.56], ["url2", 0.44], ["url3", 0.89]]},
    {"catdog" : [["url4", 0.99], ["url5", 0.24], ["url6", 0.65]]},
    {"catdogmouse" : [["url7", 0.22], ["url8", 0.54]]},
    {"cat" : [["url9", 0.11], ["url10", 0.12], ["url11", 0.21]]},
    {"lizard" : [["url12", 0.01], ["url13", 0.34], ["url14", 0.87]]}
  ];

  const expected = [
    [ 'url4', 0.99 ],
    [ 'url3', 0.89 ],
    [ 'url6', 0.65 ],
    [ 'url1', 0.56 ]
  ];

  const doQuery = (cb) => {
    distribution.queryGroup.query.execQuery('./query.js dog 4', 'outGroup', (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution['outGroup'].store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doQuery();
      }
    });
  });
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
    const outGroupConfig = {gid: 'outGroup'};
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


