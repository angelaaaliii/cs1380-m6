/** @typedef {import("../types.js").Node} Node */

const assert = require('assert');
const crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @return {ID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @return {ID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
}


function rendezvousHash(kid, nids) {
  /*
  In our setting, given a KID and a list of NIDs, utils.rendezvousHash needs to:

create a new list by concatenating each NID with the KID (any concatenation order is correct, but the tests expect you to do kid + nid.)
hash these values (e.g., sha256) and then convert them to a numerical representation,
sort the resulting values and pick the maximum, and
convert the chosen element back into an ID and return i
*/
  let maxVal = -1;
  let maxNid;
  for (let nid of nids) {
    const hashNum = idToNum(getID(kid + nid));
    if (hashNum > maxVal) {
      maxVal = hashNum;
      maxNid = nid;
    }
  }
  return maxNid;
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
