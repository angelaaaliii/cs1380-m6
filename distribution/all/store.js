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
          callback(e, v);
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
    },
  };
};

module.exports = store;
