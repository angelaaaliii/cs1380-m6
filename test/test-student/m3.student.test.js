/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const { serialize } = require('../../distribution/util/util.js');
const id = distribution.util.id;

test('(1 pts) student test', (done) => {
  // distributed routes rem, non existent but should not error
  distribution.mygroup.routes.put({}, "test route", (e, v) => {
    try {
      expect(serialize(e)).toBe(serialize({}));
      expect(Object.keys(v).length).toBe(3);

      const remote = {node: {ip: '127.0.0.1', port: 8000}, method: "get", service: "routes"};
      distribution.local.comm.send(["test route"], remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(serialize(v)).toBe(serialize({}));
          done();
        } catch (err) {
          done(err);
        }
      });
    } catch (err) {
      done(err);
    }
  });
});

test('(1 pts) student test', (done) => {
  // distributed groups del, not found error test
  distribution.mygroup.groups.del('not found', (e, v) => {
    try {
      expect(Object.keys(e).length).toBe(3);
      for (const k in e) {
        expect(e[k]).toBeInstanceOf(Error);
      }
      expect(serialize(v)).toBe(serialize({}));
      done();
    } catch (err) {
      done(err);
    }
  });
});

test('(1 pts) student test', (done) => {
  // groups tests
  // rem when name does not exist in groups
  // rem when node does not exist in group name
  const g = {
    'abc': {ip: '127.0.0.1', port: 9000},
    'def': {ip: '127.0.0.1', port: 9001},
  };

  distribution.local.groups.put('test1', g, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(g);
      distribution.local.groups.rem('test2', 'abc', (e, v) => {
        try {
          expect(e).toBeDefined();
          expect(e).toBeInstanceOf(Error);
          expect(v).toBeFalsy();
          distribution.local.groups.rem('test1', 'ghi', (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v).toBe(g);
              done();
            } catch (error) {
              done(error);
            }
          });
        } catch (error) {
          done(error);
        }
      });
    } catch (error) {
      done(error);
    }
  });

});


test('(1 pts) student test', (done) => {
  // distributed comm 
  distribution.mygroup.comm.send(['ip'], {service: 'status', method: 'get'}, (e, v) => {
    try {
      expect(Object.keys(e).length).toBe(0);
      expect(serialize(Object.values(v))).toBe(serialize(['127.0.0.1', '127.0.0.1', '127.0.0.1']));
      done();
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // distributed status stop/get
  distribution.mygroup.status.stop((e, v) => {
    try {
      expect(serialize(e)).toBe(serialize({}));
      expect(Object.keys(v).length).toBe(3);
      
      
      setTimeout(()=> {
        // now try getting information from group4, some should err, but must wait a bit first to guarantee 2 go down
        distribution.group4.status.get('sid', (e, v) => {
          try {
            expect(Object.keys(e).length).toBe(2);
            expect(Object.keys(v).length).toBe(1);
            done();
          } catch (error) {
            done(error);
          }
        });
      }, 1000);
    } catch (error) {
      done(error);
    }
  });

});


// This group is used for testing most of the functionality
const mygroupGroup = {};
// This group is used for {adding,removing} {groups,nodes}
const group4Group = {};

/*
   This hack is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const n4 = {ip: '127.0.0.1', port: 8003};
const n5 = {ip: '127.0.0.1', port: 8004};
const n6 = {ip: '127.0.0.1', port: 8005};

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n6;
            distribution.local.comm.send([], remote, (e, v) => {
            });
          });
        });
      });
    });
  });

  mygroupGroup[id.getSID(n1)] = n1;
  mygroupGroup[id.getSID(n2)] = n2;
  mygroupGroup[id.getSID(n3)] = n3;

  group4Group[id.getSID(n1)] = n1;
  group4Group[id.getSID(n2)] = n2;
  group4Group[id.getSID(n4)] = n4;

  // Now, start the base listening node
  distribution.node.start((server) => {
    localServer = server;

    const groupInstantiation = (e, v) => {
      const mygroupConfig = {gid: 'mygroup'};
      const group4Config = {gid: 'group4'};

      // Create some groups
      distribution.local.groups
          .put(mygroupConfig, mygroupGroup, (e, v) => {
            distribution.local.groups
                .put(group4Config, group4Group, (e, v) => {
                  done();
                });
          });
    };

    // Start the nodes
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, (e, v) => {
            distribution.local.status.spawn(n5, (e, v) => {
              distribution.local.status.spawn(n6, groupInstantiation);
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  distribution.mygroup.status.stop((e, v) => {
    const remote = {service: 'status', method: 'stop'};
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n2;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n3;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n4;
          distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n5;
            distribution.local.comm.send([], remote, (e, v) => {
              remote.node = n6;
              distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
                done();
              });
            });
          });
        });
      });
    });
  });
});
