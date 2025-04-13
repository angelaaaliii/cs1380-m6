const { id } = require("../util/util");

function store(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed store service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      if (configuration === null) {
        const remote = {service: "store", method: "get"};
        const message = [{key: null, gid: context.gid}];
        global.distribution[context.gid].comm.send(message, remote, (e, v) => {
          let keys = [];
          for (let val of Object.values(v)) {
            keys = [...keys, ...val];
          }
          callback(e, keys);
          return;
        });
      } else {
        let kid = id.getID(configuration);

        global.distribution.local.groups.get(context.gid, (e, v) => {
          // map from nid to node
          const nidToNode = {};
          for (const n of Object.values(v)) {
            nidToNode[id.getNID(n)] = n;
          }
          const nids = Object.keys(nidToNode);
          const nid = context.hash(kid, nids);
          const remote = {service: "store", method: "get", node: nidToNode[nid]};
          const message = [{key: configuration, gid: context.gid}];
          global.distribution.local.comm.send(message, remote, (e, v) => {
            if (e) {
              callback(e, null);
            } else {
              callback(null, v);
            }
          });
        });
      }
    },

    put: (state, configuration, callback) => {
      let kid = id.getID(configuration);
      if (configuration == null) {
        kid = id.getID(id.getID(state));
      }

      global.distribution.local.groups.get(context.gid, (e, v) => {
        // map from nid to node
        const nidToNode = {};
        for (const n of Object.values(v)) {
          nidToNode[id.getNID(n)] = n;
        }
        const nids = Object.keys(nidToNode);
        const nid = context.hash(kid, nids);
        const remote = {service: "store", method: "put", node: nidToNode[nid]};
        const message = [state, {key: configuration, gid: context.gid}];
        global.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            callback(e, null);
          } else {
            callback(null, v);
          }
        });
      });
    },

    del: (configuration, callback) => {
      let kid = id.getID(configuration);

      global.distribution.local.groups.get(context.gid, (e, v) => {
        // map from nid to node
        const nidToNode = {};
        for (const n of Object.values(v)) {
          nidToNode[id.getNID(n)] = n;
        }
        const nids = Object.keys(nidToNode);
        const nid = context.hash(kid, nids);
        const remote = {service: "store", method: "del", node: nidToNode[nid]};
        const message = [{key: configuration, gid: context.gid}];
        global.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            callback(e, null);
          } else {
            callback(null, v);
          }
        });
      });
    },

    reconf: (configuration, callback) => {
      // getting all keys
      global.distribution[context.gid].store.get(null, (e, v) => {
        if (Object.keys(e).length === 0) {
          const allKeys = v; // all keys
          let keysToRelocate = {}; // {key: {oldNode: x, newNode: y}}

          const oldNodes = {}; // {nid: node}
          const newNodes = {}; // {nid: node}

          global.distribution.local.groups.get(context.gid, (e, v) => {
            if (e) {
              callback(e, null);
              return;
            }

            // populating old nodes
            for (const node of Object.values(configuration)) {
              oldNodes[id.getNID(node)] = node;
            }

            // populating new nodes
            for (const node of Object.values(v)) {
              newNodes[id.getNID(node)] = node;
            }

            // loop through all keys and rehash given old group and new group nids
            for (const k of allKeys) {
              const oldNid = context.hash(id.getID(k), Object.keys(oldNodes));
              const newNid = context.hash(id.getID(k), Object.keys(newNodes));

              if (oldNid != newNid) {
                // if diff, must be reconf so add to relocation map
                keysToRelocate[k] = {oldNode: oldNodes[oldNid], newNode: newNodes[newNid]};
              }
            }

            let numRelocated = 0;
            // loop through all keys to relocate
            for (const key of Object.keys(keysToRelocate)) {
              // get from old node to get object associated with key
              let message = [{key: key, gid: context.gid}];
              let remote = {method: "get", service: "store", node: keysToRelocate[key].oldNode};
              global.distribution.local.comm.send(message, remote, (e, v) => {
                if (e) {
                  callback(e, null);
                  return;
                }
                const obj = v;

                // delete from old node
                message = [{key: key, gid: context.gid}];
                remote = {node: keysToRelocate[key].oldNode, method: "del", service: "store"};
                global.distribution.local.comm.send(message, remote, (e, v) => {
                  if (e) {
                    callback(e, null);
                    return;
                  }

                  // put on new node
                  message = [obj, {key: key, gid: context.gid}];
                  remote = {node: keysToRelocate[key].newNode, method: "put", service: "store"};
                  global.distribution.local.comm.send(message, remote, (e, v) => {
                    if (e) {
                      callback(e, null);
                      return;
                    }

                    numRelocated++;
                    if (numRelocated === Object.keys(keysToRelocate).length) {
                      callback(null, v);
                      return;
                    }

                  });
                });
              });
            }
            
          });
        
        } else {
          callback(e, v);
          return;
        }
      });
    },

    append: (configuration, val, callback) => {
      let kid = id.getID(configuration);
      if (configuration == null) {
        kid = id.getID(id.getID(state));
      }

      global.distribution.local.groups.get(context.gid, (e, v) => {
        // map from nid to node
        const nidToNode = {};
        for (const n of Object.values(v)) {
          nidToNode[id.getNID(n)] = n;
        }
        const nids = Object.keys(nidToNode);
        const nid = context.hash(kid, nids);
        const remote = {service: "store", method: "append", node: nidToNode[nid]};
        const message = [{key: configuration, gid: context.gid}, val];
        global.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            callback(e, null);
          } else {
            callback(null, v);
          }
        });
      });
    },

    crawl_append: (configuration, val, callback) => {
      let kid = id.getID(configuration);
      if (configuration == null) {
        kid = id.getID(id.getID(state));
      }

      global.distribution.local.groups.get(context.gid, (e, v) => {
        // map from nid to node
        const nidToNode = {};
        for (const n of Object.values(v)) {
          nidToNode[id.getNID(n)] = n;
        }
        const nids = Object.keys(nidToNode);
        const nid = context.hash(kid, nids);
        const remote = {service: "store", method: "crawl_append", node: nidToNode[nid]};
        const message = [{key: configuration, gid: context.gid}, val];
        console.log("IN CRAWL APPEND, sending = ", remote, message);
        global.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            callback(e, null);
          } else {
            callback(null, v);
          }
        });
      });
    },
  };
};

module.exports = store;
