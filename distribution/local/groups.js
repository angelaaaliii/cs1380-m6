const id = distribution.util.id;
const groups = {};

groups.get = function(name="", callback=()=>{}) {
  if (name in groups) {
    callback(null, groups[name]);
  } else {
    callback(new Error("could not find name in groups"), null);
  }
};

groups.put = function(config="", group={}, callback=()=>{}) {
    groups[config] = group;
    callback(null, group);
};

groups.del = function(name="", callback=() => {}) {
  if (name in groups) {
    const deleted = groups[name];
    delete groups[name];
    callback(null, deleted);
  } else {
    callback(new Error("no name in groups to delete"), null);
  }
};

groups.add = function(name="", node={}, callback=()=>{}) {
  if (name in groups) {
    groups[name][id.getSID(node)] = node;
    callback(null, node);
  } else {
    callback(new Error("name not found"), null);
  }
};

groups.rem = function(name="", node="", callback=()=>{}) {
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
