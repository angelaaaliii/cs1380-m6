
const comm = function(config) {
  let context = {};
  context.gid = config.gid || 'global';
  return {
    send: (message, configuration, callback) => {
    },
  };
};

module.exports = comm;
