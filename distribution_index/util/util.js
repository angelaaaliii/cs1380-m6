// const serialization = require('./serialization');
const serialization = require("@brown-ds/distribution/distribution/util/util");
const id = require('./id');
const wire = require('./wire');

module.exports = {
  serialize: serialization.serialize,
  deserialize: serialization.deserialize,
  id: id,
  wire: wire,
};
