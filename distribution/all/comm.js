/** @typedef {import("../types").Callback} Callback */

const distribution = require("@brown-ds/distribution");
const { groups } = require("../local/local");

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {Array} message
   * @param {object} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    let val_map = {};
    let err_map = {};
    let group_nodes = {};
    groups.get(gid, (e, v) => {
      if (e) {
        callback(e, null);
        return;
      }
      group_nodes = v;
    });
    const group_len = Object.keys(group_nodes).length;
    let i = 0;
    for (let sid in group_nodes) {
      // add node info to configuration, configuration = remote
      configuration[node] = group_nodes[sid];
      distribution.local.comm.send(message, configuration, (e, v) => {
        if (e) {
          err_map[sid] = e;
        } else {
          val_map[sid] = v;
        }
        i += 1;
        if (i == group_len) {
          if (err_map == {}) {
            callback(null, val_map);
          } else if (val_map == {}) {
            callback(err_map, null);
          } else {
            callback(err_map, val_map);
          }
          return;
        }
      });
    }
  }

  return {send};
};

module.exports = comm;
