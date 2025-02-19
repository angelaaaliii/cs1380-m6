const groups = {};
const { id } = require('../util/util');

groups.get = function(name="", callback=(e, v)=>{}) {
  if (name in groups) {
    callback(null, groups[name]);
  } else {
    callback(new Error("could not find name in groups"), null);
  }
};

groups.put = function(config="", group={}, callback=(e, v)=>{}) {
  if (typeof(config) === 'object' && 'gid' in config){
    config = config['gid'];
  }
  groups[config] = group;

  // TODO?
  global.distribution[config] = {};
  global.distribution[config].status =
      require('../all/status')({gid: config});
      global.distribution[config].comm =
      require('../all/comm')({gid: config});
      global.distribution[config].gossip =
      require('../all/gossip')({gid: config});
      global.distribution[config].groups =
      require('../all/groups')({gid: config});
      global.distribution[config].routes =
      require('../all/routes')({gid: config});
      global.distribution[config].mem =
      require('../all/mem')({gid: config});
      global.distribution[config].store =
      require('../all/store')({gid: config});

  // TODO?
  // distribution[config] = {};
  // distribution[config].status =
  //     require('../all/status')({gid: config});
  //     distribution[config].comm =
  //     require('../all/comm')({gid: config});
  //     distribution[config].gossip =
  //     require('../all/gossip')({gid: config});
  //     distribution[config].groups =
  //     require('../all/groups')({gid: config});
  //     distribution[config].routes =
  //     require('../all/routes')({gid: config});
  //     distribution[config].mem =
  //     require('../all/mem')({gid: config});
  //     distribution[config].store =
  //     require('../all/store')({gid: config});

  callback(null, group);
};

groups.del = function(name="", callback=(e, v) => {}) {
  if (name in groups) {
    const deleted = groups[name];
    delete groups[name];
    callback(null, deleted);
  } else {
    callback(new Error("no name in groups to delete"), null);
  }
};

groups.add = function(name="", node={}, callback=(e, v)=>{}) {
  if (name in groups) {
    groups[name][id.getSID(node)] = node;
    callback(null, node);
  } else {
    callback(new Error("name not found"), null);
  }
};

groups.rem = function(name="", node="", callback=(e, v)=>{}) {
  if (!(name in groups)) {
    callback(null, groups);
    return;
  }
  if (!(node in groups[name])) {
    callback(null, groups);
    return;
  }
  delete groups[name][node];
  callback(null, groups);
};

module.exports = groups;
