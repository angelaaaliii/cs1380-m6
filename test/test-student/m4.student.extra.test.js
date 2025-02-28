/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
const distribution = require('../../config.js');
const { id, serialize } = require('../../distribution/util/util.js');

const n1 = {ip: '127.0.0.1', port: 9001};
const n2 = {ip: '127.0.0.1', port: 9002};
const n3 = {ip: '127.0.0.1', port: 9003};
const n4 = {ip: '127.0.0.1', port: 9004};
const n5 = {ip: '127.0.0.1', port: 9005};
const n6 = {ip: '127.0.0.1', port: 9006};

let mygroupGroup = {};
mygroupGroup[id.getSID(n1)] = n1;
mygroupGroup[id.getSID(n2)] = n2;
mygroupGroup[id.getSID(n3)] = n3;
mygroupGroup[id.getSID(n4)] = n4;
mygroupGroup[id.getSID(n5)] = n5;

let myGroupCopy = {...mygroupGroup};

// First, we check where the keys should be placed
  // before we change the group's nodes.
  // mygroup uses the specified hash function for item placement,
  // so we test using the same hash function
  const users = [
    {first: 'Emma', last: 'Watson'},
    {first: 'John', last: 'Krasinski'},
    {first: 'Julie', last: 'Bowen'},
    {first: 'Sasha', last: 'Spielberg'},
    {first: 'Tim', last: 'Nelson'},
  ];
  const keys = [
    'a',
    'b',
    'c',
    'd',
    'e',
  ];

  // The keys at first will be placed in nodes n2, n4, and n5
  // After reconfiguration all nodes will be placed in n2
  // Note: These distributions happened because of the specific key values and the specific hashing function used.

test('(15 pts) detect the need to reconfigure', (done) => {
  // This function will be called after we put items in nodes
  const checkPlacement = (e, v) => {
    try {
      const remote = {node: n2, service: 'mem', method: 'get'};
      const messages = [
        [{key: keys[0], gid: 'mygroup'}],
        [{key: keys[1], gid: 'mygroup'}],
        [{key: keys[2], gid: 'mygroup'}],
        [{key: keys[3], gid: 'mygroup'}],
        [{key: keys[4], gid: 'mygroup'}],
      ];



    distribution.local.comm.send(messages[0], remote, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(users[0]);
      } catch (error) {
        done(error);
        return;
      }
      distribution.local.comm.send(messages[1], remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(users[1]);
        } catch (error) {
          done(error);
          return;
        }

        distribution.local.comm.send(messages[2], remote, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v).toEqual(users[2]);
          } catch (error) {
            done(error);
            return;
          }

          distribution.local.comm.send(messages[3], remote, (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v).toEqual(users[3]);
            } catch (error) {
              done(error);
              return;
            }

            distribution.local.comm.send(messages[4], remote, (e, v) => {
              try {
                expect(e).toBeFalsy();
                expect(v).toEqual(users[4]);
                done();
                return;
              } catch (error) {
                done(error);
                return;
              }
            });
          });
        });
      });
    });
    } catch (error) {
      done(error);
      return;
    }
  };

  // Now we actually put items in the group,
  // remove n5, and check if the items are placed correctly
  distribution.mygroup.mem.put(users[0], keys[0], (e, v) => {
    distribution.mygroup.mem.put(users[1], keys[1], (e, v) => {
      distribution.mygroup.mem.put(users[2], keys[2], (e, v) => {
        distribution.mygroup.mem.put(users[3], keys[3], (e, v) => {
          distribution.mygroup.mem.put(users[4], keys[4], (e, v) => {
            // We need to pass a copy of the group's
            // nodes before we call reconf()

            // function for gossip at
            const func = () => {
                distribution.local.groups.get('mygroup', (e, v) => {
                    if (JSON.stringify(Object.values(v)) != JSON.stringify(Object.values(myGroupCopy))) {
                        console.log("ONLY ONCE");
                        const old = {...myGroupCopy};
                        myGroupCopy = v;
                            const message = ['mygroup', v];
                            const remote = {service: 'groups', method: 'put'};
                            distribution.mygroup.gossip.send(message, remote, (e, v) => {
                                distribution.mygroup.mem.reconf(old, (e, v) => {
                                    return;
                                })
                            });
                    } else {
                        return;
                    }
                });
            };

            // Then, we remove n3 from the list of nodes on local node
            distribution.local.groups.rem('mygroup', id.getSID(n3), (e, v) => {
                // this gossip at function should check its previous state of the group against the current
                // if there are any differences, it should call reconf and gossip send that to other nodes in the group
                distribution.mygroup.gossip.at(50, func, (e, v) => {
                    const intervalID = v;                        
                    setTimeout(() => {
                        checkPlacement();
                        // distribution.mygroup.gossip.del(intervalID, (e, v) => {
                        //     done();
                        // });
                    }, 3000);
                });
            });
                
          });
        });
      });
    });
  });

});


/*
    Following is the setup for the tests.
*/

/*
   This is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

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

    // Now, start the nodes listening node
    distribution.node.start((server) => {
      localServer = server;

      const groupInstantiation = () => {
        const mygroupConfig = {gid: 'mygroup'};

        // Create the groups
        distribution.local.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
          distribution.mygroup.groups
              .put(mygroupConfig, mygroupGroup, (e, v) => {
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
