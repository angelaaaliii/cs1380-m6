const id = require('../util/id');
const log = require('../util/log');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() { };
  // TODO: implement remaining local status items

  if (configuration === 'nid') {
    callback(null, global.moreStatus.nid);
    return;
  }
  if (configuration === 'sid') {
    callback(null, global.moreStatus.sid);
    return;
  }
  if (configuration === 'counts') {
    callback(null, global.moreStatus.counts);
    return;
  }
  if (configuration === 'ip') {
    callback(null, global.nodeConfig.ip);
    return;
  }
  if (configuration === 'port') {
    callback(null, global.nodeConfig.port);
    return
  }
  if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }
  callback(new Error('Status key not found'));
};


status.spawn = function(configuration, callback) {
};

status.stop = function(callback) {
};

module.exports = status;
