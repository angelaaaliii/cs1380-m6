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
  // fs.appendFileSync("crawl_append.txt", serialize(configuration) + '\n');
  if (configuration === null) {
    configuration = {key: id.getID(state), gid: "local"};
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
    // fs.appendFileSync("crawl_append.txt", "1");
  } else if (typeof(configuration) === 'string') {
    configuration = {key: (configuration).replace(/[^a-zA-Z0-9]/g, ''), gid: "local"};
    // fs.appendFileSync("crawl_append.txt", "1");
  } 
  else if (configuration.key === null) {
    configuration.key = id.getID(state);
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
    // fs.appendFileSync("crawl_append.txt", "1");
  } 
  else {
    // config already a map, make sure id is alphanumeric only
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
    // fs.appendFileSync("crawl_append.txt", "1");
  }

  if (configuration.key.length > 255) {
    configuration.key = configuration.key.substring(0, 50);
    // fs.appendFileSync("crawl_append.txt", ", 1.5");
  }

  const fileContent = serialize(state);
  // fs.appendFileSync("crawl_append.txt", ", 2");

  // use nid and gid as directories
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration.gid, configuration.key);
  // create nid dir if it does not exit
  if (!fs.existsSync(path.join(__dirname, '../', nidDirName))) {
    fs.mkdirSync(path.join(__dirname, '../', nidDirName), {recursive: true});
    // fs.appendFileSync("crawl_append.txt", ", 2.5");
  }

  // create gid dir if it does not exit
  if (!fs.existsSync(path.join(__dirname, '../', nidDirName, configuration.gid))) {
    fs.mkdirSync(path.join(__dirname, '../', nidDirName, configuration.gid), {recursive: true});
    // fs.appendFileSync("crawl_append.txt", ", 2.75");
  }

  try {
    fs.writeFileSync(filePath, fileContent);
    // fs.appendFileSync("crawl_append.txt", ", 3\n");
    callback(null, state);
  } catch (error) {
    // fs.appendFileSync("crawl_append.txt", "ERROR");
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
      console.log("STORE GET KEYS = ", dirPath, keys);
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
    if (configuration.key.length > 255) {
      configuration.key = configuration.key.substring(0, 50);
    }
    configuration.key = (configuration.key).replace(/[^a-zA-Z0-9]/g, '');
  }

  // use nid and gid as directories
  const nid = id.getNID(global.nodeConfig);
  const nidDirName = nid.toString(16);
  const filePath = path.join(__dirname, '../', nidDirName, configuration.gid, configuration.key);
  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    callback(err, null);
    return;
  }

  try {
    const deserialized_content = deserialize(fileContent); 
    callback(null, deserialized_content);
    return;
  } catch (e) {
    console.log("DESERIALIZE ERR 4", e, fileContent);
    callback(null, []);
    return;
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

  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
  }
  catch (e) {
    callback(new Error("error in local store del", {source:err}), null);
    return;
  }

  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    callback(new Error("error in local store del", {source:err}), null);
    return;
  } 

  let deserializedContent;
  try {
    deserializedContent = deserialize(fileContent);
  } catch (e) {
    console.log("DESERIALIZE ERR 5", e);
    callback(new Error("error in local store del", {source:e}), null);
    return;
  }
  callback(null, deserializedContent);
}

function append(configuration, val, callback) {
  // get(configuration, (e, v1) => {
  //   if (e) {
  //     // key not on node
  //     v1 = [];
  //   }
  //   v2 = v1.concat(val);
  //   put(v2, configuration, (e, v) => {
  //     callback(e, v);
  //     return;
  //   });
  // });

  get(configuration, (e, v1) => {
    if (e) {
      // key not on node
      v1 = [];
    }
    v2 = v1.concat(val);
    put(v2, configuration, (e, v) => {
      callback(e, v);
      return;
    });
  });
  
}

function crawl_append(configuration, val, callback) {
  if (val == []) {
    console.log("APPEND 1");
    callback(null, val);
    return;
  }
  get(configuration, (e, v1) => {
    if (e) {
      // key not on node
      v1 = [];
    }
    if (v1.length > 0 && 'page_text' in v1[0]) {
      console.log("APPEND 2");
      callback(null, val);
      return;
    } else if ('page_text' in val || v1.length == 0){
      v2 = [val];
      put(v2, configuration, (e, v) => {
        console.log("APPEND 3");
        callback(e, v);
        return;
      });
    } else {
      console.log("APPEND 4");
      callback(null, val);
      return;
    }
  });
}
module.exports = {put, get, del, crawl_append, append};
