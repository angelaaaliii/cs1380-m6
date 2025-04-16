/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const http = require('node:http');
const fs = require('fs');
const { serialize, deserialize } = require("../util/util");


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
function send(message=[], remote={node: "default", method: "default", service: "default"}, callback=(e, v)=>{}) {  
  if (remote.node == "default") {
    callback(new Error("no remote passed in"), null);
    return;
  }
  let gid = "local"
  if ('gid' in remote) {
    gid = remote['gid'];
  }
  const serialized_msg = serialize(message);
  // if (remote.method == "crawl_append") {
  //   console.log("COMM SEND", serialized_msg);
  // }
  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path: '/' + gid + '/' + remote.service + '/' + remote.method,
    method: 'PUT',
  };

  // console.log(`from ${global.nodeConfig.ip}:${global.nodeConfig.port} to ${remote.node.ip}:${remote.node.port}`);

  const req = http.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
      if (!responseBody || responseBody.trim().length === 0) {
        console.warn(`[COMM] Empty response body from ${remote.node.ip}:${remote.node.port}`);
        return callback(null, []);  // soft fail: treat as empty result
      }
    
      let deserialized_res;
      try {
        deserialized_res = deserialize(responseBody);
      } catch (err) {
        console.warn(`[COMM] Failed to deserialize response from ${remote.node.ip}:${remote.node.port}`);
        console.warn(`[COMM] Error: ${err.name} - ${err.message}`);
        console.warn(`[COMM] Raw body: ${responseBody.slice(0, 200)}...`);
        return callback(null, []);  // soft fail: treat as empty result
      }
    
      return callback(...deserialized_res);
    });
  });

  req.write(serialized_msg);
  req.on('error', (err) => {
    callback(new Error(err), null);
  }
  // callback(err, null)
);
  req.end();
}

module.exports = {send};
