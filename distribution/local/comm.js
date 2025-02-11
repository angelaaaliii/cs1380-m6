/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const { serialize } = require("../util/serialization");
const { deserialize } = require("../util/serialization");
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
    hostname: remote.node.ip,
    port: remote.node.port,
    path: '/' + remote.service + '/' + remote.method,
    method: 'PUT',
  };
  const req = http.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        let deserialized_res = deserialize(responseBody);
        return callback(...deserialized_res);
    });
  });

  req.write(serialized_msg);
  req.end();
}

module.exports = {send};
