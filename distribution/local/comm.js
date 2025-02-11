/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const { serialize } = require("../util/serialization");
const http = require('node:http');


/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 */

/**
 * @param {Array} message
 * @param {Target} remote
 * @param {Callback} [callback]
 * @return {void}
 */
function send(message, remote, callback) {  
  const serialized_msg = serialize(message);
  const options = {
    hostname: remote.node.,
    port: 80,
    path: '/todos/1',
    method: remote.method,
  };

  http.request(remote, (res) => {

  });
}

module.exports = {send};
