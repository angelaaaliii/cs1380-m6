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
    configuration.key = Buffer.from(configuration.key).toString('hex');
  } else if (typeof(configuration) === 'string') {
    configuration = {key: Buffer.from(configuration).toString('hex'), gid: "local"};
  } 
  else if (configuration.key === null) {
    configuration.key = id.getID(state);
    configuration.key = Buffer.from(configuration.key).toString('hex');
  } 
  else {
    // config already a map, make sure id is alphanumeric only
    configuration.key = Buffer.from(configuration.key).toString('hex');
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
  if (typeof(configuration) === 'string') {
    configuration = {key: Buffer.from(configuration).toString('hex'), gid: "local"};
  } else {
    configuration.key = Buffer.from(configuration.key).toString('hex');
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
    configuration = {key: Buffer.from(configuration).toString('hex'), gid: "local"};
  } else {
    // config was already map
    // convert id to alphanumeric only
    configuration.key = Buffer.from(configuration.key).toString('hex');
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

module.exports = {put, get, del};
