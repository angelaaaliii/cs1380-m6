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
  function exec(configuration, cb, compact=(k, vArr) => {const res = {}; res[k] = vArr; return res;}) {
    // setup
    const id = 'mr-' + Math.random().toString(36).substring(2, 3 + 2);
    
    // MR SERVICE FUNCS FOR WORKER NODES
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

        // get keys on this node
        global.distribution.local.store.get({key: null, gid: mrServiceName}, (e, keys) => {
          if (e) {
            mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

          let i = 0;
          let reduceRes = [];
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
    mrService.compact = compact;
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, coordinatorConfig, gid) => {
      // get mrservice from routes
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e; 
        }

        global.distribution.local.store.get({key: null, gid: gid}, (e, keys) => {
          if (e) {
            mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
            return;
          }
  
          let i = 0;
          let res = {};
          for (const k of keys) {
            global.distribution.local.store.get({key: k, gid: gid}, (e, v) => {
              if (e) {
                mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
                return;
              }
              const mapRes = mrService.mapper(k, v);

              for (const mapElem of mapRes) {
                const mapResKey = Object.keys(mapElem)[0];
                // some intermediate grouping to create compaction input
                if (mapResKey in res) {
                  res[mapResKey].push(mapElem[mapResKey]);
                } else {
                  res[mapResKey] = [mapElem[mapResKey]];
                }
              }
              i++;

              if (i == keys.length) {
                // done mapper
                // run compaction function before shuffling aka storing on some node in group
                let shuffleCounter = 0;
                for (const resKey of Object.keys(res)) {
                  const shuffleKeyPair = mrService.compact(resKey, res[resKey]);
                  console.log("shuffle key pair = ", shuffleKeyPair);
                  const shuffleKey = Object.keys(shuffleKeyPair)[0];

                  // now shuffle aka calling distributed store append under mr id group
                  global.distribution[mrServiceName].store.append(shuffleKey, shuffleKeyPair[shuffleKey], (e, v) => {
                    if (e) {
                      mrService.notify(e, mrServiceName, coordinatorConfig);
                      return;
                    }

                    console.log("done calling append on ", shuffleKeyPair, global.nodeConfig.port);

                    shuffleCounter++;
                    if (shuffleCounter == Object.keys(res).length) {

                      setTimeout(() => {
                        //notify coordinator that worker is done mapper & shuffling
                        const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                        global.distribution.local.comm.send([], remote, (e, v) => {
                          return;
                        });
                      }, 500);
                    }
                  });
                }
                if (shuffleCounter == Object.keys(res).length) {
                  // done - no keys to compact/shuffle
                  const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                  global.distribution.local.comm.send([], remote, (e, v) => {
                    return;
                  });
                }
              }
            });
          }
          if (i == keys.length) {
            // done mapper - no keys
            const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
            global.distribution.local.comm.send([], remote, (e, v) => {
              return;
            });
          }
        });
        

      });
    };


    // MR SERVICE FUNCS FOR COORDINATOR
    const mrServiceCoord = {};
    let counter = 0;
    // coordinator node's notify for map (receiving workers' notifications)
    mrServiceCoord.receiveNotifyShuff = (obj) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counter++;

        if (counter == groupLen) {
          // deregister here? received all map res, start reduce TODO 
          const remote = {service: id, method: 'reduceWrapper'};
          global.distribution[context.gid].comm.send([id, global.nodeConfig], remote, (e, v) => {
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
    // coordinator node's notify for reduce
    mrServiceCoord.receiveNotifyReduce = (obj) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counterReduce++;
        reduceRes = [...reduceRes, ...obj];
        if (counterReduce == groupLen) {
          // deregister here? received all reduce res TODO delete group mr service and remove mr job routes
          cb(null, reduceRes);
          return;
        }
      })
    };

    // WHERE EXEC STARTS AFTER SETUP
    // get all nodes in coordinator's view of group
    global.distribution.local.groups.get(context.gid, (e, nodeGroup) => {
      if (e) {
        cb(e, null);
        return;
      }

      // put this view of the group on all worker nodes, under gid MR ID
      global.distribution[context.gid].groups.put(id, nodeGroup, (e, v) => {
        if (Object.keys(e).length != 0) {
          cb(e, null);
          return;
        }

        // add mr service to all worker nodes in group
        global.distribution[context.gid].routes.put(mrService, id, (e, v) => {
          // add mr service to coordinator node
          global.distribution.local.routes.put(mrServiceCoord, id, (e, v) => {
            
            // setup down, call map on all of the worker nodes
            const remote = {service: id, method: 'mapWrapper'};
            global.distribution[context.gid].comm.send([id, global.nodeConfig, context.gid], remote, (e, v) => {

            });
          });
        });
      });
    });
  }

  return {exec};
};

module.exports = mr;