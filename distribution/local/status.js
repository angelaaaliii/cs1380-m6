const { serialize, deserialize } = require('../util/util');
const { createRPC, toAsync } = require('../util/wire');
const path = require('path');
const { spawn } = require('child_process');

const status = {};
global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
  toLocal: {},
};

status.get = function(configuration="", callback=(e, v)=>{}) {
  callback = callback || function() { };
  // TODO: implement remaining local status items

  if (configuration == 'nid') {
    callback(null, global.moreStatus.nid);
    return;
  }
  if (configuration == 'sid') {
    callback(null, global.moreStatus.sid);
    return;
  } 
  if (configuration == 'counts') {
    callback(null, global.moreStatus.counts);
    return;
  }
  if (configuration == 'ip') {
    callback(null, global.nodeConfig.ip);
    return;
  }
  if (configuration == 'port') {
    callback(null, global.nodeConfig.port);
    return;
  }
  if (configuration == 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration == 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }

  if (configuration in status) {
    callback(null, status[configuration]);
  } else {
    callback(new Error("Status key not found"), null);
  }
};

// status.spawn = function(configuration={}, callback=(e, v) => {}) {
//   if (!('ip' in configuration) || !('port' in configuration)) {
//     // configuration missing node info
//     callback(new Error("configuration missing ip/port"), null);
//     return;
//   }
//   const onStart = configuration.onStart || (() => {});
//   const onStartStr = "\nlet onStart = " + onStart.toString() + ";";

//   const rpcStub = createRPC(toAsync(callback));
//   // console.log("original rpc from callback =\n", serialize(rpcStub));
//   let rpcStubStr = rpcStub.toString();
//   const rpcStubIdx = rpcStubStr.indexOf('const callback = args.pop();');
//   rpcStubStr = 'function anonymous(...args) {' + onStartStr + '\nonStart();\n' + rpcStubStr.substring(rpcStubIdx);
//   // console.log("new rpc stub = ", rpcStubStr);

//   let serializedRPC = serialize(rpcStub);
//   serializedRPC['value'] = rpcStubStr;

//   const newRPCStub = deserialize(serializedRPC);

//   configuration['onStart'] = newRPCStub;

//   let options = {'cwd': path.join(__dirname, '../..'), 'detached': true, 'stdio': 'inherit'};
//   const child = spawn('node', ['distribution.js', '--config='+serialize(configuration)], options);
// };


status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn; 


status.stop = function(callback) {
  callback(null, global.nodeConfig);
  setTimeout(()=> {
    distribution.node.server.close();
  }, 1500);
};
// status.stop = require('@brown-ds/distribution/distribution/local/status').stop; 

module.exports = status;
