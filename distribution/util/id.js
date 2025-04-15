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
  // nids.sort();
  // return nids[idToNum(kid) % nids.length];

   // Convert NIDs to numerical representation and insert them into a new list
   const nidList = nids.map(nid => ({ nid, num: idToNum(nid) }));
   const kidNum = idToNum(kid);
   nidList.push({nid: kid, num: kidNum});
   const sortedList = nidList.slice().sort((a, b) => a.num - b.num);
 
   // Pick the NID right after the one corresponding to the KID
   for (let i = 0; i < sortedList.length; i++) {
     if (sortedList[sortedList.length - 1] == {nid: kid, num: idToNum(kid)}) {
       return sortedList[0].nid;
     } else if (sortedList[i].num > kidNum) {
       return sortedList[i].nid;
     }
   }
   return sortedList[0].nid;
}

function consistentHash(kid, nids) {
  /*

  Consistent hashing. The key idea behind consistent hashing is to 
  (1) place all nodes of a group on a ring, 
  (2) place the object ID on the same ring, and 
  (3) pick the node ID immediately following the object ID.


In our setting, given a KID and a list of NIDs, utils.consistentHash needs to:

convert the KID and NIDs to a numerical representation and insert them into a new list,
sort the list (avoiding unnecessarily mutating the original list),
pick the element right after the one corresponding to KID,[2]
convert the chosen element back into an ID and return it


  */
  const kidVal = idToNum(kid);
  let copiedArray = [kidVal];

  let valToNid = {};
  for (let nid of nids) {
    valToNid[idToNum(nid)] = nid;
    copiedArray.push(idToNum(nid));
  }

  copiedArray.sort();

  let nidIdx = copiedArray.indexOf(kidVal);
  while (copiedArray[nidIdx] <= kidVal) {
    nidIdx += 1;
  }

  return valToNid[copiedArray[nidIdx]];
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
