/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */

const { serialize } = require("../util/serialization");



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
  
}

module.exports = {send};
