const { serialize, deserialize } = require('../util/util');
const { createRPC, toAsync } = require('../util/wire');
const path = require('path');
const { spawn } = require('child_process');
const { exit } = require('process');

const status = {};
global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
  toLocal: {},
};

status.get = function(configuration="", callback=(e, v)=>{}) {
  callback = callback || function() { };

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

status.spawn = function(configuration={}, callback=(e, v) => {}) {
  if (!('ip' in configuration) || !('port' in configuration)) {
    // configuration missing node info
    callback(new Error("configuration missing ip/port"), null);
    return;
  }
  // setting onStart var and calling it as a string
  const onStart = configuration.onStart || (() => {});
  let onStartStr = "let onStart = " + onStart.toString() + ";onStart();\n";
  onStartStr = onStartStr.replace(/[\x00-\x1F\x7F\x80-\x9F]/g, '');

  // adding onStart var and call to rpc stub string
  const rpcStub = createRPC(toAsync(callback));
  const originalRPCSerialized = serialize(rpcStub);

  const startIdx = originalRPCSerialized.indexOf('const callback');
  let newRPCSerialized = originalRPCSerialized.substring(0, startIdx) + onStartStr + originalRPCSerialized.substring(startIdx);

  // trying to hardcode args
  let nodeArg = "[null, {ip: __IP__, port: __PORT__}];";
  nodeArg = nodeArg.replace("__IP__", "\\\"" + configuration.ip + "\\\"");
  nodeArg = nodeArg.replace("__PORT__", configuration.port);

  let callbackSerialized = serialize(callback);
  callbackSerialized = callbackSerialized.replace("{\"type\":\"function\",\"value\":", "");
  callbackSerialized = callbackSerialized.substring(1, callbackSerialized.length-2);

  newRPCSerialized = newRPCSerialized.replace("args.pop()", "()=>{}");
  newRPCSerialized = newRPCSerialized.replace("let message = args;", "let message = " + nodeArg);

  const newRPCStub = deserialize(newRPCSerialized);
  configuration['onStart'] = newRPCStub;

  let options = {'cwd': path.join(__dirname, '../..'), 'detached': true, 'stdio': 'inherit'};
  const child = spawn('node', ['distribution.js', '--config='+serialize(configuration)], options);
};


// status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn; 


status.stop = function(callback) {
  global.distribution.node.server.close();
  setTimeout(()=> {
    exit(0);
  }, 0.5);
  callback(null, global.nodeConfig);
};

// status.stop = require('@brown-ds/distribution/distribution/local/status').stop; 

module.exports = status;
