const groups = function(config) {
  let context = {};
  context.gid = config.gid || 'global';

  return {
    put: (config, group, callback) => {
    },

    del: (name, callback) => {
    },

    get: (name, callback) => {
    },

    add: (name, node, callback) => {
    },

    rem: (name, node, callback) => {
    },
  };
};

module.exports = groups;
