# M3: Node Groups & Gossip Protocols


## Summary

Some key challenges were the imports overwriting the distribution object. Another key challenge was conceptually understanding how to configure the RPC to pass as the onStart field in spawn status local. 


My implementation comprises 7 new software components, totaling 288 added lines of code over the previous implementation. Key challenges included allowing distributed services. This included adding a local and distributed version of groups to add, delete, remove, and put groups. Previous services like local comms, routes, and node.js also had to be modified to accomodate for this. Next, the crux of the distributed services include all comm.send, which I  used in all other distributed services like all status, groups, and routes. Lastly, I implemented gossip (all and local).


## Correctness & Performance Characterization
*Correctness*

There are 5 student tests, which take 2.038 sec, to characterize correctness. The given 1380 and 1385 tests also all pass.


*Performance* 

The throughput of spawn through code is ~ 12.231 nodes / sec. The latency of spawn through code is ~ 1 node / 81.758 milliseconds. 
The performance benchmarks are in scenarios/m3/m3.performance.test.js.
The throughput of spawn through the terminal is ~ 138.694 nodes / 1 sec.
The latency of spawn through the terminal is ~ 1 node / 0.139 milliseconds. 
There was a 0.05 millisecond difference between the gossip protocol using log n vs n as the parameter (# of peer nodes to send message to). Sending to all nodes here was a little faster, likely because the total number of nodes in the 'network' was small, as I was modifying the gossip.all.extra.test.js file. If on a much larger network, the difference would be greater and likely the log n parameter would reach convergence faster. 


## Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

The point of having a gossip protocol is for scalability and fault-tolerance. If one node were to message _all_ other nodes, this introduces a single point of failure and does not make the system fault-tolerant. If that one node were to go down, no other nodes would receive the message. The gossip protocol works against this wherein if one nodes goes down, other nodes that have received the message can spread the message as well. 

In terms of scalability, messaging all nodes would grow expoenentially whereas if each node messages say log n nodes, this grows at a much more controllable rate. The gossip protocol is also configurable based on this parameter, which is convenient. 

