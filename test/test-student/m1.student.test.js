/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const util = distribution.util;

test('(1 pts) student test', () => {
  // number
  const number = -0.5;
  const serialized = util.serialize(number);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(number);
});


test('(1 pts) student test', () => {
  // string
  const str = "3";
  const serialized = util.serialize(str);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(str);
});


test('(1 pts) student test', () => {
  // boolean
  const bool = null == null;
  const serialized = util.serialize(bool);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(bool);
});

test('(1 pts) student test', () => {
  // null
  const val = null;
  const serialized = util.serialize(val);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(val);
});

test('(1 pts) student test', () => {
  // undefined
  const map = new Map();
  const val = map.get("key");
  const serialized = util.serialize(val);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBe(val);
});
