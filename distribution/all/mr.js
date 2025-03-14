/** @typedef {import("../types").Callback} Callback */

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */


/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb) {
    // setup
    const id = 'mr-' + Math.random().toString(36).substring(2, 3 + 2);
    
    // notify method for worker nodes
    const mrService = {};
    mrService.workerNotify = (obj, serviceName, coordinatorConfig, methodName) => {
      const remote = {node: coordinatorConfig, method: methodName, service: serviceName};
      global.distribution.local.comm.send([obj], remote, (e, v) => {
        return;
      });
    };

    // reduce func for workers
    mrService.reducer = configuration.reduce;
    mrService.reduceWrapper = (mrServiceName, coordinatorConfig) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e; // TODO
        }
        console.log("REDUCE - got keys on node");
        // get keys on this node
        global.distribution.local.store.get({key: null, gid: mrServiceName}, (e, keys) => {
          if (e) {
            mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

          let i = 0;
          let reduceRes = [];
          console.log("ALL KEYS ON NODE = ", keys);
          for (const k of keys) {
            global.distribution.local.store.get({key: k, gid: mrServiceName}, (e, v) => {
              if (e) {
                mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
                return;
              }

              reduceRes.push(mrService.reducer(k, v));
              i++;

            });
          }
          if (i == keys.length) {
            // notify coordinator we are done reduce and send result
            mrService.workerNotify(reduceRes, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

        });
      });
    };

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, coordinatorConfig, gid) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e; // TODO?
        }

        global.distribution.local.store.get({key: null, gid: gid}, (e, keys) => {
          if (e) {
            mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
            return;
          }
  
          let i = 0;
          let res = []
          for (const k of keys) {
            global.distribution.local.store.get({key: k, gid: gid}, (e, v) => {
              if (e) {
                mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
                return;
              }
              const mapRes = mrService.mapper(k, v);
              res = [...res, ...mapRes];
              // store mapRes with local store put
              const mapResKey = Object.keys(mapRes[0])[0];
              console.log(mapRes);

              // storing new key under mr id group aka SHUFFLING
              global.distribution[mrServiceName].store.get(mapResKey, (e, v) => {
                if (e) {
                  console.log("DNE = ", mapRes);
                  // key DNE in group
                  global.distribution[mrServiceName].store.put([mapRes[0][mapResKey]], mapResKey, (e, v) => {
                    i++;
                    if (e) {
                      mrService.notify(e, mrServiceName, coordinatorConfig);
                      return;
                    }
                    if (i == keys.length) {
                      // notify coordinator that worker is done mapper / shuffling
                      console.log("TELLING COORD WE ARE DONE SHUFFLING");
                      const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                      global.distribution.local.comm.send([res], remote, (e, v) => {
                        return;
                      });
                    }
                  });
                } else {
                  console.log("EXISTS = ", mapRes);
                  // key already exists in group, append to array
                  global.distribution[mrServiceName].store.put([...Object.values(v), mapRes[0][mapResKey]], mapResKey, (e, v) => {
                    i++;
                    if (e) {
                      mrService.notify(e, mrServiceName, coordinatorConfig);
                      return;
                    }
                    if (i == keys.length) {
                      // notify coordinator that worker is done mapper / shuffling
                      console.log("TELLING COORD WE ARE DONE SHUFFLING");
                      const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                      global.distribution.local.comm.send([res], remote, (e, v) => {
                        return;
                      });
                    }
                  });
                }
              })
            });
          }
        });
        

      });
    };

    const mrServiceOrch = {};
    let counter = 0;
    // orchestrator node's notify for map (receiving workers' notifications)
    mrServiceOrch.receiveNotifyShuff = (obj) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(config.gid, (e, v) => {
        if (e) {
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counter++;

        if (counter == groupLen) {
          console.log("COORD HAS COLLECTED ALL SHUFF RESPS");
          // deregister here? received all map res, start reduce TODO 
          const remote = {service: id, method: 'reduceWrapper'};
          global.distribution[config.gid].comm.send([id, global.nodeConfig], remote, (e, v) => {
            if (Object.keys(e) > 0) {
              cb(e, null);
            }
            return;
          });
        }
      })
    };

    let counterReduce = 0;
    let reduceRes = [];
    // orchestrator node's notify for reduce
    mrServiceOrch.receiveNotifyReduce = (obj) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(config.gid, (e, v) => {
        if (e) {
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counterReduce++;
        reduceRes = [...reduceRes, ...obj];
        if (counterReduce == groupLen) {
          // deregister here? received all reduce res TODO
          cb(null, reduceRes);
          return;
        }
      })
    };

    // WHERE EXEC STARTS
    // get all nodes in coordinator's view of group
    global.distribution.local.groups.get(config.gid, (e, nodeGroup) => {
      if (e) {
        cb(e, null);
        return;
      }

      // put this view of the group on all worker nodes, under gid MR ID
      global.distribution[config.gid].groups.put(id, nodeGroup, (e, v) => {
        if (Object.keys(e).length != 0) {
          cb(e, null);
          return;
        }

        // add mr service to all worker nodes in group
        global.distribution[config.gid].routes.put(mrService, id, (e, v) => {
          // add mr service to orchestrator node
          global.distribution.local.routes.put(mrServiceOrch, id, (e, v) => {
            
            // setup down, call map on all of the worker nodes
            const remote = {service: id, method: 'mapWrapper'};
            global.distribution[config.gid].comm.send([id, global.nodeConfig, config.gid], remote, (e, v) => {

            });
          });
        });
      });
    });
  }

  return {exec};
};

module.exports = mr;

// TODO:
// SHUFFLING / REDUCING ON ALL NODES
/*
MODIFY WORKERS MAP: STORE KEYS / VALUES WITH LOCAL STORE PUT
1. after coordinator gets all map responses, trigger distributed comm send for workers' shuffle
2. workers need to have shuffle method and at end comm send notify to coordinator
3. coordinator needs to receive shuffle notify
4. coordinator needs to trigger distributed comm send reducer for workers
5. workers need to have reducer wrapper
6. workers need to notify and send final reduce back to coordinator
7. coordinator needs to receive reducer notify


ACTION ITEMS:
X1. modify workers map to store map output on local store
2. create general worker notify map, should take in remote config
------ ^^ prev tests should still work at this point
3. coordinator needs func to receive shuffle notify
4. workers shuffle func
5. in coordinator map, send distributed call for workers shuffle
6. in coordinator receive shuffle, send comm all for workers reduce
7. workers need reducer func
8. coordinator needs func to receive reducer outputs
*/
