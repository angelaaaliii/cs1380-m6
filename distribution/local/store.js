/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const path = require('path');
const fs = require('fs');
const { serialize, deserialize } = require('../util/serialization');
const { id } = require('../util/util');

function put(state, configuration, callback) {
  if (configuration === null) {
    configuration = id.getID(state);
  }
  // convert string to alphanumeric only
  configuration = Buffer.from(configuration).toString('hex');

  const fileContent = serialize(state);

  // use nid as directory
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration);

  // create nid dir if it does not exit
  if (!fs.existsSync(path.join(__dirname, '../', nidDirName))) {
    fs.mkdirSync(path.join(__dirname, '../', nidDirName));
  }

  try {
    fs.writeFileSync(filePath, fileContent);
    callback(null, state);
  } catch (error) {
    callback(new Error("error in write file sync", {source:error}), null);
  }
}

function get(configuration, callback) {
  // convert string to alphanumeric only
  configuration = Buffer.from(configuration).toString('hex');

  // use nid as directory
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    callback(null, deserialize(fileContent));
  } catch (err) {
    callback(new Error("error in read file sync", {source:err}), null);
  }
}

function del(configuration, callback) {
  // convert string to alphanumeric only
  configuration = Buffer.from(configuration).toString('hex');

  // use nid as directory
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    fs.unlinkSync(filePath);
    callback(null, deserialize(fileContent));
  } catch (err) {
    callback(new Error("error in local store del", {source:err}), null);
  }
}

module.exports = {put, get, del};
