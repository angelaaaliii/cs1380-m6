const distribution = require("../../config");

const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    get: (configuration, callback) => {
      // distribution.all.comm.send(message, configuration, (e, v) => {
      //   if ()
      // })
    },

    spawn: (configuration, callback) => {
    },

    stop: (callback) => {
    },
  };
};

module.exports = status;
