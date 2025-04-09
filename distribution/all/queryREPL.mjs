import wordListPath from 'word-list';
import fs from 'fs';
import distribution from '../../config.js';
const id = distribution.util.id;

import pkg from 'natural';
const { LevenshteinDistance } = pkg;
import readline from 'readline';
import { execSync } from 'child_process';
import Fuse from 'fuse.js';

// Setup and initialization
let words = fs.readFileSync(wordListPath, 'utf8').split('\n');
const queryGroup = {};
let localServer = null;
const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };

queryGroup[id.getSID(n1)] = n1;
queryGroup[id.getSID(n2)] = n2;
queryGroup[id.getSID(n3)] = n3;

const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
            distribution.local.status.spawn(n3, (e, v) => {
                cb();
            });
        });
    });
};

distribution.node.start((server) => {
    localServer = server;

    const queryConfig = { gid: 'queryGroup' };
    const outGroupConfig = { gid: 'outGroup' };
    startNodes(() => {
        distribution.local.groups.put(queryConfig, queryGroup, (e, v) => {
            distribution.local.groups.put(outGroupConfig, queryGroup, (e, v) => {
                distribution.queryGroup.groups.put(queryConfig, queryGroup, (e, v) => {
                    const dataset = [{
                            "dog": [
                                ["url1", 0.56],
                                ["url2", 0.44],
                                ["url3", 0.89]
                            ]
                        },
                        {
                            "catdog": [
                                ["url4", 0.99],
                                ["url5", 0.24],
                                ["url6", 0.65]
                            ]
                        },
                        {
                            "catdogmouse": [
                                ["url7", 0.22],
                                ["url8", 0.54]
                            ]
                        },
                        {
                            "cat": [
                                ["url9", 0.11],
                                ["url10", 0.12],
                                ["url11", 0.21]
                            ]
                        },
                        {
                            "lizard": [
                                ["url12", 0.01],
                                ["url13", 0.34],
                                ["url14", 0.87]
                            ]
                        }
                    ];
                    let cntr = 0;
                    dataset.forEach((o) => {
                        const key = Object.keys(o)[0];
                        const value = o[key];
                        distribution['outGroup'].store.put(value, key, (e, v) => {
                            cntr++;
                            if (cntr === dataset.length) {
                                console.log("Done putting objects in group");
                            }
                        });
                    });
                    rl.prompt();
                });
            });
        });
    });
});


function spellCheck(query) {
    let bestMatch = null;
    let bestDistance = Infinity;

    words.forEach(word => {
        let distance = LevenshteinDistance(query, word);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = word;
        }
    });
    return bestMatch ? [bestMatch] : [];
}

// REPL Setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter search query (or type "exit" to quit): ',
});

// Start REPL
rl.prompt();

rl.on('line', (line) => {
    const trimmed = line.trim();

    if (trimmed.toLowerCase() === 'exit') {
        rl.close();
        return;
    }
    if (trimmed.split(' ').length != 3) {
        console.log("Invalid input format");
        rl.close();
        return;
    }

    // Assume the user enters something like: "search cat 5"
    distribution.outGroup.query.execQuery(trimmed, 'outGroup', (err, result) => {
        if (err) {
            console.error('Error:', err.message);
            rl.prompt();
            return;
        }

        if (result.length === 0) {
            const splitInput = trimmed.split(' ');
            const command = splitInput[0];
            const originalWord = splitInput[1];
            const numResults = splitInput[2];

            const suggestions = spellCheck(originalWord);
            if (suggestions.length > 0) {
                const correctedWord = suggestions[0];
                const newQuery = `${command} ${correctedWord} ${numResults}`;
                console.log(`No results found for "${originalWord}". Trying "${correctedWord}" instead...`);

                // Retry the query with the spell-corrected word
                distribution.outGroup.query.execQuery(newQuery, 'outGroup', (retryErr, retryResult) => {
                    if (retryErr) {
                        console.error('Error:', retryErr.message);
                    } else if (retryResult.length === 0) {
                        console.log(`Still no results found for "${correctedWord}".`);
                    } else {
                        console.log('Results:', retryResult);
                    }
                    rl.prompt();
                });
            } else {
                console.log(`No suggestions found for "${originalWord}".`);
                rl.prompt();
            }
        } else {
            console.log('Results:', result);
            rl.prompt();
        }
    });
});

rl.on('close', () => {
    console.log('\nExiting');
    const remote = { service: 'status', method: 'stop' };
    remote.node = n1;
    distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n2;
        distribution.local.comm.send([], remote, (e, v) => {
            remote.node = n3;
            distribution.local.comm.send([], remote, (e, v) => {
                localServer.close();
                console.log('Shutdown complete.');
            });
        });
    });
    process.exit(0);
});