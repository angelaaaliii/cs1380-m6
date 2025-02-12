# M2: Actors and Remote Procedure Calls (RPC)


## Summary

My implmentation consists of status, which has the method get to get information on a node. There is also routes, which contains rem, get, and put to update the routes map that is able to access each core service from the service name. Next, I implemented comm, which sends an http request to another node. To receive requests, I implemented node.js which deserializes the message, and using routes sends the result back. Lastly, I implemented createRPC, which creates an RPC stub for another node to utilize. 


My implementation comprises 5 software components, totaling 355 lines of code. Key challenges included understanding how to utilize callback functions and understanding how RPC stubs were being generated and called.


## Correctness & Performance Characterization

> Describe how you characterized the correctness and performance of your implementation


*Correctness*: I wrote 5 students tests where each test file contained 2 tests for each method in the core service library (status, routes, comm). Overall, a total of 10 tests were written in 5 test files. 


*Performance*: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop (in the latency.m2.test.js file). Average throughput and latency is recorded in `package.json`.


## Key Feature

createRPC is the function that generates a stub that another node can call to execute a function on the current node. This stub can be considered some list of instructions on how to contact the current node to execute its function. To create the stub, the current node writes down on the stub, some unique identifier and the current node internally remembers that this unique identifier corresponds to calling some function. So, when the other node later calls upon this stub and sends over some unique identifier, the current node will know what function to call. 