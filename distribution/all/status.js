const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    get: (configuration, callback) => {

      let val = 0;
      let val_map = {};
      let err_map = {};
      let group_nodes = {};
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }
        group_nodes = v;
        const group_len = Object.keys(v).length;

        let i = 0;
        for (let sid in group_nodes) {
          let remote = {node: group_nodes[sid], method: 'get', service: 'status'};
          if (configuration == 'counts' || configuration == 'heapTotal' || configuration == 'heapUsed') {
            // addition
            global.distribution.local.comm.send([configuration], remote, (e, v) => {
              if (e) {
                err_map[sid] = e;
              } else {
                val += v;
              }
              i += 1;
              if (i == group_len) {    
                  callback(err_map, val);
                  return;
              }
            });
          }

          else {
            // no addition
            global.distribution.local.comm.send([configuration], remote, (e, v) => {
              if (e) {
                err_map[sid] = e;
              } else {
                val_map[sid] = v;
              }
              i += 1;
              if (i == group_len) {    
                callback(err_map, val_map);
                return;
              }
            });
            
          }
        }
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
