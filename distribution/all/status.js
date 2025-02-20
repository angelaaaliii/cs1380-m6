
const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    get: (configuration, callback) => {
      const remote = {service: 'status', method: 'get'};
      global.distribution[context.gid].comm.send([configuration], remote, (e, v)=> {
        callback(e, v);
        return;
      });
    },

    spawn: (configuration, callback) => {
      // The spawn method starts a new node with appropriate IP and port information, 
      // and adds that node to the corresponding group for all nodes (see above)

      global.distribution.local.status.spawn(configuration, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        // adds node to corresponding group for all nodes
        const remote = {service: 'groups', method: 'put'};
        global.distribution[context.gid].comm.send([context.gid, configuration], remote, (e, v) => {
          callback(e, v);
          return;
        })
      });
    },

    stop: (callback) => {
      let val_map = {};
      let err_map = {};
      let group_nodes;
      
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        group_nodes = v;
        const group_len = Object.keys(v).length;

        let i = 0;
        for (let sid in group_nodes) { // TODO use nid
          if (sid != global.nodeConfig.sid) {
            // stop nodes that are not local node
            let configuration = {node: group_nodes[sid], method: "stop", service: 'status'};

            global.distribution.local.comm.send([], configuration, (e, v) => {
              if (e) {
                err_map[sid] = e;
              } else {
                val_map[sid] = v;
              }

              i += 1;

              if (i == group_len - 1) {
                // time to stop local node
                callback(err_map, val_map);
                return;
         
              }
            })
          }
        }
      });
    },
  };
};

module.exports = status;
