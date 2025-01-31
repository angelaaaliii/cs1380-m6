/*
    Checklist:

    1. Serialize strings
    2. Serialize numbers
    3. Serialize booleans
    4. Serialize (non-circular) Objects
    5. Serialize (non-circular) Arrays
    6. Serialize undefined and null
    7. Serialize Date, Error objects
    8. Serialize (non-native) functions
    9. Serialize circular objects and arrays
    10. Serialize native functions
*/


function serialize(object) {
  let serialized_obj;
  if (typeof(object) == "number") {
    serialized_obj = {type: "number", value: object.toString()};
  } else if (typeof(object) == "string") {
    serialized_obj = {type: "string", value: object.toString()};
  } else if (typeof(object) == "boolean") {
    serialized_obj = {type: "boolean", value: object.toString()};
  } else if (object == null) {
    serialized_obj = {type: "null", value: object.toString()};
  } else if (object == undefined) {
    serialized_obj = {type: "undefined", value: object.toString()};
  } 
  // else if (typeof(object) == "function") {
  //   serialized_obj = {type: "function", value: {inputs: [], body: }}
  // }
  return serialized_obj.toString();
}


function deserialize(string) {
  const json_obj = JSON.parse(string);
  if (json_obj[type] == "number") {
    return Number(json_obj[value]);
  } else if (json_obj[type] == "string") {
    return json_obj[value];
  } else if (json_obj[type] == "boolean") {
    return Boolean(json_obj[value]);
  } else if (json_obj[type] == "null") {
    return null;
  } else if (json_obj[type] == "undefined") {
    return undefined;
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
