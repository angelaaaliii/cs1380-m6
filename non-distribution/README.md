# M0: Setup & Centralized Computing

* name: Angela Li

* email: angela_li@brown.edu

* cslogin: ali190


## Summary

Overall, my implementation includes functionality for all tasks, including the lab tasks. 


My implementation consists of 9 components and addressing T1--8 and 23 tests (for both lab and base functionality).

I implemented stem.js, getText.js, getURLs.js, merge.js, query.js, process.sh, process.js, combine.js, and invert.js.

The most challenging aspect was learning bash and javascript syntax and also understanding how the pipeline was functioning for the lab section. This was challenging because the syntax was brand new for me and because the lab section was rather open-ended, so choosing where to edit the components in the pipeline was difficult.


## Correctness & Performance Characterization


To characterize correctness (non-tf-idf), I developed 13 tests that test the following cases: 
- when word to query is not found in any documents/global-index
- getting text outside of divs
- creating n-grams with < 3 words as input to ensure there are no 3-grams
- stemming with same base word and different endings
- querying that returns the query as a substring of the match in global-index
- querying where there is only 1 match
and more. These tests include 3 test for the .js components of process, combine, and invert and several for query as a part of the scenarios task. 

To characterize correctness (tf-idf), I developed 10 tests. These tests include getting the previous given tests in non-distribution/t to work with my tf-idf implementation. Then, I created my own custom multi-document corpus by mocking the content files, since it would have been a lot of overhead to create html pages for crawl to extract the text from. So, I started the testing at index in the pipeline. I called index on the corpus and made sure the global-index was what I expected (non-distribution-tfidf/t/test-end_to_end). Then,I also passed that index file to query and tested that query returned the correct terms and expected tf-idf scores (non-distribution-tfidf/t/test-query-custom.sh). 

The main edge case tested was checking that the tf-idf implementation would rank a document A (less total words than document B) higher than document B even though the term has a higher frequency in document B, following correct tf-idf protocol. 


*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json. The file used to test performance is found in non-distribution/s_test_performance.js.


## Wild Guess

I estimate it will take 2000 lines of code to build a fully distributed search engine because in lec 2 we talked about how there are lots of parts to maintain in a distributed system, like enabling recovery, having code for fault tolerance and backups, etc. And because of all those components to ensure consistency and a properly working system, I feel the code would be ~5x the base code for non-distributed systems. 