const distribution = require('../config.js');
const local = distribution.local;
const id = distribution.util.id;

test('(10 pts) local.comm(status.get(nid))', (done) => {
  const node = distribution.node.config;

  remote = {node: node, service: 'status', method: 'get'};
  message = ['nid']; // Arguments to the method

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(id.getNID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(10 pts) comm: status.get()', (done) => {
  const node = distribution.node.config;
  remote = {node: node, service: 'status', method: 'get'};
  message = [
    'sid',
  ];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(id.getSID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});

/* Test infrastructure */

let localServer = null;

beforeAll((done) => {
  try {
    distribution.node.start((server) => {
      localServer = server;
      done();
    });
  } catch (error) {
    done(error);
  }
});

afterAll((done) => {
  try {
    localServer.close();
    done();
  } catch (error) {
    done(error);
  }
});
