#!/usr/bin/env node
const distribution = require('../../config.js');
const util = distribution.util;
const fs = require('fs');

// latency of base types
let start = performance.now();
let deserialized = util.deserialize(util.serialize(-29507));
deserialized = util.deserialize(util.serialize("null"));
deserialized = util.deserialize(util.serialize(true));
deserialized = util.deserialize(util.serialize(null));
deserialized = util.deserialize(util.serialize(undefined));
let end = performance.now();
console.log("average latency for base types = " + (end - start)/5 + " milliseconds");


// latency of functions
start = performance.now();
deserialized = util.deserialize(util.serialize(fs.readFile));
deserialized = util.deserialize(util.serialize(console.log));
deserialized = util.deserialize(util.serialize(fs.writeFile));
deserialized = util.deserialize(util.serialize(fs.appendFile));
deserialized = util.deserialize(util.serialize(performance.createHistogram));
end = performance.now();
console.log("average latency for functions = " + (end - start)/5 + " milliseconds");


// latency of complex, recursive objects
start = performance.now();
deserialized = util.deserialize(util.serialize(new Date()));
deserialized = util.deserialize(util.serialize({a: {b: 1, c: 2}, d: 3}));
deserialized = util.deserialize(util.serialize([{a: {b: 1, c: 2}, d: 3}, "hello", [1, 2], true]));
deserialized = util.deserialize(util.serialize(new Error('latency measurement')));
end = performance.now();
console.log("average latency for complex, recursive structures = " + (end - start)/4 + " milliseconds");