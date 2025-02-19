const log = require('../util/log');
const crypto = require('crypto');
const { serialize } = require("../util/serialization");
const { deserialize } = require("../util/serialization");
const distribution = require('@brown-ds/distribution');

function createRPC(func) {
  // Write some code...
  const hash = crypto.randomBytes(16).toString('hex');
  global.moreStatus.toLocal[hash] = func;
  const g = (...args) => {
    const cb = args.pop();
    let remote = { node: '__NODE_INFO__', service: 'rpc', method: '__HASH__' };
    require('@brown-ds/distribution/distribution/local/comm').send(args, remote, cb);
  }
  let serialized_g = serialize(g);
  serialized_g = serialized_g.replace("'__NODE_INFO__'", "{'ip':'" + global.nodeConfig.ip.toString() + "', 'port': " + global.nodeConfig.port.toString() + "}");
  serialized_g = serialized_g.replace("'__HASH__'", "'" + hash + "'");
  return deserialize(serialized_g);
}

/*
  The toAsync function transforms a synchronous function that returns a value into an asynchronous one,
  which accepts a callback as its final argument and passes the value to the callback.
*/
function toAsync(func) {
  log(`Converting function to async: ${func.name}: ${func.toString().replace(/\n/g, '|')}`);

  // It's the caller's responsibility to provide a callback
  const asyncFunc = (...args) => {
    const callback = args.pop();
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };

  /* Overwrite toString to return the original function's code.
   Otherwise, all functions passed through toAsync would have the same id. */
  asyncFunc.toString = () => func.toString();
  return asyncFunc;
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
