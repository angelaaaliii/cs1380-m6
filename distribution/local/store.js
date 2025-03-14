/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const path = require('path');
const fs = require('fs');
const { serialize, deserialize } = require('../util/serialization');
const { id } = require('../util/util');

function put(state, configuration, callback) {
  // want configuration in format {id: i, gid: g}
  if (configuration === null) {
    configuration = {key: id.getID(state), gid: "local"};
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
  } else if (typeof(configuration) === 'string') {
    configuration = {key: (configuration).replace(/[^a-zA-Z0-9]/g, ''), gid: "local"};
  } 
  else if (configuration.key === null) {
    configuration.key = id.getID(state);
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
  } 
  else {
    // config already a map, make sure id is alphanumeric only
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
  }

  const fileContent = serialize(state);

  // use nid and gid as directories
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration.gid, configuration.key);
  // create nid dir if it does not exit
  if (!fs.existsSync(path.join(__dirname, '../', nidDirName))) {
    fs.mkdirSync(path.join(__dirname, '../', nidDirName));
  }

  // create gid dir if it does not exit
  if (!fs.existsSync(path.join(__dirname, '../', nidDirName, configuration.gid))) {
    fs.mkdirSync(path.join(__dirname, '../', nidDirName, configuration.gid));
  }

  try {
    fs.writeFileSync(filePath, fileContent);
    callback(null, state);
  } catch (error) {
    callback(new Error("error in write file sync", {source:error}), null);
  }
}

function get(configuration, callback) {
  if (configuration === null) {
    configuration = {key: null, gid: "local"};
  }
  if (typeof(configuration) === 'string') {
    configuration = {key: (configuration).replace(/[^a-zA-Z0-9]/g, ''), gid: "local"};
  } else if (configuration.key === null) {
    // return full list of keys
    const nid = id.getNID(global.nodeConfig);
    const nidDirName = nid.toString(16);
    const dirPath = path.join(__dirname, '../', nidDirName, configuration.gid);
    try {
      const keys = fs.readdirSync(dirPath);
      callback(null, keys);
      return;
    } catch (err) {
      if (err.code === 'ENOENT') {
        callback(null, []);
        return;
      }
      callback(err, null);
      return;
    }
  } else {
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
  }

  // use nid and gid as directories
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration.gid, configuration.key);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    callback(null, deserialize(fileContent));
  } catch (err) {
    callback(new Error("error in read file sync", {source:err}), null);
  }
}

function del(configuration, callback) {
  if (typeof(configuration) === 'string') {
    configuration = {key: (configuration).replace(/[^a-zA-Z0-9]/g, ''), gid: "local"};
  } else {
    // config was already map
    // convert id to alphanumeric only
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
  }

  // use nid and gid as directories
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration.gid, configuration.key);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    fs.unlinkSync(filePath);
    callback(null, deserialize(fileContent));
  } catch (err) {
    callback(new Error("error in local store del", {source:err}), null);
  }
}

function append(configuration, val, callback) {
  get(configuration, (e, v) => {
    if (e) {
      // key not on node
      v = [];
    }
    v = v.concat(val);
    put(v, configuration, (e, v) => {
      callback(e, v);
      return;
    })
  })
}
module.exports = {put, get, del, append};
