const distribution = require('../../config.js');
const id = distribution.util.id;
const { performance } = require('node:perf_hooks');
const fs = require('fs');

const queryGroup = {};
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

/*
  IMPORTANT NOTE: There can't be any spaces in the n-grams that are produced by the 
  inverted index. This is because store.put gets rid of spaces in between words to 
  create the files. We must also get rid of spaces in the user's query term.
*/

function execQueryMultipleTimes(totalQueries = 100) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let completed = 0;

    for (let i = 0; i < totalQueries; i++) {
      distribution.queryGroup.query.execQuery('./query.js brand 4', '2_reduceOut', (e, v) => {
        completed++;

        if (completed === totalQueries) {
          const endTime = performance.now();
          const totalTime = endTime - startTime;
          console.log(`All ${totalQueries} queries completed in ${totalTime.toFixed(2)} ms`);
          resolve();
        }
      });
    }
  });
}

function spawnNode(node) {
  return new Promise((resolve) => {
    distribution.local.status.spawn(node, (e, v) => resolve());
  });
}

function putGroup(gid, group, target) {
  return new Promise((resolve) => {
    target.groups.put({gid}, group, (e, v) => resolve());
  });
}

function sendStopSignal(node) {
  return new Promise((resolve) => {
    const remote = {service: 'status', method: 'stop', node};
    distribution.local.comm.send([], remote, (e, v) => resolve());
  });
}

async function setup() {
  queryGroup[id.getSID(n1)] = n1;
  queryGroup[id.getSID(n2)] = n2;
  queryGroup[id.getSID(n3)] = n3;

  await new Promise((resolve) => {
    distribution.node.start((server) => {
      localServer = server;
      resolve();
    });
  });

  await spawnNode(n1);
  await spawnNode(n2);
  await spawnNode(n3);

  const queryConfig = {gid: 'queryGroup'};
  const outGroupConfig = {gid: '2_reduceOut'};

  await putGroup('queryGroup', queryGroup, distribution.local);
  await putGroup('2_reduceOut', queryGroup, distribution.local);
  await putGroup('queryGroup', queryGroup, distribution.queryGroup);
}

async function teardown() {
  await sendStopSignal(n1);
  await sendStopSignal(n2);
  await sendStopSignal(n3);
  localServer.close();
}

async function main() {
  try {
    console.log('Setting up environment...');
    await setup();

    console.log('Running queries...');
    await execQueryMultipleTimes(100);

  } catch (err) {
    console.error('An error occurred:', err);
  } finally {
    console.log('Tearing down...');
    await teardown();
    console.log('Done.');
  }
}

main();
