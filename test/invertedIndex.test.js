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

describe('TF-IDF Ranking Test', () => {
    const totalDocs = 3;
    const corpus = {
      doc1: "banana banana banana apple",
      doc2: "banana apple apple apple",
      doc3: "apple orange mango"
    };
  
    test('banana should have correct tf-idf scores and be ranked properly', () => {
      const combinedMap = {};
  
      // Run mapper for all docs
      for (const [docID, content] of Object.entries(corpus)) {
        const output = invertedIndexMapper(docID, content, totalDocs);
        for (const [word, data] of Object.entries(output)) {
          if (!combinedMap[word]) combinedMap[word] = [];
          combinedMap[word].push(data);
        }
      }
  
      // Run reducer
      const reduced = invertedIndexReducer('banana', combinedMap['banana']);
  
      const bananaTFIDFs = reduced.values;
  
      // Assert two documents only (banana not in doc3)
      expect(bananaTFIDFs.length).toBe(2);
  
      // Ensure doc1 has higher score than doc2
      expect(bananaTFIDFs[0][0]).toBe('doc1'); // Highest tf-idf first
      expect(bananaTFIDFs[1][0]).toBe('doc2');
  
      // Assert approximate TF-IDF values
      const logIDF = Math.log(3 / 2); // ≈ 0.405
      const expectedDoc1Score = (3 / 9) * logIDF;
      const expectedDoc2Score = (1 / 9) * logIDF;
  
      expect(bananaTFIDFs[0][1]).toBeCloseTo(expectedDoc1Score, 4);
      expect(bananaTFIDFs[1][1]).toBeCloseTo(expectedDoc2Score, 4);
    });
  });