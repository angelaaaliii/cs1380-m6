
function serialize(object) {
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
    let val_map = {};
    const name_val = {type: "string", value: "Error"};
    for (let key of Object.keys(object)) {
      val_map[key] = serialize(object[key]);
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
    return Boolean(json_obj['value']);
  } else if (json_obj['type'] == "undefined") {
    return undefined;
  } else if (json_obj['type'] == "null") {
    return null;
  } 
  else if (json_obj['type'] == 'function') {
    const f_str_arr = json_obj['value'].split("=>");
    let inputs_str = f_str_arr[0].trim();
    let inputs_arr = (inputs_str.substring(1, inputs_str.length-1)).split(",");
    const f = new Function(`return (${inputs_arr}) => ${f_str_arr[1]};`)(); 
    return f;
  } 
  else if (json_obj['type'] == 'array') {
    const val = json_obj['value'];
    let res = new Array(val.length);
    for (let key of Object.keys(val)) {
      res[Number(key)] = deserialize(val[key]);
    }
    return res;
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
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
