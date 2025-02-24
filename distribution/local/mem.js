const { id } = require("../util/util");

const memMap = {};
// memMap = {gid: {key: val}, gid: {key: val}}

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
  setTimeout( () => {
    callback(null, state);
    return;
  }, 3000);
};

function get(configuration, callback) {
  if (typeof(configuration) == 'string') {
    configuration = {key: configuration, gid: "local"};
  } 
  if (!('gid' in configuration)) {
    configuration.gid = 'local';
  }

  if (configuration.gid in memMap && configuration.key in memMap[configuration.gid]) {
    callback(null, memMap[configuration.gid][configuration.key]);
    return;
  }

  callback(new Error("key not found in in-mem"), null);
}

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

module.exports = {put, get, del};
