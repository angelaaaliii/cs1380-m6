const path = require('node:path');
const distribution = require('../../config');
const id = require('../util/id');
const { serialize } = require('../util/serialization');
const { createRPC, toAsync } = require('../util/wire');
const {spawn} = require('node:child_process');

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

  console.log("original callback in spawn = " + serialize(callback));

  // if configuration already has onStart value, must create RPC that has onStart and callback in a sequential order
  configuration['onStart'] = createRPC(toAsync(callback));

  let options = {'cwd': path.join(__dirname, '../..'), 'detached': true, 'stdio': 'inherit'};
  const child = spawn('node', ['distribution.js', '--config='+serialize(configuration)], options);
};

status.stop = function(callback) {
  console.log("IN STOP");
  callback(null, global.moreStatus.nodeConfig);
  console.log("callback done");
  setTimeout(()=> {
    distribution.node.server.close();
    console.log("HERE IN STOP");
  }, 1500);
};

module.exports = status;
