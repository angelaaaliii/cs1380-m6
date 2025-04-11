const os = require('os'); 
const fs = require('fs');
const cs = require('console');
const native_funcs = require('repl')._builtinLibs;
const AsyncFunction = (async () => {}).constructor;

// const native_val_map = 
// {'fs.readFile': fs.readFile, 'console.log': cs.log, 'os.type': os.type,
//   'fs.writeFile': fs.writeFile, 'fs.appendFile': fs.appendFile
// };

let id_obj = new Map();
let obj_id = new Map();

// lab
let native_val = new Map();
let val_native = new Map();

function native_helper() {
  for (let func of native_funcs) {
    const mod = require(func);
    for (let property of Object.getOwnPropertyNames(mod)) {
      if (typeof(mod[property]) == 'function' && !mod[property].constructor.name.includes("Async")) {

        if (!native_val.has(mod[property])) {
          native_val.set(mod[property], property);
          val_native.set(property, mod[property]);
        }
      }
    }
  }
}



function serialize(object) {
  native_helper();
  let serialized_obj;
  if (typeof(object) == "number") {
    serialized_obj = {type: "number", value: object.toString()};
  } else if (typeof(object) == "string") {
    serialized_obj = {type: "string", value: object.toString()};
  } else if (typeof(object) == "boolean") {
    serialized_obj = {type: "boolean", value: object.toString()};
  } else if (typeof(object) == "undefined") {
    serialized_obj = {type: "undefined", value: ""};
  } else if (object == null) {
    serialized_obj = {type: "null", value: "null"};
  } 
  else if (native_val.has(object)) {
    val_native.set(native_val.get(object), object);
    serialized_obj = {type: "native", value: native_val.get(object)};
  }
  // else if (object === cs.log) {
  //   serialized_obj = {type: "native", value: "console.log"};
  // }
  // else if (object === os.type) {
  //   serialized_obj = {type: "native", value: "os.type"};
  // }
  // else if (object === fs.writeFile) {
  //   serialized_obj = {type: "native", value: "fs.writeFile"};
  // }
  // else if (object === fs.appendFile) {
  //   serialized_obj = {type: "native", value: "fs.appendFile"};
  // }
  else if (typeof(object) == "function") {
    serialized_obj = {type: "function", value: object.toString()};
  } 
  else if (Array.isArray(object)) {
    const elem_obj_arr = object.map((x) => (serialize(x)));
    serialized_obj = {type: "array", value: {...elem_obj_arr}};
  }
  else if (object instanceof Error) {
    const obj_val_map = {name: serialize("Error"), message: serialize(object.message), cause: serialize(object.cause)};
    serialized_obj = {type: "error", value: {type: "object", value: obj_val_map} };
  }
  else if (object instanceof Date) {
    serialized_obj = {type:"date",value:object.toISOString()};
  }
  else if (typeof(object) == 'object') {
    let random_uuid = generateID();
    id_obj.set(random_uuid, object);
    obj_id.set(object, random_uuid);

    let val_map = {};

    for (let key of Object.keys(object)) {
      if (obj_id.get(object[key]) != undefined && object[key] === id_obj.get(obj_id.get(object[key]))) {
        // circular object
        val_map[key] = JSON.stringify({type:"reference", value: obj_id.get(object[key]).toString()});
      } else {
        val_map[key] = serialize(object[key]);
      }
    }
    serialized_obj = {type: "object", value: val_map};
  }
  return JSON.stringify(serialized_obj);
}


function deserialize(string) {
  const json_obj = JSON.parse(string);
  if (json_obj['type'] == "number") {
    return Number(json_obj['value']);
  } else if (json_obj['type'] == "string") {
    return json_obj['value'];
  } else if (json_obj['type'] == "boolean") {
    return json_obj['value'] == 'true';
  } else if (json_obj['type'] == "undefined") {
    return undefined;
  } else if (json_obj['type'] == "null") {
    return null;
  } 
  else if (json_obj['type'] == 'function') {
    return new Function("return " + json_obj['value'])();
  } 
  else if (json_obj['type'] == 'array') {
    const val = json_obj['value'];
    const keys = Object.keys(val);
    let res = new Array(keys.length);
    for (let key of keys) {
      res[Number(key)] = deserialize(val[key]);
    }
    return res;
  }
  else if (json_obj['type'] == 'error') {
    const e = new Error(deserialize(json_obj['value']['value']['message']), { cause: deserialize(json_obj['value']['value']['cause'])});
    return e;
  }
  else if (json_obj['type'] == 'date') {
    return new Date(json_obj['value']);
  }
  else if (json_obj['type'] == 'object') {
    const val_map = json_obj['value'];
    let res = {};
    for (let key of Object.keys(val_map)) {
      res[key] = deserialize(val_map[key]);
    }
    return res;
  }
  else if (json_obj['type'] == 'native') {
    // native functions
    return val_native.get(json_obj['value']);
  }
  else if (json_obj['type'] == 'reference') {
    return id_obj.get(json_obj['value']);
  }
}



function generateID() {
  const timeStamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substr(2, 5);
  return timeStamp + randomString;
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
