const gossip = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || function(lst) {
    // return Math.ceil(Math.log(lst.length));
    return lst.length;
  };

  return {
    send: (payload, remote, callback) => {
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(e, null);
          return;
        }

        // pick nodes to send to
        const g = {};
        const vArr = Object.entries(v);
        const nodesLen = context.subset(vArr);
        while (Object.keys(g).length < nodesLen) {
          const idx = Math.floor(Math.random() * (vArr.length));
          const idKey = Object.keys(v)[idx];
          if ((idKey in g)) {
            continue;
          }
          g[idKey] = v[idKey];
        }

        global.distribution.local.groups.put("gossip_group", g, (e, v) => {
          if (e) {
            callback(e, null);
            return;
          }

          global.distribution.gossip_group.comm.send(payload, remote, (e, v)=> {
            global.distribution.local.groups.del("gossip_group", (e, v) => {
              callback(e, v);
              return;
            });
          });
        });

      });
    },

    at: (period, func, callback) => {
      const intervalID = setInterval(func, period);
      callback(null, intervalID);
    },

    del: (intervalID, callback) => {
      clearInterval(intervalID);
      callback();
    },
  };
};

module.exports = gossip;
