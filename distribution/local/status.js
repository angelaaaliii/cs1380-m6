const distribution = require('../../config');
const id = require('../util/id');
const { fork } = require('node:child_process');
const { serialize } = require('../util/serialization');
const { createRPC, toAsync } = require('../util/wire');

const status = {
  'nid': global.moreStatus.nid,
  'sid': global.moreStatus.sid,
  'counts': global.moreStatus.counts,
  'ip': global.nodeConfig.ip,
  'port': global.nodeConfig.port,
  'heapTotal': process.memoryUsage().heapTotal,
  'heapUsed': process.memoryUsage().heapUsed
};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
  toLocal: {},
};

status.get = function(configuration="", callback=(e, v)=>{}) {
  callback = callback || function() { };
  // TODO: implement remaining local status items

  if (configuration in status) {
    callback(null, status[configuration]);
  } else {
    callback(new Error("Status key not found"), null);
  }
};


status.spawn = function(configuration={}, callback=(e, v) => {}) {
  if (!('ip' in configuration) || !('port' in configuration)) {
    // configuration missing node info
    callback(new Error("configuration missing ip/port"), null);
    return;
  }
  configuration['onStart'] = createRPC(toAsync(callback));
  const child = fork('../distribution.js', ['--ip='+configuration['ip'], '--port='+configuration['port']]);
  // child.on('error', (err) => {
  //   callback(err, null);
  //   return;
  // });
  callback(null, configuration);
  return;
};

status.stop = function(callback) {
  callback(null, global.moreStatus.nodeConfig);
  setTimeout(()=> {
    distribution.node.server.close();
    return;
  }, 1500);
};

module.exports = status;
