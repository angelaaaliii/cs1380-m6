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

  let iterativeCounter = 0;

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   */
  function exec(configuration, cb, compact=(c_k, c_v)=>{const res = {}; res[c_k] = c_v; return res;}, out='final-', inMemory=false, rounds=1) {
    // setup
    let memType = 'store';
    const id = 'mr-' + Math.random().toString(36).substring(2, 3 + 2);
    if ('out' in configuration) {
      out = configuration.out;
    } else {
      out = out + id;
    }
    if ('compact' in configuration) {
      compact = configuration.compact;
    }
    if ('rounds' in configuration) {
      rounds = configuration.rounds;
    }
    if ('inMemory' in configuration) {
      if (configuration.inMemory) {
        memType = 'mem';
      }
    }
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
    mrService.reduceWrapper = (mrServiceName, coordinatorConfig, finalGroupName, memType) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e;
        }

        // get keys on this node
        global.distribution.local[memType].get({key: null, gid: mrServiceName}, (e, keys) => {
          if (e) {
            mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

          let i = 0;
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: mrServiceName}, (e, v) => {
              if (e) {
                mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
                return;
              }
              // E2: no longer sending reducer res to coordinator, just storing them under final group id
              const reduceRes = mrService.reducer(k, v);
              const reduceKey = Object.keys(reduceRes)[0];
              global.distribution[finalGroupName][memType].put(reduceRes[reduceKey], reduceKey, (e, v) => {
                i++;
                if (i == keys.length) {
                  // notify coordinator we are done reduce and send result
                  mrService.workerNotify([], mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
                  return;
                }
              });
            });
          }
          if (0 == keys.length) {
            // notify coordinator we are done reduce and send result
            mrService.workerNotify([], mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

        });
      });
    };

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.compact = compact;
    mrService.mapWrapper = (mrServiceName, coordinatorConfig, inputGid, outputGid, memType) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e;
        }

        global.distribution.local[memType].get({key: null, gid: inputGid}, (e, keys) => {
          if (e) {
            mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
            return;
          }
  
          let i = 0;
          let res = {};
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: inputGid}, (e, v) => {
              if (e) {
                mrService.workerNotify(e, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
                return;
              }
              const mapRes = mrService.mapper(k, v);
              // need to do some intermediate grouping for compaction
              for (const mapElem of mapRes) {
                const mapResKey = Object.keys(mapElem)[0];
                if (mapResKey in res) {
                  res[mapResKey].push(mapElem[mapResKey]);
                } else {
                  res[mapResKey] = [mapElem[mapResKey]];
                }
              }
              i++;
              if (i == keys.length) {
                let shuffleCounter = 0;
                for (const resKey in res) {
                  // E1: COMPACTION
                  const compactPair = mrService.compact(resKey, res[resKey]);
                  const compactKey = Object.keys(compactPair)[0];

                  // storing res of compaction under mr id group aka SHUFFLING 
                  global.distribution[outputGid][memType].append(compactKey, compactPair[compactKey], (e, v) => {
                    if (e) {
                      mrService.notify(e, mrServiceName, coordinatorConfig);
                      return;
                    }

                    shuffleCounter++;
                    if (shuffleCounter == Object.entries(res).length) {
                      //notify coordinator that worker is done mapper & shuffling
                      const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                      global.distribution.local.comm.send([[]], remote, (e, v) => {
                        return;
                      });
                    }
                  });
                }
                if (Object.entries(res).length == 0) {
                  const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                  global.distribution.local.comm.send([[]], remote, (e, v) => {
                    return;
                  });
                }
              }
            });
          }
          if (0 == keys.length) {
            const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
            global.distribution.local.comm.send([[]], remote, (e, v) => {
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
      global.distribution.local.groups.get(config.gid, (e, v) => {
        if (e) {
          counter = 0;
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counter++;

        if (counter == groupLen) {
          // deregister here? received all map res, start reduce TODO 
          const remote = {service: id, method: 'reduceWrapper'};
          global.distribution[config.gid].comm.send([id, global.nodeConfig, out, memType], remote, (e, v) => {
            counter = 0;
            if (Object.keys(e) > 0) {
              cb(e, null);
            }
            return;
          });
        }
      })
    };

    let counterReduce = 0;
    // coordinator node's notify for reduce
    mrServiceCoord.receiveNotifyReduce = (obj) => {
      let finalRes = [];
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(config.gid, (e, v) => {
        if (e) {
          counterReduce = 0;
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counterReduce++;
        if (counterReduce == groupLen) {
          counterReduce = 0;
          // deregister here? received all reduce res TODO delete group mr service and remove mr job routes
          // delete groups & services
          // TODO? should delete final out group for distributed persistence?
          // E2: no longer reciving results from workers (workers directly store results), so can just get them
          global.distribution[out][memType].get(null, (e, keys) => {
            if (Object.keys(e).length > 0) {
              cb(e, null);
              return;
            }
            
            for (const key of keys) {
              global.distribution[out][memType].get(key, (e, val) => {
                const kv = {};
                kv[key] = val;
                finalRes.push(kv);

                if (finalRes.length == keys.length) {
                  cb(null, finalRes);
                  return;
                }
              });
            }
            if (keys.length == 0) {
              cb(e, keys);
              return;
            }
          });
        }
      })
    };

    // WHERE EXEC STARTS AFTER SETUP
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

        // E2: putting new group on coordinator and workers for them to store reducer res themselves
        global.distribution.local.groups.put(out, nodeGroup, (e, v) => {
          global.distribution[config.gid].groups.put(out, nodeGroup, (e, v) => {
            // add mr service to all worker nodes in group
            global.distribution[config.gid].routes.put(mrService, id, (e, v) => {
              // add mr service to coordinator node
              global.distribution.local.routes.put(mrServiceCoord, id, (e, v) => {
                
                // setup down, call map on all of the worker nodes
                const remote = {service: id, method: 'mapWrapper'};
                global.distribution[config.gid].comm.send([id, global.nodeConfig, config.gid, id, memType], remote, (e, v) => {
  
                });
              });
            });
          });
        });
      });
    });
  }

  return {exec};
};

module.exports = mr;