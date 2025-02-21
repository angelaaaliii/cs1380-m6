/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const util = distribution.util;

let total_time = 0;
test('(1 pts) student test', () => {
  // number
  const number = -0.5;
  const start = performance.now();
  const serialized = util.serialize(number);
  const deserialized = util.deserialize(serialized);
  const end = performance.now();
  expect(deserialized).toBe(number);
  // console.log("time for test 1 = " + (end-start) + " milliseconds");
  total_time += (end-start);
});


test('(1 pts) student test', () => {
  // string
  const str = "3";
  const start = performance.now();
  const serialized = util.serialize(str);
  const deserialized = util.deserialize(serialized);
  const end = performance.now();
  expect(deserialized).toBe(str);
  // console.log("time for test 2 = " + (end-start) + " milliseconds");
  total_time += (end-start);
});


test('(1 pts) student test', () => {
  // boolean
  const bool = null == null;
  const start = performance.now();
  const serialized = util.serialize(bool);
  const deserialized = util.deserialize(serialized);
  const end = performance.now();
  expect(deserialized).toBe(bool);
  // console.log("time for test 3 = " + (end-start) + " milliseconds");
  total_time += (end-start);
});

test('(1 pts) student test', () => {
  // null
  const val = null;
  const start = performance.now();
  const serialized = util.serialize(val);
  const deserialized = util.deserialize(serialized);
  const end = performance.now();
  expect(deserialized).toBe(val);
  // console.log("time for test 4 = " + (end-start) + " milliseconds");
  total_time += (end-start);
});

test('(1 pts) student test', () => {
  // undefined
  const map = new Map();
  const val = map.get("key");
  const start = performance.now();
  const serialized = util.serialize(val);
  const deserialized = util.deserialize(serialized);
  const end = performance.now();
  expect(deserialized).toBe(val);
  // console.log("time for test 5 = " + (end-start) + " milliseconds");
  total_time += (end-start);
  // console.log("time for all tests to execute = " + total_time + " milliseconds");
});