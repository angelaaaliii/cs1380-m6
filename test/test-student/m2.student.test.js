/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const { serialize } = require('../../distribution/util/serialization.js');
const local = distribution.local;
const id = distribution.util.id;
const status = distribution.local.status;
const routes = distribution.local.routes;

const config = distribution.node.config;

test('(1 pts) student test', (done) => {
  // service = status, method = get

  // test 1: error case
  local.status.get('invalid key', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
    } catch (error) { 
      done(error);
    }
  });

  // test 2: no error case
  local.status.get('nid', (e, v) => {
    try {
      expect(e).toBeFalsy();
      
      expect(v).toBe(id.getNID(config));
      done();
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // service = routes, method = get

  // test 1: get status
  local.routes.get('status', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(status);
    } catch (error) {
      done(error);
    }
  });

  // test 2: nested call with rem and get
  local.routes.rem('status', (e, v) => {
    local.routes.get('status', (e, v) => {
      try {
        expect(e).toBeDefined();
        expect(e).toBeInstanceOf(Error);
        expect(v).toBeFalsy();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  // service = routes, method = put

  // test 1: put with get
  local.routes.put('value', 'key', (e, v) => {
    local.routes.get('key', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe('value');
      } catch (error) {
        done(error);
      }
    });
  });

  // test 2: put with rem
  local.routes.put('value2', 'key2', (e, v) => {
    local.routes.rem('key2', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe('value2');
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // service = routes, method = rem

  // test 1: nested with put
  local.routes.put(status, 'status', (e, v) => {
    local.routes.rem('status', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(status);
      } catch (error) {
        done(error);
      }
    });
  });

  // test 2: key not in routes map
  local.routes.rem('no key', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(undefined);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  // service = comm, method = send

  // test 1: routes with invalid method (error case)
  const node = distribution.node.config;
  let remote = {node: node, service: 'routes', method: 'invalid'};
  let message = ['routes'];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeTruthy();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
    } catch (error) {
      done(error);
    }
  });

  // test 2: routes with invalid method (error case)
  remote = {node: node, service: 'routes', method: 'get'};
  message = ['routes'];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(serialize(v)).toBe(serialize(routes));
      done();
    } catch (error) {
      done(error);
    }
  });
});


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
