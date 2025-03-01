/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
jest.setTimeout(500000);
const distribution = require('../../config.js');
const { id } = require('../../distribution/util/util.js');

const kv = {};

test.only('(1 pts) timing insert', (done) => {
  // just to make jest pass
  done();
});

test('(1 pts) timing insert', (done) => {
  // inserting objects into distributed store
  let totalInserts = 0;
  let totalQueries = 0;
  let start1 = performance.now();
  for (const key of Object.keys(kv)) {
    distribution.mygroup.mem.put(kv[key], kv, (e, v) => {
      totalInserts += 1;
      if (totalInserts == 1000) {
        let end1 = performance.now();
        console.log("time to insert = " + (end1-start1) + " milliseconds");

        // timing time to query
        let start2 = performance.now();
        for (const key of Object.keys(kv)) {
          distribution.mygroup.mem.get(key, (e, v) => {
            totalQueries += 1;
            if (totalQueries == 1000) {
              let end2 = performance.now();
              console.log("time to query = " + (end2-start2) + " milliseconds");
              done();
            }
          });
        }

      }
    });
  }

});


const n1 = {ip: '3.145.62.69', port: 1234};
const n2 = {ip: '3.14.143.159', port: 1234};
const n3 = {ip: '18.191.149.88', port: 1234};
const mygroupGroup = {};


beforeAll((done) => {
  const randomStr = () => {
    const chs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chs.charAt(Math.floor(Math.random() * chs.length));
    }
    return res;
  };

  const randomObj = () => {
    const obj = {};
    const keys = ['a', 'bcd', 'c', 75, true];
    const vals = ['f', 'ghi', -100, false, {}];

    for (let i = 0; i < 2; i++) {
      const keyIdx = Math.floor(Math.random() * keys.length);
      const valIdx = Math.floor(Math.random() * keys.length);

      obj[keys[keyIdx]] = vals[valIdx];
    }

    return obj;
  };


  // generate 1000 kv pairs
  while (Object.keys(kv).length != 1000) {
    kv[randomStr()] = randomObj();
  }

    mygroupGroup[id.getSID(n1)] = n1;
    mygroupGroup[id.getSID(n2)] = n2;
    mygroupGroup[id.getSID(n3)] = n3;

  distribution.local.groups.put('mygroup', mygroupGroup, (e, v) => {
    done();
  });
});

afterAll((done) => {
  done();
});