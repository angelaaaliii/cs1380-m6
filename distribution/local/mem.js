const { id } = require("../util/util");

const memMap = {};
// memMap = {gid: {key: val, k: v}, gid: {key: val}}

function put(state, configuration, callback) {
  // normalizing config input
  if (configuration === null) {
    configuration = {key: id.getID(state), gid: "local"};
  }
  if (typeof(configuration) === 'string') {
    configuration = {key: configuration, gid: "local"};
  }
  if (!("key" in configuration)) {
    // config is map, check if key is null
    configuration.key = id.getID(state);
    configuration.gid = configuration.gid || 'local';
  }
  if ('key' in configuration && configuration.key === null) {
    configuration.key = id.getID(state);
    configuration.gid = configuration.gid || 'local';
  }
  // adding/updating map
  if (!(configuration.gid in memMap)) {
    memMap[configuration['gid']] = {};
  } 
  memMap[configuration['gid']][configuration['key']] = state;

  callback(null, state);
  return;
};

function get(configuration, callback) {
  if (configuration === null) {
    configuration = {key: null, gid: "local"};
  }
  if (typeof(configuration) == 'string') {
    configuration = {key: configuration, gid: "local"};
  } 
  if (configuration.key === null) {
    if (configuration.gid in memMap) {
      callback(null, Object.keys(memMap[configuration.gid]));
    } else {
      callback(null, []);
    }
    return;
  }
  if (!('gid' in configuration)) {
    configuration.gid = 'local';
  }

  if (configuration.gid in memMap && configuration.key in memMap[configuration.gid]) {
    callback(null, memMap[configuration.gid][configuration.key]);
    return;
  }
  callback(new Error("key not found in in-mem"), null);
};

function del(configuration, callback) {
  if (typeof(configuration) === 'string') {
    configuration = {key: configuration, gid: "local"};
  }

  if (configuration.gid in memMap && configuration.key in memMap[configuration.gid]) {
    const val = memMap[configuration.gid][configuration.key];
    delete memMap[configuration.gid][configuration.key];
    callback(null, val);
    return;
  }

  callback(new Error("mem del - key not found in in-mem"), null);
};

function append(configuration, val, callback) {
  get(configuration, (e, v) => {
    if (e) {
      // key not on node
      v = [];
    }
    v = v.concat(val);
    put(v, configuration, (e, v) => {
      callback(e, v);
      return;
    });
  });
};

module.exports = {put, get, del, append};
