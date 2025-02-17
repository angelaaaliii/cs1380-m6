const id = distribution.util.id;
const groups = {};

groups.get = function(name="", callback=(e, v)=>{}) {
  if (name in groups) {
    callback(null, groups[name]);
  } else {
    callback(new Error("could not find name in groups"), null);
  }
};

groups.put = function(config="", group={}, callback=(e, v)=>{}) {
    groups[config] = group;

    // TODO?
    distribution[config] = {};
distribution[config].status =
    require('../../distribution/all/status')({gid: config});
distribution[config].comm =
    require('../../distribution/all/comm')({gid: config});
distribution[config].gossip =
    require('../../distribution/all/gossip')({gid: config});
distribution[config].groups =
    require('../../distribution/all/groups')({gid: config});
distribution[config].routes =
    require('../../distribution/all/routes')({gid: config});
distribution[config].mem =
    require('../../distribution/all/mem')({gid: config});
distribution[config].store =
    require('../../distribution/all/store')({gid: config});

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
