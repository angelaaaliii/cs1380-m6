/** @typedef {import("../types").Callback} Callback */
const status = require('./status');
const comm = require('./comm');
const gossip = require('./gossip');
const mem = require('./mem');
const store = require('./store');

const status_all = require('../all/status');
const routes_all = require('../all/routes');
const comm_all = require('../all/comm');
const gossip_all = require('../all/gossip');
const mem_all = require("../all/mem");
const store_all = require("../all/store");
const mr_all = require("../all/mr");
const query_all = require("../all/query");

let routes_map = 
{'status': status,
'routes': this,
'comm': comm,
'rpc': global.toLocal,
'gossip': gossip,
'mem': mem,
'store': store,

'all': {
  'status': status_all,
  'routes': routes_all,
  'comm': comm_all,
  'gossip': gossip_all,
  'mem': mem_all,
  'store': store_all,
  'mr': mr_all,
  'query': query_all,
  }
};

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration="", callback = (e, v) =>{}) {
  if (typeof(configuration) === 'object') {
    if (!('gid' in configuration) && !('service' in configuration)) {
      callback(new Error("configuration missing either gid and service key"), null);
      return;
    } 
    if (!('gid' in configuration)) {
      configuration = configuration['service'];
    } else if (configuration['gid'] === 'local') {
      configuration = configuration['service'];
      // local, so treat normally
    } else if (configuration['service'] in routes_map['all']) {
      // distributed service exists
      const service = configuration['service'];
      callback(null, routes_map['all'][service](configuration));
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
