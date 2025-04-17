import wordListPath from 'word-list';
import fs from 'fs';
import distribution from '../../config.js';
const id = distribution.util.id;

import pkg from 'natural';
const { LevenshteinDistance } = pkg;
import readline from 'readline';

// Load word list for spell check
let words = fs.readFileSync(wordListPath, 'utf8').split('\n');

let localServer = null;

// Start the local node
distribution.node.start((server) => {
    localServer = server;
    rl.prompt();
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
    if (trimmed.split(' ').length != 2) {
        console.log("Invalid input format");
        rl.prompt();
        return;
    }

    const [queryWord, numResults] = trimmed.split(' ');

    distribution.outGroup.query.execQuery(trimmed, 'indexReduceOut', (err, result) => {
        if (err) {
            console.error('Error:', err.message);
            rl.prompt();
            return;
        }

        if (result.length === 0) {
            const suggestions = spellCheck(queryWord);
            if (suggestions.length > 0) {
                const correctedWord = suggestions[0];
                const newQuery = `${correctedWord} ${numResults}`;
                console.log(`No results found for "${queryWord}". Trying "${correctedWord}" instead...`);

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
                console.log(`No suggestions found for "${queryWord}".`);
                rl.prompt();
            }
        } else {
            console.log('Results:', result);
            rl.prompt();
        }
    });
});

rl.on('close', () => {
    console.log('\nExiting...');
    if (localServer) {
        localServer.close(() => {
            console.log('Shutdown complete.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});