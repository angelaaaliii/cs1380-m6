const { groups } = require("../local/local");
const { id } = require("../util/util");

function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get: (configuration, callback) => {
      if (configuration === null) {
        const remote = {service: "mem", method: "get"};
        const message = [{key: configuration, gid: context.gid}];
        global.distribution[context.gid].comm.send(message, remote, (e, v) => {
          let keys = [];
          for (let k in v) {
            keys = [...keys, ...v[k]];
          }
          callback(e, keys);
          return;
        })
      } else {
        const kid = id.getID(configuration);
        global.distribution.local.groups.get(context.gid, (e, v) => {
          // map from nid to node
          const nidToNode = {};
          for (const n of Object.values(v)) {
            nidToNode[id.getNID(n)] = n;
          }
          const nids = Object.keys(nidToNode);
          const nid = context.hash(kid, nids);

          configuration.gid = context.gid;
          const remote = {service: "mem", method: "get", node: nidToNode[nid]};
          const message = [{key: configuration, gid: context.gid}];
          global.distribution.local.comm.send(message, remote, (e, v) => {
            if (e) {
              callback(e, null);
            } else {
              callback(null, v);
            }
          })
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
        const remote = {service: "mem", method: "put", node: nidToNode[nid]};
        const message = [state, {key: configuration, gid: context.gid}];

        global.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            console.log(e);
            callback(e, null);
          } else {
            callback(null, v);
          }
        });
      });
    },

    del: (configuration, callback) => {
      const kid = id.getID(configuration);

      global.distribution.local.groups.get(context.gid, (e, v) => {
        // map from nid to node
        const nidToNode = {};
        for (const n of Object.values(v)) {
          nidToNode[id.getNID(n)] = n;
        }
        const nids = Object.keys(nidToNode);
        const nid = context.hash(kid, nids);

        const remote = {service: "mem", method: "del", node: nidToNode[nid]};
        const message = [{key: configuration, gid: context.gid}];
        global.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            callback(new Error("mem del error from comm send"), null);
          } else {
            callback(null, v);
          }
        })
      });
    },

    reconf: (configuration, callback) => {
    },
  };
};

module.exports = mem;
