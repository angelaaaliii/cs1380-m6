/** @typedef {import("../types").Callback} Callback */
const status = require('./status');
const comm = require('./comm');

let routes_map = 
{'status': 
  {'get': status.get, 'spawn': status.spawn, 'stop': status.stop},

'routes': 
  {'get': this.get, 'rem': this.rem, 'put': this.put},

'comm': 
  {'send': comm.send},

'rpc': global.moreStatus.toLocal
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
    } else if (!(configuration['service'] in distribution[configuration['gid']])){
      // distributed service, service not found
      callback(new Error ("could not find distributed service"), null);
    } else {
      // distributed service exists
      callback(null, distribution[configuration['gid'][configuration['service']]]);
      return;
    }
  }

  // configuration is just string now:
  if (configuration in routes_map) {
    callback(null, routes_map[configuration]);
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
