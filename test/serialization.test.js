const distribution = require('../config.js');
const util = distribution.util;

test('(5 pts) serializeNumber', () => {
  const number = 42;
  const serialized = util.serialize(number);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(number);
});

test('(5 pts) serializeString', () => {
  const string = 'Hello, World!';
  const serialized = util.serialize(string);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(string);
});

test('(10 pts) serializeSimpleObject', () => {
  const object = {a: 1, b: 2, c: 3};
  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(object);
});

test('(5 pts) serializeNestedObject', () => {
  const object = {a: 1, b: 2, c: 3, d: {e: 4, f: 5, g: 6}};
  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(object);
});

test('(5 pts) serializeArray', () => {
  const array = [1, 2, 3, 4, 5];
  const serialized = util.serialize(array);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(array);
});

test('(5 pts) serializeNestedArray', () => {
  const array = [1, 2, 3, 4, 5, [6, 7, 8, 9, 10]];
  const serialized = util.serialize(array);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(array);
});

test('(5 pts) serializeNestedArrayAndObject', () => {
  const array = [1, 2, 3, 4, 5, [6, 7, 8, 9, 10], {a: 1, b: 2, c: 3}];
  const serialized = util.serialize(array);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(array);
});

test('(5 pts) serializeError', () => {
  const error = new Error('Hello, World!');
  const serialized = util.serialize(error);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(error);
});

test('(5 pts) serializeDate', () => {
  const date = new Date();
  const serialized = util.serialize(date);
  const deserialized = util.deserialize(serialized);
  expect(deserialized.getTime()).toBe(date.getTime());
});

test('(5 pts) serializeUndefined', () => {
  const serialized = util.serialize(undefined);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBeUndefined();
});

test('(5 pts) serializeNull', () => {
  const serialized = util.serialize(null);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBeNull();
});

test('(5 pts) serializeKindaCircularObject', () => {
  // this object is not strictly circular, it just branches.
  const x = {a: 1, b: 2, c: 3};
  const object = {a: x, b: x, c: 1};
  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(deserialized).toEqual(object);
});

test('(5 pts) serializeFunction', () => {
  const fn = (a, b) => a + b;
  const serialized = util.serialize(fn);
  const deserialized = util.deserialize(serialized);

  expect(typeof deserialized).toBe('function');
  expect(deserialized(42, 1)).toBe(43);
});

test('(5 pts) serializeObjectWithFunctions', () => {
  const fn = (a, b) => a + b;
  const object = {func: fn};
  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized.func).toBe('function');
  expect(deserialized.func(42, 1)).toBe(43);
});

test('(5 pts) serializeObjectWithNameClashFunctions', () => {
  const object = {log: () => 42};
  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized.log).toBe('function');
  expect(deserialized.log()).toBe(42);
});

test('(5 pts) serializeRainbowObject', () => {
  const object = {
    n: 1,
    s: 'Hello, World!',
    a: [1, 2, 3, 4, 5],
    e: new Error('Hello, World!'),
    d: new Date(),
    o: {x: 1, y: 2, z: 3},
    n: null,
    u: undefined,
  };

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(deserialized).toEqual(object);
});

test('(5 pts) serialize and deserialize null', () => {
  let original = null;
  let serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(5 pts) serialize and deserialize undefined', () => {
  let original = undefined;
  let serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(5 pts) serialize and deserialize special string', () => {
  let original = '\\string\n\t\r"';
  let serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(5 pts) serialize and deserialize boolean true', () => {
  let original = true;
  let serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(5 pts) serialize and deserialize boolean false', () => {
  let original = false;
  let serialized = util.serialize(original);
  expect(original).toEqual(util.deserialize(serialized));
});

test('(5 pts) serialize and deserialize Date object', () => {
  let original = new Date();
  let serialized = util.serialize(original);
  expect(original.toString()).toEqual(util.deserialize(serialized).toString());
});

test('(5 pts) serialize and deserialize empty object', () => {
  let original = {};
  let serialized = util.serialize(original);
  expect(util.deserialize(serialized)).toEqual({});
});

test('(5 pts) serialize and deserialize empty array', () => {
  let original = [];
  let serialized = util.serialize(original);
  expect(util.deserialize(serialized)).toEqual([]);
});

test('(5 pts) serialize and deserialize complex array', () => {
  let original = [27, null, undefined, 'string', true, false, {}, []];
  let serialized = util.serialize(original);
  expect(util.deserialize(serialized)).toEqual([27,
    null, undefined, 'string', true, false, {}, []]);
});

test('(5 pts) serialize and deserialize array with functions', () => {
  let f = function() {};
  let original = [f];
  let serialized = util.serialize(original);
  let deserialized = util.deserialize(serialized);
  expect(typeof deserialized[0]).toBe('function');
});

test('(5 pts) serialize and deserialize array with multiple functions', () => {
  let f = function() {};
  let original = [f, function() {}];
  let serialized = util.serialize(original);
  let deserialized = util.deserialize(serialized);
  expect(typeof deserialized[0]).toBe('function');
  expect(typeof deserialized[1]).toBe('function');
});

test('(5 pts) serialize and deserialize object with function', () => {
  let f = function() {};
  let original = {f: f};
  let serialized = util.serialize(original);
  let deserialized = util.deserialize(serialized);
  expect(typeof deserialized.f).toBe('function');
});

