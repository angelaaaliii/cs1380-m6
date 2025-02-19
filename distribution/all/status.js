
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
      // TODO
      // local_status.spawn(configuration, (e, v) => {
      //   if (e) {
      //     callback(e, null);
      //   } else {
      //     // add new node to all nodes in group
      //     comm.send()
      //   }
      // });
    },

    stop: (callback) => {
      // TODO?
      // const remote = {service: 'status', method: 'stop'};
      // global.distribution[context.gid].comm.send([], remote, (e, v)=> {
      //   callback(e, v);
      //   return;
      // });

      let val = 0;
      let val_map = {};
      let err_map = {};
      
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        const group_len = Object.keys(v).length;

        let i = 0;
        for (let sid in group_nodes) {
          if (sid != global.moreStatus.sid) {
            // stop nodes that are not local node
            let configuration = {node: group_nodes[sid], method: "status", service: 'status'};

            global.distribution.local.comm.send([], configuration, (e, v) => {
              if (e) {
                err_map[sid] = e;
              } else {
                val_map[sid] = v;
              }

              i += 1;

              if (i == group_len - 1) {
                // time to stop local node
                local_status.stop((e, v) => {
                  if (e) {
                    err_map[sid] = e;
                  } else {
                    val_map[sid] = v;
                  }
                  callback(err_map, val_map);
                  return;
                })
              }
            })
          }
        }
      });
    },
  };
};

module.exports = status;
