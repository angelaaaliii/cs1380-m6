
/**
 * Mapper part of the tf-idf inverted index calculations
 * We need the total number of documents as an additional argument
 * @param {*} key the docID, the URL of the page being processed
 * @param {string} value the content of the page being processed
 * @return a dictionary of {word: [docID, wordFrequency, docWordCount, totalDocs]}
 */
function invertedIndexMapper(key, value, totalDocs) {
    const natural = require('natural');
    const fs = require('fs');

    out = {};

    function preprocess(text) {
        text = text.replace(/[0-9]/g, '');
        text = text.replace(/[^a-zA-Z]/g, ' ');
        text = text.toLowerCase();
        text = text.replace(/\s+/g, ' ');
        const arr = text.split(' ');

        stopwords = fs.readFileSync('./d/stopwords.txt', 'utf8');
        const stopwordsSet = new Set(stopwords.split('\n').map((item) => item.trim()));

        postProcessText = [];
        for (const word of arr) {
            word = natural.PorterStemmer.stem(word);
            // Remove stopwords
            if (!stopwordsSet.has(word)) {
                postProcessText.push(word);
            }
        }

        output = [];

        // 3 grams
        for (let i = 0; i < postProcessText.length-2; i++) {
            output.push(postProcessText[i] + ' ' + postProcessText[i+1] + ' ' + postProcessText[i+2]);
        }
        
        // 2 grams
        for (let i = 0; i < postProcessText.length-1; i++) {
            output.push(postProcessText[i] + ' ' + postProcessText[i+1]);
        }
        
        // 1 gram
        for (const word of postProcessText) {
            output.push(word);
        }

        return output;
    }

    words = preprocess(value);
    docWordCount = words.length;

    for (let i = 0; i < words.length; i++) {
        word = words[i];
        if (word in out) {
            out[word][1] += 1;
        } else {
            out[word] = [key, 1, docWordCount, totalDocs];
        }
    }

    return out;
}

/**
 * Reducer part of the tf-idf inverted index calculations
 * @param {*} key word in the corpus being processed
 * @param {*} values list of lists of [docID, wordFrequency, docWordCount, totalDocs], where each inner list is from a doc that contains the word
 * @return a dictionary of {word: [[docID, tfidf]]} for each docID that contains the word
 */
function invertedIndexReducer(key, values) {
    docTFIDF = [];
    docFrequency = values.length;

    for (let i = 0; i < values.length; i++) {
        docID = values[i][0];
        wordFrequency = values[i][1];
        docWordCount = values[i][2];
        totalDocs = values[i][3]; // Should be the same across all values

        tfidf = (wordFrequency / docWordCount) * Math.log(totalDocs / docFrequency);

        docTFIDF.push([docID, tfidf]);
    }

    docTFIDF.sort((a, b) => b[1] - a[1]); // Sort by tfidf in descending order

    return { key: key, values: docTFIDF };
}