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
  function exec(configuration, cb, out='final-', inMemory=false, rounds=1) {
    // setup
    console.log("TOP OF EXEC");
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


    // MR SERVICE FUNCS FOR WORKER NODES
    // notify method for worker nodes
    const mrService = {};

    // reduce func for workers
    mrService.reducer = configuration.reduce;
    mrService.reduceWrapper = (mrServiceName, reduceInGid, reduceOutGid, memType, finalOut, callback) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        console.log("IN REDUCE WRAPPER", e);
        if (e) {
          console.log("2", e);
          callback(e, null);
          return e;
        }

        // get keys on this node
        global.distribution.local[memType].get({key: null, gid: reduceInGid}, (e, keys) => {
          if (e) {
            console.log("3", e);
            callback(e, null);
            return;
          }

          let i = 0;
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: reduceInGid}, (e, v) => {
              if (e) {
                console.log("4", e);
                callback(e, null);
                return;
              }
              // E2: no longer sending reducer res to coordinator, just storing them under final group id
              const reduceRes = mrService.reducer(k, v);
              const reduceKey = Object.keys(reduceRes)[0];
              let reducerOutGroup;
              if ('page_text' in reduceRes[reduceKey]) {
                reducerOutGroup = finalOut;
              } else {
                reducerOutGroup = reduceOutGid;
              }
              global.distribution[reducerOutGroup][memType].put(reduceRes[reduceKey], reduceKey, (e, v) => {
                i++;
                if (e) {
                  console.log("5", e);
                  callback(e, null);
                  return;
                }
                if (i == keys.length) {
                  // notify coordinator we are done reduce and send result
                  callback(null, null);
                  return;
                }
              });
            });
          }
          if (0 == keys.length) {
            // notify coordinator we are done reduce and send result
            callback(null, null);
            return;
          }

        });
      });
    };

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, inputGid, outputGid, memType, execSync, callback) => {
      console.log("IN MAP WRAPPER", outputGid);
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          console.log("6", e);
          callback(e, null);
          return;
        }

        let i = 0;
        let res = [];
        global.distribution.local[memType].get({key: null, gid: inputGid}, (e, keys) => {
          if (e) {
            console.log("7", e);
            callback(e, null);
            return;
          }

          console.log("in map wrapper, got keys", keys.length);
  
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: inputGid}, (e, v) => {
              if (e) {
                console.log("8", e);
                callback(e, null);
                return;
              }

              const mapRes = mrService.mapper(k, v, execSync);
              res = [...res, ...mapRes];
              i++;
              if (i == keys.length) {
                console.log("STARTING TO SHUFFLE");
                let shuffleCounter = 0;
                for (const pair of res) {
                  const sanitized_url = Object.keys(pair)[0];
                  // SHUFFLING 
                  global.distribution[outputGid][memType].crawl_append(sanitized_url, pair[sanitized_url], (e, v) => {
                    if (e) {
                      console.log("9 mAP WRAPPER SHUFFLE COUNTER =", outputGid, shuffleCounter, res.length, e, new Date().toLocaleTimeString());
                      callback(e, null);
                      return;
                    }
                    shuffleCounter++;
                    
                    if (shuffleCounter == res.length) {
                      console.log("DONE SHUFFLE");
                      callback(null, v);
                      return;
                    }
                  });
                }
                if (res.length == 0) {
                  callback(null, v);
                  return;
                }
              }
       
            });
          }
          if (0 == keys.length) {
            callback(null, v);
            return;
          }
        });
        

      });
    };


    // WHERE EXEC STARTS AFTER SETUP

    // get all nodes in coordinator's view of group
    console.log("IN EXEC");
    global.distribution.local.groups.get(mapInGid, (e, nodeGroup) => {
      // put this view of the group on all worker nodes, under map out gid
      global.distribution[config.gid].groups.put(mapOutGid, nodeGroup, (e, v) => {
        // E2: putting new group on coordinator and workers for them to store reducer res themselves
        global.distribution.local.groups.put(reduceOutGid, nodeGroup, (e, v) => {
          global.distribution[config.gid].groups.put(reduceOutGid, nodeGroup, (e, v) => {
            // add mr service to all worker nodes in group
            global.distribution[config.gid].routes.put(mrService, id, (e, v) => {

                // put final out gid on nodes
                global.distribution.local.groups.put(out, nodeGroup, (e, v) => {
                  global.distribution[config.gid].groups.put(out, nodeGroup, (e, v) => {
                    // setup done, call map on all of the worker nodes
                    console.log("very begining of exec calling map wrapper", iterativeCounter);
                    const remote = {service: id, method: 'mapWrapper'};
                    global.distribution[config.gid].comm.send([id, mapInGid, mapOutGid, memType, execSync], remote, (e, v) => {
                      console.log("done initialize mapwrapper comm send", iterativeCounter);
                      if (Object.keys(e).length > 0) {
                        console.log("22", e);
                        cb(e, null);
                        return;
                      }

                      // remove map in/out groups
                      global.distribution.local.groups.del(mapOutGid, (e, v) => {
                        global.distribution[config.gid].groups.del(mapOutGid, (e, v) => {
                          if (mapInGid != config.gid) {
                      global.distribution.local.groups.del(mapInGid, (e, v) => {
                        global.distribution[config.gid].groups.del(mapInGid, (e, v) => {
                              });
                            });
                          }

                          // done map wrapper on all nodes, now call reduceWrapper
                          const remote = {service: id, method: 'reduceWrapper'};
                          global.distribution[config.gid].comm.send([id, reduceInGid, reduceOutGid, memType, out], remote, (e, v) => {
                            if (Object.keys(e).length > 0) {
                              console.log("15", e);
                              cb(e, null);
                              return;
                            }
                            console.log("ITERATION DONE, DONE REDUCE WRAPPEr", global.distribution.local.store.crawl_append);
                            if (configuration.iterativeCounter == configuration.rounds) {
                              // deregistering routes
                              global.distribution[config.gid].routes.rem(id, (e, v) => {
                                // removing extra groups
                                global.distribution.local.groups.del(reduceInGid, (e, v) => {
                                  global.distribution[config.gid].groups.del(reduceInGid, (e, v) => {
                                    // if out group specified, no need to delete it
                                    console.log("MR DONE", new Date().toLocaleTimeString());
                                    cb(null, reduceOutGid);
                                    return;
                                  });
                                });
                              });
               
                            } else {
                              // global.distribution.local.store.crawl_append("hi", {original_url: "hi", page_text: "hi"}, (e, v) => {
                              //   console.log("30", e);
                              //   cb(e, null);
                              //   return;
                              // });
                              console.log("ITERATIVE COUNTER = ", configuration.iterativeCounter);
                              configuration['iterativeCounter'] = configuration.iterativeCounter + 1;
                              configuration['mapInGid'] = reduceOutGid;
                              configuration['mapOutGid'] = configuration.iterativeCounter+id;
                              configuration['reduceInGid'] = mapOutGid;
                              configuration['reduceOutGid'] = configuration.iterativeCounter + out;
                              configuration['id'] = id;
                              console.log("iterative counter, rounds = ", configuration.iterativeCounter, configuration.rounds);
                              console.log("before calling routes", global.distribution[config.gid].routes);
                
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
    });
  }

  return {exec};
};




module.exports = mr;