
let gossip = function(config) {
  let context = {};
  context.gid = config.gid || 'global';
  context.subset = config.subset || function(lst) {
    return Math.ceil(Math.log(lst.length));
  };

  return {
    send: (payload, remote, callback) => {
    },

    at: (period, func, callback) => {
    },

    del: (intervalID, callback) => {
    },
  };
};

module.exports = gossip;
