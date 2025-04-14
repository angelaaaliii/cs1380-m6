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

    let mapInGid;
    let mapOutGid;
    if ('mapInGid' in configuration) {
      mapInGid = configuration.mapInGid;
      mapOutGid = configuration.mapOutGid;
    } else {
      mapInGid = config.gid;
      mapOutGid = iterativeCounter + id;
    }

    console.log("DONE INITIAL VARS SET UP = ", memType, id, out, rounds, iterativeCounter, mapInGid, mapOutGid);


    // MR SERVICE FUNCS FOR WORKER NODES
    // notify method for worker nodes
    const mrService = {};

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, inputGid, outputGid, finalOut, memType, execSync, callback) => {
      console.log("IN MAP WRAPPER", outputGid);
      
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          console.log("6", e);
          callback(e, null);
          return;
        }
        global.distribution.local[memType].get({key: null, gid: inputGid}, (e, keys) => {
          if (e) {
            console.log("7", e);
            keys = [];
          }
          console.log("in map wrapper, got keys", keys.length);
          let i = 0;
          let res = [];
          for (const k of keys) {
            global.distribution.local[memType].get({key: k, gid: inputGid}, (e, v) => {
              if (e) {
                console.log("8", e);
                callback(e, null);
                return;
              }

              const mapRes = mrService.mapper(k, v, execSync);
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
                  if (e) {
                    console.log("9 mAP WRAPPER SHUFFLE COUNTER =", sanitized_url, [pair[sanitized_url]], shuffleCounter);                
                    // callback(e, null);
                    // return;
                  }
                  if (shuffleCounter == mapRes.length) {
                    i++
                    if (i == keys.length) {
                      callback(null, null);
                      return;
                    }
                  }
                });
              }
              if (mapRes.length == 0) {
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


    // WHERE EXEC STARTS AFTER SETUP

    // get all nodes in coordinator's view of group
    console.log("IN EXEC", config.gid);
    global.distribution.local.groups.get(config.gid, (e, nodeGroup) => {
      // put this view of the group on all worker nodes, under map out gid
      global.distribution.local.groups.put(mapOutGid, nodeGroup, (e, v) => {
        global.distribution[config.gid].groups.put(mapOutGid, nodeGroup, (e, v) => {
          // E2: putting new group on coordinator and workers for them to store reducer res themselves
              
              // add mr service to all worker nodes in group
              global.distribution[config.gid].routes.put(mrService, id, (e, v) => {
  
                  // put final out gid on nodes
                  global.distribution.local.groups.put(out, nodeGroup, (e, v) => {
                    global.distribution[config.gid].groups.put(out, nodeGroup, (e, v) => {
                      // setup done, call map on all of the worker nodes
                      console.log("very begining of exec calling map wrapper", iterativeCounter);
                      const remote = {service: id, method: 'mapWrapper'};
                      global.distribution[config.gid].comm.send([id, mapInGid, mapOutGid, out, memType, execSync], remote, (e, v) => {
                        console.log("done initialize mapwrapper comm send", iterativeCounter);
                        if (Object.keys(e).length > 0) {
                          console.log("22", e);
                          cb(e, null);
                          return;
                        }
  
                        // remove map in/out groups
                        // global.distribution.local.groups.del(mapOutGid, (e, v) => {
                          // global.distribution[config.gid].groups.del(mapOutGid, (e, v) => {
                        //     if (mapInGid != config.gid) {
                        // global.distribution.local.groups.del(mapInGid, (e, v) => {
                        //   global.distribution[config.gid].groups.del(mapInGid, (e, v) => {
                        //         });
                        //       });
                        //     }
  
                        // done map wrapper on all nodes,
                        console.log("ITERATION DONE", global.distribution.local.store.crawl_append);
                        if (configuration.iterativeCounter == configuration.rounds) {
                          // deregistering routes
                          global.distribution[config.gid].routes.rem(id, (e, v) => {
                            // removing extra groups
                            // global.distribution.local.groups.del(reduceInGid, (e, v) => {
                            //   global.distribution[config.gid].groups.del(reduceInGid, (e, v) => {
                                // if out group specified, no need to delete it
                                console.log("MR DONE", new Date().toLocaleTimeString());
                                cb(null, mapOutGid);
                                return;
                            //   });
                            // });
                          });
                        } else {
                          // global.distribution.local.store.crawl_append("hi", {original_url: "hi", page_text: "hi"}, (e, v) => {
                          //   console.log("30", e);
                          //   cb(e, null);
                          //   return;
                          // });
                          console.log("ITERATIVE COUNTER = ", configuration.iterativeCounter);
                          configuration['iterativeCounter'] = configuration.iterativeCounter + 1;
                          configuration['mapInGid'] = mapOutGid;
                          configuration['mapOutGid'] = configuration.iterativeCounter+'_mapOut';
                          configuration['id'] = id;
                          configuration['out'] = configuration.iterativeCounter + "_CRAWL_TEST";
                          console.log("iterative counter, rounds = ", configuration.iterativeCounter, configuration.rounds);            
                          exec(configuration, cb);
                        }
      
                          // });
                        // });
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

// mr = require('@brown-ds/distribution/distribution/all/mr').mr; 
module.exports = mr;