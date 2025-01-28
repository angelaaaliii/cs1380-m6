const {execSync} = require('child_process');

const baseURL = process.argv[2];
const terms = process.argv[3].split('\n');
const tracker = {};
for (let i = 0; i < terms.length; i++) {
  const term = terms[i];
  if (term in tracker) {
    tracker[term]+= 1;
  } else {
    tracker[term] = 1;
  }
}

// now appending tf instead of freq to output str for TFIDF LAB

// getting number of words in document
const grepCommand = `grep -h "${baseURL}" "d/corpus-tracker.txt"`;
const res = execSync(grepCommand, {encoding: 'utf-8'});
const totalWords = Number(res.split(' ')[1]);


let outputStr = '';
for (const k in tracker) {
  // TFIDF LAB - putting term freq in doc / total words in doc in index instead of just term freq
  outputStr += k + ' | ' + Number(tracker[k]/totalWords).toFixed(3) + ' | ' + baseURL + '\n';
}
console.log(outputStr.substring(0, outputStr.length-1));
