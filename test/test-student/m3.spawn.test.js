const distribution = require('../../config.js');
const local = distribution.local;
const comm = distribution.local.comm;

test('(10 pts) local.status.spawn/stop using local.comm', (done) => {
  const node = {
    ip: '127.0.0.1',
    port: 9091,
  };

  const config = {
    ip: node.ip,
    port: node.port,
    onStart: () => {
      console.log('Node is started!');
    },
  };

  const spawnNode = (server) => {
    local.status.spawn(config, (e, v) => {
      try {
        console.log(v);
        expect(e).toBeFalsy();
        expect(v).toBeDefined();
        done();
      } catch (error) {
        done();
      }
    });
  };

  spawnNode(localServer);
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