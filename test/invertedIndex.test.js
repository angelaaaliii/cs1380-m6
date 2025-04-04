const { invertedIndexMapper, invertedIndexReducer } = require('../distribution/all/invert');

describe('Inverted Index Tests', () => {
    const totalDocs = 2; // Total number of documents in the corpus
    const corpus = {
        doc1: "The quick brown fox jumps over the lazy dog.",
        doc2: "The quick brown fox is quick and smart."
    };

    test('Mapper should correctly map words to their frequencies and metadata', () => {
        const mapperOutput1 = invertedIndexMapper('doc1', corpus.doc1, totalDocs);
        const mapperOutput2 = invertedIndexMapper('doc2', corpus.doc2, totalDocs);

        console.log(mapperOutput1);
        console.log(mapperOutput2);

        // Check some expected outputs for doc1
        expect(mapperOutput1['quick']).toEqual(['doc1', 1, 15, totalDocs]);
        expect(mapperOutput1['brown']).toEqual(['doc1', 1, 15, totalDocs]);
        expect(mapperOutput1['fox']).toEqual(['doc1', 1, 15, totalDocs]);

        // Check some expected outputs for doc2
        expect(mapperOutput2['quick']).toEqual(['doc2', 2, 12, totalDocs]);
        expect(mapperOutput2['brown']).toEqual(['doc2', 1, 12, totalDocs]);
        expect(mapperOutput2['smart']).toEqual(['doc2', 1, 12, totalDocs]);
    });

    test('Reducer should correctly reduce word data to calculate tf-idf', () => {
        const mapperOutput1 = invertedIndexMapper('doc1', corpus.doc1, totalDocs);
        const mapperOutput2 = invertedIndexMapper('doc2', corpus.doc2, totalDocs);

        // Combine mapper outputs for the reducer
        const combinedOutputs = {};
        for (const [word, data] of Object.entries(mapperOutput1)) {
            combinedOutputs[word] = combinedOutputs[word] || [];
            combinedOutputs[word].push(data);
        }
        for (const [word, data] of Object.entries(mapperOutput2)) {
            combinedOutputs[word] = combinedOutputs[word] || [];
            combinedOutputs[word].push(data);
        }

        // Reduce each word
        const reducedOutputs = {};
        for (const [word, values] of Object.entries(combinedOutputs)) {
            reducedOutputs[word] = invertedIndexReducer(word, values);
        }

        // Check some expected tf-idf values
        const tfidfQuickDoc1 = (1 / 15) * Math.log(2 / 2); // = 0
        const tfidfQuickDoc2 = (2 / 12) * Math.log(2 / 2); // = 0
        const tfidfSmartDoc2 = (1 / 12) * Math.log(2 / 1); // ≈ 0.0578        

        expect(reducedOutputs['quick'].values).toEqual([
            ['doc1', tfidfQuickDoc2],
            ['doc2', tfidfQuickDoc1]
        ]);
        expect(reducedOutputs['smart'].values).toEqual([
            ['doc2', tfidfSmartDoc2]
        ]);
    });
});