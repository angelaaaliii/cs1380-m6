# M5: Distributed Execution Engine


## Summary

> Overall, this milestone's implementation required generating a new route under an mr job id from within exec and registering all functions the worker nodes and coordinator node would call. The flow of exec (non-iterative) is as follows: 
1) Coordinator sets up ephemeral routes and groups that will be used. 
2) Coordinator node uses distributed comm send to call the worker's map wrapper. 
- The map wrapper on each worker gets all keys and values under the map input gid group on the local node. The worker aggregates the values under the same keys after mapping all keys and then calls a compaction function. The result of this is then directly stored (distributed store/mem service) under the map output gid group (aka shuffling phase). 
3) Once the worker node is done shuffling, the worker node uses a local comm send to call the coordinator's receiveNotifyShuff. 
4) On the coordinator, in receiveNotifyShuff, the coordinator tracks that it has received notifications from all worker nodes before using distributed comm send to call the worker nodes' reduce wrapper function. 
5) On each worker node's reduce wrapper function, it gets all the keys and values stored locally under the reduce input gid and calls reduce on each key-value. The worker node then directly places the results under the reduce output gid by using the distributed store/mem service. The worker node then uses a local comm send to call the coordinator's receiveNotifyReduce.
6) On the coordinator's receiveNotifyReduce, the coordinator waits for all worker nodes to finish and then uses a distributed store/mem get to retrieve all results under the reduce output gid.


My implementation comprises 1 new software component, mr, totaling 356 added lines of code over the previous implementation. Key challenges included race conditions amongst worker nodes, especially when appending to store/mem values with the same key, and tracking iterations and other counters for iterative MapReduce. 
I solved the race condition by creating a new method under the store/mem local/distributed services called append, which stores an array of values under one key. 

## Correctness & Performance Characterization
*Correctness*: I wrote 8 cases testing all 4 lab functionality and 5 other MapReduce test cases. 
Lab functionality tests checked that a compacter function produced accurate results, distributed persistence placed final results in the correct out group, in-memory mem services could be used to find the results in the correct group (tested in conjunction with distributed persistence), and finally an iterative map reduce for web crawling could retrieve the accurate urls from a mocked corpus. 

Other tests include edge cases where not all nodes were used (# keys < # worker nodes), there are duplicate keys in the initial dataset (which should be overwritten), and having more keys than worker nodes & using an identity reducer so that values are arrays. Another test checked that calling iterative map reduce with a small value of rounds, does not return all the urls in the corpus. The last test checked that calling iterative map reduce with a number of rounds greater than necessary to extract all urls from the corpus worked properly. 

*Performance*: My webcrawl (iterative) workflow can sustain a throughput of 28.607 map reduce rounds/second, with an average latency of 34.956 milliseconds/map reduce round. This performance test can be found in m5.performance.test.js.


## Key Feature

> I implemented all extra lab functionality, including compaction, distributed persistence, optional in-memory operation, and iterative MapReduce. 

To implement compaction, I modified my base MapReduce to finish mapping all keys stored on a worker node before grouping values with the same key together. Then, once this was done, I called the user-specified compacter before shuffling. The rest of the code remained the same. 

To implement distributed persistence, in the reducer wrapper on each worker node, the worker node would use the distributed store/mem put to place the reduce result under the user-specified gid group immediately after reducing the key & value rather than sending this back to the coordinator. 

To implement optional in-memory operation, I created a variable memType to represent either 'store' or 'mem', dependent on the user parameter, and would specify the memory type by calling global.distribution.gid[memType]...

To implement iterative MapReduce, I utilized variables mapInGid, mapOutGid, reduceInGid, and reduceOutGid to help with this. I also utilized counters with the user-specified rounds parameter to track the iterations. For all intermediate iterations, the reduceOutGid became next iteration's mapInGid and the mapOutGid became next iteration's reduceInGid. Otherwise, most components of MapReduce remained the same.