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
    mrService.notifyMap = (obj, serviceName, coordinatorConfig) => {
      const remote = {node: coordinatorConfig, method: 'notify', service: serviceName};
      global.distribution.local.comm.send([obj], remote, (e, v) => {
        return;
      });
    };

    // reduce func for workers
    mrService.reducer = configuration.reduce;

    // map/mapper funcs for workers
    mrService.mapper = configuration.map;
    mrService.mapWrapper = (mrServiceName, coordinatorConfig, gid) => {
      global.distribution.local.routes.get(mrServiceName, (e, mrService) => {
        if (e) {
          return e; // TODO?
        }

        global.distribution.local.store.get({key: null, gid: gid}, (e, v) => {
          if (e) {
            mrService.notifyMap(e, mrServiceName, coordinatorConfig);
            return;
          }
  
          const keys = v;
          let i = 0;
          let res = []
          for (const k of keys) {
            global.distribution.local.store.get({key: k, gid: gid}, (e, v) => {
              if (e) {
                mrService.notifyMap(e, mrServiceName, coordinatorConfig);
                return;
              }
              const mapRes = mrService.mapper(k, v);
              i++;
              res = [...res, ...mapRes];
            });
          }
          if (i == keys.length) {
            // notify coordinator that worker is done mapper 
            const remote = {node: coordinatorConfig, method: 'receiveNotifyMap', service: mrServiceName};
            global.distribution.local.comm.send([res], remote, (e, v) => {
              return;
            })
          }
        });
        

      });
    }

    const mrServiceOrch = {};
    let counter = 0;
    let mapRes = [];
    // orchestrator node's notify for mr service
    mrServiceOrch.receiveNotifyMap = (obj) => {
      // get num of nodes we expect responses from:
      global.distribution.local.groups.get(config.gid, (e, v) => {
        if (e) {
          cb(e, null);
          return;
        }
        const groupLen = Object.keys(v).length;
        counter++;
        mapRes = [...mapRes, ...obj];
        if (counter == groupLen) {
          // deregister here? received all map res, start reduce?
          const reduceInput = {};
          for (let elem of mapRes) {
            const k = Object.keys(elem)[0];
            if (k in reduceInput) {
              reduceInput[k].push(elem[k]);
            } else {
              reduceInput[k] = [elem[k]];
            }
          }
            
          let finalOut = [];
          for (let key of Object.keys(reduceInput)) {
            finalOut.push(configuration.reduce(key, reduceInput[key]));
          }
          cb(null, finalOut);
          return;
        }
      })
    };

    // WHERE EXEC STARTS
    // add mr service to all worker nodes in group
    global.distribution[config.gid].routes.put(mrService, id, (e, v) => {
      // add mr service to orchestrator node
      global.distribution.local.routes.put(mrServiceOrch, id, (e, v) => {
        
        // setup down, call map on all of the worker nodes
        const remote = {service: id, method: 'mapWrapper'};
        global.distribution[config.gid].comm.send([id, global.nodeConfig, config.gid], remote, (e, v) => {

        })
      });
    });
  }

  return {exec};
};

module.exports = mr;
