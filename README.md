# M4: Distributed Storage


## Summary

This implementation allows data to be stored on nodes locally and through the distributed service. There are 2 types of storage: mem and store. The distributed services generally use a hashing function to identify a node to store the data on and then puts the data there. Thus, this implementation includes some hash functions and additional features to allow full access to stored objects and the ability ro reconfigure/detect need for reconfiguration through the use of gossip at health checks. 


## Correctness & Performance Characterization

> I wrote student tests to check the local mem put/get/del error case, distributed store put/get non-error case, hashing to the same node, null store all get test, and the all mem reconf case after removing 2 nodes and only relocating 2 keys.


*Correctness* -- I wrote five additional student tests along with the pre-existing test suite. All tests pass. Student tests take 1.056 seconds.


*Performance* -- insertion and retrieval.
- Latency for insertion = 127.188 milliseconds/insert
- Throughput for insertion = 7.862 inserts/second
- Latency for query = 75.236 milliseconds/query
- Throughput for query = 13.291 queries/second


## Key Feature

> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

If we were to fetch all objects immediately and place them all, this would be redundant for objects that do not require re-placing. By first identifying which objects should be moved, we can be more efficient and reduce unecessary operaitons. Moreover, fetching all objects immediately could create a bottleneck and would not scale well if nodes were to contain thousands of objects.