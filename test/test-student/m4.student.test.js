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
  // local mem put/get/del error case
  const user = {first: 'Angela', last: 'Li'};
  const key = 'ali190';

  distribution.local.mem.put(user, key, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(user);
      distribution.local.mem.del(key, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(user);
          distribution.local.mem.get(key, (e, v) => {
            expect(e).toBeInstanceOf(Error);
            done();
          })
        } catch (error) {
          done(error);
        }
      })
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // distributed store put/get non-error case
  const user = {first: 'Angela', last: 'Li'};
  const key = 'ali190';

  distribution.mygroup.store.put(user, key, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(serialize(v)).toBe(serialize(user));

      distribution.mygroup.store.get(key, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(serialize(v)).toBe(serialize(user));
          done();
        } catch (error) {
          done(error);
        }
        
      })
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // hashing, hash to same node
  const n1 = {ip: '127.0.0.1', port: 9001};
  const n2 = {ip: '127.0.0.1', port: 9002};
  const n3 = {ip: '127.0.0.1', port: 9003};
  const n4 = {ip: '127.0.0.1', port: 9004};
  const n5 = {ip: '127.0.0.1', port: 9005};
  const n6 = {ip: '127.0.0.1', port: 9006};

  const nids = [id.getNID(n1), id.getNID(n2), id.getNID(n3), id.getNID(n4), id.getNID(n5), id.getNID(n6)];

  const hash0 = id.consistentHash(id.getID('0'), nids);
  const hash1 = id.consistentHash(id.getID('1'), nids);
  try {
    expect(hash0).toBe(id.getNID(n5));
    expect(hash1).toBe(id.getNID(n5));
    done();
  } catch (error) {
    done(error);
  }

});

test('(1 pts) student test', (done) => {
  // null store all get test
  distribution.mygroup.store.put('a', 'a', (e, v) => {
    distribution.mygroup.store.put('b', 'b', (e, v) => {
      distribution.mygroup.store.put('c', 'c', (e, v) => {
        distribution.mygroup.store.put('d', 'd', (e, v) => {
          distribution.mygroup.store.get(null, (e, v) => {
            try {
              expect(serialize(e)).toBe(serialize({}));
              expect(v.includes('a')).toBeTruthy();
              expect(v.includes('b')).toBeTruthy();
              expect(v.includes('c')).toBeTruthy();
              expect(v.includes('d')).toBeTruthy();
              done();
            } catch (error) {
              done(error);
            }
          })
        });  
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  // mem all reconf test, after removing 2 nodes, and only 2 keys should be relocated
  const keys = ['x', 'y', 'z'];
  const vals = ['x', 'y', 'z'];

  const checkPlacement = (e, v) => {
    try {
      const remote2 = {node: n2, service: 'mem', method: 'get'};
      const remote5 = {node: n5, service: 'mem', method: 'get'};
      const messages = [
        [{key: keys[0], gid: 'mygroup'}],
        [{key: keys[1], gid: 'mygroup'}],
        [{key: keys[2], gid: 'mygroup'}]
      ];

    distribution.local.comm.send(messages[0], remote5, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(vals[0]);
      } catch (error) {
        done(error);
        return;
      }
      distribution.local.comm.send(messages[1], remote2, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(vals[1]);
        } catch (error) {
          done(error);
          return;
        }

        distribution.local.comm.send(messages[2], remote5, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v).toEqual(vals[2]);
            done();
          } catch (error) {
            done(error);
            return;
          }
        });
      });
    });
    } catch (error) {
      done(error);
      return;
    }
  };

  distribution.mygroup.mem.put(vals[0], keys[0], (e, v) => {
    distribution.mygroup.mem.put(vals[1], keys[1], (e, v) => {
      distribution.mygroup.mem.put(vals[2], keys[2], (e, v) => {
        const groupCopy = {...mygroupGroup};

        distribution.local.groups.rem('mygroup', id.getSID(n3), (e, v) => {
          distribution.mygroup.groups.rem('mygroup', id.getSID(n3), (e, v) => {
            distribution.local.groups.rem('mygroup', id.getSID(n4), (e, v) => {
              distribution.mygroup.groups.rem('mygroup', id.getSID(n4), (e, v) => {
                distribution.mygroup.mem.reconf(groupCopy, (e, v) => {
                  checkPlacement();
                });
              });
            });
          });
        });
      });
    });
  });

});


const mygroupGroup = {};
const mygroupBGroup = {};

/*
   This is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 9001};
const n2 = {ip: '127.0.0.1', port: 9002};
const n3 = {ip: '127.0.0.1', port: 9003};
const n4 = {ip: '127.0.0.1', port: 9004};
const n5 = {ip: '127.0.0.1', port: 9005};
const n6 = {ip: '127.0.0.1', port: 9006};

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  const fs = require('fs');
  const path = require('path');

  fs.rmSync(path.join(__dirname, '../store'), {recursive: true, force: true});
  fs.mkdirSync(path.join(__dirname, '../store'));

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
              startNodes();
            });
          });
        });
      });
    });
  });

  const startNodes = () => {
    mygroupGroup[id.getSID(n1)] = n1;
    mygroupGroup[id.getSID(n2)] = n2;
    mygroupGroup[id.getSID(n3)] = n3;
    mygroupGroup[id.getSID(n4)] = n4;
    mygroupGroup[id.getSID(n5)] = n5;

    mygroupBGroup[id.getSID(n1)] = n1;
    mygroupBGroup[id.getSID(n2)] = n2;
    mygroupBGroup[id.getSID(n3)] = n3;
    mygroupBGroup[id.getSID(n4)] = n4;
    mygroupBGroup[id.getSID(n5)] = n5;

    // Now, start the nodes listening node
    distribution.node.start((server) => {
      localServer = server;

      const groupInstantiation = () => {
        const mygroupConfig = {gid: 'mygroup'};
        const mygroupBConfig = {gid: 'mygroupB', hash: id.rendezvousHash};

        // Create the groups
        distribution.local.groups.put(mygroupBConfig, mygroupBGroup, (e, v) => {
          distribution.local.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
            distribution.mygroup.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
              done();
            });
          });
        });
      };

      // Start the nodes
      distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
          distribution.local.status.spawn(n3, (e, v) => {
            distribution.local.status.spawn(n4, (e, v) => {
              distribution.local.status.spawn(n5, (e, v) => {
                distribution.local.status.spawn(n6, (e, v) => {
                  groupInstantiation();
                });
              });
            });
          });
        });
      });
    });
  };
});

afterAll((done) => {
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