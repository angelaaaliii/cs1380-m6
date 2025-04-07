/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/
const path = require('path');
const fs = require('fs');
// const { serialize, deserialize } = require('../util/serialization');
const { serialize, deserialize } = require("@brown-ds/distribution/distribution/util/util");

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

  if (configuration.key.length > 255) {
    configuration.key = configuration.key.substring(0, 50);
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
    callback(err, null);
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
  if (val.original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
    let debug = "\n\n";

    if ('page_text' in val) {
      debug = val.page_text + "\n\n";
    }
    fs.appendFileSync("debug.txt", "original url: " + val.original_url + ", " +  debug);
    
    console.log("CRAWL APPEND JOSH VAL");
  }
  get(configuration, (e, v1) => {
    // if (val.original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
    //   console.log("CRAWL APPEND BOOL = ", 'page_text' in val, val);
    // }
    if (e) {
      // key not on node
      v1 = [];
    }
    if (v1.length > 0 && 'page_text' in v1[0]) {
      // if (val.original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
      //   console.log("CRAWL APPEND ALRDY HAS PAGE TEXT");
      // }
      callback(e, val);
      return;
    } else if ('page_text' in val || v1.length == 0){
      v2 = [val];
      put(v2, configuration, (e, v) => {
        // if (val.original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
        //   console.log("CRAWL APPEND PUT V2 =", v2);
        // }
        callback(e, v);
        return;
      });
    } else {
      // if (val.original_url == "https://en.wikipedia.org/wiki/Josh_Schache") {
      //   console.log("CRAWL APPEND DO NOTHING");
      // }
      callback(e, val);
      return;
    }
  });
}
module.exports = {put, get, del, crawl_append, append};
