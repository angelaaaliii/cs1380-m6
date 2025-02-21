const gossip = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || function(lst) {
    return Math.ceil(Math.log(lst.length));
  };

  return {
    send: (payload, remote, callback) => {
      // global.distribution.local.groups.get(context.gid, (e, v) => {
      //   if (e) {
      //     callback(e, null);
      //     return;
      //   }

      //   // pick nodes to send to
      //   const g = {};
      //   const nodesLen = context.subset(v);
      //   while (g.size != nodesLen) {
      //     const idx = Math.floor(Math.log(v.length));
      //     if (!(v[idx] in g)) {
      //       g.add(v[idx]);
      //     }
      //   }

      //   global.distribution.local.groups.put("gossip", g, (e, v) => {
      //     if (e) {
      //       callback(e, null);
      //       return;
      //     }

      //     // send to all nodes in this group:
      //     global.distribution["gossip"].comm.send(payload, remote, (e, v)=> {
      //       global.distribution.local.groups.del("gossip", (e, v) => {
      //         callback(e, v);
      //       });
      //     });
      //   });

      // });
    },

    at: (period, func, callback) => {
    },

    del: (intervalID, callback) => {
    },
  };
};

module.exports = gossip;
