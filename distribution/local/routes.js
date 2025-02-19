/** @typedef {import("../types").Callback} Callback */

let routes_map = 
{'status': 
  {'get': global.distribution.local.status.get, 'spawn': global.distribution.local.status.spawn, 'stop': global.distribution.local.status.stop},

'routes': 
  {'get': this.get, 'rem': this.rem, 'put': this.put},

'comm': 
  {'send': global.distribution.local.comm.send},

'rpc': global.moreStatus.toLocal,

'all': {
  'status': global.distribution.all.status,

  'routes': global.distribution.all.routes,

  'comm': global.distribution.all.comm
  }
};

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration="", callback = (e, v) =>{}) {
  if (typeof(configuration) === 'object') {
    if (!('gid' in configuration) || !('service' in configuration)) {
      callback(new Error("configuration missing either gid or service key"), null);
      return;
    } 
    if (configuration['gid'] === 'local') {
      configuration = configuration['service'];
      // local, so treat normally
    } else if (configuration['service'] in routes_map['all']) {
      // distributed service exists
      callback(null, routes_map['all'][configuration['service']](configuration));
      return;
    } else {
      // could be rpc
      const rpc = global.toLocal[configuration['service']];
      if (rpc) {
        callback(null, { 'call': rpc });
        return;
      }
      // not rpc, could not be found
      callback(new Error('Routes key not found, configuration = ' + configuration));
      return;
    }
  }

  // configuration is just string now:
  if (configuration in routes_map) {
    callback(null, routes_map[configuration]);
    return;
  } 
  // could be rpc 
  const rpc = global.toLocal[configuration];
  if (rpc) {
    callback(null, {'call':rpc});
    return;
  }
  callback(new Error('Routes key not found, configuration = ' + configuration));
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service={}, configuration="", callback=(e, v)=>{}) {
  routes_map[configuration] = service;
  callback(null, service);
  return;
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration="", callback=(e, v)=>{}) {
  let val = undefined;
  if (configuration in routes_map) {
    val = routes_map[configuration];
    delete routes_map[configuration];
  }
  callback(null, val);
};

module.exports = {get, put, rem};
