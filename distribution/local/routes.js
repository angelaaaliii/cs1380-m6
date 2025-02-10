/** @typedef {import("../types").Callback} Callback */
const status = require('./status');
const comm = require('./comm');

let routes_map = {'status': status, 'routes': this, 'comm': comm};

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
  if (configuration in routes_map) {
    callback(null, routes_map[configuration]);
    return;
  }
  callback(new Error('Routes key not found'));
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback=(e, v)=>{}) {
  routes_map[configuration] = service;
  callback(null, service);
  return;
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  if (configuration in routes_map) {
    delete routes_map.configuration;
    callback(null, routes_map);
    return;
  }
  callback(new Error('Routes key not found'));
};

module.exports = {get, put, rem};
