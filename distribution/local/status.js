const status = {};
global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
  toLocal: {},
};
// Object.defineProperty(global, 'moreStatus', {
//   set(val) {
//     console.error("morestat mutated")
//     this._moreStatus = val
//   },
//   get(val) {
//     return this._moreStatus
//   }
// });

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


// TODO?
// status.spawn = function(configuration={}, callback=(e, v) => {}) {
//   if (!('ip' in configuration) || !('port' in configuration)) {
//     // configuration missing node info
//     callback(new Error("configuration missing ip/port"), null);
//     return;
//   }

//   console.log("original callback in spawn = " + serialize(callback));

//   // if configuration already has onStart value, must create RPC that has onStart and callback in a sequential order
//   configuration['onStart'] = createRPC(toAsync(callback));

//   let options = {'cwd': path.join(__dirname, '../..'), 'detached': true, 'stdio': 'inherit'};
//   const child = spawn('node', ['distribution.js', '--config='+serialize(configuration)], options);
// };
status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn;

// status.stop = function(callback) {
//   console.log("IN STOP");
//   callback(null, global.moreStatus.nodeConfig);
//   console.log("callback done");
//   setTimeout(()=> {
//     distribution.node.server.close();
//     console.log("HERE IN STOP");
//   }, 1500);
// };
status.stop = require('@brown-ds/distribution/distribution/local/status').stop; 

module.exports = status;
