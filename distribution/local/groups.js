const { id } = require('../util/util');

const groups = {all: {}};

groups.get = function(name="", callback=(e, v)=>{}) {
  if (name in groups) {
    callback(null, groups[name]);
  } else {
    callback(new Error("could not find name in groups"), null);
  }
};

groups.put = function(config="", group={}, callback=(e, v)=>{}) {
  let hash = null;
  if (typeof(config) === 'object' && 'gid' in config){
    if ('hash' in config) {
      hash = config.hash;
    }

    config = config['gid'];
  }
  groups[config] = group;

  // loop through nodes in group and put into all if not already there:

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
      require('../all/mem')({gid: config, hash: hash});
      global.distribution[config].store =
      require('../all/store')({gid: config, hash: hash});

  // for (let k of Object.keys(group)) {
  //   if (!(k in groups.all)) {
  //     groups.all[k] = group[k];
  //   }
  // }
  // console.log("groups = ", groups);
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
    callback(new Error("group name not found"), null);
    return;
  }
  if (!(node in groups[name])) {
    callback(null, groups[name]);
    return;
  }
  delete groups[name][node];
  if (groups[name] == {}) {
    delete groups[name];
  }
  callback(null, groups);
};

module.exports = groups;
