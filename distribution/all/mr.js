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
  function exec(configuration, cb, out='final-', inMemory=false, rounds=1) {
    // setup
    let memType = 'store';
    let id;
    if ('id' in configuration) {
      id = configuration.id;
    } else {
      id ='mr-' + Math.random().toString(36).substring(2, 3 + 2);
    }
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
    let iterativeCounter;
    if ('iterativeCounter' in configuration) {
      iterativeCounter = configuration['iterativeCounter'];
    } else {
      configuration['iterativeCounter'] = 1;
      iterativeCounter=1;
    }

    let mapInGid;
    let mapOutGid;
    if ('mapInGid' in configuration) {
      mapInGid = configuration.mapInGid;
      mapOutGid = configuration.mapOutGid;
    } else {
      mapInGid = config.gid;
      mapOutGid = iterativeCounter + id;
    }

    let total = 0;
    if ('total' in configuration) {
      total = configuration.total;
    }

    let mapOutConfig;
    if ('mapOutConfig' in configuration) {
      mapOutConfig = configuration.mapOutConfig;
    } else {
      mapOutConfig = config.gid;
    }

    // MR SERVICE FUNCS FOR WORKER NODES
    // notify method for worker nodes
    const mrService = {};

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, inputGid, outputGid, finalOut, memType, callback) => {      
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          global.distribution.local.store.rem(inputGid, (e2, v) => {
            callback(e, null);
            return;
          });
        }
        global.distribution.local[memType].get({key: null, gid: inputGid}, (e, keys) => {
          if (e) {
            keys = [];
          }
          let i = 0;
          let outPutCounter = 0;
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: inputGid}, (e, v) => {
              if (e) {
                global.distribution.local.store.rem(inputGid, (e2, v) => {
                  callback(e, null);
                  return;
                });
              }
              // setTimeout(function (){
  
                // rate limit?

                mrService.mapper(k, v).then(mapRes => {
                  let shuffleCounter = 0;
                  let out = outputGid;
                  for (const pair of mapRes) {
                    const sanitized_url = Object.keys(pair)[0];
                    if ('page_text' in pair[sanitized_url]) {
                      out = finalOut;
                    } else {
                      out = outputGid;
                    }
                    global.distribution[out][memType].put(pair[sanitized_url], sanitized_url, (e, v) => {
                      shuffleCounter++;
                      if (!e && v && out == finalOut) {
                        outPutCounter++;
                      }
                      if (shuffleCounter == mapRes.length) {
                        i++
                        if (i == keys.length) {
                          global.distribution.local.store.rem(inputGid, (e2, v) => {
                            callback(null, outPutCounter);
                            return;
                          });
                        }
                      }
                    });
                  }
                  if (mapRes.length == 0) {
                    i++;
                    if (i == keys.length) {
                      global.distribution.local.store.rem(inputGid, (e2, v) => {
                        callback(null, outPutCounter);
                        return;
                      });
                    }
                  }
                })
                .catch(err => {
                  i++
                  if (i == keys.length) {
                    global.distribution.local.store.rem(inputGid, (e2, v) => {
                      callback(null, outPutCounter);
                      return;
                    });
                  }
                });
            });
          }
          if (0 == keys.length) {
            global.distribution.local.store.rem(inputGid, (e2, v) => {
              callback(null, outPutCounter);
              return;
            });
          }
        });
      });
    };

    // get all nodes in coordinator's view of group
    const startTime = performance.now();
    global.distribution.local.groups.get(config.gid, (e, nodeGroup) => {
      // put this view of the group on all worker nodes, under map out gid
      global.distribution.local.groups.put(mapOutGid, nodeGroup, (e, v) => {
        global.distribution[config.gid].groups.put(mapOutGid, nodeGroup, (e, v) => {
          // E2: putting new group on coordinator and workers for them to store reducer res themselves
              
          // add mr service to all worker nodes in group
          global.distribution[config.gid].routes.put(mrService, id, (e, v) => {

              // put final out gid on nodes
              global.distribution.local.groups.put(out, mapOutConfig, (e, v) => {
                global.distribution[config.gid].groups.put(out, mapOutConfig, (e, v) => {
                  // setup done, call map on all of the worker nodes
                  const remote = {service: id, method: 'mapWrapper'};
                  global.distribution[config.gid].comm.send([id, mapInGid, mapOutGid, out, memType], remote, (e, v) => {
                    if (Object.keys(e).length > 0) {
                      cb(e, null);
                      return;
                    }

                    for (const nid of Object.keys(v)) {
                      total += v[nid];
                    }

                    // call indexer mr
                    if ('indexMapper' in configuration) {
                      const indexConfig = { map: configuration.indexMapper, reduce: configuration.indexReducer, rounds: 1, out: configuration.iterativeCounter + "_INDEX_TEST", mapInGid: out, mapOutGid: configuration.iterativeCounter + "_mapIndexOut", reduceOutGid: configuration.iterativeCounter + "_reduceIndexOut"};
                      global.distribution[out].mr.execIndex(indexConfig, (e, v) => {
                      });
                    }

                    if (configuration.iterativeCounter == configuration.rounds) {

                      // remove store input files
                      global.distribution[config.gid].store.rem(mapInGid, (e, v) => {
                        // deregistering routes
                        global.distribution[config.gid].routes.rem(id, (e, v) => {
                          // removing extra groups
                              cb(null, total);
                              return;
                        });
                      });
                    } else {
                      configuration['iterativeCounter'] = configuration.iterativeCounter + 1;
                      configuration['mapInGid'] = mapOutGid;
                      configuration['mapOutGid'] = configuration.iterativeCounter+'_mapOut';
                      configuration['id'] = id;
                      configuration['out'] = configuration.iterativeCounter + "_CRAWL_TEST";
                      configuration['total'] = total;
                      exec(configuration, cb);
                    }
                  });
                });
              });
          });
        });
      });
    });
  }


  function execIndex(configuration, cb, out='final-', inMemory=false, rounds=1) {
    // setup
    let memType = 'store';
    let id;
    if ('id' in configuration) {
      id = configuration.id;
    } else {
      id ='mr-' + Math.random().toString(36).substring(2, 3 + 2);
    }
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
    let iterativeCounter;
    if ('iterativeCounter' in configuration) {
      iterativeCounter = configuration['iterativeCounter'];
    } else {
      configuration['iterativeCounter'] = 1;
      iterativeCounter=1;
    }

    let reduceOutGid;
    let mapInGid;
    let mapOutGid;
    let reduceInGid;
    if ('mapInGid' in configuration) {
      reduceOutGid = configuration.reduceOutGid;
      mapInGid = configuration.mapInGid;
      mapOutGid = configuration.mapOutGid;
      reduceInGid = mapOutGid;
    } else {
      reduceOutGid = iterativeCounter + out;
      mapInGid = config.gid;
      mapOutGid = iterativeCounter + id;
      reduceInGid = mapOutGid;
    }

    // MapReduce service functions for worker nodes
    // notify method for worker nodes
    const mrService = {};

    // reduce func for workers
    mrService.reducer = configuration.reduce;
    mrService.reduceWrapper = (mrServiceName, reduceInGid, reduceOutGid, memType, finalOut, callback) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          callback(e, null);
          return;
        }

        // get keys on this node
        global.distribution.local[memType].get({key: null, gid: reduceInGid}, (e, keys) => {
          if (e) {
            keys = [];
          }

          let i = 0;
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: reduceInGid}, (e, v) => {
              if (e) {
                callback(e, null);
                return;
              }
              // No longer sending reducer res to coordinator, just storing them under final group id
              const reduceRes = mrService.reducer(k, v);
              global.distribution[reduceOutGid][memType].put(reduceRes['values'], k, (e, v) => {
                i++;
                if (e) {
                  callback(e, null);
                  return;
                }
                if (i == keys.length) {
                  // Notify coordinator we are done reduce and send result
                  callback(null, null);
                  return;
                }
              });
            });
          }
          if (0 == keys.length) {
            // Notify coordinator we are done reduce and send result
            callback(null, null);
            return;
          }

        });
      });
    };

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, inputGid, outputGid, memType, docs, callback) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          callback(e, null);
          return;
        }
        global.distribution.local[memType].get({key: null, gid: inputGid}, (e, keys) => {
          if (e) {
            keys = [];
          }
          let i = 0;
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: inputGid}, (e, v) => {
              if (e) {
                callback(e, null);
                return;
              }
              const mapRes = mrService.mapper(k, v['page_text'], docs);
              let shuffleCounter = 0;
              for (const key of Object.keys(mapRes)) {
                global.distribution[outputGid][memType].append(key, [mapRes[key]], (e, v) => {
                  shuffleCounter++;
                  if (e) {
                    callback(e, null);
                    return;
                  }
                  if (shuffleCounter == Object.keys(mapRes).length) {
                    i++
                    if (i == keys.length) {
                      callback(null, null);
                      return;
                    }
                  }
                });
              }
              if (Object.keys(mapRes).length == 0) {
                i++;
                if (i == keys.length) {
                  callback(null, null);
                  return;
                }
              }
            });
          }
          if (0 == keys.length) {
            callback(null, null);
            return;
          }
        });
      });
    };


    // Starting exec after setup process

    // Fetch all nodes in coordinator's view of group
    global.distribution.local.groups.get(config.gid, (e, nodeGroup) => {
      // Put this view of the group on all worker nodes, under map out GID
      global.distribution.local.groups.put(mapOutGid, nodeGroup, (e, v) => {
        global.distribution[config.gid].groups.put(mapOutGid, nodeGroup, (e, v) => {
          // Putting new group on coordinator and workers for them to store reducer res themselves
          global.distribution.local.groups.put(reduceOutGid, nodeGroup, (e, v) => {
            global.distribution[config.gid].groups.put(reduceOutGid, nodeGroup, (e, v) => {
              // Add mr service to all worker nodes in group
              global.distribution[config.gid].routes.put(mrService, id, (e, v) => {
                  // Put final out GID on nodes
                  global.distribution.local.groups.put(out, nodeGroup, (e, v) => {
                    global.distribution[config.gid].groups.put(out, nodeGroup, (e, v) => {
                      // Setup done, call map on all of the worker nodes
                      const remote = {service: id, method: 'mapWrapper'};
                      global.distribution[config.gid].comm.send([id, mapInGid, mapOutGid, memType, 4], remote, (e, v) => {
                        if (Object.keys(e).length > 0) {
                          cb(e, null);
                          return;
                        }
                            // Done map wrapper on all nodes, now call reduceWrapper
                            const remote = {service: id, method: 'reduceWrapper'};
                            global.distribution[config.gid].comm.send([id, reduceInGid, reduceOutGid, memType, out], remote, (e, v) => {
                              if (configuration.iterativeCounter == configuration.rounds) {
                                // Deregistering routes
                                global.distribution[config.gid].routes.rem(id, (e, v) => {
                                      cb(null, reduceOutGid);
                                      return;
                                });
                 
                              } else {
                                configuration['iterativeCounter'] = configuration.iterativeCounter + 1;
                                configuration['mapInGid'] = reduceOutGid;
                                configuration['mapOutGid'] = configuration.iterativeCounter+'_mapOut';
                                configuration['reduceOutGid'] = configuration.iterativeCounter + "_reduceOut";
                                configuration['id'] = id;
                                configuration['out'] = configuration.iterativeCounter + "_CRAWL_TEST";
                                exec(configuration, cb);
                              }
                            });
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

  return {exec, execIndex};
};

module.exports = mr;