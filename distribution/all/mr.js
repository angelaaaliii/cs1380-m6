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

const {execSync} = require('child_process');
const fs = require('fs');
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
  function exec(configuration, cb, compact=(c_k, c_v)=>{const res = {}; res[c_k] = c_v; return res;}, out='final-', inMemory=false, rounds=1) {
    // setup
    let iterativeCounter = 0;
    let memType = 'store';
    const id = 'mr-' + Math.random().toString(36).substring(2, 3 + 2);
    if ('out' in configuration) {
      out = configuration.out;
    } else {
      out = out + id;
    }
    if ('rounds' in configuration) {
      rounds = configuration.rounds;
    }
    if ('inMemory' in configuration) {
      if (configuration.inMemory) {
        memType = 'mem';
      }
    }

    let reduceOutGid = iterativeCounter + out;
    let mapInGid = config.gid;
    let mapOutGid = iterativeCounter + id;
    let reduceInGid = mapOutGid;
    // if (rounds == 1) {
    //   // can set outputGid to out
    //   reduceOutGid = out;
    // }
    // MR SERVICE FUNCS FOR WORKER NODES
    // notify method for worker nodes
    const mrService = {};
    mrService.workerNotify = (execSync, finalOut, serviceName, coordinatorConfig, methodName) => {
      const remote = {node: coordinatorConfig, method: methodName, service: serviceName};
      global.distribution.local.comm.send([execSync, finalOut], remote, (e, v) => {
        return;
      });
    };

    // reduce func for workers
    mrService.reducer = configuration.reduce;
    mrService.reduceWrapper = (mrServiceName, coordinatorConfig, reduceInGid, reduceOutGid, memType, execSync, finalOut) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e;
        }

        // get keys on this node
        global.distribution.local[memType].get({key: null, gid: reduceInGid}, (e, keys) => {
          if (e) {
            mrService.workerNotify(execSync, finalOut, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

          let i = 0;
          console.log("REDUCER KEYS gotten from = ", keys.length, reduceInGid);
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: reduceInGid}, (e, v) => {
              if (e) {
                mrService.workerNotify(execSync, finalOut, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
                return;
              }
              // E2: no longer sending reducer res to coordinator, just storing them under final group id
              const reduceRes = mrService.reducer(k, v);
              if (v[0].original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
                console.log("IN REDUCER EXEC INPUT =", k, v);
              }
              const reduceKey = Object.keys(reduceRes)[0];
              if (v[0].original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
                console.log("IN REDUCER EXEC RES =", reduceRes);
              }
              let reducerOutGroup;
              if ('page_text' in reduceRes[reduceKey]) {
                reducerOutGroup = finalOut;
              } else {
                reducerOutGroup = reduceOutGid;
              }
              if (v[0].original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
                console.log("REDUCER OUT GROUP =", reducerOutGroup);
              }
              // console.log("REDUCER FINAL PUT = ", reducerOutGroup)
              global.distribution[reducerOutGroup][memType].put(reduceRes[reduceKey], reduceKey, (e, v) => {
                i++;
                if (i == keys.length) {
                  // notify coordinator we are done reduce and send result
                  mrService.workerNotify(execSync, finalOut, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
                  return;
                }
              });
            });
          }
          if (0 == keys.length) {
            // notify coordinator we are done reduce and send result
            mrService.workerNotify(execSync, finalOut, mrServiceName, coordinatorConfig, 'receiveNotifyReduce');
            return;
          }

        });
      });
    };

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, coordinatorConfig, inputGid, outputGid, memType, execSync, finalOut) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e;
        }

        global.distribution.local[memType].get({key: null, gid: inputGid}, (e, keys) => {
          if (e) {
            mrService.workerNotify(execSync, finalOut, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
            return;
          }
  
          let i = 0;
          let res = [];
          console.log("MAPPER KEYS = ", keys.length, inputGid);
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: inputGid}, (e, v) => {
              if (e) {
                mrService.workerNotify(execSync, finalOut, mrServiceName, coordinatorConfig, 'receiveNotifyShuff');
                return;
              }
              const mapRes = mrService.mapper(k, v, execSync);
              res = [...res, ...mapRes];
              i++;
              if (v.original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
                console.log("IN MAPPER EXEC RES =", mapRes);
              }
              if (i == keys.length) {
                let shuffleCounter = 0;
                for (const pair of res) {
                  const shuffleKey = Object.keys(pair)[0];

                  // SHUFFLING 
                  if (pair[shuffleKey].original_url == "https://en.wikipedia.org/wiki/Josh_Schache" && 'page_text' in pair[shuffleKey]) {
                    console.log("IN EXEC CALLING CRAWL APPEND ON =", pair[shuffleKey]);
                  }
                  global.distribution[outputGid][memType].crawl_append(shuffleKey, pair[shuffleKey], (e, v) => {
                    if (pair[shuffleKey].original_url == "https://en.wikipedia.org/wiki/Josh_Schache" && 'page_text' in pair[shuffleKey]) {
                      console.log("IN EXEC DONE CALLING CRAWL APPEND ON =", pair[shuffleKey]);
                    }
                    shuffleCounter++;
                    if (shuffleCounter == res.length) {
                      //notify coordinator that worker is done mapper & shuffling
                      global.distribution[outputGid][memType].get("https://en.wikipedia.org/wiki/Josh_Schache", (e, v) => {
                        console.log("GOTTEN OJSH", v);
                        const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                        global.distribution.local.comm.send([execSync, finalOut], remote, (e, v) => {
                          return;
                        });

                      });
                    }
                  });
                }
                if (res.length == 0) {
                  const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
                  global.distribution.local.comm.send([execSync, finalOut], remote, (e, v) => {
                    return;
                  });
                }
              }
            });
          }
          if (0 == keys.length) {
            const remote = {node: coordinatorConfig, method: 'receiveNotifyShuff', service: mrServiceName};
            global.distribution.local.comm.send([execSync, finalOut], remote, (e, v) => {
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
    mrServiceCoord.receiveNotifyShuff = (execSync, finalOut) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(config.gid, (e, v) => {
        const groupLen = Object.keys(v).length;
        counter++;

        if (counter == groupLen) {
          // deregister here? received all map res, start reduce TODO 
          counter = 0;
          const remote = {service: id, method: 'reduceWrapper'};
          global.distribution[config.gid].comm.send([id, global.nodeConfig, reduceInGid, reduceOutGid, memType, execSync, finalOut], remote, (e, v) => {
            // remove map in/out groups
            global.distribution.local.groups.del(mapOutGid, (e, v) => {
              global.distribution[config.gid].groups.del(mapOutGid, (e, v) => {
                if (mapInGid != config.gid) {
                  global.distribution.local.groups.del(mapInGid, (e, v) => {
                    global.distribution[config.gid].groups.del(mapInGid, (e, v) => {
                      return;
                    });
                  });
                } else {
                  return;
                }
              });
            });
          });
        }
      })
    };

    let counterReduce = 0;
    // coordinator node's notify for reduce
    mrServiceCoord.receiveNotifyReduce = (execSync, finalOut) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(config.gid, (e, v) => {
        const groupLen = Object.keys(v).length;
        counterReduce++;
        if (counterReduce == groupLen && iterativeCounter + 1 == rounds) {
          counterReduce = 0;
          // DONE ITERATIVE MAP REDUCE
          // E2: no longer reciving results from workers (workers directly store results), so can just get them            
          // deregistering routes
          global.distribution.local.routes.rem(id, (e, v) => {
            global.distribution[config.gid].routes.rem(id, (e, v) => {

              // removing extra groups
              global.distribution.local.groups.del(reduceInGid, (e, v) => {
                global.distribution[config.gid].groups.del(reduceInGid, (e, v) => {
                  // if out group specified, no need to delete it
                  cb(null, null);
                  return;
                });
              });
            });
          });
        } else if (counterReduce == groupLen && iterativeCounter + 1 < rounds) {
          counterReduce = 0;
          // E4: ITERATIVE MAP REDUCE
          // trigger next round of exec
          iterativeCounter++;

          // can only remove map in and reduce in gids because others are needed for next iter
          global.distribution.local.groups.del(reduceInGid, (e, v) => {
            global.distribution[config.gid].groups.del(reduceInGid, (e, v) => {

              // update gids for map/reduce wrapper funcs
              console.log("LAST ROUND, MAP IN, MAP OUT, REDUCE IN, REDUCE OUT = ", mapInGid, mapOutGid, reduceInGid, reduceOutGid);
              mapInGid = reduceOutGid;
              mapOutGid = iterativeCounter + id;
              reduceInGid = mapOutGid;
              reduceOutGid = iterativeCounter + out;
              console.log("NEXT ITER, MAP IN, MAP OUT, REDUCE IN, REDUCE OUT = ", mapInGid, mapOutGid, reduceInGid, reduceOutGid);
              global.distribution.local.groups.get(config.gid, (e, nodeGroup) => {
                // put this view of the group on all worker nodes, under map out gid
                global.distribution[config.gid].groups.put(mapOutGid, nodeGroup, (e, v) => {
                  // E2: putting new group on coordinator and workers for them to store reducer res themselves
                  global.distribution.local.groups.put(reduceOutGid, nodeGroup, (e, v) => {
                    global.distribution[config.gid].groups.put(reduceOutGid, nodeGroup, (e, v) => {
                      
                      // setup done, call map on all of the worker nodes
                      const remote = {service: id, method: 'mapWrapper'};
                      global.distribution[config.gid].comm.send([id, global.nodeConfig, mapInGid, mapOutGid, memType, execSync, finalOut], remote, (e, v) => {
                        if (mapInGid != config.gid) {
                          global.distribution.local.groups.del(mapInGid, (e, v) => {
                            global.distribution[config.gid].groups.del(mapInGid, (e, v) => {
                              return;
                            });
                          });
                        } else {
                          return;
                        }
                      });
          
                    });
                  });
                });
              });
            });
          });

        }
      })
    };

    // WHERE EXEC STARTS AFTER SETUP
    // get all nodes in coordinator's view of group
    global.distribution.local.groups.get(config.gid, (e, nodeGroup) => {
      // put this view of the group on all worker nodes, under map out gid
      global.distribution[config.gid].groups.put(mapOutGid, nodeGroup, (e, v) => {
        // E2: putting new group on coordinator and workers for them to store reducer res themselves
        global.distribution.local.groups.put(reduceOutGid, nodeGroup, (e, v) => {
          global.distribution[config.gid].groups.put(reduceOutGid, nodeGroup, (e, v) => {
            // add mr service to all worker nodes in group
            global.distribution[config.gid].routes.put(mrService, id, (e, v) => {
              // add mr service to coordinator node
              global.distribution.local.routes.put(mrServiceCoord, id, (e, v) => {
                
                // put final out gid on nodes
                global.distribution.local.groups.put(out, nodeGroup, (e, v) => {
                  global.distribution[config.gid].groups.put(out, nodeGroup, (e, v) => {
                    // setup done, call map on all of the worker nodes
                    const remote = {service: id, method: 'mapWrapper'};
                    global.distribution[config.gid].comm.send([id, global.nodeConfig, mapInGid, mapOutGid, memType, execSync, out], remote, (e, v) => {
                    });
                  });
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