const routes = function(config) {
  let context = {};
  context.gid = config.gid || 'global';

  return {
    put: (service, name, callback) => {
    },

    rem: (name, callback) => {
    },
  };
};

module.exports = routes;
