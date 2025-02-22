const { id } = require("../util/util");

const memMap = {};

function put(state, configuration, callback) {
  if (configuration === null) {
    configuration = id.getID(state);
  }

  memMap[configuration] = state;
  callback(null, state);
};

function get(configuration, callback) {
  if (configuration in memMap) {
    callback(null, memMap[configuration]);
    return;
  }

  callback(new Error("key not found in in-mem"), null);
}

function del(configuration, callback) {
  if (configuration in memMap) {
    const val = memMap[configuration];
    delete memMap[configuration];
    callback(null, val);
    return;
  }

  callback(new Error("key not found in in-mem map"), null);
};

module.exports = {put, get, del};
