
const status = function(config) {
  const context = {};
  context.gid = config.gid || 'global';

  return {
    get: (configuration, callback) => {
    },

    spawn: (configuration, callback) => {
    },

    stop: (callback) => {
    },
  };
};

module.exports = status;
